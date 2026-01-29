import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, Plus, Edit, Trash2, X, Check, Image } from 'lucide-react';
import { teamsAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    flag_url: '',
    group_name: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await teamsAPI.getAll();
      setTeams(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await teamsAPI.update(editingTeam.id, formData);
        toast.success('Équipe modifiée');
      } else {
        await teamsAPI.create(formData);
        toast.success('Équipe créée');
      }
      setShowModal(false);
      resetForm();
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      code: team.code || '',
      flag_url: team.flag_url || '',
      group_name: team.group_name || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette équipe ?')) return;
    try {
      await teamsAPI.delete(id);
      toast.success('Équipe supprimée');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const resetForm = () => {
    setEditingTeam(null);
    setFormData({ name: '', code: '', flag_url: '', group_name: '' });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) {
      toast.error('Image trop grande (max 500KB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, flag_url: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const renderFlag = (flagUrl, teamName) => {
    if (!flagUrl) return <span className="text-2xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={teamName} className="w-10 h-7 object-cover rounded" />;
    }
    return <span className="text-2xl">{flagUrl}</span>;
  };

  // Group teams by group_name
  const groupedTeams = teams.reduce((acc, team) => {
    const group = team.group_name || 'Sans groupe';
    if (!acc[group]) acc[group] = [];
    acc[group].push(team);
    return acc;
  }, {});

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-4xl gradient-text">Gestion des Équipes</h1>
            <p className="text-gray-400 mt-2">{teams.length} équipes enregistrées</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle Équipe</span>
          </button>
        </div>

        {/* Teams by Group */}
        {Object.keys(groupedTeams).sort().map((group) => (
          <div key={group} className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Groupe {group}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedTeams[group].map((team) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {renderFlag(team.flag_url, team.name)}
                    <div>
                      <p className="text-white font-semibold">{team.name}</p>
                      {team.code && <p className="text-xs text-gray-500">{team.code}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(team)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {teams.length === 0 && (
          <div className="card text-center py-12">
            <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucune équipe créée</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingTeam ? 'Modifier l\'équipe' : 'Nouvelle équipe'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Nom de l'équipe *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
                    placeholder="Ex: Algérie"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
                      placeholder="ALG"
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Groupe</label>
                    <input
                      type="text"
                      value={formData.group_name}
                      onChange={(e) => setFormData({ ...formData, group_name: e.target.value.toUpperCase() })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
                      placeholder="A"
                      maxLength={1}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Drapeau</label>
                  <div className="flex items-center space-x-4">
                    {formData.flag_url ? (
                      <img src={formData.flag_url} alt="Flag" className="w-16 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-12 bg-white/5 rounded flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <label className="btn-secondary cursor-pointer text-sm">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      Choisir image
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>{editingTeam ? 'Modifier' : 'Créer'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeams;
