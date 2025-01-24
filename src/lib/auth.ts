import { doc, getDoc, collection, query, where, getDocs, setDoc } from './firebase';
import { db } from './firebase';
import { collaboratorService } from './services/collaborator-service';
import { ROLE_PERMISSIONS } from './models/collaborator';

export async function findClubForAdmin(email: string): Promise<{ clubId: string; adminData: any; clubData: any } | null> {
  try {
    // First check if it's a club owner
    const clubsRef = collection(db, 'clubs');
    const clubQuery = query(clubsRef, where('email', '==', email));
    const clubSnap = await getDocs(clubQuery);

    if (!clubSnap.empty) {
      const clubDoc = clubSnap.docs[0];
      return {
        clubId: clubDoc.id,
        adminData: {
          email,
          firstLogin: false,
          permissions: ROLE_PERMISSIONS.club_admin,
          createdAt: new Date().toISOString()
        },
        clubData: clubDoc.data()
      };
    }

    // Then check if it's a collaborator
    const collaborator = await collaboratorService.getCollaboratorByEmail(email);
    if (collaborator) {
      const clubDoc = await getDoc(doc(db, 'clubs', collaborator.clubId));
      if (clubDoc.exists()) {
        return {
          clubId: collaborator.clubId,
          adminData: {
            email,
            firstLogin: false,
            permissions: ROLE_PERMISSIONS[collaborator.role],
            role: collaborator.role,
            createdAt: collaborator.createdAt
          },
          clubData: clubDoc.data()
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding club for admin:', error);
    return null;
  }
}

export async function findClubByEmail(email: string) {
  try {
    const clubsRef = collection(db, 'clubs');
    const q = query(clubsRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const clubDoc = querySnapshot.docs[0];
      return {
        id: clubDoc.id,
        ...clubDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding club:', error);
    return null;
  }
}