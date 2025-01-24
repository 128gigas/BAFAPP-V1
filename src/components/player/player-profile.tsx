import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayerLayout } from './player-layout';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Edit, Upload, Users } from 'lucide-react';

interface PlayerData {
  id: string;
  clubId: string;
  fullName: string;
  categoryId: string;
  photoUrl?: string;
  bannerUrl?: string;
  documents?: { name: string; url: string }[];
}

export function PlayerProfile() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const playerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) {
        setLoading(false);
        return;
      }

      try {
        // Find the club that has this player
        const clubsRef = collection(db, 'clubs');
        const clubs = await getDocs(clubsRef);
        
        for (const clubDoc of clubs.docs) {
          const playersRef = collection(db, `clubs/${clubDoc.id}/players`);
          const q = query(playersRef, where('playerId', '==', playerId));
          const playerSnapshot = await getDocs(q);
          
          if (!playerSnapshot.empty) {
            const playerDoc = playerSnapshot.docs[0];
            const data = playerDoc.data();
            setPlayerData({
              id: playerDoc.id,
              clubId: clubDoc.id,
              fullName: data.fullName,
              categoryId: data.categoryId,
              photoUrl: data.photoUrl,
              bannerUrl: data.bannerUrl,
              documents: data.documents || []
            });
            break;
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching player data:', error);
        setToast({
          title: 'Error',
          description: 'Error al cargar los datos del jugador',
          type: 'error'
        });
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  const handleUpdatePhoto = async (base64: string) => {
    if (!playerData) return;

    try {
      const playerRef = doc(db, `clubs/${playerData.clubId}/players`, playerData.id);
      await updateDoc(playerRef, {
        photoUrl: base64,
        updatedAt: new Date().toISOString()
      });
      
      setPlayerData(prev => prev ? { ...prev, photoUrl: base64 } : null);
      setIsEditingProfile(false);
      setToast({
        title: 'Éxito',
        description: 'Foto actualizada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating photo:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar la foto',
        type: 'error'
      });
    }
  };

  const handleUpdateBanner = async (base64: string) => {
    if (!playerData) return;

    try {
      const playerRef = doc(db, `clubs/${playerData.clubId}/players`, playerData.id);
      await updateDoc(playerRef, {
        bannerUrl: base64,
        updatedAt: new Date().toISOString()
      });
      
      setPlayerData(prev => prev ? { ...prev, bannerUrl: base64 } : null);
      setIsEditingBanner(false);
      setToast({
        title: 'Éxito',
        description: 'Banner actualizado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el banner',
        type: 'error'
      });
    }
  };

  const handleUploadDocument = async (base64: string, fileName: string) => {
    if (!playerData) return;

    try {
      const playerRef = doc(db, `clubs/${playerData.clubId}/players`, playerData.id);
      const newDocument = {
        name: fileName,
        url: base64,
        uploadedAt: new Date().toISOString()
      };

      const updatedDocuments = [...(playerData.documents || []), newDocument];

      await updateDoc(playerRef, {
        documents: updatedDocuments,
        updatedAt: new Date().toISOString()
      });
      
      setPlayerData(prev => prev ? { ...prev, documents: updatedDocuments } : null);
      setIsUploadingDocument(false);
      setToast({
        title: 'Éxito',
        description: 'Documento subido correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo subir el documento',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <PlayerLayout>
        <div className="flex justify-center items-center h-64">Cargando...</div>
      </PlayerLayout>
    );
  }

  if (!playerData) {
    return (
      <PlayerLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron datos del jugador</p>
        </div>
      </PlayerLayout>
    );
  }

  return (
    <PlayerLayout>
      <ToastProvider>
        <div className="space-y-6 px-4 sm:px-0">
          {/* Banner y Foto de Perfil */}
          <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden">
            {playerData.bannerUrl ? (
              <img
                src={playerData.bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
            )}
            
            <button
              onClick={() => setIsEditingBanner(true)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Edit className="h-5 w-5" />
            </button>

            {/* Profile Photo - Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                  {playerData.photoUrl ? (
                    <img
                      src={playerData.photoUrl}
                      alt={playerData.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-2xl sm:text-4xl text-white">
                        {playerData.fullName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Información del Jugador */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-6">
              {playerData.fullName}
            </h2>
            
            {/* Sección de Documentos */}
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-blue-600" />
                  Documentos
                </h3>
                <button
                  onClick={() => setIsUploadingDocument(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Subir Documento
                </button>
              </div>

              <div className="space-y-3">
                {playerData.documents?.map((doc, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                  >
                    <div className="flex items-center space-x-3">
                      <Upload className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 break-words">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          Subido el {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      download={doc.name}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Descargar
                    </a>
                  </div>
                ))}
                {(!playerData.documents || playerData.documents.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay documentos subidos</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modales */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actualizar Foto de Perfil</h3>
              <PhotoUpload
                onFileSelect={handleUpdatePhoto}
                currentPhotoUrl={playerData.photoUrl}
                onRemovePhoto={() => handleUpdatePhoto('')}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditingBanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actualizar Banner</h3>
              <PhotoUpload
                onFileSelect={handleUpdateBanner}
                currentPhotoUrl={playerData.bannerUrl}
                onRemovePhoto={() => handleUpdateBanner('')}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsEditingBanner(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {isUploadingDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subir Documento</h3>
              <PhotoUpload
                onFileSelect={(base64, file) => handleUploadDocument(base64, file.name)}
                acceptedFileTypes="application/pdf,.doc,.docx"
                maxFileSize={5242880} // 5MB
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsUploadingDocument(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast className={toast.type === 'error' ? 'bg-red-100' : 'bg-green-100'}>
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </PlayerLayout>
  );
}