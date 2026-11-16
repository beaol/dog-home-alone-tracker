/**
 * Every rule the recommendation engine uses points back to one of these.
 * Quotes are copied from the source pages (checked November 2026).
 */
export interface Source {
  id: SourceId;
  org: string;
  title: string;
  url: string;
  authors?: string;
  points: string[];
}

export type SourceId =
  | 'aspca'
  | 'vca'
  | 'rspca'
  | 'dogstrust'
  | 'bluecross'
  | 'demartini-less'
  | 'demartini-regress'
  | 'demartini-slow';

export const SOURCES: Record<SourceId, Source> = {
  aspca: {
    id: 'aspca',
    org: 'ASPCA',
    title: 'Separation Anxiety',
    url: 'https://www.aspca.org/pet-care/dog-care/common-dog-behavior-issues/separation-anxiety',
    points: [
      '“The main rule is to plan your absences to be shorter than the time it takes for your dog to become upset.”',
      'Start with many short separations that don’t cause anxiety, then increase the duration “by only a few seconds each session, or every couple of sessions.”',
      'Most anxious reactions happen in the first 40 minutes alone. Once the dog can handle 40 minutes, increase in bigger steps: “5-minute increments at first, then later 15-minute increments.”',
      'A dog that is calm for 90 minutes can probably handle 4 hours; build toward longer absences over a few days.',
      '“During your sessions, be sure to wait a few minutes between absences.”',
      'Schedule: several sessions a day on weekends and twice-daily sessions on workdays.',
      'Mild cases may respond to counterconditioning, e.g. a food-stuffed toy that lasts 20–30 minutes, given as you leave and picked up when you return.',
      'If you see signs of distress, shorten absences and progress more slowly. Moderate or severe cases need a behaviour professional.',
    ],
  },
  vca: {
    id: 'vca',
    org: 'VCA Animal Hospitals',
    authors: 'Ellen Lindell VMD DACVB, Debra Horwitz DVM DACVB, Gary Landsberg DVM DACVB',
    title: 'Separation-related distress in dogs',
    url: 'https://vcahospitals.com/know-your-pet/behavior-problems-separation-anxiety-in-dogs',
    points: [
      '“Begin with short departures and return quickly, before your dog appears distressed.”',
      '“If your dog does well, vary the length of your outings, always monitoring the camera for signs of distress.”',
      '“Gradually and randomly increase departures if they are well tolerated.”',
      'Distress signs include vocalizing, pacing, ears back, hiding, damaging objects or exit points.',
      '“If you notice distress at any point in training, it is important to discontinue these exercises.”',
      'Some dogs become distressed faster and faster: they are “sensitized” instead of “desensitized.”',
      'Make sure your dog is relaxed between each departure.',
    ],
  },
  rspca: {
    id: 'rspca',
    org: 'RSPCA',
    title: 'Training your dog to be left alone',
    url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour/alone',
    points: [
      'Repeat each stage “until you are sure your dog is happy before progressing.”',
      'If your dog becomes anxious, “simply go back a stage and try leaving them for a shorter period next time.”',
      '“Never leave your dog so long that they start to become distressed.”',
      'Watch (or film) for less obvious signs too, like trembling, pacing or whining. Some dogs “suffer in silence.”',
      'Once you reach the stage of leaving through the door, vary how long you are out.',
      'Dogs should not be left alone for more than four hours. If problems continue, talk to a vet or clinical behaviourist.',
    ],
  },
  dogstrust: {
    id: 'dogstrust',
    org: 'Dogs Trust',
    title: 'Helping your dog get used to spending time alone',
    url: 'https://www.dogstrust.ie/dog-advice/training/home/help-your-dog-spend-time-alone',
    points: [
      '“A few minutes is enough to start with,” then build up very gradually, paired with something positive.',
      'Signs of worry: panting, pacing, lip-licking, vocalising, urinating or destruction. If you see them, “take it back a step and progress more slowly.”',
      'Avoid leaving your dog for more than four hours.',
    ],
  },
  bluecross: {
    id: 'bluecross',
    org: 'Blue Cross',
    title: 'Preventing separation anxiety in puppies',
    url: 'https://www.bluecross.org.uk/advice/dog/preventing-separation-anxiety-in-puppies',
    points: [
      'Gradually increase the time alone to about 30 minutes over a period of days.',
      '“If your dog struggles, take a few steps back and start from when they were last comfortable.”',
      'Anxious behaviours include panting, pacing, drooling, howling and barking, sometimes already while you get ready to leave.',
    ],
  },
  'demartini-less': {
    id: 'demartini-less',
    org: 'Malena DeMartini (separation anxiety specialist)',
    title: 'Less Is More',
    url: 'https://malenademartini.com/?p=7898',
    points: [
      'Her program trains five days a week, with two days off for both dog and guardian.',
      '“Breaks and rest periods play a crucial role in the learning process.” Spacing sessions out helps the dog retain what it learned.',
      'Longer or more frequent sessions don’t speed things up. Her course suggests about 20–30 minutes of training a day.',
    ],
  },
  'demartini-regress': {
    id: 'demartini-regress',
    org: 'Malena DeMartini (separation anxiety specialist)',
    title: 'Regressions for the Win',
    url: 'https://malenademartini.com/?p=1715',
    points: [
      'Regressions are “normal when working through any behavior modification plan” and often come before a jump in progress.',
      'The threshold is “whatever duration and difficulty that the dog can handle at that time.” Adjust duration to match it, e.g. a few days of shorter absences.',
      'Change one thing at a time so you know what helped.',
    ],
  },
  'demartini-slow': {
    id: 'demartini-slow',
    org: 'Malena DeMartini (separation anxiety specialist)',
    title: 'Why Progress in Separation Anxiety Often Looks Slow',
    url: 'https://malenademartini.com/?p=33171',
    points: [
      'Real progress often looks like “repeating the same duration more than once,” “increasing time in very small increments,” and “adjusting or even stepping back on certain days.”',
      'Calm repetitions build on each other: “When it happens again, and then again, it begins to build.”',
    ],
  },
};

export const SOURCE_LIST = Object.values(SOURCES);
