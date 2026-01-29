import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, ArrowLeft, Clock, Lock, Check, AlertCircle } from 'lucide-react';
import { tournamentsAPI, predictionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TournamentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [predictionInputs, setPredictionInputs] = useState({});

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    try {
      const [tournamentRes, matchesRes] = await Promise.all([
        tournamentsAPI.getById(id),
        tournamentsAPI.getMatches(id)
      ]);
      setTournament(tournamentRes.data);
      setMatches(matchesRes.data);

      if (user) {
        const predictionsRes = await predictionsAPI.getMyPredictions();
        const predMap = {};
        predictionsRes.data.forEach(p => {
          predMap[p.match_id] = p;
        });
        setPredictions(predMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canPredictMatch = (match) => {
    if (match.status === 'completed' || match.status === 'live') return false;
    const now = new Date();
    const matchDate = new Date(match.match_date);
    return now < matchDate;
  };

  const getTimeRemaining = (matchDate) => {
    const now = new Date();
    const match = new Date(matchDate);
    const diff = match - now;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}j ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const handlePredictionChange = (matchId, team, value) => {
    setPredictionInputs(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: parseInt(value) || 0 }
    }));
  };

  const submitPrediction = async (matchId) => {
    if (!user) {
      toast.error('Connectez-vous pour faire un pronostic');
      return;
    }
    const input = predictionInputs[matchId];
    if (!input || input.team1_score === undefined || input.team2_score === undefined) {
      toast.error('Entrez les deux scores');
      return;
    }
    try {
      await predictionsAPI.makePrediction({
        match_id: matchId,
        team1_score: input.team1_score,
        team2_score: input.team2_score
      });
      toast.success('Pronostic enregistré !');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const renderFlag = (flagUrl, teamName) => {
    if (!flagUrl) return <span className="text-3xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={teamName} className="w-10 h-7 object-cover rounded" />;
    }
    return <span className="text-3xl">{flagUrl}</span>;
  };

  // Group matches by stage
  const groupedMatches = matches.reduce((acc, match) => {
    const stage = match.stage || 'Autres';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(match);
    return acc;
  }, {});

  const stageOrder = ['Groupes', 'Huitièmes', 'Quarts', 'Demi-finales', '3ème place', 'Finale'];

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-gray-400">Tournoi non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link to="/tournois" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux tournois</span>
        </Link>

        {/* Tournament Header */}
        <div className="card mb-8">
          <div className="flex items-center space-x-6">
            {tournament.logo_url ? (
              <img src={tournament.logo_url} alt={tournament.name} className="w-24 h-24 object-cover rounded-xl" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
              {tournament.description && <p className="text-gray-400 mt-2">{tournament.description}</p>}
              {tournament.start_date && (
                <p className="text-sm text-gray-500 mt-2 flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(tournament.start_date).toLocaleDateString('fr-FR')}
                    {tournament.end_date && ` - ${new Date(tournament.end_date).toLocaleDateString('fr-FR')}`}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Matches by Stage */}
        {matches.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun match programmé</p>
          </div>
        ) : (
          stageOrder.map(stage => {
            const stageMatches = groupedMatches[stage];
            if (!stageMatches || stageMatches.length === 0) return null;

            return (
              <div key={stage} className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-primary-500" />
                  <span>{stage}</span>
                </h2>
                <div className="space-y-4">
                  {stageMatches.map((match) => {
                    const canPredict = canPredictMatch(match);
                    const timeRemaining = getTimeRemaining(match.match_date);
                    const existingPrediction = predictions[match.id];
                    const input = predictionInputs[match.id] || {
                      team1_score: existingPrediction?.team1_score ?? '',
                      team2_score: existingPrediction?.team2_score ?? ''
                    };

                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`card ${match.status === 'completed' ? 'opacity-70' : ''}`}
                      >
                        {/* Status Badge */}
                        <div className="flex justify-end mb-2">
                          {match.status === 'completed' ? (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Terminé</span>
                          ) : canPredict ? (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{timeRemaining}</span>
                            </span>
                          ) : (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full flex items-center space-x-1">
                              <Lock className="w-3 h-3" />
                              <span>Fermé</span>
                            </span>
                          )}
                        </div>

                        {/* Teams */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-center">
                            {renderFlag(match.team1_flag, match.team1_name)}
                            <p className="text-white font-semibold mt-2">{match.team1_name}</p>
                          </div>

                          <div className="flex-1 flex flex-col items-center">
                            {match.status === 'completed' ? (
                              <div className="text-2xl font-bold text-white">
                                {match.team1_score} - {match.team2_score}
                              </div>
                            ) : canPredict && user ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={input.team1_score}
                                  onChange={(e) => handlePredictionChange(match.id, 'team1_score', e.target.value)}
                                  className="w-14 bg-white/5 border border-white/10 rounded-lg py-2 px-2 text-white text-center text-xl"
                                  placeholder="0"
                                />
                                <span className="text-gray-400 text-xl">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={input.team2_score}
                                  onChange={(e) => handlePredictionChange(match.id, 'team2_score', e.target.value)}
                                  className="w-14 bg-white/5 border border-white/10 rounded-lg py-2 px-2 text-white text-center text-xl"
                                  placeholder="0"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-500">
                                {existingPrediction ? (
                                  <span className="text-xl font-bold">
                                    {existingPrediction.team1_score} - {existingPrediction.team2_score}
                                  </span>
                                ) : (
                                  <span className="text-lg">VS</span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(match.match_date).toLocaleDateString('fr-FR')} à{' '}
                              {new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <div className="flex-1 text-center">
                            {renderFlag(match.team2_flag, match.team2_name)}
                            <p className="text-white font-semibold mt-2">{match.team2_name}</p>
                          </div>
                        </div>

                        {/* Submit Button */}
                        {canPredict && user && (
                          <div className="mt-4 flex justify-center">
                            <button
                              onClick={() => submitPrediction(match.id)}
                              className="btn-primary text-sm flex items-center space-x-2"
                            >
                              <Check className="w-4 h-4" />
                              <span>{existingPrediction ? 'Modifier' : 'Valider'}</span>
                            </button>
                          </div>
                        )}

                        {existingPrediction && (
                          <p className="text-center text-xs text-green-400 mt-2">
                            ✓ Votre prono: {existingPrediction.team1_score} - {existingPrediction.team2_score}
                            {existingPrediction.points_earned > 0 && ` (+${existingPrediction.points_earned} pts)`}
                          </p>
                        )}

                        {!user && canPredict && (
                          <p className="text-center text-xs text-yellow-400 mt-4">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            Connectez-vous pour pronostiquer
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TournamentDetailPage;
