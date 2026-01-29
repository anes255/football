import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Edit, Trash2, Calendar, X, Check, Image } from 'lucide-react';
import { tournamentsAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    logo_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await tournamentsAPI.getAll();
      setTournaments(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des tournois');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTournament) {
        await tournamentsAPI.update(editingTournament.id, formData);
        toast.success('Tournoi modifié');
      } else {
        await tournamentsAPI.create(formData);
        toast.success('Tournoi créé');
      }
      setShowModal(false);
      resetForm();
      fetchTournaments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      start_date: tournament.start_date ? tournament.start_date.split('T')[0] : '',
      end_date: tournament.end_date ? tournament.end_date.split('T')[0] : '',
      logo_url: tournament.logo_url || '',
      is_active: tournament.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce tournoi ?')) return;
    try {
      await tournamentsAPI.delete(id);
      toast.success('Tournoi supprimé');
      fetchTournaments();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setEditingTournament(null);
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      logo_url: '',
      is_active: true
    });
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
      setFormData({ ...formData, logo_url: reader.result });
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-4xl gradient-text">Gestion des Tournois</h1>
            <p className="text-gray-400 mt-2">Créez et gérez les compétitions</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau Tournoi</span>
          </button>
        </div>

        {/* Tournaments List */}
        <div className="grid gap-4">
          {tournaments.length === 0 ? (
            <div className="card text-center py-12">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun tournoi créé</p>
            </div>
          ) : (
            tournaments.map((tournament) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {tournament.logo_url ? (
                      <img
                        src={tournament.logo_url}
                        alt={tournament.name}
                        className="w-16 h-16 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tournament.is_active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {tournament.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      {tournament.description && (
                        <p className="text-gray-400 text-sm mt-1">{tournament.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        {tournament.start_date && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(tournament.start_date).toLocaleDateString('fr-FR')}
                              {tournament.end_date && ` - ${new Date(tournament.end_date).toLocaleDateString('fr-FR')}`}
                            </span>
                          </span>
                        )}
                        <span>{tournament.match_count || 0} matchs</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(tournament)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tournament.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingTournament ? 'Modifier le tournoi' : 'Nouveau tournoi'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Nom du tournoi *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
                    placeholder="Ex: Coupe d'Afrique 2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white resize-none"
                    placeholder="Description du tournoi..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Date de début</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Date de fin</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Logo du tournoi</label>
                  <div className="flex items-center space-x-4">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo" className="w-16 h-16 object-cover rounded-xl" />
                    ) : (
                      <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <label className="btn-secondary cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      Choisir une image
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.is_active ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                  <span className="text-gray-300">Tournoi actif</span>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>{editingTournament ? 'Modifier' : 'Créer'}</span>
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

export default AdminTournaments;
