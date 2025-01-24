export enum PostCategory {
  ANNOUNCEMENT = 'announcement',
  NEWS = 'news',
  EVENT = 'event',
  MATCH = 'match',
  TRAINING = 'training',
  GENERAL = 'general'
}

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  [PostCategory.ANNOUNCEMENT]: 'Anuncio',
  [PostCategory.NEWS]: 'Noticia',
  [PostCategory.EVENT]: 'Evento',
  [PostCategory.MATCH]: 'Partido',
  [PostCategory.TRAINING]: 'Entrenamiento',
  [PostCategory.GENERAL]: 'General'
};

export const POST_CATEGORY_COLORS: Record<PostCategory, string> = {
  [PostCategory.ANNOUNCEMENT]: 'bg-red-100 text-red-800',
  [PostCategory.NEWS]: 'bg-blue-100 text-blue-800',
  [PostCategory.EVENT]: 'bg-purple-100 text-purple-800',
  [PostCategory.MATCH]: 'bg-green-100 text-green-800',
  [PostCategory.TRAINING]: 'bg-yellow-100 text-yellow-800',
  [PostCategory.GENERAL]: 'bg-gray-100 text-gray-800'
};