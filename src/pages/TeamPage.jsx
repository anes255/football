import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Trophy, Clock, Check, AlertCircle, Flag } from 'lucide-react';
import { teamsAPI, matchesAPI, predictionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TeamPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [predictionInputs, setPredictionInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch team info
      const teamRes = await teamsAPI.getById(id);
      setTeam(teamRes.data);
      
      // Fetch matches for this team
      try {
        const matchesRes = await matchesAPI.getByTeam(id);
        setMatches(matchesRes.data || []);
      } catch (matchError) {
        console.error('Error fetching matches:', matchError);
        setMatches([]);
      }

      // Fetch user predictions if logged in
      if (user) {
        try {
          const predRes = await predictionsAPI.getMyPredictions();
          const predMap = {};
          predRes.data.forEach(p => { predMap[p.match_id] = p; });
          setPredictions(predMap);
        } catch (predError) {
          console.error('Error fetching predictions:', predError);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Équipe non trouvée');
    } finally {
      setLoading(false);
    }
  };

  const renderFlag = (flagUrl, name, size = 'md') => {
    const sizeClass = size === 'lg' ? 'w-20 h-14' : size === 'sm' ? 'w-8 h-6' : 'w-12 h-8';
    const textSize = size === 'lg' ? 'text-5xl' : size === 'sm' ? 'text-2xl' : 'text-3xl';
    
    if (!flagUrl) return <span className={textSize}>🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className={`${sizeClass} object-cover rounded`} />;
    }
    return <span className={textSize}>{flagUrl}</span>;
  };

  const canPredictMatch = (match) => {
    if (match.status === 'completed' || match.status === 'live') return false;
    return new Date() < new Date(match.match_date);
  };

  const getTimeRemaining = (matchDate) => {
    const diff = new Date(matchDate) - new Date();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}j ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  };

  const handlePredictionChange = (matchId, field, value) => {
    setPredictionInputs(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: parseInt(value) || 0 }
    }));
  };

  const submitPrediction = async (matchId) => {
    if (!user) {
      toast.error('Connectez-vous pour pronostiquer');
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
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // Calculate stats
  const completedMatches = matches.filter(m => m.status === 'completed');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const liveMatches = matches.filter(m => m.status === 'live');

  // Separate matches within 24 hours
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const matchesWithin24Hours = upcomingMatches.filter(m => new Date(m.match_date) <= in24Hours);
  const matchesAfter24Hours = upcomingMatches.filter(m => new Date(m.match_date) > in24Hours);

  // Check if match is within 24 hours
  const isWithin24Hours = (matchDate) => {
    return new Date(matchDate) <= in24Hours;
  };

  const stats = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
  completedMatches.forEach(m => {
    const isTeam1 = m.team1_id === parseInt(id);
    const teamScore = isTeam1 ? m.team1_score : m.team2_score;
    const oppScore = isTeam1 ? m.team2_score : m.team1_score;
    stats.played++;
    stats.goalsFor += teamScore || 0;
    stats.goalsAgainst += oppScore || 0;
    if (teamScore > oppScore) stats.wins++;
    else if (teamScore === oppScore) stats.draws++;
    else stats.losses++;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/equipes" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux équipes</span>
          </Link>
          <div className="card text-center py-12">
            <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{error || 'Équipe non trouvée'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/equipes" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux équipes</span>
        </Link>

        {/* Team Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="flex items-center space-x-6">
            {renderFlag(team.flag_url, team.name, 'lg')}
            <div>
              <h1 className="text-3xl font-bold text-white">{team.name}</h1>
              {team.code && <p className="text-gray-400">{team.code}</p>}
              {team.group_name && <p className="text-sm text-gray-500">Groupe {team.group_name}</p>}
            </div>
          </div>

          {/* Stats */}
          {stats.played > 0 && (
            <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stats.played}</p>
                <p className="text-xs text-gray-400">Joués</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.wins}</p>
                <p className="text-xs text-gray-400">Victoires</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.draws}</p>
                <p className="text-xs text-gray-400">Nuls</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
                <p className="text-xs text-gray-400">Défaites</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-400">{stats.goalsFor - stats.goalsAgainst}</p>
                <p className="text-xs text-gray-400">Diff.</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span>En cours</span>
            </h2>
            <div className="space-y-4">
              {liveMatches.map(match => (
                <MatchCard key={match.id} match={match} teamId={id} renderFlag={renderFlag} />
              ))}
            </div>
          </section>
        )}

        {/* Matches Within 24 Hours - Special Highlight */}
        {matchesWithin24Hours.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
              <span>Dans les prochaines 24h</span>
              <span className="text-sm font-normal text-orange-400">Pronostiquez maintenant !</span>
            </h2>
            <div className="space-y-4">
              {matchesWithin24Hours.map(match => {
                const canPredict = canPredictMatch(match);
                const existingPred = predictions[match.id];
                const input = predictionInputs[match.id] || {
                  team1_score: existingPred?.team1_score ?? '',
                  team2_score: existingPred?.team2_score ?? ''
                };

                return (
                  <motion.div key={match.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card border-orange-500/50 bg-orange-500/5">
                    <div className="flex justify-between items-center mb-3">
                      {match.tournament_name && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                          {match.tournament_name}
                        </span>
                      )}
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full flex items-center space-x-1 ml-auto animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeRemaining(match.match_date)}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        {renderFlag(match.team1_flag, match.team1_name, 'sm')}
                        <p className="text-white font-semibold mt-2 text-sm">{match.team1_name}</p>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center">
                        {canPredict && user ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={input.team1_score}
                              onChange={(e) => handlePredictionChange(match.id, 'team1_score', e.target.value)}
                              className="w-12 bg-gray-700 border border-orange-500/50 rounded-lg py-2 text-white text-center"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={input.team2_score}
                              onChange={(e) => handlePredictionChange(match.id, 'team2_score', e.target.value)}
                              className="w-12 bg-gray-700 border border-orange-500/50 rounded-lg py-2 text-white text-center"
                            />
                          </div>
                        ) : existingPred ? (
                          <span className="text-lg font-bold text-gray-400">
                            {existingPred.team1_score} - {existingPred.team2_score}
                          </span>
                        ) : (
                          <span className="text-gray-500">VS</span>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      <div className="flex-1 text-center">
                        {renderFlag(match.team2_flag, match.team2_name, 'sm')}
                        <p className="text-white font-semibold mt-2 text-sm">{match.team2_name}</p>
                      </div>
                    </div>

                    {canPredict && user && (
                      <div className="mt-4 flex justify-center">
                        <button onClick={() => submitPrediction(match.id)} className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-lg transition-colors">
                          {existingPred ? 'Modifier' : 'Valider le pronostic'}
                        </button>
                      </div>
                    )}

                    {existingPred && (
                      <p className="text-center text-xs text-green-400 mt-2">
                        ✓ Votre prono: {existingPred.team1_score} - {existingPred.team2_score}
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
          </section>
        )}

        {/* Other Upcoming Matches */}
        {matchesAfter24Hours.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>À venir</span>
            </h2>
            <div className="space-y-4">
              {matchesAfter24Hours.map(match => {
                const canPredict = canPredictMatch(match);
                const existingPred = predictions[match.id];
                const input = predictionInputs[match.id] || {
                  team1_score: existingPred?.team1_score ?? '',
                  team2_score: existingPred?.team2_score ?? ''
                };

                return (
                  <motion.div key={match.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                    <div className="flex justify-between items-center mb-3">
                      {match.tournament_name && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                          {match.tournament_name}
                        </span>
                      )}
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex items-center space-x-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeRemaining(match.match_date)}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        {renderFlag(match.team1_flag, match.team1_name, 'sm')}
                        <p className="text-white font-semibold mt-2 text-sm">{match.team1_name}</p>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center">
                        {canPredict && user ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={input.team1_score}
                              onChange={(e) => handlePredictionChange(match.id, 'team1_score', e.target.value)}
                              className="w-12 bg-gray-700 border border-gray-600 rounded-lg py-2 text-white text-center"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={input.team2_score}
                              onChange={(e) => handlePredictionChange(match.id, 'team2_score', e.target.value)}
                              className="w-12 bg-gray-700 border border-gray-600 rounded-lg py-2 text-white text-center"
                            />
                          </div>
                        ) : existingPred ? (
                          <span className="text-lg font-bold text-gray-400">
                            {existingPred.team1_score} - {existingPred.team2_score}
                          </span>
                        ) : (
                          <span className="text-gray-500">VS</span>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(match.match_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      
                      <div className="flex-1 text-center">
                        {renderFlag(match.team2_flag, match.team2_name, 'sm')}
                        <p className="text-white font-semibold mt-2 text-sm">{match.team2_name}</p>
                      </div>
                    </div>

                    {canPredict && user && (
                      <div className="mt-4 flex justify-center">
                        <button onClick={() => submitPrediction(match.id)} className="btn-primary text-sm">
                          {existingPred ? 'Modifier' : 'Valider'}
                        </button>
                      </div>
                    )}

                    {existingPred && (
                      <p className="text-center text-xs text-green-400 mt-2">
                        ✓ Votre prono: {existingPred.team1_score} - {existingPred.team2_score}
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
          </section>
        )}

        {/* Completed Matches */}
        {completedMatches.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Terminés</span>
            </h2>
            <div className="space-y-4">
              {completedMatches.map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  teamId={id} 
                  renderFlag={renderFlag}
                  prediction={predictions[match.id]}
                  completed
                />
              ))}
            </div>
          </section>
        )}

        {matches.length === 0 && (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun match programmé pour cette équipe</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MatchCard = ({ match, renderFlag, prediction, completed }) => {
  return (
    <div className={`card ${completed ? 'opacity-80' : ''}`}>
      <div className="flex justify-between items-center mb-3">
        {match.tournament_name && (
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
            {match.tournament_name}
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full ml-auto ${
          completed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {completed ? 'Terminé' : 'En cours'}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
          {renderFlag(match.team1_flag, match.team1_name, 'sm')}
          <p className="text-white font-semibold mt-2 text-sm">{match.team1_name}</p>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-white">
            {match.team1_score} - {match.team2_score}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(match.match_date).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex-1 text-center">
          {renderFlag(match.team2_flag, match.team2_name, 'sm')}
          <p className="text-white font-semibold mt-2 text-sm">{match.team2_name}</p>
        </div>
      </div>

      {prediction && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Votre prono: {prediction.team1_score} - {prediction.team2_score}
          {prediction.points_earned > 0 && (
            <span className="text-green-400"> (+{prediction.points_earned} pts)</span>
          )}
        </p>
      )}
    </div>
  );
};

export default TeamPage;
