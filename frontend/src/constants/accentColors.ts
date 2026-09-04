export type AccentColor = 'green' | 'violet' | 'orange';

export interface AccentTokens {
  solid: string;
  solidHover: string;
  gradientFrom: string;
  gradientTo: string;
  pastelBg: string;
  pastelText: string;
  hoverText: string;
  tintBg: string;
  tintBorder: string;
}

const PALETTES: Record<AccentColor, { dark: AccentTokens; light: AccentTokens }> = {
  green: {
    dark: {
      solid: '#10b981', solidHover: '#059669',
      gradientFrom: '#10b981', gradientTo: '#34d399',
      pastelBg: '#052e1c', pastelText: '#6ee7b7', hoverText: '#a7f3d0',
      tintBg: '#052e1c', tintBorder: '#065f46',
    },
    light: {
      solid: '#059669', solidHover: '#047857',
      gradientFrom: '#059669', gradientTo: '#10b981',
      pastelBg: '#d1fae5', pastelText: '#065f46', hoverText: '#047857',
      tintBg: '#ecfdf5', tintBorder: '#a7f3d0',
    },
  },
  violet: {
    dark: {
      solid: '#6366f1', solidHover: '#4f46e5',
      gradientFrom: '#6366f1', gradientTo: '#818cf8',
      pastelBg: '#1e1b4b', pastelText: '#a5b4fc', hoverText: '#c7d2fe',
      tintBg: '#1e1b4b', tintBorder: '#3730a3',
    },
    light: {
      solid: '#4f46e5', solidHover: '#4338ca',
      gradientFrom: '#4f46e5', gradientTo: '#6366f1',
      pastelBg: '#e0e7ff', pastelText: '#3730a3', hoverText: '#4338ca',
      tintBg: '#eef2ff', tintBorder: '#c7d2fe',
    },
  },
  orange: {
    dark: {
      solid: '#f97316', solidHover: '#ea580c',
      gradientFrom: '#f97316', gradientTo: '#fb923c',
      pastelBg: '#431407', pastelText: '#fdba74', hoverText: '#fed7aa',
      tintBg: '#431407', tintBorder: '#9a3412',
    },
    light: {
      solid: '#ea580c', solidHover: '#c2410c',
      gradientFrom: '#ea580c', gradientTo: '#f97316',
      pastelBg: '#ffedd5', pastelText: '#7c2d12', hoverText: '#c2410c',
      tintBg: '#fff7ed', tintBorder: '#fed7aa',
    },
  },
};

export function getAccentTokens(theme: 'dark' | 'light', accent: AccentColor = 'green'): AccentTokens {
  return PALETTES[accent][theme];
}

export const ACCENT_OPTIONS: Array<{ id: AccentColor; label: string; swatch: string }> = [
  { id: 'green', label: 'Green', swatch: '#10b981' },
  { id: 'violet', label: 'Violet', swatch: '#6366f1' },
  { id: 'orange', label: 'Orange', swatch: '#f97316' },
];
