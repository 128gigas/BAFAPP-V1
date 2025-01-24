import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Division {
  id: string;
  name: string;
  description: string;
}

export function useDivisions() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'divisions'));
        const divisionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Division[];
        setDivisions(divisionsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching divisions:', error);
        setError('No se pudieron cargar las divisiones');
        setLoading(false);
      }
    };

    fetchDivisions();
  }, []);

  return { divisions, loading, error };
}