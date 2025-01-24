import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { PlayerStatisticsPanel } from '@/components/player/statistics/player-statistics-panel';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

interface PlayerDocument {
  name: string;
  url: string;
  uploadedAt: string;
}

interface PlayerData {
  fullName: string;
  documents?: PlayerDocument[];
}

export function PlayerDetails() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId || !auth.currentUser) return;

      try {
        // Get player data directly from the current club
        const playerRef = doc(db, `clubs/${auth.currentUser.uid}/players`, playerId);
        const playerSnap = await getDoc(playerRef);
        
        if (playerSnap.exists()) {
          setPlayerData(playerSnap.data() as PlayerData);
        } else {
          setToast({
            title: 'Error',
            description: 'No se encontró el jugador',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Error fetching player data:', error);
        setToast({
          title: 'Error',
          description: 'No se pudieron cargar los datos del jugador',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!playerData || !auth.currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontró el jugador</p>
        <button
          onClick={() => navigate('/club/dashboard/players')}
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/club/dashboard/players')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{playerData.fullName}</h2>
        </div>

        <PlayerStatisticsPanel 
          playerId={playerId!} 
          clubId={auth.currentUser.uid}
          isEditable={false}
        />

        {/* Sección de Documentos */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
            </div>

            {playerData.documents && playerData.documents.length > 0 ? (
              <div className="space-y-3">
                {playerData.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          Subido el {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      download={doc.name}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>El jugador no ha subido documentos</p>
              </div>
            )}
          </div>
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