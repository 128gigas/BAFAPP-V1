import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { GoalForm } from './goal-form';
import { v4 as uuidv4 } from 'uuid';

interface Player {
  id: string;
  fullName: string;
  position: string;
  categoryId: string;
}

interface MatchFormProps {
  match?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  categories: any[];
  divisions: any[];
  coaches: any[];
  players: Player[];
}

interface FormData {
  date: string;
  time: string;
  categoryId: string;
  opponent: string;
  location: string;
  isHome: boolean;
  coachId: string;
  assistantId: string;
  players: { [key: string]: { minutes: number } };
  goals: any[];
}

export function MatchForm({ match, onSubmit, onCancel, categories = [], divisions = [], coaches = [], players = [] }: MatchFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>(() => {
    if (!match) {
      return {
        date: '',
        time: '',
        categoryId: '',
        opponent: '',
        location: 'Nuestra Cancha',
        isHome: true,
        coachId: '',
        assistantId: '',
        players: {},
        goals: []
      };
    }

    // Si hay un partido, determinar si somos el equipo local
    const isHome = match.homeTeamId === auth.currentUser?.uid;

    // Transformar los goles según la perspectiva correcta
    const transformedGoals = (match.goals || []).map(goal => ({
      ...goal,
      teamType: goal.teamType === 'home' ? 
        (isHome ? 'home' : 'away') : 
        (isHome ? 'away' : 'home')
    }));

    // Construir el objeto de datos inicial
    return {
      date: match.date || '',
      time: match.time || '',
      categoryId: match.categoryId || '',
      opponent: isHome ? match.awayTeamId : match.homeTeamId,
      location: match.location || 'Nuestra Cancha',
      isHome: isHome,
      coachId: match.coachId || '',
      assistantId: match.assistantId || '',
      players: match.players || {},
      goals: transformedGoals
    };
  });

  // Cargar y filtrar equipos disponibles
  useEffect(() => {
    if (divisions.length > 0 && divisions[0].teams) {
      const currentUserId = auth.currentUser?.uid;
      const filteredTeams = divisions[0].teams.filter(team => team.id !== currentUserId);
      setAvailableTeams(filteredTeams);

      // Si hay un oponente seleccionado pero no está en la lista filtrada, resetear
      if (formData.opponent && !filteredTeams.find(team => team.id === formData.opponent)) {
        setFormData(prev => ({ ...prev, opponent: '' }));
      }
    }
  }, [divisions]);

  // Validar que los jugadores en el partido pertenezcan a la categoría seleccionada
  useEffect(() => {
    if (formData.categoryId) {
      const validPlayerIds = players
        .filter(player => player.categoryId === formData.categoryId)
        .map(player => player.id);

      const filteredPlayers = Object.entries(formData.players)
        .filter(([playerId]) => validPlayerIds.includes(playerId))
        .reduce((acc, [playerId, data]) => ({ ...acc, [playerId]: data }), {});

      if (Object.keys(formData.players).length !== Object.keys(filteredPlayers).length) {
        setFormData(prev => ({ ...prev, players: filteredPlayers }));
      }
    }
  }, [formData.categoryId, players]);

  const handleAddGoal = (goal: Omit<any, 'id'>) => {
    const newGoal = { ...goal, id: uuidv4() };
    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal]
    }));
  };

  const handleRemoveGoal = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter(goal => goal.id !== goalId)
    }));
  };

  const handlePlayerMinutes = (playerId: string, minutes: number) => {
    setFormData(prev => ({
      ...prev,
      players: {
        ...prev.players,
        [playerId]: { minutes }
      }
    }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.date && formData.time && formData.categoryId;
      case 2:
        return formData.opponent && formData.location;
      case 3:
        return formData.coachId;
      case 4:
        return Object.keys(formData.players).length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      const finalData = {
        ...formData,
        homeTeamId: formData.isHome ? auth.currentUser?.uid : formData.opponent,
        awayTeamId: formData.isHome ? formData.opponent : auth.currentUser?.uid,
        goals: formData.goals.map(goal => ({
          ...goal,
          teamType: goal.teamType === 'home' ? 
            (formData.isHome ? 'home' : 'away') : 
            (formData.isHome ? 'away' : 'home')
        }))
      };
      onSubmit(finalData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const renderStep = () => {
    const categoryPlayers = players.filter(player => player.categoryId === formData.categoryId);

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Hora</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Rival</Label>
              <Select
                value={formData.opponent}
                onValueChange={(value) => setFormData({ ...formData, opponent: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el equipo rival" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.clubName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lugar</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label>Local</Label>
              <Switch
                checked={formData.isHome}
                onCheckedChange={(checked) => setFormData({ ...formData, isHome: checked })}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Entrenador</Label>
              <Select
                value={formData.coachId}
                onValueChange={(value) => setFormData({ ...formData, coachId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un entrenador" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asistente</Label>
              <Select
                value={formData.assistantId}
                onValueChange={(value) => setFormData({ ...formData, assistantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un asistente" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Minutos jugados</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {categoryPlayers.map((player) => (
                <div key={player.id}>
                  <Label>{player.fullName}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.players[player.id]?.minutes || 0}
                    onChange={(e) => handlePlayerMinutes(player.id, parseInt(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Goles</h4>
            <GoalForm
              isHome={formData.isHome}
              players={categoryPlayers}
              goals={formData.goals}
              onAddGoal={handleAddGoal}
              onRemoveGoal={handleRemoveGoal}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm text-gray-600">Paso {currentStep} de 5</span>
          <span className="text-sm text-gray-600">
            {currentStep === 1 && 'Información Básica'}
            {currentStep === 2 && 'Equipos'}
            {currentStep === 3 && 'Cuerpo Técnico'}
            {currentStep === 4 && 'Jugadores'}
            {currentStep === 5 && 'Goles'}
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={handleBack}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 1 && onCancel ? 'Cancelar' : 'Anterior'}
        </button>
        <button
          onClick={handleNext}
          disabled={!validateCurrentStep()}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 5 ? 'Guardar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}

export default MatchForm;