import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { findClubForAdmin, findClubByEmail } from '@/lib/auth';
import { CollaboratorRole, ROLE_PERMISSIONS } from '@/lib/models/collaborator';
import { doc, getDoc, collection, getDocs } from '@/lib/firebase';

interface ClubAuthState {
  user: User | null;
  clubId: string | null;
  isAdmin: boolean;
  role?: CollaboratorRole;
  permissions: typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS];
  clubData: any | null;
  loading: boolean;
}

export function useClubAuth() {
  const [authState, setAuthState] = useState<ClubAuthState>({
    user: null,
    clubId: null,
    isAdmin: false,
    permissions: ROLE_PERMISSIONS.read_only,
    clubData: null,
    loading: true
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          sessionStorage.clear();
          setAuthState({
            user: null,
            clubId: null,
            isAdmin: false,
            permissions: ROLE_PERMISSIONS.read_only,
            clubData: null,
            loading: false
          });
          return;
        }

        if (!user.email) {
          throw new Error('User email is required');
        }

        // Special case for info@dg.uy
        if (user.email === 'info@dg.uy') {
          try {
            const clubsRef = collection(db, 'clubs');
            const clubsSnap = await getDocs(clubsRef);
            if (!clubsSnap.empty) {
              const firstClub = clubsSnap.docs[0];
              const authData = {
                clubId: firstClub.id,
                clubData: firstClub.data(),
                isAdmin: true,
                role: CollaboratorRole.CLUB_ADMIN,
                permissions: ROLE_PERMISSIONS.club_admin
              };

              sessionStorage.setItem('clubId', authData.clubId);
              sessionStorage.setItem('clubData', JSON.stringify(authData.clubData));
              sessionStorage.setItem('isAdmin', 'true');
              sessionStorage.setItem('role', CollaboratorRole.CLUB_ADMIN);
              sessionStorage.setItem('permissions', JSON.stringify(ROLE_PERMISSIONS.club_admin));

              setAuthState({
                user,
                ...authData,
                loading: false
              });
              return;
            }
          } catch (error) {
            console.error('Error handling super admin:', error);
            throw error;
          }
        }

        // Check for club admin or collaborator
        const adminResult = await findClubForAdmin(user.email);
        if (adminResult) {
          console.log('User is admin/collaborator for club:', adminResult.clubId);
          
          // Get fresh club data
          const clubDoc = await getDoc(doc(db, 'clubs', adminResult.clubId));
          if (!clubDoc.exists()) {
            throw new Error('Club not found');
          }

          const freshClubData = clubDoc.data();
          const role = adminResult.adminData.role || CollaboratorRole.CLUB_ADMIN;
          const permissions = adminResult.adminData.permissions || ROLE_PERMISSIONS[role];

          // Store data in session storage
          const authData = {
            clubId: adminResult.clubId,
            clubData: freshClubData,
            isAdmin: role === CollaboratorRole.CLUB_ADMIN,
            role,
            permissions
          };

          sessionStorage.setItem('clubId', authData.clubId);
          sessionStorage.setItem('clubData', JSON.stringify(authData.clubData));
          sessionStorage.setItem('isAdmin', String(authData.isAdmin));
          sessionStorage.setItem('role', authData.role);
          sessionStorage.setItem('permissions', JSON.stringify(authData.permissions));

          setAuthState({
            user,
            ...authData,
            loading: false
          });
          return;
        }

        // If not admin or collaborator, check if it's a club owner
        const club = await findClubByEmail(user.email);
        if (club) {
          console.log('User is club owner:', club.id);
          
          sessionStorage.setItem('clubId', club.id);
          sessionStorage.setItem('clubData', JSON.stringify(club));
          sessionStorage.setItem('isAdmin', 'true');
          sessionStorage.setItem('role', CollaboratorRole.CLUB_ADMIN);
          sessionStorage.setItem('permissions', JSON.stringify(ROLE_PERMISSIONS.club_admin));

          setAuthState({
            user,
            clubId: club.id,
            clubData: club,
            isAdmin: true,
            role: CollaboratorRole.CLUB_ADMIN,
            permissions: ROLE_PERMISSIONS.club_admin,
            loading: false
          });
          return;
        }

        // If neither admin, collaborator, nor club owner, sign out
        console.log('User has no valid role, signing out');
        await auth.signOut();
        sessionStorage.clear();
        setAuthState({
          user: null,
          clubId: null,
          isAdmin: false,
          permissions: ROLE_PERMISSIONS.read_only,
          clubData: null,
          loading: false
        });
      } catch (error) {
        console.error('Error in auth state change:', error);
        // Clear state and storage on error
        sessionStorage.clear();
        await auth.signOut();
        setAuthState({
          user: null,
          clubId: null,
          isAdmin: false,
          permissions: ROLE_PERMISSIONS.read_only,
          clubData: null,
          loading: false
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
}