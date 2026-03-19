"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronRight, Plus, ShieldAlert, Loader2 } from 'lucide-react';
import { useDashboard, Subscription } from '../../context/DashboardProvider';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  successFocusRef: React.RefObject<HTMLElement>; 
}

export function AddSubscriptionModal({ 
  isOpen, 
  onClose, 
  triggerRef, 
  successFocusRef 
}: AddSubscriptionModalProps) {
  const { state, dispatch } = useDashboard();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ state: '', program: '', identifier: '' });
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLButtonElement>(null);
  const step2Ref = useRef<HTMLButtonElement>(null);
  const step3InputRef = useRef<HTMLInputElement>(null);

  const isSubmittingRef = useRef(false);
  const submitLockRef = useRef(false);
  const closeReasonRef = useRef<'CANCEL' | 'SUCCESS'>('CANCEL');

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({ state: '', program: '', identifier: '' });
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  }, [isOpen]);

  const handleUserClose = useCallback(() => {
    if (isSubmittingRef.current) return;
    closeReasonRef.current = 'CANCEL';
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmittingRef.current) handleUserClose();
      if (e.key === 'Tab') {
        const modalElement = modalRef.current;
        if (!modalElement) return;
        const focusable = modalElement.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          modalRef.current?.focus(); 
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevBodyOverflow = document.body.style.overflow;
    const hostParent = overlayRef.current?.parentElement;
    const siblings = Array.from(hostParent?.children || []).filter(el => el !== overlayRef.current);
    const snapshot = siblings.map(el => ({
      el: el as HTMLElement,
      prevAriaHidden: el.getAttribute('aria-hidden'),
      prevPointerEvents: (el as HTMLElement).style.pointerEvents,
      prevInert: (el as any).inert
    }));

    document.body.style.overflow = 'hidden';
    snapshot.forEach(({ el }) => {
      el.setAttribute('aria-hidden', 'true');
      el.style.pointerEvents = 'none';
      (el as any).inert = true;
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevBodyOverflow;
      snapshot.forEach(({ el, prevAriaHidden, prevPointerEvents, prevInert }) => {
        if (prevAriaHidden === null) el.removeAttribute('aria-hidden');
        else el.setAttribute('aria-hidden', prevAriaHidden);
        el.style.pointerEvents = prevPointerEvents;
        (el as any).inert = prevInert ?? false;
      });

      if (closeReasonRef.current === 'SUCCESS' && successFocusRef.current) {
        successFocusRef.current.focus();
        successFocusRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, handleUserClose, triggerRef, successFocusRef]);

  useEffect(() => {
    if (!isOpen || isSubmitting) return;
    if (step === 1) step1Ref.current?.focus();
    else if (step === 2) step2Ref.current?.focus();
    else if (step === 3) step3InputRef.current?.focus();
  }, [isOpen, step, isSubmitting]);

  if (!isOpen) return null;

  const handleComplete = async () => {
    if (submitLockRef.current || !formData.identifier) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    modalRef.current?.focus();

    const currentSeq = state.tracking.nextOptimisticId;
    const tempId = `opt-seq-${currentSeq}`;

    dispatch({ 
      type: 'ADD_SUBSCRIPTION_OPTIMISTIC', 
      payload: { 
        id: tempId, 
        stateCode: formData.state, 
        programCode: formData.program, 
        identifierLabel: `Last Digit: ${formData.identifier}`,
        nextDepositDate: "2026-04-01",
        status: 'active',
        isSyncing: true
      } 
    });

    try {
      await new Promise(res => setTimeout(res, 1000));
      closeReasonRef.current = 'SUCCESS';
      dispatch({ 
        type: 'COMMIT_SUBSCRIPTION_ADD', 
        payload: { 
          tempId, 
          finalSub: {
            id: `srv-auth-${currentSeq}`,
            stateCode: formData.state,
            programCode: formData.program,
            identifierLabel: `Last Digit: ${formData.identifier}`,
            nextDepositDate: "2026-04-12",
            status: 'active'
          }
        } 
      });
      onClose();
    } catch (e) {
      dispatch({ type: 'ROLLBACK_SUBSCRIPTION_ADD', payload: { tempId, error: "Submission failed." } });
      closeReasonRef.current = 'CANCEL';
      submitLockRef.current = false;
      setIsSubmitting(false); 
    }
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200" 
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && handleUserClose()}
    >
      <div ref={modalRef} tabIndex={-1} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6 outline-none animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1 text-left">
            <h2 id="modal-title" className="text-xs font-bold uppercase tracking-widest text-slate-200">
              {isSubmitting ? 'Finalizing...' : `Step ${step} of 3`}
            </h2>
          </div>
          <button disabled={isSubmitting} onClick={handleUserClose} className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-0" aria-label="Close modal">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Select State">
            {['CA', 'NY', 'TX', 'FL'].map((s, idx) => (
              <button key={s} ref={idx === 0 ? step1Ref : null} disabled={isSubmitting} onClick={() => { setFormData({...formData, state: s}); setStep(2); }} className="p-4 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:border-emerald-500 transition-all outline-none focus:ring-1 focus:ring-emerald-500 text-left flex items-center justify-between group">
                {s} <ChevronRight className="h-3 w-3 text-slate-700 group-hover:text-emerald-500" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2" role="group" aria-label="Select Program">
            {['SNAP', 'TANF', 'WIC'].map((p, idx) => (
              <button key={p} ref={idx === 0 ? step2Ref : null} disabled={isSubmitting} onClick={() => { setFormData({...formData, program: p}); setStep(3); }} className="w-full flex items-center justify-between p-4 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:border-emerald-500 transition-all outline-none">
                {p} <ChevronRight className="h-4 w-4 text-slate-600" aria-hidden="true" />
              </button>
            ))}
            <button disabled={isSubmitting} onClick={() => setStep(1)} className="text-[10px] font-bold text-slate-500 uppercase mt-2 focus:underline">← Back</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3 text-left" role="alert">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
              <p className="text-[10px] text-amber-200/70 leading-relaxed font-medium">Last digit required for {formData.state} {formData.program}.</p>
            </div>
            <div className="space-y-2 text-left">
              <label htmlFor="identifier" className="text-[10px] font-bold uppercase text-slate-500 block">Last Digit</label>
              <input id="identifier" ref={step3InputRef} disabled={isSubmitting} type="text" maxLength={1} inputMode="numeric" value={formData.identifier} onChange={(e) => setFormData({...formData, identifier: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-emerald-400 font-mono outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50" />
            </div>
            <div className="flex gap-3 pt-2">
              <button disabled={isSubmitting} onClick={() => setStep(2)} className="flex-1 py-2.5 border border-slate-800 text-xs font-bold text-slate-500 rounded-lg uppercase">Back</button>
              <button disabled={isSubmitting || !formData.identifier} onClick={handleComplete} className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg uppercase flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                {isSubmitting ? 'Confirming' : 'Activate'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}