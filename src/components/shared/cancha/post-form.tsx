import { useState, useCallback, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { Image, Link as LinkIcon, X, Smile, Pin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import EmojiPicker from 'emoji-picker-react';
import { PostCategory, POST_CATEGORY_LABELS } from '@/lib/models/post-category';

interface PostFormProps {
  clubId: string;
  onPostCreated: () => void;
}

export function PostForm({ clubId, onPostCreated }: PostFormProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [category, setCategory] = useState<PostCategory>(PostCategory.GENERAL);
  const [isPinned, setIsPinned] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const playerId = sessionStorage.getItem('playerId');
      const authorId = playerId || auth.currentUser?.uid;

      if (!authorId) {
        throw new Error('No hay usuario autenticado');
      }

      // Obtener datos del jugador si es un jugador
      let authorName = '';
      let authorPhotoUrl = '';

      if (playerId) {
        // Buscar el jugador en el club
        const playerRef = collection(db, `clubs/${clubId}/players`);
        const playerQuery = query(playerRef, where('playerId', '==', playerId));
        const playerSnapshot = await getDocs(playerQuery);
        
        if (!playerSnapshot.empty) {
          const playerData = playerSnapshot.docs[0].data();
          authorName = playerData.fullName;
          authorPhotoUrl = playerData.photoUrl || '';
        }
      } else {
        // Es un club o admin, obtener datos del club
        const clubRef = doc(db, 'clubs', authorId);
        const clubDoc = await getDoc(clubRef);
        if (clubDoc.exists()) {
          authorName = clubDoc.data().clubName;
          authorPhotoUrl = clubDoc.data().photoUrl || '';
        }
      }

      const postData = {
        authorId,
        authorName: authorName || (playerId ? `Jugador ${playerId}` : (auth.currentUser?.email || 'Usuario')),
        authorPhotoUrl,
        clubId,
        content: content.trim(),
        imageUrl: imageUrl || '',
        linkUrl: linkUrl || '',
        category,
        isPinned,
        reactions: {},
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const postsRef = collection(db, 'posts');
      await addDoc(postsRef, postData);

      setContent('');
      setImageUrl('');
      setLinkUrl('');
      setCategory(PostCategory.GENERAL);
      setIsPinned(false);
      setShowImageUpload(false);
      setShowLinkInput(false);
      
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setContent(prevContent => prevContent + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const isAuthorized = auth.currentUser?.uid || sessionStorage.getItem('playerId');

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 text-center text-gray-500">
        Debes iniciar sesión para publicar contenido.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="¿Qué está pasando en la cancha?"
          className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="mb-4">
        <Select value={category} onValueChange={(value) => setCategory(value as PostCategory)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(POST_CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showImageUpload && (
        <div className="mb-4">
          <PhotoUpload
            onFileSelect={(base64) => setImageUrl(base64)}
            currentPhotoUrl={imageUrl}
            onRemovePhoto={() => setImageUrl('')}
          />
        </div>
      )}

      {showLinkInput && (
        <div className="mb-4">
          <Label htmlFor="linkUrl">Enlace</Label>
          <div className="flex gap-2">
            <Input
              ref={linkInputRef}
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowLinkInput(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className={`p-2 rounded-full ${
                showImageUpload ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={isSubmitting}
            >
              <Image className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(!showLinkInput);
                setTimeout(() => linkInputRef.current?.focus(), 0);
              }}
              className={`p-2 rounded-full ${
                showLinkInput ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={isSubmitting}
            >
              <LinkIcon className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-full ${
                  showEmojiPicker ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                disabled={isSubmitting}
              >
                <Smile className="h-5 w-5" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Pin className={`h-5 w-5 ${isPinned ? 'text-blue-600' : 'text-gray-500'}`} />
            <Switch
              checked={isPinned}
              onCheckedChange={setIsPinned}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}