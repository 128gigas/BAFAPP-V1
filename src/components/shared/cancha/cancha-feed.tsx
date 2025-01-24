import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/lib/models/post';
import { PostCard } from './post-card';
import { PostForm } from './post-form';
import { CommentsModal } from './comments-modal';
import { FeaturedPlayers } from './featured-players';
import { WeeklyHighlights } from './weekly-highlights';
import { UpcomingEvents } from './upcoming-events';

interface CanchaFeedProps {
  clubId: string;
  isAdmin?: boolean;
}

export function CanchaFeed({ clubId, isAdmin = false }: CanchaFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const getAuthorDetails = async (authorId: string, clubId: string) => {
    try {
      // Cache para evitar búsquedas repetidas
      const cacheKey = `author_${authorId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Primero buscar en jugadores
      const playerRef = collection(db, `clubs/${clubId}/players`);
      const playerQuery = query(playerRef, where('playerId', '==', authorId));
      const playerSnapshot = await getDocs(playerQuery);
      
      if (!playerSnapshot.empty) {
        const playerData = playerSnapshot.docs[0].data();
        const details = {
          name: playerData.fullName,
          photoUrl: playerData.photoUrl || ''
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(details));
        return details;
      }

      // Si no es jugador, buscar en clubes
      const clubRef = doc(db, 'clubs', authorId);
      const clubDoc = await getDoc(clubRef);
      if (clubDoc.exists()) {
        const clubData = clubDoc.data();
        const details = {
          name: clubData.clubName,
          photoUrl: clubData.photoUrl || ''
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(details));
        return details;
      }

      return { name: 'Usuario', photoUrl: '' };
    } catch (error) {
      console.error('Error fetching author details:', error);
      return { name: 'Usuario', photoUrl: '' };
    }
  };

  const fetchPosts = async () => {
    if (!clubId) {
      setError('No se proporcionó un ID de club válido');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('clubId', '==', clubId));
      const querySnapshot = await getDocs(q);
      
      const postsData = await Promise.all(querySnapshot.docs.map(async doc => {
        try {
          const postData = doc.data();
          
          if (postData.authorId && (!postData.authorName || !postData.authorPhotoUrl)) {
            const authorDetails = await getAuthorDetails(postData.authorId, clubId);
            postData.authorName = authorDetails.name;
            postData.authorPhotoUrl = authorDetails.photoUrl;
          }

          return {
            id: doc.id,
            ...postData,
            authorName: postData.authorName || 'Usuario',
            authorPhotoUrl: postData.authorPhotoUrl || '',
            reactions: postData.reactions || {},
            commentsCount: postData.commentsCount || 0,
            createdAt: postData.createdAt || new Date().toISOString(),
            updatedAt: postData.updatedAt || new Date().toISOString()
          } as Post;
        } catch (error) {
          console.error('Error processing post:', error);
          return null;
        }
      }));

      const validPosts = postsData.filter((post): post is Post => post !== null);
      
      // Sort posts: pinned first, then by date
      const sortedPosts = validPosts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setPosts(sortedPosts);
      setError(null);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('No se pudieron cargar las publicaciones. Por favor, intenta de nuevo más tarde.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      fetchPosts();
    }
  }, [clubId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Left Sidebar */}
      <div className="lg:col-span-3 space-y-6">
        <FeaturedPlayers clubId={clubId} />
        <WeeklyHighlights clubId={clubId} />
      </div>

      {/* Main Feed */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <PostForm clubId={clubId} onPostCreated={fetchPosts} />
        </div>

        {error ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-lg">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchPosts}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-lg shadow-lg p-4 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-lg">
            <div className="mb-4 text-6xl">⚽️</div>
            <p className="text-gray-500 text-lg mb-2">No hay publicaciones aún.</p>
            <p className="text-gray-500">¡Sé el primero en compartir algo en la cancha!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <PostCard
                  post={post}
                  onCommentClick={setSelectedPostId}
                  isAdmin={isAdmin}
                  onPostDeleted={fetchPosts}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-3">
        <div className="sticky top-6 space-y-6">
          <UpcomingEvents clubId={clubId} />
        </div>
      </div>

      {selectedPostId && (
        <CommentsModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
}