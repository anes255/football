import { useState, useEffect, useContext } from 'react';
import { Trophy, User, Target, Check } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { tournamentsAPI } from '../api';

const TournamentPredictions = ({ tournamentId }) => {
  const { user } = useContext(AuthContext);
  const [players, setPlayers] = useState([]);
  const [myPrediction, setMyPrediction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [predictionType, setPredictionType] = useState(''); // 'best_player' or 'best_goal_scorer'
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleOpenModal = (type) => {
    setPredictionType(type);
    setSelectedPlayer(
      type === 'best_player'
        ? myPrediction?.best_player_id || ''
        : myPrediction?.best_goal_scorer_id || ''
    );
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        best_player_id: predictionType === 'best_player' ? selectedPlayer : myPrediction?.best_player_id || null,
        best_goal_scorer_id: predictionType === 'best_goal_scorer' ? selectedPlayer : myPrediction?.best_goal_scorer_id || null
      };
      await tournamentsAPI.savePrediction(tournamentId, data);
      setShowModal(false);
      fetchMyPrediction();
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerCard = (player, team, teamFlag, position) => {
    if (!player) {
      return (
        <div className="text-center py-8 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Pas encore de prédiction</p>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-3">
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
          <h4 className="text-white font-semibold truncate">{player.name}</h4>
          {team && (
            <p className="text-sm text-gray-400">{team}</p>
          )}
          {position && (
            <p className="text-xs text-gray-500">{position}</p>
          )}
        </div>
      </div>
    );
  };

  if (!user) return null;
  if (players.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <span>Prédictions du tournoi</span>
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Best Player */}
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
            renderPlayerCard(
              { name: myPrediction.best_player_name, photo_url: myPrediction.best_player_photo },
              myPrediction.best_player_team,
              myPrediction.best_player_team_flag,
              myPrediction.best_player_position
            )
          ) : (
            <div className="text-center py-8 text-gray-400">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Pas encore de prédiction</p>
            </div>
          )}

          <button
            onClick={() => handleOpenModal('best_player')}
            className="w-full mt-4 btn-secondary flex items-center justify-center space-x-2"
          >
            {myPrediction?.best_player_id ? (
              <>
                <Check className="w-4 h-4" />
                <span>Modifier</span>
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                <span>Prédire</span>
              </>
            )}
          </button>
        </div>

        {/* Best Goal Scorer */}
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
            renderPlayerCard(
              { name: myPrediction.best_goal_scorer_name, photo_url: myPrediction.best_goal_scorer_photo },
              myPrediction.best_goal_scorer_team,
              myPrediction.best_goal_scorer_team_flag,
              myPrediction.best_goal_scorer_position
            )
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Pas encore de prédiction</p>
            </div>
          )}

          <button
            onClick={() => handleOpenModal('best_goal_scorer')}
            className="w-full mt-4 btn-secondary flex items-center justify-center space-x-2"
          >
            {myPrediction?.best_goal_scorer_id ? (
              <>
                <Check className="w-4 h-4" />
                <span>Modifier</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                <span>Prédire</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prediction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              {predictionType === 'best_player' ? (
                <>
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <span>Choisir le meilleur joueur</span>
                </>
              ) : (
                <>
                  <Target className="w-6 h-6 text-red-400" />
                  <span>Choisir le meilleur buteur</span>
                </>
              )}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3">
                {players.map((player) => (
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
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{player.name}</h4>
                      {player.team_name && (
                        <p className="text-sm text-gray-400">{player.team_name}</p>
                      )}
                      {player.position && (
                        <p className="text-xs text-gray-500">{player.position}</p>
                      )}
                    </div>
                    {selectedPlayer === String(player.id) && (
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
              <div className="flex space-x-3">
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
