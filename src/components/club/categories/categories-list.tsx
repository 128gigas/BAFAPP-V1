import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Check, X, ArrowLeft } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useClubAuth } from '@/hooks/use-club-auth';

interface Category {
  id: string;
  name: string;
  active: boolean;
}

export function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', active: true });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  const { clubId, permissions } = useClubAuth();

  useEffect(() => {
    if (clubId) {
      fetchCategories();
    }
  }, [clubId]);

  const fetchCategories = async () => {
    if (!clubId) return;
    
    try {
      const categoriesRef = collection(db, `clubs/${clubId}/categories`);
      const querySnapshot = await getDocs(categoriesRef);
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(categoriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!clubId || !newCategory.name.trim()) {
      setToast({
        title: 'Error',
        description: 'El nombre de la categoría es requerido',
        type: 'error'
      });
      return;
    }

    try {
      const categoriesRef = collection(db, `clubs/${clubId}/categories`);
      await addDoc(categoriesRef, {
        name: newCategory.name.trim(),
        active: newCategory.active,
        createdAt: new Date().toISOString(),
      });

      setNewCategory({ name: '', active: true });
      fetchCategories();
      setToast({
        title: 'Éxito',
        description: 'Categoría agregada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding category:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar la categoría',
        type: 'error'
      });
    }
  };

  const handleUpdateCategory = async (categoryId: string, updatedCategory: Category) => {
    if (!clubId) return;

    try {
      const categoryRef = doc(db, `clubs/${clubId}/categories`, categoryId);
      await updateDoc(categoryRef, {
        name: updatedCategory.name.trim(),
        active: updatedCategory.active,
        updatedAt: new Date().toISOString(),
      });

      setEditingCategory(null);
      fetchCategories();
      setToast({
        title: 'Éxito',
        description: 'Categoría actualizada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating category:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar la categoría',
        type: 'error'
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!clubId || !window.confirm('¿Está seguro de que desea eliminar esta categoría?')) return;

    try {
      const categoryRef = doc(db, `clubs/${clubId}/categories`, categoryId);
      await deleteDoc(categoryRef);
      
      fetchCategories();
      setToast({
        title: 'Éxito',
        description: 'Categoría eliminada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar la categoría',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!permissions.canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-yellow-50 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Acceso Restringido</h3>
          <p className="text-yellow-600">
            No tienes permisos para gestionar las categorías del club. Esta sección está reservada para administradores y personal autorizado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/club/dashboard')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver al Dashboard
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Categorías</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            {/* Add Category Form */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
              <div>
                <Label htmlFor="name">Nombre de la Categoría</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Ej: Sub-15"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activa</Label>
                <Switch
                  id="active"
                  checked={newCategory.active}
                  onCheckedChange={(checked) => setNewCategory({ ...newCategory, active: checked })}
                />
              </div>
              <div>
                <button
                  onClick={handleAddCategory}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Categoría
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCategory?.id === category.id ? (
                          <Input
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCategory?.id === category.id ? (
                          <Switch
                            checked={editingCategory.active}
                            onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, active: checked })}
                          />
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {category.active ? 'Activa' : 'Inactiva'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingCategory?.id === category.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateCategory(category.id, editingCategory)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingCategory(category)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast className={toast.type === 'error' ? 'bg-red-100' : 'bg-green-100'}>
          <ToastTitle>{toast.title}</ToastTitle>
          <ToastDescription>{toast.description}</ToastDescription>
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  );
}