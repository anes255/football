import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Trophy, User, Target } from 'lucide-react';
import { tournamentsAPI, teamsAPI } from '../../api';

const AdminPlayers = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
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
        best_player_id: res.data?.best_player_id || '',
        best_goal_scorer_id: res.data?.best_goal_scorer_id || ''
      });
    } catch (error) {
      console.error('Error fetching tournament winners:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingPlayer) {
        await tournamentsAPI.updatePlayer(editingPlayer.id, formData);
      } else {
        await tournamentsAPI.createPlayer(selectedTournament, formData);
      }
      setShowModal(false);
      setEditingPlayer(null);
      setFormData({ name: '', team_id: '', photo_url: '', position: '' });
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce joueur ?')) return;
    try {
      await tournamentsAPI.deletePlayer(id);
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      team_id: player.team_id || '',
      photo_url: player.photo_url || '',
      position: player.position || ''
    });
    setShowModal(true);
  };

  const handleSetWinners = async (e) => {
    e.preventDefault();
    if (!confirm('Définir les gagnants ? Les points seront attribués automatiquement.')) return;
    setLoading(true);
    try {
      await tournamentsAPI.setWinners(selectedTournament, winners);
      alert('Gagnants définis avec succès !');
      setShowWinnersModal(false);
      fetchTournamentWinners();
    } catch (error) {
      console.error('Error setting winners:', error);
      alert('Erreur lors de la définition des gagnants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Gestion des Joueurs</h1>
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
          <div className="flex gap-4 mb-6">
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

          {/* Players List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <div key={player.id} className="card">
                <div className="flex items-start space-x-3">
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{player.name}</h3>
                    {player.team_name && (
                      <p className="text-sm text-gray-400">{player.team_name}</p>
                    )}
                    {player.position && (
                      <p className="text-xs text-gray-500">{player.position}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(player)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {players.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun joueur ajouté</p>
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
                  {teams.map((t) => (
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
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  placeholder="Ex: Attaquant, Milieu, Défenseur"
                />
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
                  Meilleur joueur
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
                  Meilleur buteur
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
                  Les points seront attribués automatiquement aux utilisateurs ayant fait les bonnes prédictions.
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
