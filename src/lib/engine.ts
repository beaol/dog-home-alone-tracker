/**
 * Recommendation engine.
 *
 * Every number in here is either taken directly from a source in ./sources.ts
 * or is the app's own conservative interpretation of a source that gives no
 * exact number. Reasons are tagged with `basis: 'source' | 'app'` so the UI can
 * show the difference honestly.
 */
import { KIND_LABEL, type Attempt } from './types';
import type { SourceId } from './sources';
import { formatDuration } from './format';

const MIN = 60;
const HOUR = 60 * MIN;
const DAY_MS = 24 * 60 * 60 * 1000;

/** ASPCA: most anxious responses happen in the first 40 minutes; bigger steps after that. */
export const BIG_STEP_FROM = 40 * MIN;
/** ASPCA: after 90 minutes, 15-minute increments. */
export const BIGGER_STEP_FROM = 90 * MIN;
/** ASPCA: after 90 calm minutes, start with 4 hours and build up to 8 over a few days. */
export const LONG_STAGE_FROM = 4 * HOUR;
/** Training goal: a full work day (ASPCA's upper end). */
export const MAX_ALONE = 8 * HOUR;
/** RSPCA / Dogs Trust welfare guidance: no more than 4 hours alone. Shown as a note, not a cap. */
export const WELFARE_NOTE_FROM = 4 * HOUR;
/** DeMartini: about 20–30 minutes of training a day. */
export const DAILY_TRAINING_BUDGET = 30 * MIN;
/** ASPCA: "wait a few minutes between absences". The app reads "a few" as at least 5. */
export const MIN_WAIT_BETWEEN_REPS = 5 * MIN;
/** DeMartini: 5 training days a week, 2 off. */
export const MAX_TRAINING_DAYS_PER_7 = 5;
/** A gap longer than this many days (more than a normal weekend off) triggers a warm-up. */
export const GAP_WARMUP_DAYS = 4;

export type Basis = 'source' | 'app';
export interface Reason {
  text: string;
  basis: Basis;
  sources: SourceId[];
}

export type RecKind = 'start' | 'increase' | 'repeat' | 'recheck' | 'stepBack' | 'easy' | 'warmup' | 'goal';
export type Severity = 'none' | 'mild' | 'significant';

export interface Recommendation {
  kind: RecKind;
  targetSec: number;
  /** Longest duration the dog has shown it handles calmly right now */
  comfortSec: number | null;
  previousSec: number | null;
  headline: string;
  reasons: Reason[];
  earliestNext: Date;
  waitHeadline: string;
  waitReasons: Reason[];
  restDay: boolean;
  repsLeftToday: number;
  warnings: Reason[];
  daysSinceLast: number | null;
}

const r = (text: string, basis: Basis, ...sources: SourceId[]): Reason => ({ text, basis, sources });

// ---------- attempt helpers ----------

export function sortAttempts(attempts: Attempt[]): Attempt[] {
  return [...attempts].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
}

/** Seconds after leaving when the first stress sign appeared, or null if the dog stayed calm. */
export function stressOnset(a: Attempt): number | null {
  const inRange = a.events.filter((e) => e.atSec <= a.durationSec);
  const list = inRange.length ? inRange : a.events;
  if (!list.length) return null;
  return Math.min(...list.map((e) => e.atSec));
}

/**
 * mild: one or two brief sounds/moments (no howling, no scratching at the door)
 * significant: anything more than that
 */
export function severity(a: Attempt): Severity {
  if (!a.events.length) return 'none';
  const mild =
    a.events.length <= 2 &&
    a.events.every((e) => e.intensity === 'brief' && e.kind !== 'howl' && e.kind !== 'scratching');
  return mild ? 'mild' : 'significant';
}

/**
 * One single brief sign, after which the dog stayed calm for a clear stretch of the session
 * (at least a quarter of it, and at least 30 s), so we know the dog settled again.
 */
export function isIsolatedSign(a: Attempt): boolean {
  if (a.events.length !== 1) return false;
  const e = a.events[0];
  if (e.intensity !== 'brief') return false;
  const settledFor = a.durationSec - (e.atSec + (e.lastedSec ?? 0));
  return settledFor >= Math.max(30, a.durationSec * 0.25);
}

