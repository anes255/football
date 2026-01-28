import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Trash2, Eye, Search } from 'lucide-react';
import { adminAPI } from '../../api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = async () => { try { const r = await adminAPI.getUsers(); setUsers(r.data); } catch (e) { console.error(e); } finally { setLoading(false); } };

  const toggleAdmin = async (user) => { try { await adminAPI.updateUser(user.id, { is_admin: !user.is_admin }); toast.success(`${user.name} ${!user.is_admin ? 'est admin' : 'n\'est plus admin'}`); fetchUsers(); } catch (e) { toast.error('Erreur'); } };
  const handleDelete = async (id) => { if (!confirm('Supprimer ?')) return; try { await adminAPI.deleteUser(id); toast.success('Supprimé'); fetchUsers(); } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); } };
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone.includes(searchTerm));

  return (
    <div className="min-h-screen pt-16 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <h1 className="font-display text-4xl gradient-text tracking-wider mb-8">Utilisateurs</h1>
        <div className="relative mb-6"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="input pl-10" /></div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center"><Users className="w-8 h-8 mx-auto text-blue-500 mb-2" /><p className="text-2xl font-bold text-white">{users.length}</p><p className="text-sm text-gray-400">Total</p></div>
          <div className="card text-center"><Shield className="w-8 h-8 mx-auto text-red-500 mb-2" /><p className="text-2xl font-bold text-white">{users.filter(u => u.is_admin).length}</p><p className="text-sm text-gray-400">Admins</p></div>
          <div className="card text-center"><Eye className="w-8 h-8 mx-auto text-green-500 mb-2" /><p className="text-2xl font-bold text-white">{users.reduce((s, u) => s + (u.total_predictions || 0), 0)}</p><p className="text-sm text-gray-400">Pronostics</p></div>
        </div>
        {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" /></div> : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5"><tr><th className="px-4 py-3 text-left text-sm text-gray-400">Nom</th><th className="px-4 py-3 text-left text-sm text-gray-400">Téléphone</th><th className="px-4 py-3 text-center text-sm text-gray-400">Points</th><th className="px-4 py-3 text-center text-sm text-gray-400">Pronostics</th><th className="px-4 py-3 text-center text-sm text-gray-400">Inscrit</th><th className="px-4 py-3 text-center text-sm text-gray-400">Admin</th><th className="px-4 py-3 text-right text-sm text-gray-400">Actions</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-white/5">
                    <td className="px-4 py-3"><div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-sm font-bold">{user.name.charAt(0).toUpperCase()}</div><span className="text-white font-medium">{user.name}</span></div></td>
                    <td className="px-4 py-3 text-gray-400">{user.phone}</td>
                    <td className="px-4 py-3 text-center"><span className="font-bold gradient-text">{user.total_points || 0}</span></td>
                    <td className="px-4 py-3 text-center text-gray-400">{user.total_predictions || 0}</td>
                    <td className="px-4 py-3 text-center text-gray-400 text-sm">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-center"><button onClick={() => toggleAdmin(user)} className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_admin ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>{user.is_admin ? 'Admin' : 'User'}</button></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="w-4 h-4" /></button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
