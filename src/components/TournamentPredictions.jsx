import { useState, useEffect } from 'react';
import { Trophy, User, Target, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tournamentsAPI } from '../api';
import toast from 'react-hot-toast';

const TournamentPredictions = ({ tournamentId, tournamentStarted = false }) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [myPrediction, setMyPrediction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [predictionType, setPredictionType] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && tournamentId) {
      fetchPlayers();
      fetchMyPrediction();
    }
  }, [user, tournamentId]);

  const fetchPlayers = async () => {
    try {
      const res = await tournamentsAPI.getPlayers(tournamentId);
      setPlayers(res.data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchMyPrediction = async () => {
    try {
      const res = await tournamentsAPI.getMyPrediction(tournamentId);
      setMyPrediction(res.data);
    } catch (error) {
      console.error('Error fetching prediction:', error);
    }
  };

  const canPredict = !tournamentStarted;

  const handleOpenModal = (type) => {
    if (!canPredict) {
      toast.error('Le tournoi a commencé, vous ne pouvez plus modifier vos prédictions');
      return;
    }
    setPredictionType(type);
    setSelectedPlayer(
      type === 'best_player'
        ? (myPrediction?.best_player_id?.toString() || '')
        : (myPrediction?.best_goal_scorer_id?.toString() || '')
    );
    setSearchQuery('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayer) {
      toast.error('Sélectionnez un joueur');
      return;
    }
    setLoading(true);
    try {
      const data = {
        best_player_id: predictionType === 'best_player' ? parseInt(selectedPlayer) : (myPrediction?.best_player_id || null),
        best_goal_scorer_id: predictionType === 'best_goal_scorer' ? parseInt(selectedPlayer) : (myPrediction?.best_goal_scorer_id || null)
      };
      await tournamentsAPI.savePrediction(tournamentId, data);
      toast.success('Prédiction enregistrée !');
      setShowModal(false);
      fetchMyPrediction();
    } catch (error) {
      console.error('Error saving prediction:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = searchQuery
    ? players.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.team_name && p.team_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : players;

  if (!user) return null;

  return (
    <div>
      {/* Info banner */}
      {tournamentStarted ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Le tournoi a commencé. Vous ne pouvez plus modifier vos prédictions de joueurs.</span>
          </p>
        </div>
      ) : (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-blue-400 text-sm">
            Choisissez le meilleur joueur et le meilleur buteur du tournoi avant que les matchs ne commencent !
          </p>
        </div>
      )}

      {players.length === 0 ? (
        <div className="card text-center py-12">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Aucun joueur ajouté à ce tournoi</p>
          <p className="text-gray-500 text-sm mt-2">Les joueurs seront ajoutés par l'administrateur</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Best Player Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span>Meilleur joueur</span>
              </h4>
              {myPrediction?.points_earned > 0 && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  +{myPrediction.points_earned} pts
                </span>
              )}
            </div>
            
            {myPrediction?.best_player_name ? (
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                {myPrediction.best_player_photo ? (
                  <img src={myPrediction.best_player_photo} alt={myPrediction.best_player_name} className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold truncate">{myPrediction.best_player_name}</h4>
                  {myPrediction.best_player_team && <p className="text-sm text-gray-400">{myPrediction.best_player_team}</p>}
                  {myPrediction.best_player_position && <p className="text-xs text-gray-500">{myPrediction.best_player_position}</p>}
                </div>
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Pas encore de prédiction</p>
              </div>
            )}

            <button
              onClick={() => handleOpenModal('best_player')}
              disabled={!canPredict}
              className="w-full mt-4 btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {myPrediction?.best_player_id ? (
                <><Check className="w-4 h-4" /><span>Modifier</span></>
              ) : (
                <><Trophy className="w-4 h-4" /><span>Prédire</span></>
              )}
            </button>
          </div>

          {/* Best Goal Scorer Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white flex items-center space-x-2">
                <Target className="w-5 h-5 text-red-400" />
                <span>Meilleur buteur</span>
              </h4>
              {myPrediction?.points_earned > 0 && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  +{myPrediction.points_earned} pts
                </span>
              )}
            </div>

            {myPrediction?.best_goal_scorer_name ? (
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                {myPrediction.best_goal_scorer_photo ? (
                  <img src={myPrediction.best_goal_scorer_photo} alt={myPrediction.best_goal_scorer_name} className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold truncate">{myPrediction.best_goal_scorer_name}</h4>
                  {myPrediction.best_goal_scorer_team && <p className="text-sm text-gray-400">{myPrediction.best_goal_scorer_team}</p>}
                  {myPrediction.best_goal_scorer_position && <p className="text-xs text-gray-500">{myPrediction.best_goal_scorer_position}</p>}
                </div>
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Pas encore de prédiction</p>
              </div>
            )}

            <button
              onClick={() => handleOpenModal('best_goal_scorer')}
              disabled={!canPredict}
              className="w-full mt-4 btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {myPrediction?.best_goal_scorer_id ? (
                <><Check className="w-4 h-4" /><span>Modifier</span></>
              ) : (
                <><Target className="w-4 h-4" /><span>Prédire</span></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Player Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              {predictionType === 'best_player' ? (
                <><Trophy className="w-6 h-6 text-yellow-400" /><span>Choisir le meilleur joueur</span></>
              ) : (
                <><Target className="w-6 h-6 text-red-400" /><span>Choisir le meilleur buteur</span></>
              )}
            </h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Rechercher un joueur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white mb-4 focus:border-primary-500 focus:outline-none"
            />

            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="grid gap-3 overflow-y-auto flex-1 pr-1">
                {filteredPlayers.map((player) => (
                  <label
                    key={player.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPlayer === String(player.id)
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="player"
                      value={player.id}
                      checked={selectedPlayer === String(player.id)}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="hidden"
                    />
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{player.name}</h4>
                      {player.team_name && <p className="text-sm text-gray-400">{player.team_name}</p>}
                      {player.position && <p className="text-xs text-gray-500">{player.position}</p>}
                    </div>
                    {selectedPlayer === String(player.id) && (
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </label>
                ))}
                {filteredPlayers.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Aucun joueur trouvé</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-3 mt-4 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={loading || !selectedPlayer}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enregistrement...' : 'Confirmer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

export default TournamentPredictions;
