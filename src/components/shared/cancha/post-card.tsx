import { useState } from 'react';
import { Post } from '@/lib/models/post';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { MessageCircle, Link as LinkIcon, MoreVertical, Trash2, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { POST_CATEGORY_COLORS, POST_CATEGORY_LABELS } from '@/lib/models/post-category';
import { AVAILABLE_REACTIONS } from '@/lib/models/post-reaction';

interface PostCardProps {
  post: Post;
  onCommentClick: (postId: string) => void;
  isAdmin?: boolean;
  onPostDeleted?: () => void;
}

export function PostCard({ post, onCommentClick, isAdmin = false, onPostDeleted }: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  
  const playerId = sessionStorage.getItem('playerId');
  const currentUserId = playerId || auth.currentUser?.uid;

  const handleReaction = async (reaction: string) => {
    if (!currentUserId) return;

    try {
      const postRef = doc(db, 'posts', post.id);
      const userReactions = post.reactions[reaction] || [];
      const hasReacted = userReactions.some(r => r.userId === currentUserId);

      if (hasReacted) {
        await updateDoc(postRef, {
          [`reactions.${reaction}`]: arrayRemove(userReactions.find(r => r.userId === currentUserId)),
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(postRef, {
          [`reactions.${reaction}`]: arrayUnion({
            userId: currentUserId,
            userName: playerId ? `Jugador ${playerId}` : auth.currentUser?.email || 'Usuario',
            reaction,
            createdAt: new Date().toISOString()
          }),
          updatedAt: new Date().toISOString()
        });
      }

      setShowReactions(false);
    } catch (error) {
      console.error('Error updating reactions:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta publicación?')) return;

    try {
      await deleteDoc(doc(db, 'posts', post.id));
      setToast({
        title: 'Éxito',
        description: 'Publicación eliminada correctamente',
        type: 'success'
      });
      onPostDeleted?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar la publicación',
        type: 'error'
      });
    }
  };

  const handleTogglePin = async () => {
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        isPinned: !post.isPinned,
        updatedAt: new Date().toISOString()
      });
      onPostDeleted?.(); // Refresh posts
    } catch (error) {
      console.error('Error toggling pin:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo fijar/desfijar la publicación',
        type: 'error'
      });
    }
  };

  const getTotalReactions = () => {
    return Object.values(post.reactions).reduce((total, reactions) => total + reactions.length, 0);
  };

  return (
    <ToastProvider>
      <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ${
        post.isPinned ? 'border-2 border-blue-200' : ''
      }`}>
        {/* Category and Pin Badge */}
        {(post.category || post.isPinned) && (
          <div className="px-4 pt-3 flex items-center justify-between">
            {post.category && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${POST_CATEGORY_COLORS[post.category]}`}>
                {POST_CATEGORY_LABELS[post.category]}
              </span>
            )}
            {post.isPinned && (
              <div className="flex items-center text-blue-600 text-sm">
                <Pin className="h-4 w-4 mr-1" />
                Fijado
              </div>
            )}
          </div>
        )}

        {/* Author Info */}
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center space-x-3">
            {post.authorPhotoUrl ? (
              <img
                src={post.authorPhotoUrl}
                alt={post.authorName}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {post.authorName.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">{post.authorName}</h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <button
                    onClick={handleTogglePin}
                    className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                  >
                    <Pin className="h-4 w-4" />
                    <span>{post.isPinned ? 'Desfijar publicación' : 'Fijar publicación'}</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar publicación</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Image */}
        {post.imageUrl && (
          <div className="px-4">
            <img
              src={post.imageUrl}
              alt="Post content"
              className="rounded-lg max-h-96 w-full object-cover"
            />
          </div>
        )}

        {/* Link Preview */}
        {post.linkUrl && (
          <div className="px-4">
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center text-blue-600">
                <LinkIcon className="h-4 w-4 mr-2" />
                {post.linkUrl}
              </div>
            </a>
          </div>
        )}

        {/* Reactions Summary */}
        {getTotalReactions() > 0 && (
          <div className="px-4 py-2 border-t">
            <div className="flex items-center space-x-1">
              {Object.entries(post.reactions).map(([reaction, users]) => 
                users.length > 0 && (
                  <div key={reaction} className="flex items-center">
                    <span className="text-lg">{reaction}</span>
                    <span className="text-sm text-gray-500 ml-1">{users.length}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
              disabled={!currentUserId}
            >
              <div className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-3 py-1">
                <span className="text-xl">👍</span>
                <span className="font-medium">{getTotalReactions()}</span>
              </div>
            </button>

            {showReactions && (
              <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border p-2 z-10">
                <div className="flex space-x-2">
                  {AVAILABLE_REACTIONS.map(({ emoji, name }) => (
                    <button
                      key={name}
                      onClick={() => handleReaction(emoji)}
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onCommentClick(post.id)}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
          >
            <div className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-3 py-1">
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">{post.commentsCount || 0}</span>
            </div>
          </button>
        </div>
      </div>

      {toast && (
        <Toast className={toast.type === 'error' ? 'bg-red-100' : 'bg-green-100'}>
          <ToastTitle>{toast.title}</ToastTitle>
          <ToastDescription>{toast.description}</ToastDescription>
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  );
}