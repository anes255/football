import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Trophy, Lock, Check, AlertCircle } from 'lucide-react';
import { matchesAPI, predictionsAPI, tournamentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MatchesPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTournament, setFilterTournament] = useState('');
  const [predictionInputs, setPredictionInputs] = useState({});

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [matchesRes, tournamentsRes] = await Promise.all([
        matchesAPI.getAll(),
        tournamentsAPI.getActive()
      ]);
      setMatches(matchesRes.data);
      setTournaments(tournamentsRes.data);

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
      [matchId]: {
        ...prev[matchId],
        [team]: parseInt(value) || 0
      }
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

  const filteredMatches = filterTournament
    ? matches.filter(m => m.tournament_id === parseInt(filterTournament))
    : matches;

  const upcomingMatches = filteredMatches.filter(m => m.status !== 'completed');
  const completedMatches = filteredMatches.filter(m => m.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl gradient-text">Matchs</h1>
          <p className="text-gray-400 mt-2">Faites vos pronostics avant le début des matchs</p>
        </div>

        {/* Tournament Filter */}
        {tournaments.length > 0 && (
          <div className="flex justify-center mb-8">
            <select
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white"
            >
              <option value="">Tous les tournois</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-primary-500" />
              <span>Matchs à venir</span>
            </h2>
            <div className="space-y-4">
              {upcomingMatches.map((match) => {
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
                    className="card"
                  >
                    {/* Match Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2">
                        {match.tournament_name && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                            {match.tournament_name}
                          </span>
                        )}
                        <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full">
                          {match.stage}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canPredict ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center space-x-1">
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
                    </div>

                    {/* Teams and Prediction */}
                    <div className="flex items-center justify-between">
                      {/* Team 1 */}
                      <div className="flex-1 text-center">
                        {renderFlag(match.team1_flag, match.team1_name)}
                        <p className="text-white font-semibold mt-2">{match.team1_name}</p>
                      </div>

                      {/* Prediction Input or Lock */}
                      <div className="flex-1 flex flex-col items-center">
                        {canPredict && user ? (
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
                              <Lock className="w-6 h-6" />
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(match.match_date).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Team 2 */}
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

                    {existingPrediction && canPredict && (
                      <p className="text-center text-xs text-green-400 mt-2">
                        ✓ Pronostic enregistré: {existingPrediction.team1_score} - {existingPrediction.team2_score}
                      </p>
                    )}

                    {!user && canPredict && (
                      <p className="text-center text-xs text-yellow-400 mt-4">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        Connectez-vous pour faire un pronostic
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Matches */}
        {completedMatches.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-primary-500" />
              <span>Matchs terminés</span>
            </h2>
            <div className="space-y-4">
              {completedMatches.map((match) => {
                const prediction = predictions[match.id];
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card opacity-80"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        {renderFlag(match.team1_flag, match.team1_name)}
                        <p className="text-white font-semibold mt-1 text-sm">{match.team1_name}</p>
                      </div>

                      <div className="flex-1 text-center">
                        <div className="text-2xl font-bold text-white">
                          {match.team1_score} - {match.team2_score}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Score final</p>
                        {prediction && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400">
                              Votre prono: {prediction.team1_score} - {prediction.team2_score}
                            </p>
                            {prediction.points_earned > 0 && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                +{prediction.points_earned} pts
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-center">
                        {renderFlag(match.team2_flag, match.team2_name)}
                        <p className="text-white font-semibold mt-1 text-sm">{match.team2_name}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {filteredMatches.length === 0 && (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun match programmé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesPage;
