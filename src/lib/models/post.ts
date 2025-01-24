import { PostCategory } from './post-category';
import { PostReaction } from './post-reaction';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  clubId: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  category?: PostCategory;
  isPinned?: boolean;
  reactions: { [key: string]: PostReaction[] };
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}