/**
 * isolated: a single brief sign the dog settled from, with no stress in the 2 sessions before
 *           (DeMartini: look for patterns, not a single moment)
 * mild / significant: see severity()
 */
export type StressClass = 'isolated' | 'mild' | 'significant';
export const PATTERN_WINDOW = 2;

export function classifyStress(sorted: Attempt[], i: number): StressClass | null {
  const a = sorted[i];
  if (!a.events.length) return null;
  const recentStress = sorted.slice(Math.max(0, i - PATTERN_WINDOW), i).some((p) => p.events.length > 0);
  if (isIsolatedSign(a) && !recentStress) return 'isolated';
  return severity(a) === 'mild' ? 'mild' : 'significant';
}

export function attemptEnd(a: Attempt): Date {
  return new Date(Date.parse(a.startedAt) + a.durationSec * 1000);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function sameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b);
}

/** Round to a step that makes sense for the size of the duration. */
export function roundDuration(sec: number, mode: 'nearest' | 'down' = 'nearest'): number {
  const step = sec < 2 * MIN ? 5 : sec < 10 * MIN ? 15 : sec < BIG_STEP_FROM ? 30 : 60;
  const fn = mode === 'down' ? Math.floor : Math.round;
  return Math.max(5, fn(sec / step) * step);
}

/** How much to add after calm sessions. */
export function increaseStep(level: number): { add: number; reason: Reason } {
  if (level >= LONG_STAGE_FROM) {
    return {
      add: HOUR,
      reason: r(
        'The ASPCA says to start with 4 hours and build up to 8 hours “over a few days.” The app spreads this over four calm sessions, adding 1 hour each time.',
        'app',
        'aspca',
      ),
    };
  }
  if (level >= BIGGER_STEP_FROM) {
    return {
      add: 15 * MIN,
      reason: r(
        'Past 90 minutes the ASPCA uses 15-minute steps. They also say a dog that is calm for 90 minutes can probably manage 4–8 hours.',
        'source',
        'aspca',
      ),
    };
  }
  if (level >= BIG_STEP_FROM) {
    return {
      add: 5 * MIN,
      reason: r(
        'Most anxious reactions happen in the first 40 minutes alone. Once the dog is past 40 minutes, the ASPCA moves to 5-minute steps.',
        'source',
        'aspca',
      ),
    };
  }
  const add = Math.min(3 * MIN, Math.max(5, level * 0.1));
  return {
    add,
    reason: r(
      'Below 40 minutes, the sources say to go up in small steps: the ASPCA says a few seconds per session in early stages, and Blue Cross builds up to about 30 minutes over several days. For a dog with mild distress, the app goes between those two and adds about 10% (at least 5 seconds, at most 3 minutes).',
      'app',
      'aspca',
      'bluecross',
      'demartini-slow',
    ),
  };
}

// ---------- history walk ----------

interface HistoryState {
  comfort: number | null;
  calmStreak: number;
  consecutiveStress: number;
  consecutiveIncreases: number;
  recentStress: boolean;
  onsetTrend: number[];
  lastClass: StressClass | null;
}

