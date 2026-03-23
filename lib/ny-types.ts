import { OffsetStrategy } from './smart-dates';

export type NYUpstateRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: OffsetStrategy;
  cohortKey: 'UPSTATE';
};

export type NYCityRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: OffsetStrategy;
  cohortKey: 'NYC_A_CYCLE' | 'NYC_B_CYCLE';
};

export type NewYorkDecoderRule = NYUpstateRule | NYCityRule;