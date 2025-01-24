import { useState, useEffect } from 'react';
import { collection, getDocs } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface Player {
  id: string;
  fullName: string;
  categoryId: string;
  categoryName?: string;
  active: boolean;
}

export function AccountsList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    if (!auth.currentUser) return;

    try {
      // Fetch players
      const playersRef = collection(db, `clubs/${auth.currentUser.uid}/players`);
      const playersSnapshot = await getDocs(playersRef);
      const playersData = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];

      // Fetch categories to get names
      const categoriesRef = collection(db, `clubs/${auth.currentUser.uid}/categories`);
      const categoriesSnapshot = await getDocs(categoriesRef);
      const categories = {};
      categoriesSnapshot.docs.forEach(doc => {
        categories[doc.id] = doc.data().name;
      });

      // Add category names to players
      const playersWithCategories = playersData.map(player => ({
        ...player,
        categoryName: categories[player.categoryId] || 'Sin categoría'
      }));

      setPlayers(playersWithCategories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player => 
    player.active && player.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Estado de Cuenta</h2>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Buscar jugador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Players List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map((player) => (
          <div
            key={player.id}
            onClick={() => navigate(`/club/dashboard/payments/accounts/${player.id}`)}
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <h3 className="font-medium text-gray-900">{player.fullName}</h3>
            <p className="text-sm text-gray-500 mt-1">{player.categoryName}</p>
          </div>
        ))}

        {filteredPlayers.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No se encontraron jugadores
          </div>
        )}
      </div>
    </div>
  );
}