export function analyseHistory(sorted: Attempt[]): HistoryState {
  let comfort: number | null = null;
  let calmStreak = 0;
  let consecutiveStress = 0;
  let consecutiveIncreases = 0;
  const onsets: number[] = [];
  let lastStressIdx = -1;
  let lastClass: StressClass | null = null;

  sorted.forEach((a, i) => {
    if (i > 0) {
      const gap = (Date.parse(a.startedAt) - attemptEnd(sorted[i - 1]).getTime()) / DAY_MS;
      if (gap >= GAP_WARMUP_DAYS) {
        calmStreak = 0;
        consecutiveIncreases = 0;
      }
    }
    const onset = stressOnset(a);
    lastClass = classifyStress(sorted, i);
    if (onset === null) {
      consecutiveStress = 0;
      if (comfort === null || a.durationSec >= comfort * 0.95) {
        if (comfort !== null && a.durationSec > comfort * 1.02) consecutiveIncreases++;
        comfort = Math.max(comfort ?? 0, a.durationSec);
        calmStreak++;
      } else {
        // A deliberately shorter (easy / warm-up) session: calm, but it doesn't prove a new level.
        consecutiveIncreases = 0;
      }
    } else {
      // An isolated sign keeps the last calm level: back to where the dog was last comfortable (RSPCA / Blue Cross).
      if (!(lastClass === 'isolated' && comfort !== null)) {
        const factor = lastClass === 'mild' || lastClass === 'isolated' ? 0.8 : 0.5;
        const cap = Math.max(5, Math.round(onset * factor));
        comfort = comfort === null ? cap : Math.min(comfort, cap);
      }
      calmStreak = 0;
      consecutiveIncreases = 0;
      consecutiveStress++;
      onsets.push(onset);
      lastStressIdx = i;
    }
  });

  return {
    comfort,
    calmStreak,
    consecutiveStress,
    consecutiveIncreases,
    recentStress: lastStressIdx >= 0 && sorted.length - 1 - lastStressIdx < 4,
    onsetTrend: onsets.slice(-3),
    lastClass,
  };
}

// ---------- recommendation ----------

export interface EngineOptions {
  /** DeMartini's 5 training days / 2 days off per week. Default on. */
  restDays?: boolean;
}

