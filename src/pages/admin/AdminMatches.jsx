import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Edit, Trash2, Trophy, X, Check } from 'lucide-react';
import { matchesAPI, teamsAPI, tournamentsAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminMatches = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [filterTournament, setFilterTournament] = useState('');
  const [formData, setFormData] = useState({
    tournament_id: '',
    team1_id: '',
    team2_id: '',
    match_date: '',
    match_time: '',
    stage: 'Groupes'
  });
  const [resultData, setResultData] = useState({ team1_score: 0, team2_score: 0 });

  const stages = ['Groupes', 'Huitièmes', 'Quarts', 'Demi-finales', '3ème place', 'Finale'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes, tournamentsRes] = await Promise.all([
        matchesAPI.getAll(),
        teamsAPI.getAll(),
        tournamentsAPI.getAll()
      ]);
      setMatches(matchesRes.data);
      setTeams(teamsRes.data);
      setTournaments(tournamentsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const matchDateTime = `${formData.match_date}T${formData.match_time}:00`;
      const data = {
        tournament_id: formData.tournament_id || null,
        team1_id: parseInt(formData.team1_id),
        team2_id: parseInt(formData.team2_id),
        match_date: matchDateTime,
        stage: formData.stage
      };

      if (editingMatch) {
        await matchesAPI.update(editingMatch.id, data);
        toast.success('Match modifié');
      } else {
        await matchesAPI.create(data);
        toast.success('Match créé');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleSetResult = async (e) => {
    e.preventDefault();
    try {
      await matchesAPI.setResult(selectedMatch.id, resultData);
      toast.success('Résultat enregistré !');
      setShowResultModal(false);
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleEdit = (match) => {
    const matchDate = new Date(match.match_date);
    setEditingMatch(match);
    setFormData({
      tournament_id: match.tournament_id || '',
      team1_id: match.team1_id.toString(),
      team2_id: match.team2_id.toString(),
      match_date: matchDate.toISOString().split('T')[0],
      match_time: matchDate.toTimeString().slice(0, 5),
      stage: match.stage || 'Groupes'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce match ?')) return;
    try {
      await matchesAPI.delete(id);
      toast.success('Match supprimé');
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const openResultModal = (match) => {
    setSelectedMatch(match);
    setResultData({ team1_score: match.team1_score || 0, team2_score: match.team2_score || 0 });
    setShowResultModal(true);
  };

  const resetForm = () => {
    setEditingMatch(null);
    setFormData({ tournament_id: '', team1_id: '', team2_id: '', match_date: '', match_time: '', stage: 'Groupes' });
  };

  const renderFlag = (flagUrl, teamName) => {
    if (!flagUrl) return <span className="text-2xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={teamName} className="w-8 h-6 object-cover rounded" />;
    }
    return <span className="text-2xl">{flagUrl}</span>;
  };

  const getMatchStatus = (match) => {
    if (match.status === 'completed') return { text: 'Terminé', color: 'bg-green-500/20 text-green-400' };
    if (match.status === 'live') return { text: 'En cours', color: 'bg-red-500/20 text-red-400' };
    const now = new Date();
    const matchDate = new Date(match.match_date);
    if (now >= matchDate) return { text: 'Commencé', color: 'bg-yellow-500/20 text-yellow-400' };
    return { text: 'À venir', color: 'bg-blue-500/20 text-blue-400' };
  };

  const filteredMatches = filterTournament
    ? matches.filter(m => m.tournament_id === parseInt(filterTournament))
    : matches;

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
            <h1 className="font-display text-4xl gradient-text">Gestion des Matchs</h1>
            <p className="text-gray-400 mt-2">Planifiez et gérez les matchs</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-xl py-2 px-4 text-white"
            >
              <option value="">Tous les tournois</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Nouveau Match</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun match planifié</p>
            </div>
          ) : (
            filteredMatches.map((match) => {
              const status = getMatchStatus(match);
              return (
                <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-6 flex-1">
                      <div className="flex items-center space-x-2 min-w-[120px] justify-end">
                        <span className="text-white font-semibold">{match.team1_name}</span>
                        {renderFlag(match.team1_flag, match.team1_name)}
                      </div>
                      <div className="text-center min-w-[100px]">
                        {match.status === 'completed' ? (
                          <div className="text-2xl font-bold text-white">{match.team1_score} - {match.team2_score}</div>
                        ) : (
                          <div className="text-primary-400 font-semibold">
                            {new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">{new Date(match.match_date).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div className="flex items-center space-x-2 min-w-[120px]">
                        {renderFlag(match.team2_flag, match.team2_name)}
                        <span className="text-white font-semibold">{match.team2_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {match.tournament_name && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">{match.tournament_name}</span>
                      )}
                      <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full">{match.stage}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.text}</span>
                      {match.status !== 'completed' && (
                        <button onClick={() => openResultModal(match)} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
                          <Trophy className="w-5 h-5" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(match)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(match.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{editingMatch ? 'Modifier le match' : 'Nouveau match'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Tournoi</label>
                  <select value={formData.tournament_id} onChange={(e) => setFormData({ ...formData, tournament_id: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white">
                    <option value="">Aucun tournoi</option>
                    {tournaments.filter(t => t.is_active).map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Équipe 1 *</label>
                    <select value={formData.team1_id} onChange={(e) => setFormData({ ...formData, team1_id: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white" required>
                      <option value="">Sélectionner</option>
                      {teams.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Équipe 2 *</label>
                    <select value={formData.team2_id} onChange={(e) => setFormData({ ...formData, team2_id: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white" required>
                      <option value="">Sélectionner</option>
                      {teams.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Date *</label>
                    <input type="date" value={formData.match_date} onChange={(e) => setFormData({ ...formData, match_date: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Heure *</label>
                    <input type="time" value={formData.match_time} onChange={(e) => setFormData({ ...formData, match_time: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Phase</label>
                  <select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white">
                    {stages.map(s => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                  <button type="submit" className="btn-primary flex-1">{editingMatch ? 'Modifier' : 'Créer'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Result Modal */}
        {showResultModal && selectedMatch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Entrer le résultat</h2>
                <button onClick={() => setShowResultModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSetResult} className="space-y-6">
                <div className="flex items-center justify-center space-x-6">
                  <div className="text-center">
                    {renderFlag(selectedMatch.team1_flag, selectedMatch.team1_name)}
                    <p className="text-white font-semibold mt-2">{selectedMatch.team1_name}</p>
                    <input type="number" min="0" value={resultData.team1_score} onChange={(e) => setResultData({ ...resultData, team1_score: parseInt(e.target.value) || 0 })} className="w-20 bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white text-center text-2xl mt-3" />
                  </div>
                  <span className="text-3xl text-gray-400">-</span>
                  <div className="text-center">
                    {renderFlag(selectedMatch.team2_flag, selectedMatch.team2_name)}
                    <p className="text-white font-semibold mt-2">{selectedMatch.team2_name}</p>
                    <input type="number" min="0" value={resultData.team2_score} onChange={(e) => setResultData({ ...resultData, team2_score: parseInt(e.target.value) || 0 })} className="w-20 bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white text-center text-2xl mt-3" />
                  </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-400 text-sm text-center">⚠️ Cette action calculera automatiquement les points</p>
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowResultModal(false)} className="btn-secondary flex-1">Annuler</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center space-x-2">
                    <Check className="w-5 h-5" /><span>Valider</span>
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

export default AdminMatches;
