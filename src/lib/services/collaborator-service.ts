import { db, auth } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Collaborator, CollaboratorRole } from '../models/collaborator';

class CollaboratorService {
  private static instance: CollaboratorService;
  private constructor() {}

  static getInstance(): CollaboratorService {
    if (!CollaboratorService.instance) {
      CollaboratorService.instance = new CollaboratorService();
    }
    return CollaboratorService.instance;
  }

  async createCollaborator(data: Omit<Collaborator, 'id' | 'createdAt' | 'updatedAt'>, initialPassword: string): Promise<Collaborator> {
    try {
      // Create user in Firebase Auth
      try {
        await createUserWithEmailAndPassword(auth, data.email, initialPassword);
      } catch (authError: any) {
        // If user already exists, that's fine
        if (authError.code !== 'auth/email-already-in-use') {
          throw authError;
        }
      }

      // Create collaborator document
      const collaboratorsRef = collection(db, 'clubCollaborators');
      const docRef = doc(collaboratorsRef);
      const collaborator: Collaborator = {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString()
      };

      await setDoc(docRef, collaborator);
      return collaborator;
    } catch (error) {
      console.error('Error creating collaborator:', error);
      throw error;
    }
  }

  async updateCollaborator(id: string, data: Partial<Collaborator>): Promise<void> {
    try {
      const docRef = doc(db, 'clubCollaborators', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating collaborator:', error);
      throw error;
    }
  }

  async deleteCollaborator(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'clubCollaborators', id));
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      throw error;
    }
  }

  async getCollaborator(id: string): Promise<Collaborator | null> {
    try {
      const docRef = doc(db, 'clubCollaborators', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Collaborator : null;
    } catch (error) {
      console.error('Error getting collaborator:', error);
      throw error;
    }
  }

  async getCollaboratorByEmail(email: string): Promise<Collaborator | null> {
    try {
      const collaboratorsRef = collection(db, 'clubCollaborators');
      const q = query(collaboratorsRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Collaborator;
    } catch (error) {
      console.error('Error getting collaborator by email:', error);
      throw error;
    }
  }

  async getCollaboratorsByClub(clubId: string): Promise<Collaborator[]> {
    try {
      const collaboratorsRef = collection(db, 'clubCollaborators');
      const q = query(collaboratorsRef, where('clubId', '==', clubId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Collaborator[];
    } catch (error) {
      console.error('Error getting collaborators by club:', error);
      throw error;
    }
  }

  async getAllCollaborators(): Promise<Collaborator[]> {
    try {
      const collaboratorsRef = collection(db, 'clubCollaborators');
      const querySnapshot = await getDocs(collaboratorsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Collaborator[];
    } catch (error) {
      console.error('Error getting all collaborators:', error);
      throw error;
    }
  }
}

export const collaboratorService = CollaboratorService.getInstance();