export function recommend(
  attemptsIn: Attempt[],
  now: Date = new Date(),
  dogName = 'your dog',
  options: EngineOptions = {},
): Recommendation {
  const dog = dogName.trim() || 'your dog';
  const attempts = sortAttempts(attemptsIn);
  const reasons: Reason[] = [];
  const warnings: Reason[] = [];

  if (!attempts.length) {
    const target = MIN;
    return {
      kind: 'start',
      targetSec: target,
      comfortSec: null,
      previousSec: null,
      headline: 'Start with a short absence',
      reasons: [
        r('Dogs Trust: “A few minutes is enough to start with.” VCA: return before your dog shows any distress.', 'source', 'dogstrust', 'vca'),
        r('With no history yet, the app starts at 1 minute so the first session is very likely to go well.', 'app'),
      ],
      earliestNext: now,
      waitHeadline: 'Ready when you are',
      waitReasons: [],
      restDay: false,
      repsLeftToday: 3,
      warnings: [],
      daysSinceLast: null,
    };
  }

  const h = analyseHistory(attempts);
  const last = attempts[attempts.length - 1];
  const lastEnd = attemptEnd(last);
  const lastOnset = stressOnset(last);
  const daysSinceLast = (now.getTime() - lastEnd.getTime()) / DAY_MS;
  const comfort = roundDuration(h.comfort ?? last.durationSec, 'down');

  let kind: RecKind;
  let target: number;

  if (lastOnset === null && daysSinceLast >= GAP_WARMUP_DAYS) {
    // ---- calm last time, but a long break since: warm up ----
    const factor = daysSinceLast >= 14 ? 0.5 : daysSinceLast >= 8 ? 0.7 : 0.85;
    kind = 'warmup';
    target = comfort * factor;
    reasons.push(
      r(
        `It’s been ${Math.floor(daysSinceLast)} days since the last session. The sources treat short breaks as good for learning: DeMartini trains 5 days a week with 2 days off and says breaks help the dog retain what it learned. Normal weekend breaks need no change.`,
        'source',
        'demartini-less',
      ),
      r(
        `No source gives a number for how much a longer break affects tolerance. They do agree that regressions happen and that every absence should stay under threshold. So after a break longer than a weekend, the app starts carefully at ${Math.round(factor * 100)}% of ${dog}’s comfortable time (${formatDuration(comfort)}). If ${dog} stays calm, the next session goes back to ${formatDuration(comfort)}, then normal increases.`,
        'app',
        'aspca',
        'demartini-regress',
      ),
    );
  } else if (lastOnset !== null && h.lastClass === 'isolated' && h.comfort !== null) {
    // ---- one brief sign, then calm: back to the last calm duration ----
    const e = last.events[0];
    const settledFor = last.durationSec - (e.atSec + (e.lastedSec ?? 0));
    kind = 'recheck';
    target = comfort;
    reasons.push(
      r(
        `Last time, ${dog} showed one brief sign (${KIND_LABEL[e.kind].toLowerCase()} at ${formatDuration(e.atSec)}) and then stayed calm for ${formatDuration(settledFor)}. DeMartini: “Threshold isn’t the moment of explosion. It happens before the explosion.” She says to look for “patterns and trends,” not “a single ‘tell’.”`,
        'source',
        'demartini-quiet',
      ),
      r(
        `RSPCA: “go back a stage.” Blue Cross: “start from when they were last comfortable.” For ${dog} that is ${formatDuration(comfort)}, the last calm duration.`,
        'source',
        'rspca',
        'bluecross',
      ),
      r(
        `One sign followed by settling is treated as isolated: repeat ${formatDuration(comfort)} until ${dog} is calm twice before increasing. If any sign comes back in the next ${PATTERN_WINDOW} sessions, the app treats it as a pattern and plans absences shorter than the time the sign appeared (ASPCA’s main rule).`,
        'app',
        'aspca',
      ),
      r(
        last.durationSec - e.atSec > 0 && e.atSec < comfort
          ? `The sign came at ${formatDuration(e.atSec)}, a point ${dog} had already handled calmly, so the longer absence itself is unlikely to be the cause. If you have video, check what happened just before it (a noise, someone outside). DeMartini suggests asking what changed just before a sign.`
          : 'If you have video, check what happened just before the sign. DeMartini suggests asking what changed just before a sign.',
        'source',
        'demartini-quiet',
      ),
    );
  } else if (lastOnset !== null) {
    // ---- last session had stress signs: step back ----
    kind = 'stepBack';
    target = comfort;
    reasons.push(
      r(
        `Last time, ${dog} showed the first stress sign at ${formatDuration(lastOnset)}. The ASPCA’s main rule is to plan absences “shorter than the time it takes for your dog to become upset.”`,
        'source',
        'aspca',
      ),
      r(
        'RSPCA: “go back a stage and try leaving them for a shorter period next time.” Blue Cross: “start from when they were last comfortable.”',
        'source',
        'rspca',
        'bluecross',
      ),
      h.lastClass === 'isolated' || h.lastClass === 'mild'
        ? r(
            `The signs were mild (one or two brief ones), so the app plans about 80% of the time the first sign appeared, or ${dog}’s last calm duration if that is shorter.`,
            'app',
          )
        : r(
            `The signs were more than a brief whine or bark, so the app halves the time the first sign appeared (or uses ${dog}’s last calm duration if that is shorter) to get clearly back under threshold.`,
            'app',
          ),
      r('Regressions are normal and often come before a jump in progress. Treat them as information, not failure.', 'source', 'demartini-regress'),
    );
    if (h.consecutiveStress >= 2) {
      target = comfort * 0.75;
      reasons.push(
        r(
          `This is ${h.consecutiveStress} stressful sessions in a row, so the app steps back an extra 25%. Dogs Trust: “take it back a step and progress more slowly.”`,
          'app',
          'dogstrust',
        ),
      );
      warnings.push(
        r(
          'Several sessions in a row with stress signs. If this continues, the RSPCA and ASPCA recommend talking to your vet or a qualified behaviour professional (e.g. a clinical animal behaviourist or a Certified Separation Anxiety Trainer).',
          'source',
          'rspca',
          'aspca',
        ),
      );
    }
  } else {
    // ---- last session calm ----
    const required = h.recentStress ? 2 : 1;
    if (h.calmStreak >= required && h.consecutiveIncreases >= 3) {
      kind = 'easy';
      target = comfort * 0.6;
      reasons.push(
        r(
          `${dog} has handled three increases in a row. VCA recommends that you “vary the length of your outings” and increase “gradually and randomly”. The RSPCA also says to vary how long you’re out. The app puts in an easy, shorter session so not every absence is the longest one yet.`,
          'source',
          'vca',
          'rspca',
        ),
        r('An easy session at about 60% of the current best is the app’s choice. After it, increases continue.', 'app'),
      );
    } else if (h.calmStreak >= required) {
      kind = 'increase';
      const { add, reason } = increaseStep(comfort);
      // From 40 min on, land on whole steps (45, 50 … 90 min, 1 h 45, 2 h …) instead of carrying an odd offset.
      target = comfort >= BIG_STEP_FROM ? Math.floor(comfort / add) * add + add : comfort + add;
      reasons.push(
        r(
          h.recentStress
            ? `${dog} has now been calm twice at ${formatDuration(comfort)} since the last stress signs, so it’s time to go up a little.`
            : `${dog} was calm for the whole ${formatDuration(last.durationSec)}, so it’s time to go up a little.`,
          'app',
        ),
        r('The RSPCA says to repeat each stage “until you are sure your dog is happy before progressing.” VCA says to increase only if absences “are well tolerated.”', 'source', 'rspca', 'vca'),
        reason,
      );
    } else {
      kind = 'repeat';
      target = comfort;
      reasons.push(
        r(
          `${dog} was calm last time, but had stress signs recently. Repeat ${formatDuration(comfort)} once more to confirm before increasing.`,
          'app',
        ),
        r(
          'After stress signs, Dogs Trust and the ASPCA both say to “progress more slowly”. DeMartini describes real progress as “repeating the same duration more than once.” The ASPCA increases “every session, or every couple of sessions.”',
          'source',
          'dogstrust',
          'aspca',
          'demartini-slow',
        ),
      );
    }
  }

  // ---- time since last session ----
  if (kind === 'stepBack' && daysSinceLast >= GAP_WARMUP_DAYS) {
    reasons.push(
      r(
        `It’s also been ${Math.floor(daysSinceLast)} days since that session. The step back already covers a careful restart after a break.`,
        'app',
      ),
    );
  } else if (daysSinceLast >= 1.5 && kind !== 'warmup' && kind !== 'stepBack') {
    reasons.push(
      r(
        `${Math.floor(daysSinceLast)} day(s) since the last session is within normal rest. DeMartini recommends 2 days off a week and says “breaks and rest periods play a crucial role in the learning process”, so no adjustment is needed.`,
        'source',
        'demartini-less',
      ),
    );
  }

  // ---- 8 hour goal ----
  if (target >= MAX_ALONE) {
    target = MAX_ALONE;
    kind = 'goal';
    reasons.push(
      r(
        `${dog} has reached 8 hours, a full work day and the upper end the ASPCA describes. Keep absences calm and regular, and step back if stress signs return.`,
        'source',
        'aspca',
      ),
    );
  }
  if (target > WELFARE_NOTE_FROM) {
    warnings.push(
      r(
        'Good to know: the RSPCA and Dogs Trust advise not leaving a dog alone for more than 4 hours. On long days, a midday walk, dog walker or neighbour visit breaks up the time alone.',
        'source',
        'rspca',
        'dogstrust',
      ),
    );
  }

  target = roundDuration(target);
  // Never plan at or above the onset of the last stressful session
  // (Except after an isolated sign, where the plan is the last calm duration.)
  if (lastOnset !== null && kind !== 'recheck' && target >= lastOnset) target = Math.max(5, roundDuration(lastOnset * 0.8));

  // ---- warnings ----
  if (h.onsetTrend.length === 3 && h.onsetTrend[0] > h.onsetTrend[1] && h.onsetTrend[1] > h.onsetTrend[2]) {
    warnings.push(
      r(
        'The first stress sign has come earlier in each of the last three stressful sessions. VCA warns some dogs become “sensitized” instead of “desensitized”. If you see distress, pause the exercises and get professional advice.',
        'source',
        'vca',
      ),
    );
  }
  if (last.events.some((e) => e.intensity === 'continuous' && (e.kind === 'howl' || e.kind === 'scratching' || e.kind === 'bark'))) {
    warnings.push(
      r(
        'Continuous howling, barking or scratching at the door is a sign of real distress. The ASPCA says moderate or severe cases need a structured program with a behaviour professional.',
        'source',
        'aspca',
      ),
    );
  }

  // ---- when to do the next session ----
  const w = nextSessionTime(attempts, now, target, lastOnset !== null, dog, options.restDays !== false);

  const headline =
    kind === 'stepBack'
      ? 'Step back to a shorter absence'
      : kind === 'increase'
        ? 'Go up a little'
        : kind === 'repeat'
          ? 'Repeat the same duration'
          : kind === 'easy'
            ? 'Mix in an easy session'
            : kind === 'warmup'
              ? 'Warm up after the break'
              : kind === 'goal'
                ? 'Goal reached: maintain'
                : kind === 'recheck'
                  ? 'Back to the last calm duration'
                  : 'Start';

  return {
    kind,
    targetSec: target,
    comfortSec: h.comfort === null ? null : comfort,
    previousSec: last.durationSec,
    headline,
    reasons,
    earliestNext: w.earliest,
    waitHeadline: w.headline,
    waitReasons: w.reasons,
    restDay: w.restDay,
    repsLeftToday: w.repsLeftToday,
    warnings,
    daysSinceLast,
  };
}

