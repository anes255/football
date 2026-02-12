import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Edit, Trash2, Users, Save, X, Crown, Play } from 'lucide-react';
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
    name: '', description: '', start_date: '', end_date: '', logo_url: '', is_active: true, format: 'groups_4', max_teams: 32, enable_player_predictions: false
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
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
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
      setFormData({ name: '', description: '', start_date: '', end_date: '', logo_url: '', is_active: true, format: 'groups_4', max_teams: 32, enable_player_predictions: false });
      fetchData();
    } catch (error) { toast.error('Erreur'); }
  };

  const handleEdit = (tournament) => {
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      start_date: tournament.start_date?.split('T')[0] || '',
      end_date: tournament.end_date?.split('T')[0] || '',
      logo_url: tournament.logo_url || '',
      is_active: tournament.is_active,
      format: tournament.format || 'groups_4',
      max_teams: tournament.max_teams || 32,
      enable_player_predictions: tournament.enable_player_predictions || false
    });
    setEditingId(tournament.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce tournoi et toutes ses données ?')) return;
    try {
      await tournamentsAPI.delete(id);
      toast.success('Tournoi supprimé');
      fetchData();
    } catch (error) { toast.error('Erreur'); }
  };

  const handleStart = async (tournament) => {
    if (!confirm(`Démarrer "${tournament.name}" ?`)) return;
    try {
      await adminAPI.startTournament(tournament.id);
      toast.success('Tournoi démarré !');
      fetchData();
    } catch (error) { toast.error('Erreur'); }
  };

  const getTournamentStatus = (t) => {
    if (!t.is_active) return { label: 'Terminé', color: 'bg-gray-500/20 text-gray-400' };
    if (t.has_started) return { label: 'En cours', color: 'bg-green-500/20 text-green-400' };
    return { label: 'Pas commencé', color: 'bg-blue-500/20 text-blue-400' };
  };

  const getFormatLabel = (format) => formats.find(f => f.value === format)?.label || format;

  if (loading) return <div className="flex items-center justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" /><span>Tournois</span>
        </h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '', start_date: '', end_date: '', logo_url: '', is_active: true, format: 'groups_4', max_teams: 32, enable_player_predictions: false }); }} className="btn-primary flex items-center space-x-1.5 text-sm px-3 py-2">
          <Plus className="w-4 h-4" /><span>Nouveau</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h2 className="text-lg font-bold text-white mb-3">{editingId ? 'Modifier' : 'Nouveau'} Tournoi</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nom</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Format</label>
                <select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm">
                  {formats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nb équipes</label>
                <select value={formData.max_teams} onChange={(e) => setFormData({ ...formData, max_teams: parseInt(e.target.value) })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm">
                  {[2,4,6,8,10,12,16,20,24,32,48,64].map(n => <option key={n} value={n}>{n} équipes</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date début</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date fin</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm" rows="2" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Logo URL</label>
              <input type="text" value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm" />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-gray-400 text-sm">Actif</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={formData.enable_player_predictions} onChange={(e) => setFormData({ ...formData, enable_player_predictions: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-gray-400 text-sm">Prédictions joueurs</span>
              </label>
            </div>
            <div className="flex space-x-3 pt-1">
              <button type="submit" className="btn-primary text-sm px-4 py-2">{editingId ? 'Modifier' : 'Créer'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm px-4 py-2">Annuler</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Tournament List */}
      <div className="space-y-3">
        {tournaments.length === 0 ? (
          <div className="card text-center py-12">
            <Trophy className="w-14 h-14 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucun tournoi</p>
          </div>
        ) : tournaments.map(tournament => {
          const status = getTournamentStatus(tournament);
          return (
            <motion.div key={tournament.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              {/* Row 1: Logo + Name + Badge */}
              <div className="flex items-center space-x-3">
                {tournament.logo_url ? (
                  <img src={tournament.logo_url} alt={tournament.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm truncate">{tournament.name}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 leading-tight ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {getFormatLabel(tournament.format)} · {tournament.team_count || 0}/{tournament.max_teams || 32} éq. · {tournament.match_count || 0} matchs
                  </p>
                </div>
              </div>

              {/* Row 2: Actions - left side labeled, right side icons */}
              <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/5">
                {!tournament.has_started && tournament.is_active && (
                  <button onClick={() => handleStart(tournament)} className="flex items-center space-x-1 px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-[11px] font-medium">
                    <Play className="w-3 h-3" /><span>Démarrer</span>
                  </button>
                )}
                <button onClick={() => setShowGroupsModal(tournament)} className="flex items-center space-x-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[11px] font-medium">
                  <Users className="w-3 h-3" /><span>Groupes</span>
                </button>
                {tournament.has_started && tournament.is_active && (
                  <button onClick={() => setShowWinnerModal(tournament)} className="flex items-center space-x-1 px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 text-[11px] font-medium">
                    <Crown className="w-3 h-3" /><span>Vainqueur</span>
                  </button>
                )}
                <div className="flex-1" />
                <button onClick={() => handleEdit(tournament)} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(tournament.id)} className="p-1.5 hover:bg-red-500/10 rounded-md text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {showGroupsModal && <GroupsModal tournament={showGroupsModal} teams={teams} formats={formats} onClose={() => { setShowGroupsModal(null); fetchData(); }} />}
      {showWinnerModal && <WinnerModal tournament={showWinnerModal} teams={teams} onClose={() => setShowWinnerModal(null)} />}
    </div>
  );
};

const WinnerModal = ({ tournament, teams, onClose }) => {
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [awarding, setAwarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { setTournamentTeams((await adminAPI.getTournamentTeams(tournament.id)).data || []); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-lg">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) return <img src={flagUrl} alt={name} className="w-6 h-4 object-cover rounded" />;
    return <span className="text-lg">{flagUrl}</span>;
  };

  const handleAwardWinner = async () => {
    setAwarding(true);
    try {
      const res = await adminAPI.awardTournamentWinner({ tournament_id: tournament.id, team_id: parseInt(selectedWinner) });
      toast.success(res.data.message);
      onClose();
    } catch (e) { toast.error('Erreur'); }
    finally { setAwarding(false); }
  };

  const availableTeams = tournamentTeams.map(tt => {
    const team = teams.find(t => t.id === tt.team_id) || tt;
    return { ...team, id: tt.team_id };
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-hidden sm:mx-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-base font-bold text-white truncate pr-2">Vainqueur - {tournament.name}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg shrink-0"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          {loading ? (
            <div className="text-center py-8"><div className="animate-spin w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div></div>
          ) : availableTeams.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">Aucune équipe dans ce tournoi</p>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">Sélectionnez l'équipe gagnante</p>
              <div className="space-y-1.5 mb-4 max-h-56 overflow-y-auto">
                {availableTeams.map(team => (
                  <label key={team.id} className={`flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selectedWinner === team.id.toString() ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                    <input type="radio" name="winner" value={team.id} checked={selectedWinner === team.id.toString()} onChange={(e) => setSelectedWinner(e.target.value)} className="sr-only" />
                    {renderFlag(team.flag_url, team.name)}
                    <span className="text-white font-medium flex-1 text-sm">{team.name}</span>
                    {selectedWinner === team.id.toString() && <Trophy className="w-4 h-4 text-yellow-400" />}
                  </label>
                ))}
              </div>
              <div className="flex space-x-3">
                <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2">Annuler</button>
                <button onClick={handleAwardWinner} disabled={!selectedWinner || awarding} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 text-sm">
                  {awarding ? <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" /> : <><Crown className="w-4 h-4" /><span>Déclarer</span></>}
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
  const numGroups = format?.groups || Math.ceil((tournament.max_teams || 32) / 4);
  const groupLetters = 'ABCDEFGHIJKLMNOP'.split('').slice(0, numGroups);

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
      if (groupName === '') setTournamentTeams(tournamentTeams.filter(t => t.team_id !== numericTeamId));
      else setTournamentTeams(tournamentTeams.map(t => t.team_id === numericTeamId ? { ...t, group_name: groupName } : t));
    } else if (groupName) {
      const team = teams.find(t => t.id === numericTeamId);
      if (team) setTournamentTeams([...tournamentTeams, { team_id: numericTeamId, group_name: groupName, name: team.name, flag_url: team.flag_url }]);
    }
  };

  const getTeamGroup = (teamId) => tournamentTeams.find(t => t.team_id === parseInt(teamId))?.group_name || '';

  const saveGroups = async () => {
    setSaving(true);
    try {
      const teamsData = tournamentTeams.filter(t => t.team_id && t.group_name).map(t => ({ teamId: parseInt(t.team_id), groupName: t.group_name }));
      if (teamsData.length === 0) { toast.error('Aucune équipe'); setSaving(false); return; }
      if (teamsData.length > (tournament.max_teams || 32)) { toast.error(`Max ${tournament.max_teams || 32} équipes`); setSaving(false); return; }
      await adminAPI.bulkAddTournamentTeams(tournament.id, { teams: teamsData });
      toast.success(`${teamsData.length} équipes sauvegardées`);
      onClose();
    } catch (error) { toast.error(error.response?.data?.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-sm">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) return <img src={flagUrl} alt={name} className="w-5 h-3.5 object-cover rounded" />;
    return <span className="text-sm">{flagUrl}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden sm:mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-3.5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white truncate pr-2">Groupes – {tournament.name}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg shrink-0"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-gray-400">{tournamentTeams.length}/{tournament.max_teams || 32} équipes</p>
            <button onClick={saveGroups} disabled={saving} className="btn-primary flex items-center space-x-1 text-xs px-3 py-1.5">
              {saving ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-3 h-3" />}
              <span>{saving ? '...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-90px)] sm:max-h-[calc(85vh-90px)]">
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div></div>
          ) : (
            <>
              {/* Group preview - compact 2-col grid */}
              <div className="p-3.5 pb-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {groupLetters.map(letter => {
                    const gt = tournamentTeams.filter(t => t.group_name === letter);
                    return (
                      <div key={letter} className="bg-white/5 rounded-lg p-2">
                        <p className="font-bold text-white text-[11px] mb-1">Gr. {letter} <span className="text-gray-500 font-normal">({gt.length})</span></p>
                        {gt.length === 0 ? <p className="text-gray-600 text-[10px]">Vide</p> : (
                          <div className="space-y-0.5">
                            {gt.map(team => (
                              <div key={team.team_id} className="flex items-center space-x-1 text-[10px]">
                                {renderFlag(team.flag_url, team.name)}
                                <span className="text-gray-300 truncate">{team.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team list */}
              <div className="p-3.5 pt-1">
                <p className="font-bold text-white text-xs mb-2">Assigner les équipes</p>
                <div className="space-y-1">
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center justify-between py-2 px-2.5 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        {renderFlag(team.flag_url, team.name)}
                        <span className="text-white text-xs truncate">{team.name}</span>
                      </div>
                      <select value={getTeamGroup(team.id)} onChange={(e) => handleTeamGroupChange(team.id, e.target.value)} className="bg-gray-700 border border-gray-600 rounded py-1 px-1.5 text-white text-[11px] ml-2 shrink-0 min-w-[60px]">
                        <option value="">—</option>
                        {groupLetters.map(letter => <option key={letter} value={letter}>Gr. {letter}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminTournaments;
