export interface PostReaction {
  userId: string;
  userName: string;
  reaction: string;
  createdAt: string;
}

export const AVAILABLE_REACTIONS = [
  { emoji: '⚽️', name: 'ball' },
  { emoji: '🎉', name: 'celebration' },
  { emoji: '👏', name: 'clap' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '💪', name: 'strong' },
  { emoji: '🏆', name: 'trophy' }
];