function nextSessionTime(
  sorted: Attempt[],
  now: Date,
  target: number,
  lastStressed: boolean,
  dog: string,
  useRestDays: boolean,
) {
  const last = sorted[sorted.length - 1];
  const lastEnd = attemptEnd(last);
  const reasons: Reason[] = [];
  const trainedDays = new Set(sorted.map((a) => dayKey(new Date(a.startedAt))));
  const todayAttempts = sorted.filter((a) => sameDay(new Date(a.startedAt), now));
  const todayTotal = todayAttempts.reduce((s, a) => s + a.durationSec, 0);
  let repsLeftToday = 0;

  let earliest: Date;
  if (lastStressed && sameDay(lastEnd, now)) {
    earliest = startOfDay(addDays(now, 1));
    reasons.push(
      r(
        `${dog} showed stress signs in the last session, so stop for today. VCA: “If you notice distress at any point in training, it is important to discontinue these exercises.” Try again tomorrow at the shorter duration, once ${dog} is fully relaxed.`,
        'source',
        'vca',
      ),
    );
  } else if (sameDay(lastEnd, now)) {
    const fitsBudget = target < DAILY_TRAINING_BUDGET && todayTotal + target <= DAILY_TRAINING_BUDGET;
    if (fitsBudget) {
      earliest = new Date(Math.max(now.getTime(), lastEnd.getTime() + MIN_WAIT_BETWEEN_REPS * 1000));
      repsLeftToday = Math.max(1, Math.floor((DAILY_TRAINING_BUDGET - todayTotal) / Math.max(target + MIN_WAIT_BETWEEN_REPS / 4, 1)));
      reasons.push(
        r('The ASPCA says to “wait a few minutes between absences”. VCA says to make sure your dog is relaxed before each departure.', 'source', 'aspca', 'vca'),
        r(
          `The app reads “a few minutes” as at least 5, and also waits until ${dog} is settled again (lying down, not following you).`,
          'app',
        ),
        r(
          `${formatDuration(todayTotal)} of training done today. DeMartini’s program uses about 20–30 minutes a day and says more training doesn’t speed things up, so the app caps the day at 30 minutes of alone time.`,
          'app',
          'demartini-less',
        ),
      );
    } else {
      earliest = startOfDay(addDays(now, 1));
      reasons.push(
        target >= DAILY_TRAINING_BUDGET
          ? r(
              `The 30-minute daily limit is for short practice absences. At ${formatDuration(target)}, one absence a day is the whole day’s training, so the next one is tomorrow.`,
              'app',
              'demartini-less',
            )
          : r(
              `${formatDuration(todayTotal)} done today. Another ${formatDuration(target)} would go over the 20–30 minutes of daily training DeMartini uses. Her program finds that “less is more.”`,
              'source',
              'demartini-less',
            ),
      );
    }
  } else {
    earliest = now;
    repsLeftToday = target < DAILY_TRAINING_BUDGET ? Math.max(1, Math.floor(DAILY_TRAINING_BUDGET / (target + 60))) : 1;
  }
  repsLeftToday = Math.min(repsLeftToday, 6);

  // Rest days: max 5 training days in any 7 (can be switched off in Settings).
  let restDays = 0;
  for (let i = 0; useRestDays && i < 7; i++) {
    const d = startOfDay(earliest);
    if (trainedDays.has(dayKey(d))) break; // continuing a day that already counts as a training day
    let count = 0;
    for (let k = 1; k <= 6; k++) if (trainedDays.has(dayKey(addDays(d, -k)))) count++;
    if (count < MAX_TRAINING_DAYS_PER_7) break;
    restDays++;
    earliest = startOfDay(addDays(d, 1));
  }
  const restDay = restDays > 0;
  if (restDay) {
    repsLeftToday = 0;
    reasons.push(
      r(
        `${dog} has trained 5 days in the past week, so take ${restDays === 1 ? 'a day' : `${restDays} days`} off before the next session. DeMartini trains 5 days a week with 2 days off and says rest helps the dog keep what it has learned.`,
        'source',
        'demartini-less',
      ),
    );
  }

  const headline = earliest.getTime() <= now.getTime() ? 'Ready now (once your dog is relaxed)' : describeWhen(earliest, now);
  return { earliest, headline, reasons, restDay, repsLeftToday };
}

