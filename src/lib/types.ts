export type VocalKind = 'whine' | 'bark' | 'howl';
export type BodyKind =
  | 'pacing'
  | 'panting'
  | 'drooling'
  | 'scratching'
  | 'restless'
  | 'trembling';
export type StressKind = VocalKind | BodyKind;

/** brief = a single short sound/moment, intermittent = on and off, continuous = didn't stop */
export type Intensity = 'brief' | 'intermittent' | 'continuous';

export interface StressEvent {
  id: string;
  kind: StressKind;
  /** Seconds after you left */
  atSec: number;
  intensity: Intensity;
  /** Optional: how long the episode lasted, in seconds */
  lastedSec?: number;
}

export interface Attempt {
  id: string;
  /** ISO timestamp of when you left */
  startedAt: string;
  /** Total time the dog was alone, in seconds */
  durationSec: number;
  events: StressEvent[];
  notes?: string;
}

export interface LiveSession {
  startedAt: string;
  events: StressEvent[];
  targetSec?: number;
}

export interface AppData {
  version: 1;
  dogName: string;
  onboarded: boolean;
  attempts: Attempt[];
  live?: LiveSession | null;
}

export const VOCAL_KINDS: VocalKind[] = ['whine', 'bark', 'howl'];
export const BODY_KINDS: BodyKind[] = [
  'pacing',
  'panting',
  'drooling',
  'scratching',
  'restless',
  'trembling',
];

export const KIND_LABEL: Record<StressKind, string> = {
  whine: 'Whined',
  bark: 'Barked',
  howl: 'Howled',
  pacing: 'Pacing',
  panting: 'Panting',
  drooling: 'Drooling',
  scratching: 'Scratching / pawing at door',
  restless: "Restless, couldn't settle",
  trembling: 'Trembling',
};

export const INTENSITY_LABEL: Record<Intensity, string> = {
  brief: 'Brief',
  intermittent: 'On and off',
  continuous: 'Continuous',
};
