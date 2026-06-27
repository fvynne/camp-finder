// Shared option lists + small helpers used across screens.

export const INTERESTS = [
  { slug: 'arts_crafts', label: 'Arts & Crafts' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'science', label: 'Science' },
  { slug: 'math', label: 'Math' },
  { slug: 'theatre', label: 'Theatre' },
  { slug: 'biology', label: 'Biology' },
];

export const LENGTH_TYPES = [
  { slug: 'half_day', label: '½ Day' },
  { slug: 'all_day', label: 'All Day' },
  { slug: 'overnight', label: 'Overnight' },
];

export const COLORS = {
  primary: '#0e7490',
  primaryDark: '#155e75',
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  chipBg: '#ecfeff',
  chipActiveBg: '#0e7490',
};

const labelByInterest = Object.fromEntries(INTERESTS.map((i) => [i.slug, i.label]));
const labelByLength = Object.fromEntries(LENGTH_TYPES.map((l) => [l.slug, l.label]));

export const interestLabel = (slug) => labelByInterest[slug] ?? slug;
export const lengthLabel = (slug) => labelByLength[slug] ?? slug;

export const formatPrice = (cents) =>
  cents == null ? 'Price varies' : `$${Math.round(cents / 100)}/wk`;