export function describeWhen(d: Date, now: Date): string {
  const diffMin = Math.ceil((d.getTime() - now.getTime()) / 60000);
  if (sameDay(d, now)) return diffMin <= 1 ? 'In about a minute' : `In ${diffMin} min`;
  if (sameDay(d, addDays(now, 1))) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

// ---------- forecast ----------

export interface ForecastSession {
  at: Date;
  targetSec: number;
  kind: RecKind;
}
export interface ForecastDay {
  date: Date;
  sessions: ForecastSession[];
}

/** Sessions start no earlier than this hour, and don't start at or after LATEST_HOUR. */
const EARLIEST_HOUR = 7;
const LATEST_HOUR = 21;

/**
 * Projects the next `days` calendar days (today included), assuming every session
 * is done at the earliest time the app allows, hits its target exactly, and is calm.
 * It runs the same `recommend()` rules over and over, so rest days, easy sessions and
 * repeats show up exactly as the app would suggest them.
 */
export function forecast(
  attemptsIn: Attempt[],
  now: Date = new Date(),
  days = 5,
  options: EngineOptions = {},
): ForecastDay[] {
  const attempts = sortAttempts(attemptsIn);
  const last = attempts[attempts.length - 1];
  // Use the hour you usually train (your last session), within daytime.
  const usualHour = last ? Math.min(LATEST_HOUR - 1, Math.max(EARLIEST_HOUR, new Date(last.startedAt).getHours())) : 9;
  const end = startOfDay(addDays(now, days));
  const out: ForecastDay[] = Array.from({ length: days }, (_, i) => ({ date: startOfDay(addDays(now, i)), sessions: [] }));

  const sim = [...attempts];
  let clock = now;
  for (let guard = 0; guard < 60; guard++) {
    const rec = recommend(sim, clock, undefined, options);
    let at = new Date(Math.max(clock.getTime(), rec.earliestNext.getTime()));
    if (at.getHours() < EARLIEST_HOUR || (!sameDay(at, clock) && at.getHours() < usualHour)) {
      // First session of a new day: use the usual training hour
      at = new Date(at);
      at.setHours(usualHour, 0, 0, 0);
    }
    if (at.getHours() >= LATEST_HOUR) {
      at = startOfDay(addDays(at, 1));
      at.setHours(usualHour, 0, 0, 0);
    }
    if (at.getTime() >= end.getTime()) break;

    const day = out.find((d) => sameDay(d.date, at));
    day?.sessions.push({ at, targetSec: rec.targetSec, kind: rec.kind });
    sim.push({ id: `forecast-${guard}`, startedAt: at.toISOString(), durationSec: rec.targetSec, events: [] });
    clock = new Date(at.getTime() + rec.targetSec * 1000);
  }
  return out;
}
