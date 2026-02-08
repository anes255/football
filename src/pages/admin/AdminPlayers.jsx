import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Trophy, User, Target, Search } from 'lucide-react';
import { tournamentsAPI, teamsAPI, adminAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminPlayers = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    team_id: '',
    photo_url: '',
    position: ''
  });
  const [winners, setWinners] = useState({
    best_player_id: '',
    best_goal_scorer_id: ''
  });

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchPlayers();
      fetchTournamentTeams();
      fetchTournamentWinners();
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const res = await tournamentsAPI.getAll();
      setTournaments(res.data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await teamsAPI.getAll();
      setTeams(res.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchTournamentTeams = async () => {
    try {
      const res = await adminAPI.getTournamentTeams(selectedTournament);
      setTournamentTeams(res.data || []);
    } catch (error) {
      console.error('Error fetching tournament teams:', error);
    }
  };

  const fetchPlayers = async () => {
    if (!selectedTournament) return;
    try {
      const res = await tournamentsAPI.getPlayers(selectedTournament);
      setPlayers(res.data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchTournamentWinners = async () => {
    if (!selectedTournament) return;
    try {
      const res = await tournamentsAPI.getById(selectedTournament);
      setWinners({
        best_player_id: res.data?.best_player_id?.toString() || '',
        best_goal_scorer_id: res.data?.best_goal_scorer_id?.toString() || ''
      });
    } catch (error) {
      console.error('Error fetching tournament winners:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Le nom du joueur est requis');
      return;
    }
    setLoading(true);
    try {
      if (editingPlayer) {
        await tournamentsAPI.updatePlayer(editingPlayer.id, formData);
        toast.success('Joueur modifié !');
      } else {
        await tournamentsAPI.createPlayer(selectedTournament, formData);
        toast.success('Joueur ajouté !');
      }
      setShowModal(false);
      setEditingPlayer(null);
      setFormData({ name: '', team_id: '', photo_url: '', position: '' });
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce joueur ?')) return;
    try {
      await tournamentsAPI.deletePlayer(id);
      toast.success('Joueur supprimé');
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      team_id: player.team_id?.toString() || '',
      photo_url: player.photo_url || '',
      position: player.position || ''
    });
    setShowModal(true);
  };

  const handleSetWinners = async (e) => {
    e.preventDefault();
    if (!winners.best_player_id && !winners.best_goal_scorer_id) {
      toast.error('Sélectionnez au moins un gagnant');
      return;
    }
    if (!confirm('Définir les gagnants ? Les points seront attribués automatiquement aux utilisateurs ayant fait les bonnes prédictions.')) return;
    setLoading(true);
    try {
      const res = await tournamentsAPI.setWinners(selectedTournament, {
        best_player_id: winners.best_player_id ? parseInt(winners.best_player_id) : null,
        best_goal_scorer_id: winners.best_goal_scorer_id ? parseInt(winners.best_goal_scorer_id) : null
      });
      toast.success(res.data.message || 'Gagnants définis avec succès !');
      setShowWinnersModal(false);
      fetchTournamentWinners();
    } catch (error) {
      console.error('Error setting winners:', error);
      toast.error('Erreur lors de la définition des gagnants');
    } finally {
      setLoading(false);
    }
  };

  // Use tournament teams for the team dropdown if available, otherwise all teams
  const availableTeams = tournamentTeams.length > 0
    ? tournamentTeams.map(tt => ({ id: tt.team_id, name: tt.name, flag_url: tt.flag_url }))
    : teams;

  const filteredPlayers = searchQuery
    ? players.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.team_name && p.team_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : players;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          <User className="w-7 h-7 text-primary-500" />
          <span>Gestion des Joueurs</span>
        </h1>
      </div>

      {/* Tournament Selection */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Sélectionner un tournoi
        </label>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
        >
          <option value="">-- Choisir un tournoi --</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => {
                setEditingPlayer(null);
                setFormData({ name: '', team_id: '', photo_url: '', position: '' });
                setShowModal(true);
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter un joueur</span>
            </button>
            <button
              onClick={() => setShowWinnersModal(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Trophy className="w-5 h-5" />
              <span>Définir les gagnants</span>
            </button>
          </div>

          {/* Search bar */}
          {players.length > 5 && (
            <div className="relative mb-6">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-2xl font-bold text-primary-400">{players.length}</p>
              <p className="text-sm text-gray-400">Joueurs</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {winners.best_player_id ? players.find(p => p.id === parseInt(winners.best_player_id))?.name || '-' : '-'}
              </p>
              <p className="text-sm text-gray-400">Meilleur joueur</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-red-400">
                {winners.best_goal_scorer_id ? players.find(p => p.id === parseInt(winners.best_goal_scorer_id))?.name || '-' : '-'}
              </p>
              <p className="text-sm text-gray-400">Meilleur buteur</p>
            </div>
          </div>

          {/* Players List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="card">
                <div className="flex items-start space-x-3">
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{player.name}</h3>
                    {player.team_name && (
                      <p className="text-sm text-gray-400 flex items-center space-x-1">
                        {player.team_flag && (
                          player.team_flag.startsWith('data:') || player.team_flag.startsWith('http')
                            ? <img src={player.team_flag} alt="" className="w-4 h-3 object-cover rounded" />
                            : <span className="text-xs">{player.team_flag}</span>
                        )}
                        <span>{player.team_name}</span>
                      </p>
                    )}
                    {player.position && (
                      <p className="text-xs text-gray-500">{player.position}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(player)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredPlayers.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{searchQuery ? 'Aucun joueur trouvé' : 'Aucun joueur ajouté'}</p>
                {!searchQuery && <p className="text-sm text-gray-500 mt-2">Cliquez sur "Ajouter un joueur" pour commencer</p>}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Player Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPlayer ? 'Modifier le joueur' : 'Ajouter un joueur'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du joueur *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  placeholder="Ex: Cristiano Ronaldo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Équipe
                </label>
                <select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">-- Choisir une équipe --</option>
                  {availableTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Photo URL
                </label>
                <input
                  type="text"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Position
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">-- Choisir --</option>
                  <option value="Gardien">Gardien</option>
                  <option value="Défenseur">Défenseur</option>
                  <option value="Milieu">Milieu</option>
                  <option value="Attaquant">Attaquant</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'Enregistrement...' : editingPlayer ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlayer(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Winners Modal */}
      {showWinnersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span>Définir les gagnants</span>
            </h2>
            <form onSubmit={handleSetWinners} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span>Meilleur joueur</span>
                  </span>
                </label>
                <select
                  value={winners.best_player_id}
                  onChange={(e) => setWinners({ ...winners, best_player_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">-- Sélectionner --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.team_name && `(${p.team_name})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-red-400" />
                    <span>Meilleur buteur</span>
                  </span>
                </label>
                <select
                  value={winners.best_goal_scorer_id}
                  onChange={(e) => setWinners({ ...winners, best_goal_scorer_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">-- Sélectionner --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.team_name && `(${p.team_name})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm text-yellow-400">
                  ⚠️ Les points seront attribués automatiquement aux utilisateurs ayant fait les bonnes prédictions.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'Enregistrement...' : 'Confirmer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWinnersModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlayers;
