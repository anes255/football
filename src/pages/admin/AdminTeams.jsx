import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { teamsAPI } from '../../api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', flag_url: '', group_name: '' });

  useEffect(() => { fetchTeams(); }, []);
  const fetchTeams = async () => { try { const r = await teamsAPI.getAll(); setTeams(r.data); } catch (e) { console.error(e); } finally { setLoading(false); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) { await teamsAPI.update(editingTeam.id, formData); toast.success('Équipe modifiée !'); }
      else { await teamsAPI.create(formData); toast.success('Équipe ajoutée !'); }
      fetchTeams(); closeModal();
    } catch (error) { toast.error(error.response?.data?.error || 'Erreur'); }
  };

  const handleDelete = async (id) => { if (!confirm('Supprimer ?')) return; try { await teamsAPI.delete(id); toast.success('Supprimée'); fetchTeams(); } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); } };
  const openModal = (team = null) => { if (team) { setEditingTeam(team); setFormData({ name: team.name, code: team.code || '', flag_url: team.flag_url || '', group_name: team.group_name || '' }); } else { setEditingTeam(null); setFormData({ name: '', code: '', flag_url: '', group_name: '' }); } setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingTeam(null); setFormData({ name: '', code: '', flag_url: '', group_name: '' }); };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const groupedTeams = filteredTeams.reduce((acc, t) => { const g = t.group_name || 'Sans groupe'; if (!acc[g]) acc[g] = []; acc[g].push(t); return acc; }, {});

  return (
    <div className="min-h-screen pt-16 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8"><h1 className="font-display text-4xl gradient-text tracking-wider">Équipes</h1><button onClick={() => openModal()} className="btn-primary flex items-center space-x-2"><Plus className="w-5 h-5" /><span>Ajouter</span></button></div>
        <div className="relative mb-6"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="input pl-10" /></div>
        {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" /></div> : (
          <div className="space-y-8">
            {Object.entries(groupedTeams).map(([group, gTeams]) => (
              <div key={group}><h2 className="font-display text-xl text-white mb-4">Groupe {group}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gTeams.map((team) => (
                    <motion.div key={team.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex items-center justify-between">
                      <div className="flex items-center space-x-3"><div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">{team.flag_url || '🏳️'}</div><div><p className="font-semibold text-white">{team.name}</p><p className="text-sm text-gray-400">{team.code}</p></div></div>
                      <div className="flex space-x-2"><button onClick={() => openModal(team)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(team.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="w-4 h-4" /></button></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-md w-full">
              <div className="flex items-center justify-between mb-6"><h2 className="font-display text-2xl text-white">{editingTeam ? 'Modifier' : 'Ajouter'}</h2><button onClick={closeModal}><X className="w-6 h-6 text-gray-400" /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm text-gray-300 mb-2">Nom</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required /></div>
                <div><label className="block text-sm text-gray-300 mb-2">Code</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input" placeholder="ALG, MAR..." /></div>
                <div><label className="block text-sm text-gray-300 mb-2">Drapeau (emoji)</label><input type="text" value={formData.flag_url} onChange={(e) => setFormData({ ...formData, flag_url: e.target.value })} className="input" placeholder="🇩🇿" /></div>
                <div><label className="block text-sm text-gray-300 mb-2">Groupe</label><select value={formData.group_name} onChange={(e) => setFormData({ ...formData, group_name: e.target.value })} className="input"><option value="">Sélectionner</option>{['A','B','C','D','E','F'].map(g => <option key={g} value={g}>Groupe {g}</option>)}</select></div>
                <button type="submit" className="btn-primary w-full">{editingTeam ? 'Modifier' : 'Ajouter'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeams;
