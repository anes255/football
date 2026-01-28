import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Check, X, Calendar } from 'lucide-react';
import { matchesAPI, teamsAPI } from '../../api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

const AdminMatches = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [resultMatch, setResultMatch] = useState(null);
  const [formData, setFormData] = useState({ team1_id: '', team2_id: '', match_date: '', stage: 'Groupes' });
  const [resultData, setResultData] = useState({ team1_score: '', team2_score: '' });

  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => { 
    try { 
      const [m, t] = await Promise.all([matchesAPI.getAll(), teamsAPI.getAll()]); 
      setMatches(m.data || []); 
      setTeams(t.data || []); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleSubmit = async (e) => { 
    e.preventDefault();
    if (formData.team1_id === formData.team2_id) {
      toast.error('Les deux équipes doivent être différentes');
      return;
    }
    try { 
      if (editingMatch) { 
        await matchesAPI.update(editingMatch.id, formData); 
        toast.success('Match modifié !'); 
      } else { 
        await matchesAPI.create(formData); 
        toast.success('Match créé !'); 
      } 
      fetchData(); 
      closeModal(); 
    } catch (error) { 
      toast.error(error.response?.data?.error || 'Erreur'); 
    } 
  };
  
  const handleSetResult = async (e) => { 
    e.preventDefault(); 
    try { 
      await matchesAPI.setResult(resultMatch.id, { team1_score: parseInt(resultData.team1_score), team2_score: parseInt(resultData.team2_score) }); 
      toast.success('Résultat enregistré et points calculés !'); 
      fetchData(); 
      setShowResultModal(false); 
    } catch (error) { 
      toast.error(error.response?.data?.error || 'Erreur'); 
    } 
  };
  
  const handleDelete = async (id) => { 
    if (!confirm('Supprimer ce match ?')) return; 
    try { 
      await matchesAPI.delete(id); 
      toast.success('Match supprimé'); 
      fetchData(); 
    } catch (e) { 
      toast.error(e.response?.data?.error || 'Erreur'); 
    } 
  };
  
  const openModal = (match = null) => { 
    if (match) { 
      setEditingMatch(match); 
      setFormData({ team1_id: match.team1_id, team2_id: match.team2_id, match_date: match.match_date.slice(0, 16), stage: match.stage || 'Groupes' }); 
    } else { 
      setEditingMatch(null); 
      setFormData({ team1_id: '', team2_id: '', match_date: '', stage: 'Groupes' }); 
    } 
    setShowModal(true); 
  };
  
  const closeModal = () => { 
    setShowModal(false); 
    setEditingMatch(null); 
  };
  
  const openResultModal = (match) => { 
    setResultMatch(match); 
    setResultData({ team1_score: '', team2_score: '' }); 
    setShowResultModal(true); 
  };
  
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  
  const filteredMatches = matches.filter(m => filter === 'all' || m.status === filter);

  const renderFlag = (flagUrl) => {
    if (flagUrl && (flagUrl.startsWith('data:') || flagUrl.startsWith('http'))) {
      return <img src={flagUrl} alt="" className="w-6 h-6 rounded-full object-cover" />;
    }
    return <span>{flagUrl || '🏳️'}</span>;
  };

  return (
    <div className="min-h-screen pt-16 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl gradient-text tracking-wider">Matchs</h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2" disabled={teams.length < 2}>
            <Plus className="w-5 h-5" /><span>Nouveau match</span>
          </button>
        </div>

        {teams.length < 2 && (
          <div className="card mb-6 bg-yellow-500/10 border-yellow-500/30">
            <p className="text-yellow-400">⚠️ Créez au moins 2 équipes avant de pouvoir ajouter des matchs.</p>
          </div>
        )}
        
        <div className="flex space-x-2 mb-6">
          {[{ value: 'all', label: 'Tous' }, { value: 'upcoming', label: 'À venir' }, { value: 'completed', label: 'Terminés' }].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={`px-4 py-2 rounded-lg ${filter === f.value ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : matches.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Aucun match créé</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <motion.div key={match.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">{formatDate(match.match_date)}</p>
                      <p className="text-xs text-gray-500">{match.stage}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {renderFlag(match.team1_flag)}
                        <span className="text-white font-semibold">{match.team1_name}</span>
                      </div>
                      {match.status === 'completed' ? (
                        <span className="text-2xl font-bold text-primary-500">{match.team1_score} - {match.team2_score}</span>
                      ) : (
                        <span className="text-gray-500 font-display text-xl">VS</span>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-semibold">{match.team2_name}</span>
                        {renderFlag(match.team2_flag)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${match.status === 'completed' ? 'bg-green-500/20 text-green-400' : match.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {match.status === 'completed' ? 'Terminé' : match.status === 'live' ? 'En cours' : 'À venir'}
                    </span>
                    {match.status === 'upcoming' && (
                      <button onClick={() => openResultModal(match)} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30" title="Entrer le résultat">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => openModal(match)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(match.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Add/Edit Match Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-md w-full">
              <div className="flex justify-between mb-6">
                <h2 className="font-display text-2xl text-white">{editingMatch ? 'Modifier' : 'Nouveau'} match</h2>
                <button onClick={closeModal}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Équipe 1 *</label>
                  <select value={formData.team1_id} onChange={(e) => setFormData({...formData, team1_id: e.target.value})} className="input" required>
                    <option value="">-- Sélectionner --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Équipe 2 *</label>
                  <select value={formData.team2_id} onChange={(e) => setFormData({...formData, team2_id: e.target.value})} className="input" required>
                    <option value="">-- Sélectionner --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Date et heure *</label>
                  <input type="datetime-local" value={formData.match_date} onChange={(e) => setFormData({...formData, match_date: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Phase</label>
                  <select value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})} className="input">
                    <option value="Groupes">Phase de groupes</option>
                    <option value="Huitièmes">Huitièmes de finale</option>
                    <option value="Quarts">Quarts de finale</option>
                    <option value="Demi-finales">Demi-finales</option>
                    <option value="3ème place">Match pour la 3ème place</option>
                    <option value="Finale">Finale</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20">Annuler</button>
                  <button type="submit" className="flex-1 btn-primary">{editingMatch ? 'Modifier' : 'Créer'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        
        {/* Set Result Modal */}
        {showResultModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-md w-full">
              <div className="flex justify-between mb-6">
                <h2 className="font-display text-2xl text-white">Entrer le résultat</h2>
                <button onClick={() => setShowResultModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <p className="text-center text-gray-300 mb-6">
                <span className="font-semibold">{resultMatch?.team1_name}</span>
                <span className="text-gray-500 mx-2">vs</span>
                <span className="font-semibold">{resultMatch?.team2_name}</span>
              </p>
              <form onSubmit={handleSetResult} className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">{resultMatch?.team1_name}</p>
                    <input type="number" min="0" value={resultData.team1_score} onChange={(e) => setResultData({...resultData, team1_score: e.target.value})} className="w-20 h-16 text-center text-2xl input" required />
                  </div>
                  <span className="text-2xl text-gray-500 mt-6">-</span>
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">{resultMatch?.team2_name}</p>
                    <input type="number" min="0" value={resultData.team2_score} onChange={(e) => setResultData({...resultData, team2_score: e.target.value})} className="w-20 h-16 text-center text-2xl input" required />
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">Les points seront automatiquement calculés pour tous les pronostics</p>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setShowResultModal(false)} className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20">Annuler</button>
                  <button type="submit" className="flex-1 btn-primary">Valider</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMatches;
