import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Team {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

interface TeamsListProps {
  divisionId: string;
  teams: Team[];
  onTeamsUpdate: () => void;
}

export function TeamsList({ divisionId, teams, onTeamsUpdate }: TeamsListProps) {
  const [newTeam, setNewTeam] = useState({
    name: '',
    active: true
  });

  const handleAddTeam = async () => {
    if (!newTeam.name.trim()) return;

    try {
      const teamsRef = collection(db, `divisions/${divisionId}/teams`);
      await addDoc(teamsRef, {
        name: newTeam.name.trim(),
        active: newTeam.active,
        createdAt: new Date().toISOString()
      });

      setNewTeam({ name: '', active: true });
      onTeamsUpdate();
    } catch (error) {
      console.error('Error adding team:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este equipo?')) return;

    try {
      await deleteDoc(doc(db, `divisions/${divisionId}/teams`, teamId));
      onTeamsUpdate();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleToggleTeamStatus = async (teamId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, `divisions/${divisionId}/teams`, teamId), {
        active: !currentStatus,
        updatedAt: new Date().toISOString()
      });
      onTeamsUpdate();
    } catch (error) {
      console.error('Error updating team status:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
        <div>
          <Label htmlFor="teamName">Nombre del Equipo</Label>
          <Input
            id="teamName"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            placeholder="Nombre del equipo"
            className="mt-1"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="teamActive">Activo</Label>
          <Switch
            id="teamActive"
            checked={newTeam.active}
            onCheckedChange={(checked) => setNewTeam({ ...newTeam, active: checked })}
          />
        </div>
        <div>
          <button
            onClick={handleAddTeam}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar Equipo
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">{team.name}</span>
              <Switch
                checked={team.active}
                onCheckedChange={() => handleToggleTeamStatus(team.id, team.active)}
              />
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                team.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {team.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <button
              onClick={() => handleDeleteTeam(team.id)}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}