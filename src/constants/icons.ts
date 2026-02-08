// Curated set of minimal, modern icons for goals
// Selected for clean, simple aesthetic similar to Noun Project style

export const GOAL_ICONS = [
  '◎',  // Target/focus
  '◇',  // Diamond
  '△',  // Triangle
  '○',  // Circle
  '□',  // Square
  '⬡',  // Hexagon
  '✦',  // Star
  '→',  // Arrow
  '↗',  // Diagonal arrow
  '⊕',  // Circle plus
  '◉',  // Bullseye
  '⬢',  // Filled hexagon
  '▲',  // Filled triangle
  '●',  // Filled circle
  '■',  // Filled square
  '⧫',  // Diamond filled
  '✧',  // Star outline
  '⊙',  // Circle dot
  '⊗',  // Circle x
  '⊖',  // Circle minus
  '⊘',  // Circle slash
  '⌘',  // Command
  '⌬',  // Benzene ring
  '⏣',  // Hexagon horizontal
];

// Get a random icon from the set
export const getRandomIcon = (): string => {
  const index = Math.floor(Math.random() * GOAL_ICONS.length);
  return GOAL_ICONS[index];
};

// Get the default icon (first in list)
export const getDefaultIcon = (): string => {
  return GOAL_ICONS[0];
};
