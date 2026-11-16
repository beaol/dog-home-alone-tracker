import { useColorScheme } from 'react-native';

const light = {
  bg: '#f4f3ef',
  surface: '#fcfcfb',
  surfaceAlt: '#ecebe6',
  border: '#dcdad3',
  text: '#0b0b0b',
  textSecondary: '#52514e',
  textMuted: '#77756f',
  accent: '#2a78d6',
  accentText: '#ffffff',
  good: '#0ca30c',
  goodText: '#006300',
  warning: '#fab219',
  warningText: '#7a5200',
  critical: '#d03b3b',
  criticalText: '#a12525',
  grid: '#e4e2dc',
  appBadgeBg: '#eef3fb',
  sourceBadgeBg: '#eaf6ea',
};

const dark: typeof light = {
  bg: '#111110',
  surface: '#1a1a19',
  surfaceAlt: '#262624',
  border: '#383835',
  text: '#f0efec',
  textSecondary: '#c3c2b7',
  textMuted: '#9a998f',
  accent: '#3987e5',
  accentText: '#ffffff',
  good: '#0ca30c',
  goodText: '#5fd35f',
  warning: '#fab219',
  warningText: '#fab219',
  critical: '#d03b3b',
  criticalText: '#f07a7a',
  grid: '#2c2c2a',
  appBadgeBg: '#1d2a3b',
  sourceBadgeBg: '#1b2e1b',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
