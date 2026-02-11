import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, Plus, Edit, Trash2, X, Check, Image, Trophy, Save, Users } from 'lucide-react';
import { teamsAPI, tournamentsAPI, adminAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [formats, setFormats] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', flag_url: '' });
  const [tab, setTab] = useState('groups'); // 'groups' or 'all'

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, tourRes, formatsRes] = await Promise.all([
        teamsAPI.getAll(), tournamentsAPI.getAll(), tournamentsAPI.getFormats()
      ]);
      setTeams(teamsRes.data || []);
      setTournaments(tourRes.data || []);
      setFormats(formatsRes.data || []);
      // Auto-select first tournament
      const first = tourRes.data?.[0];
      if (first) {
        setSelectedTournament(first);
        fetchTournamentTeams(first.id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTournamentTeams = async (tournamentId) => {
    try {
      const res = await adminAPI.getTournamentTeams(tournamentId);
      setTournamentTeams((res.data || []).map(t => ({ ...t, team_id: t.team_id || t.id })));
    } catch (e) { console.error(e); setTournamentTeams([]); }
  };

  const handleSelectTournament = (t) => {
    setSelectedTournament(t);
    fetchTournamentTeams(t.id);
  };

  // Team CRUD (global)
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
      setEditingTeam(null);
      setFormData({ name: '', code: '', flag_url: '' });
      const res = await teamsAPI.getAll();
      setTeams(res.data || []);
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({ name: team.name, code: team.code || '', flag_url: team.flag_url || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette équipe ?')) return;
    try {
      await teamsAPI.delete(id);
      toast.success('Équipe supprimée');
      const res = await teamsAPI.getAll();
      setTeams(res.data || []);
      if (selectedTournament) fetchTournamentTeams(selectedTournament.id);
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { toast.error('Image trop grande (max 500KB)'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, flag_url: reader.result });
    reader.readAsDataURL(file);
  };

  // Group assignment for selected tournament
  const format = selectedTournament ? formats.find(f => f.value === selectedTournament.format) : null;
  const numGroups = format?.groups || (selectedTournament ? Math.ceil((selectedTournament.max_teams || 32) / 4) : 4);
  const groupLetters = 'ABCDEFGHIJKLMNOP'.split('').slice(0, Math.max(numGroups, 1));

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
    if (!selectedTournament) return;
    setSaving(true);
    try {
      const teamsData = tournamentTeams.filter(t => t.team_id && t.group_name).map(t => ({ teamId: parseInt(t.team_id), groupName: t.group_name }));
      if (teamsData.length === 0) { toast.error('Aucune équipe assignée'); setSaving(false); return; }
      const max = selectedTournament.max_teams || 32;
      if (teamsData.length > max) { toast.error(`Maximum ${max} équipes pour ce tournoi`); setSaving(false); return; }
      await adminAPI.bulkAddTournamentTeams(selectedTournament.id, { teams: teamsData });
      toast.success(`${teamsData.length} équipes sauvegardées pour ${selectedTournament.name}`);
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) return <img src={flagUrl} alt={name} className="w-8 h-6 object-cover rounded" />;
    return <span className="text-xl">{flagUrl}</span>;
  };

  if (loading) return <div className="flex items-center justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
          <Flag className="w-8 h-8 text-blue-500" /><span>Équipes</span>
        </h1>
        <button onClick={() => { setEditingTeam(null); setFormData({ name: '', code: '', flag_url: '' }); setShowModal(true); }} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" /><span>Nouvelle équipe</span>
        </button>
      </div>

      {/* Tournament Selector */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" /><span>Sélectionner un tournoi</span>
        </h2>
        <select
          value={selectedTournament?.id || ''}
          onChange={(e) => {
            const t = tournaments.find(t => t.id.toString() === e.target.value);
            if (t) handleSelectTournament(t);
          }}
          className="w-full bg-gray-700 border border-gray-600 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-primary-500"
        >
          <option value="" disabled>Choisir un tournoi</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.team_count || 0} équipes)</option>
          ))}
        </select>
        {tournaments.length === 0 && <p className="text-gray-400 text-sm mt-2">Créez d'abord un tournoi</p>}
      </div>

      {/* Tabs */}
      {selectedTournament && (
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-primary-500"
        >
          <option value="groups">Groupes & Assignation</option>
          <option value="all">Toutes les équipes ({teams.length})</option>
        </select>
      )}

      {/* Groups Tab */}
      {selectedTournament && tab === 'groups' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Group Summary */}
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              {selectedTournament.name} • {tournamentTeams.length}/{selectedTournament.max_teams || 32} équipes • {format?.label || selectedTournament.format}
            </p>
            <button onClick={saveGroups} disabled={saving} className="btn-primary text-sm flex items-center space-x-2">
              {saving ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder les groupes'}</span>
            </button>
          </div>

          {/* Groups Preview */}
          <div className="grid md:grid-cols-4 gap-4">
            {groupLetters.map(letter => {
              const groupTeams = tournamentTeams.filter(t => t.group_name === letter);
              return (
                <div key={letter} className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-bold text-white mb-3">Groupe {letter} <span className="text-gray-400 font-normal text-sm">({groupTeams.length})</span></h3>
                  {groupTeams.length === 0 ? <p className="text-gray-500 text-sm">Vide</p> : (
                    <div className="space-y-2">
                      {groupTeams.map(team => (
                        <div key={team.team_id} className="flex items-center space-x-2 text-sm">
                          {renderFlag(team.flag_url, team.name)}
                          <span className="text-white truncate">{team.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Team Assignment List */}
          <div className="card">
            <h3 className="font-bold text-white mb-4">Assigner les équipes aux groupes</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teams.map(team => (
                <div key={team.id} className={`flex items-center justify-between p-3 rounded-lg transition-all ${getTeamGroup(team.id) ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-white/5'}`}>
                  <div className="flex items-center space-x-2 min-w-0">
                    {renderFlag(team.flag_url, team.name)}
                    <span className="text-white text-sm truncate">{team.name}</span>
                  </div>
                  <select
                    value={getTeamGroup(team.id)}
                    onChange={(e) => handleTeamGroupChange(team.id, e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg py-1 px-2 text-white text-sm ml-2"
                  >
                    <option value="">—</option>
                    {groupLetters.map(letter => <option key={letter} value={letter}>Grp {letter}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* All Teams Tab */}
      {(tab === 'all' || !selectedTournament) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {teams.length === 0 ? (
            <div className="card text-center py-12">
              <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucune équipe créée</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => (
                <motion.div key={team.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    {renderFlag(team.flag_url, team.name)}
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{team.name}</p>
                      {team.code && <p className="text-xs text-gray-500">{team.code}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button onClick={() => handleEdit(team)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(team.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{editingTeam ? 'Modifier' : 'Nouvelle'} équipe</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Nom *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white" placeholder="Ex: Algérie" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Code</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white" placeholder="ALG" maxLength={3} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Drapeau</label>
                <div className="flex items-center space-x-4">
                  {formData.flag_url ? (
                    <div className="relative">
                      <img src={formData.flag_url} alt="Flag" className="w-16 h-12 object-cover rounded" />
                      <button type="button" onClick={() => setFormData({ ...formData, flag_url: '' })} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5"><X className="w-3 h-3 text-white" /></button>
                    </div>
                  ) : (
                    <div className="w-16 h-12 bg-white/5 rounded flex items-center justify-center"><Image className="w-6 h-6 text-gray-500" /></div>
                  )}
                  <label className="btn-secondary cursor-pointer text-sm">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    Choisir image
                  </label>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center space-x-2">
                  <Check className="w-5 h-5" /><span>{editingTeam ? 'Modifier' : 'Créer'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminTeams;
