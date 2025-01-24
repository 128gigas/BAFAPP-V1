import { doc, collection, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Función para inicializar las estadísticas de un club
export async function initializeClubStatistics(clubId: string) {
  try {
    const statsRef = doc(db, 'statistics', clubId);
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      await setDoc(statsRef, {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error initializing club statistics:', error);
    throw error;
  }
}

// Función para actualizar estadísticas de partido
export async function updateMatchStatistics(clubId: string, matchData: any) {
  try {
    await initializeClubStatistics(clubId);
    const matchesRef = collection(db, `statistics/${clubId}/matches`);

    // Calculate result
    const isHome = matchData.homeTeamId === clubId;
    const ourScore = isHome ? matchData.score.home : matchData.score.away;
    const theirScore = isHome ? matchData.score.away : matchData.score.home;
    
    let result = 'tied';
    if (ourScore > theirScore) result = 'won';
    else if (ourScore < theirScore) result = 'lost';

    // Separate goals for and against
    const teamGoals = [];
    const concededGoals = [];

    matchData.goals.forEach(goal => {
      const goalData = {
        ...goal,
        minute: parseInt(goal.minute),
        type: goal.type || 'normal'
      };

      if ((isHome && goal.teamType === 'home') || (!isHome && goal.teamType === 'away')) {
        teamGoals.push(goalData);
      } else {
        concededGoals.push(goalData);
      }
    });

    // Save match statistics with coach data
    const matchStats = {
      id: matchData.id,
      date: matchData.date,
      seasonId: matchData.seasonId,
      leagueId: matchData.leagueId,
      divisionId: matchData.divisionId,
      categoryId: matchData.categoryId,
      coachId: matchData.coachId,
      assistantId: matchData.assistantId,
      result,
      goalsScored: ourScore,
      goalsConceded: theirScore,
      players: matchData.players || {},
      goals: teamGoals,
      concededGoals: concededGoals,
      isHome,
      opponent: isHome ? matchData.awayTeamId : matchData.homeTeamId,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(matchesRef, matchData.id), matchStats);

    // Update player statistics
    const playersRef = collection(db, `statistics/${clubId}/players`);
    for (const [playerId, playerData] of Object.entries(matchData.players || {})) {
      const playerStats = {
        playerId,
        matchId: matchData.id,
        minutesPlayed: (playerData as any).minutes || 0,
        goals: teamGoals.filter(goal => goal.playerId === playerId).length,
        date: matchData.date,
        categoryId: matchData.categoryId,
        seasonId: matchData.seasonId,
        coachId: matchData.coachId,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(playersRef, `${matchData.id}_${playerId}`), playerStats);
    }
  } catch (error) {
    console.error('Error updating match statistics:', error);
    throw error;
  }
}

// Función para actualizar estadísticas de entrenamiento
export async function updateTrainingStatistics(clubId: string, trainingData: any) {
  try {
    await initializeClubStatistics(clubId);
    const trainingsRef = collection(db, `statistics/${clubId}/trainings`);

    // Calculate attendance
    const attendance = trainingData.attendance || {};
    const totalPlayers = Object.keys(attendance).length;
    const presentPlayers = Object.values(attendance).filter(attended => attended).length;
    const attendancePercentage = totalPlayers > 0 ? (presentPlayers / totalPlayers) * 100 : 0;

    // Save training statistics
    const trainingStats = {
      id: trainingData.id,
      date: trainingData.date,
      categoryId: trainingData.categoryId,
      totalPlayers,
      presentPlayers,
      attendance: attendancePercentage,
      players: attendance,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(trainingsRef, trainingData.id), trainingStats);
  } catch (error) {
    console.error('Error updating training statistics:', error);
    throw error;
  }
}

// Función para eliminar estadísticas de partido
export async function deleteMatchStatistics(clubId: string, matchId: string) {
  try {
    // Delete match statistics
    await deleteDoc(doc(collection(db, `statistics/${clubId}/matches`), matchId));
    
    // Delete related player statistics
    const playersRef = collection(db, `statistics/${clubId}/players`);
    const playerDocs = await getDocs(query(playersRef, where('matchId', '==', matchId)));
    for (const doc of playerDocs.docs) {
      await deleteDoc(doc.ref);
    }
  } catch (error) {
    console.error('Error deleting match statistics:', error);
    throw error;
  }
}

// Función para eliminar estadísticas de entrenamiento
export async function deleteTrainingStatistics(clubId: string, trainingId: string) {
  try {
    await deleteDoc(doc(collection(db, `statistics/${clubId}/trainings`), trainingId));
  } catch (error) {
    console.error('Error deleting training statistics:', error);
    throw error;
  }
}