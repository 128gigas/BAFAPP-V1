import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SuperAdminLogin } from './components/superadmin/superadmin-login';
import { SuperAdminDashboard } from './components/superadmin/superadmin-dashboard';
import { ProtectedRoute } from './components/protected-route';
import { ClubLogin } from './components/club/club-login';
import { ClubDashboard } from './components/club/club-dashboard';
import { ClubEdit } from './components/club/club-edit';
import { CategoriesList } from './components/club/categories/categories-list';
import { CoachesList } from './components/club/coaches/coaches-list';
import { PlayersList } from './components/club/players/players-list';
import { PlayerDetails } from './components/club/players/player-details';
import { PlayerEdit } from './components/club/players/player-edit';
import { TrainingsList } from './components/club/trainings/trainings-list';
import { MatchesList } from './components/club/matches/matches-list';
import { DivisionMatches } from './components/club/matches/division-matches';
import { NewMatch } from './components/club/matches/new-match';
import { MatchDetails } from './components/club/matches/match-details';
import { ProtectedClubRoute } from './components/club/protected-club-route';
import { ClubLayout } from './components/club/layout/club-layout';
import { PlayerLogin } from './components/player/player-login';
import { PlayerDashboard } from './components/player/player-dashboard';
import { PlayerTeam } from './components/player/player-team';
import { PlayerProfile } from './components/player/player-profile';
import { ProtectedPlayerRoute } from './components/player/protected-player-route';
import { PositionsList } from './components/club/positions/positions-list';
import { LandingPage } from './components/landing-page';
import { StatisticsDashboard } from './components/club/statistics/statistics-dashboard';
import { NotificationsList } from './components/club/notifications/notifications-list';
import { PaymentsPanel } from './components/club/payments/payments-panel';
import { CategoryFees } from './components/club/payments/category-fees';
import { PlayerAccount } from './components/club/payments/player-account';
import { CoachEdit } from './components/club/coaches/coach-edit';
import { PlayerNotifications } from './components/player/notifications/player-notifications';
import { PlayerCancha } from './components/player/player-cancha';
import { ClubCancha } from './components/club/cancha/club-cancha';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Rutas del SuperAdmin */}
        <Route path="/superadmin" element={<SuperAdminLogin />} />
        <Route
          path="/superadmin/dashboard/*"
          element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Rutas del Club */}
        <Route path="/club" element={<ClubLogin />} />
        <Route
          path="/club/dashboard"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <ClubDashboard />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/edit"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <ClubEdit />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/categories"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <CategoriesList />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/coaches"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <CoachesList />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/coaches/:coachId"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <CoachEdit />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/players"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <PlayersList />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/players/view/:playerId"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <PlayerDetails />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/players/:playerId"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <PlayerEdit />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/trainings"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <TrainingsList />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/matches"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <MatchesList />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/matches/:seasonId/:leagueId/:divisionId"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <DivisionMatches />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/matches/:seasonId/:leagueId/:divisionId/new"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <NewMatch />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/matches/:seasonId/:leagueId/:divisionId/:matchId"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <MatchDetails />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/positions"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <PositionsList />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/statistics"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <StatisticsDashboard />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/notifications"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <NotificationsList />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        {/* Payment Routes */}
        <Route
          path="/club/dashboard/payments"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <PaymentsPanel />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/payments/fees"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <CategoryFees />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/payments/account/:playerId"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <PlayerAccount />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />
        <Route
          path="/club/dashboard/cancha"
          element={
            <ProtectedClubRoute>
              <ClubLayout>
                <ClubCancha />
              </ClubLayout>
            </ProtectedClubRoute>
          }
        />

        {/* Rutas del Jugador */}
        <Route path="/player" element={<PlayerLogin />} />
        <Route
          path="/player/dashboard"
          element={
            <ProtectedPlayerRoute>
              <PlayerDashboard />
            </ProtectedPlayerRoute>
          }
        />
        <Route
          path="/player/notifications"
          element={
            <ProtectedPlayerRoute>
              <PlayerNotifications />
            </ProtectedPlayerRoute>
          }
        />
        <Route
          path="/player/team"
          element={
            <ProtectedPlayerRoute>
              <PlayerTeam />
            </ProtectedPlayerRoute>
          }
        />
        <Route
          path="/player/profile"
          element={
            <ProtectedPlayerRoute>
              <PlayerProfile />
            </ProtectedPlayerRoute>
          }
        />
        <Route
          path="/player/cancha"
          element={
            <ProtectedPlayerRoute>
              <PlayerCancha />
            </ProtectedPlayerRoute>
          }
        />
      </Routes>
    </Router>
  );
}