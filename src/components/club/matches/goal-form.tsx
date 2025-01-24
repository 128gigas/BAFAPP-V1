import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

interface Goal {
  id: string;
  minute: number;
  playerId?: string;
  rivalPlayerName?: string;
  goalkeeperId?: string;
  type: 'inside_box' | 'outside_box' | 'penalty' | 'free_kick' | 'header' | 'own_goal';
  teamType: 'home' | 'away';
}

interface Player {
  id: string;
  fullName: string;
  position: string;
  categoryId: string;
}

interface GoalFormProps {
  isHome: boolean;
  players: Player[];
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onRemoveGoal: (goalId: string) => void;
}

const goalTypes = [
  { id: 'inside_box', name: 'Dentro del área' },
  { id: 'outside_box', name: 'Fuera del área' },
  { id: 'penalty', name: 'Penal' },
  { id: 'free_kick', name: 'Tiro libre' },
  { id: 'header', name: 'Cabeza' },
  { id: 'own_goal', name: 'Gol en contra' },
];

export function GoalForm({ isHome, players, goals, onAddGoal, onRemoveGoal }: GoalFormProps) {
  const [newGoal, setNewGoal] = useState({
    minute: 0,
    playerId: '',
    rivalPlayerName: '',
    goalkeeperId: '',
    type: '' as Goal['type'],
    teamType: 'home' as 'home' | 'away'
  });

  // Filtrar goleros y jugadores de campo
  const goalkeepers = players.filter(player => {
    // Debug para ver las posiciones
    console.log('Player position:', player.fullName, player.position);
    return player.position === 'UQGNpMFntqeTk0dwHgFo'; // ID de la posición de golero
  });

  const fieldPlayers = players.filter(player => player.position !== 'UQGNpMFntqeTk0dwHgFo');

  // Debug para ver los goleros encontrados
  console.log('Goalkeepers found:', goalkeepers.map(g => g.fullName));

  const handleAddGoal = () => {
    // Validaciones básicas
    if (!newGoal.type || !newGoal.minute) {
      return;
    }

    // Validaciones específicas según el equipo que anotó
    if (newGoal.teamType === 'home' && !newGoal.playerId) {
      return;
    }

    if (newGoal.teamType === 'away' && (!newGoal.rivalPlayerName || !newGoal.goalkeeperId)) {
      return;
    }

    onAddGoal(newGoal);
    setNewGoal({
      minute: 0,
      playerId: '',
      rivalPlayerName: '',
      goalkeeperId: '',
      type: '' as Goal['type'],
      teamType: 'home'
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Selección de equipo */}
        <div>
          <Label>Equipo que anotó</Label>
          <Select
            value={newGoal.teamType}
            onValueChange={(value: 'home' | 'away') => 
              setNewGoal({ 
                ...newGoal, 
                teamType: value, 
                playerId: '', 
                rivalPlayerName: '', 
                goalkeeperId: '' 
              })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione el equipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home">Mi equipo</SelectItem>
              <SelectItem value="away">Equipo rival</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campos según el equipo que anotó */}
        {newGoal.teamType === 'home' ? (
          <div>
            <Label>Jugador que anotó</Label>
            <Select
              value={newGoal.playerId}
              onValueChange={(value) => setNewGoal({ ...newGoal, playerId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el jugador" />
              </SelectTrigger>
              <SelectContent>
                {fieldPlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            <div>
              <Label>Jugador rival que anotó</Label>
              <Input
                value={newGoal.rivalPlayerName}
                onChange={(e) => setNewGoal({ ...newGoal, rivalPlayerName: e.target.value })}
                placeholder="Nombre del jugador rival"
              />
            </div>
            <div className="col-span-2">
              <Label>Golero al que le anotaron</Label>
              {goalkeepers.length > 0 ? (
                <Select
                  value={newGoal.goalkeeperId}
                  onValueChange={(value) => setNewGoal({ ...newGoal, goalkeeperId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el golero" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalkeepers.map((goalkeeper) => (
                      <SelectItem key={goalkeeper.id} value={goalkeeper.id}>
                        {goalkeeper.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1 text-sm text-red-600">
                  No hay goleros disponibles en esta categoría. 
                  Jugadores disponibles: {players.map(p => `${p.fullName} (${p.position})`).join(', ')}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tipo de gol y minuto */}
        <div>
          <Label>Tipo de Gol</Label>
          <Select
            value={newGoal.type}
            onValueChange={(value: Goal['type']) => setNewGoal({ ...newGoal, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione el tipo" />
            </SelectTrigger>
            <SelectContent>
              {goalTypes.map((type) => (
                <SelectItem key={type.id} value={type.id as Goal['type']}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Minuto</Label>
          <Input
            type="number"
            min="0"
            max="120"
            value={newGoal.minute}
            onChange={(e) => setNewGoal({ ...newGoal, minute: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <button
        onClick={handleAddGoal}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
      >
        <Plus className="h-5 w-5 mr-2" />
        Agregar Gol
      </button>

      {/* Lista de goles registrados */}
      {goals.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-900">Goles registrados</h4>
          <div className="space-y-2">
            {goals.map((goal) => {
              const player = players.find(p => p.id === goal.playerId);
              const goalkeeper = players.find(p => p.id === goal.goalkeeperId);
              return (
                <div key={goal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {goal.minute}'
                    </span>
                    <span className="text-sm">
                      {goal.teamType === 'home' ? 'Mi equipo' : 'Equipo rival'} - {player ? player.fullName : goal.rivalPlayerName}
                      {goal.goalkeeperId && ` (a ${goalkeeper?.fullName})`}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({goalTypes.find(t => t.id === goal.type)?.name})
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveGoal(goal.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}