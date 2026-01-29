import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trash2, Shield, ShieldOff, Search, Trophy } from 'lucide-react';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (user) => {
    const action = user.is_admin ? 'retirer les droits admin' : 'donner les droits admin';
    if (!confirm(`Voulez-vous ${action} à ${user.name} ?`)) return;
    
    try {
      await adminAPI.updateUser(user.id, { is_admin: !user.is_admin });
      toast.success(`Droits mis à jour pour ${user.name}`);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const deleteUser = async (user) => {
    if (!confirm(`Supprimer définitivement ${user.name} ?`)) return;
    
    try {
      await adminAPI.deleteUser(user.id);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl gradient-text">Gestion des Utilisateurs</h1>
            <p className="text-gray-400 mt-2">{users.length} utilisateurs inscrits</p>
          </div>
          
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-blue-500/20 to-blue-600/10">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-gray-400">Utilisateurs</p>
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-yellow-500/20 to-yellow-600/10">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{users.filter(u => u.is_admin).length}</p>
                <p className="text-sm text-gray-400">Admins</p>
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-green-500/20 to-green-600/10">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.reduce((sum, u) => sum + (u.total_predictions || 0), 0)}
                </p>
                <p className="text-sm text-gray-400">Pronostics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Utilisateur</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Téléphone</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Points</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Pronostics</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Rôle</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{user.name.charAt(0)}</span>
                        </div>
                        <span className="text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400">{user.phone}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-primary-400 font-bold">{user.total_points || 0}</span>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-400">{user.total_predictions || 0}</td>
                    <td className="py-4 px-4 text-center">
                      {user.is_admin ? (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Admin</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">Utilisateur</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleAdmin(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_admin
                              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                          }`}
                          title={user.is_admin ? 'Retirer admin' : 'Rendre admin'}
                        >
                          {user.is_admin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
