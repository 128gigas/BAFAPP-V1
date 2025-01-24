import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Position {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'positions'));
        const positionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Position[];
        setPositions(positionsData.filter(pos => pos.active));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching positions:', error);
        setError('No se pudieron cargar las posiciones');
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  return { positions, loading, error };
}