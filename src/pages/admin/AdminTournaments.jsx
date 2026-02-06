import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Edit, Trash2, Users, Save, X, Crown } from 'lucide-react';
import { tournamentsAPI, teamsAPI, adminAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', start_date: '', end_date: '', logo_url: '', is_active: true, format: 'groups_4'
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [tourRes, teamsRes, formatsRes] = await Promise.all([
        tournamentsAPI.getAll(), teamsAPI.getAll(), tournamentsAPI.getFormats()
      ]);
      setTournaments(tourRes.data);
      setTeams(teamsRes.data);
      setFormats(formatsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await tournamentsAPI.update(editingId, formData);
        toast.success('Tournoi modifié');
      } else {
        await tournamentsAPI.create(formData);
        toast.success('Tournoi créé');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', start_date: '', end_date: '', logo_url: '', is_active: true, format: 'groups_4' });
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleEdit = (tournament) => {
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      start_date: tournament.start_date?.split('T')[0] || '',
      end_date: tournament.end_date?.split('T')[0] || '',
      logo_url: tournament.logo_url || '',
      is_active: tournament.is_active,
      format: tournament.format || 'groups_4'
    });
    setEditingId(tournament.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce tournoi ?')) return;
    try {
      await tournamentsAPI.delete(id);
      toast.success('Tournoi supprimé');
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getFormatLabel = (format) => formats.find(f => f.value === format)?.label || format;

  if (loading) return <div className="flex items-center justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <span>Tournois</span>
        </h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '', start_date: '', end_date: '', logo_url: '', is_active: true, format: 'groups_4' }); }} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" /><span>Nouveau</span>
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h2 className="text-xl font-bold text-white mb-4">{editingId ? 'Modifier' : 'Nouveau'} Tournoi</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Format</label>
                <select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white">
                  {formats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date début</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date fin</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white" rows="2" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Logo URL</label>
              <input type="text" value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" />
              <label className="text-gray-400">Actif</label>
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">{editingId ? 'Modifier' : 'Créer'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        {tournaments.length === 0 ? (
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun tournoi</p>
          </div>
        ) : tournaments.map(tournament => (
          <motion.div key={tournament.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {tournament.logo_url ? (
                  <img src={tournament.logo_url} alt={tournament.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">{tournament.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>{getFormatLabel(tournament.format)}</span>
                    <span>•</span>
                    <span>{tournament.match_count || 0} matchs</span>
                    <span>•</span>
                    <span>{tournament.team_count || 0} équipes</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${tournament.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {tournament.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setShowWinnerModal(tournament)} className="p-2 hover:bg-yellow-500/20 text-yellow-400 rounded-lg" title="Déclarer le vainqueur">
                  <Crown className="w-5 h-5" />
                </button>
                <button onClick={() => setShowGroupsModal(tournament)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg" title="Gérer les groupes">
                  <Users className="w-5 h-5" />
                </button>
                <button onClick={() => handleEdit(tournament)} className="p-2 hover:bg-white/10 text-gray-400 rounded-lg">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(tournament.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showGroupsModal && <GroupsModal tournament={showGroupsModal} teams={teams} formats={formats} onClose={() => { setShowGroupsModal(null); fetchData(); }} />}
      {showWinnerModal && <WinnerModal tournament={showWinnerModal} teams={teams} onClose={() => { setShowWinnerModal(null); fetchData(); }} />}
    </div>
  );
};

const WinnerModal = ({ tournament, teams, onClose }) => {
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [loading, setLoading] = useState(true);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    try {
      const res = await adminAPI.getTournamentTeams(tournament.id);
      setTournamentTeams(res.data || []);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleAwardWinner = async () => {
    if (!selectedWinner) { toast.error('Sélectionnez une équipe'); return; }
    if (!confirm('Déclarer ce vainqueur et attribuer les points bonus ?')) return;
    setAwarding(true);
    try {
      const res = await adminAPI.awardTournamentWinner({ tournament_id: tournament.id, team_id: parseInt(selectedWinner) });
      toast.success(res.data.message || 'Vainqueur déclaré !');
      onClose();
    } catch (error) { toast.error('Erreur'); }
    finally { setAwarding(false); }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-2xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) return <img src={flagUrl} alt={name} className="w-8 h-6 object-cover rounded" />;
    return <span className="text-2xl">{flagUrl}</span>;
  };

  const availableTeams = tournamentTeams.length > 0 ? tournamentTeams.map(tt => ({ id: tt.team_id, name: tt.name, flag_url: tt.flag_url })) : teams;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg"><Crown className="w-6 h-6 text-yellow-400" /></div>
            <div>
              <h2 className="text-xl font-bold text-white">Déclarer le vainqueur</h2>
              <p className="text-gray-400 text-sm">{tournament.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-6 h-6 text-gray-400" /></button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div></div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">Sélectionnez l'équipe gagnante</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableTeams.map(team => (
                    <label key={team.id} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedWinner === team.id.toString() ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                      <input type="radio" name="winner" value={team.id} checked={selectedWinner === team.id.toString()} onChange={(e) => setSelectedWinner(e.target.value)} className="sr-only" />
                      {renderFlag(team.flag_url, team.name)}
                      <span className="text-white font-medium flex-1">{team.name}</span>
                      {selectedWinner === team.id.toString() && <Trophy className="w-5 h-5 text-yellow-400" />}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
                <button onClick={handleAwardWinner} disabled={!selectedWinner || awarding} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2">
                  {awarding ? <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" /> : <><Crown className="w-5 h-5" /><span>Déclarer</span></>}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const GroupsModal = ({ tournament, teams, formats, onClose }) => {
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const format = formats.find(f => f.value === tournament.format);
  const numGroups = format?.groups || 4;
  const groupLetters = 'ABCDEFGH'.split('').slice(0, numGroups);

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    try {
      const res = await adminAPI.getTournamentTeams(tournament.id);
      setTournamentTeams((res.data || []).map(t => ({ ...t, team_id: t.team_id || t.id })));
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleTeamGroupChange = (teamId, groupName) => {
    const numericTeamId = parseInt(teamId);
    const existing = tournamentTeams.find(t => t.team_id === numericTeamId);
    if (existing) {
      if (groupName === '') {
        setTournamentTeams(tournamentTeams.filter(t => t.team_id !== numericTeamId));
      } else {
        setTournamentTeams(tournamentTeams.map(t => t.team_id === numericTeamId ? { ...t, group_name: groupName } : t));
      }
    } else if (groupName) {
      const team = teams.find(t => t.id === numericTeamId);
      if (team) setTournamentTeams([...tournamentTeams, { team_id: numericTeamId, group_name: groupName, name: team.name, flag_url: team.flag_url }]);
    }
  };

  const getTeamGroup = (teamId) => tournamentTeams.find(t => t.team_id === parseInt(teamId))?.group_name || '';

  const saveGroups = async () => {
    setSaving(true);
    try {
      // Build teams data - NO position field
      const teamsData = tournamentTeams
        .filter(t => t.team_id && t.group_name)
        .map(t => ({ teamId: parseInt(t.team_id), groupName: t.group_name }));
      
      if (teamsData.length === 0) {
        toast.error('Aucune équipe à sauvegarder');
        setSaving(false);
        return;
      }
      
      await adminAPI.bulkAddTournamentTeams(tournament.id, { teams: teamsData });
      toast.success(`${teamsData.length} équipes sauvegardées`);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-lg">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) return <img src={flagUrl} alt={name} className="w-6 h-4 object-cover rounded" />;
    return <span className="text-lg">{flagUrl}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Groupes - {tournament.name}</h2>
            <p className="text-gray-400 text-sm">{format?.label} • {tournamentTeams.length} équipes sélectionnées</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={saveGroups} disabled={saving} className="btn-primary flex items-center space-x-2">
              {saving ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-6 h-6 text-gray-400" /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div></div>
          ) : (
            <>
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {groupLetters.map(letter => {
                  const groupTeams = tournamentTeams.filter(t => t.group_name === letter);
                  return (
                    <div key={letter} className="bg-white/5 rounded-xl p-4">
                      <h3 className="font-bold text-white mb-3">Groupe {letter} ({groupTeams.length})</h3>
                      {groupTeams.length === 0 ? <p className="text-gray-500 text-sm">Aucune équipe</p> : (
                        <div className="space-y-2">
                          {groupTeams.map(team => (
                            <div key={team.team_id} className="flex items-center space-x-2 text-sm">
                              {renderFlag(team.flag_url, team.name)}
                              <span className="text-white">{team.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <h3 className="font-bold text-white mb-4">Assigner les équipes aux groupes</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {renderFlag(team.flag_url, team.name)}
                      <span className="text-white text-sm">{team.name}</span>
                    </div>
                    <select value={getTeamGroup(team.id)} onChange={(e) => handleTeamGroupChange(team.id, e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg py-1 px-2 text-white text-sm">
                      <option value="">-</option>
                      {groupLetters.map(letter => <option key={letter} value={letter}>Groupe {letter}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminTournaments;
