import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { X, Smile } from 'lucide-react';
import { Comment } from '@/lib/models/post';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import EmojiPicker from 'emoji-picker-react';

interface CommentsModalProps {
  postId: string;
  onClose: () => void;
}

export function CommentsModal({ postId, onClose }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, where('postId', '==', postId));
      const querySnapshot = await getDocs(q);
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];

      const sortedComments = commentsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setComments(sortedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const playerId = sessionStorage.getItem('playerId');
      const authorId = playerId || auth.currentUser?.uid;

      if (!authorId) {
        throw new Error('No hay usuario autenticado');
      }

      const comment = {
        postId,
        authorId,
        authorName: playerId ? `Jugador ${playerId}` : (auth.currentUser?.email || 'Usuario'),
        authorPhotoUrl: '',
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Crear el comentario
      const commentsRef = collection(db, 'comments');
      await addDoc(commentsRef, comment);

      // Actualizar el contador de comentarios en el post
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentCount = postSnap.data().commentsCount || 0;
        await updateDoc(postRef, {
          commentsCount: currentCount + 1,
          updatedAt: new Date().toISOString()
        });
      }

      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewComment(prevComment => prevComment + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Verificar si hay un usuario autenticado o un playerId en la sesión
  const isAuthorized = auth.currentUser?.uid || sessionStorage.getItem('playerId');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Comentarios</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-4">Cargando comentarios...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  {comment.authorPhotoUrl ? (
                    <img
                      src={comment.authorPhotoUrl}
                      alt={comment.authorName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                  )}
                  <div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-sm">{comment.authorName}</p>
                      <p className="text-gray-800">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: es
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAuthorized ? (
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 right-0 z-50">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Comentar'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="border-t p-4 text-center text-gray-500">
            Debes iniciar sesión para comentar.
          </div>
        )}
      </div>
    </div>
  );
}