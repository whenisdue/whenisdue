"use client";

import Link, { LinkProps } from "next/link";
import { trackClick } from "@/lib/analytics";

interface TrackedLinkProps extends LinkProps {
  href: string;
  eventId?: string;
  className?: string;
  children: React.ReactNode;
}

export default function TrackedLink({ eventId, children, className, ...props }: TrackedLinkProps) {
  return (
    <Link 
      {...props} 
      className={className} 
      onClick={() => {
        if (eventId) trackClick(eventId);
      }}
    >
      {children}
    </Link>
  );
}