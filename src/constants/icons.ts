// Colorful, visually interesting icons for goals

export const GOAL_ICONS = [
  // Nature & Growth
  '🌱',  // Seedling - new beginnings
  '🌿',  // Herb - growth
  '🌸',  // Cherry blossom
  '🌻',  // Sunflower
  '🍀',  // Four leaf clover
  '🌈',  // Rainbow

  // Achievement & Success
  '🎯',  // Target
  '🏆',  // Trophy
  '⭐',  // Star
  '🌟',  // Glowing star
  '💎',  // Gem
  '🔥',  // Fire

  // Energy & Action
  '⚡',  // Lightning
  '🚀',  // Rocket
  '💪',  // Flexed biceps
  '✨',  // Sparkles
  '🎨',  // Artist palette
  '🎵',  // Music note

  // Mind & Focus
  '🧠',  // Brain
  '💡',  // Light bulb
  '🎓',  // Graduation cap
  '📚',  // Books
  '🔬',  // Microscope
  '🧩',  // Puzzle piece

  // Heart & Wellness
  '❤️',  // Red heart
  '💜',  // Purple heart
  '💙',  // Blue heart
  '💚',  // Green heart
  '🧘',  // Meditation
  '🌅',  // Sunrise

  // Objects & Tools
  '🔑',  // Key
  '🧭',  // Compass
  '⚙️',  // Gear
  '🛠️',  // Tools
  '📌',  // Pin
  '🎪',  // Circus tent
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
