import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Trophy, Clock, Check, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    try {
      const [teamRes, matchesRes] = await Promise.all([
        teamsAPI.getById(id),
        matchesAPI.getByTeam(id)
      ]);
      setTeam(teamRes.data);
      setMatches(matchesRes.data);

      if (user) {
        const predRes = await predictionsAPI.getMyPredictions();
        const predMap = {};
        predRes.data.forEach(p => { predMap[p.match_id] = p; });
        setPredictions(predMap);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-3xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-12 h-8 object-cover rounded" />;
    }
    return <span className="text-3xl">{flagUrl}</span>;
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

  const handlePredictionChange = (matchId, team, value) => {
    setPredictionInputs(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: parseInt(value) || 0 }
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
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  // Categorize matches
  const completedMatches = matches.filter(m => m.status === 'completed');
  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');

  // Calculate team stats
  const stats = {
    played: completedMatches.length,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0
  };

  completedMatches.forEach(m => {
    const isTeam1 = m.team1_id === parseInt(id);
    const teamScore = isTeam1 ? m.team1_score : m.team2_score;
    const oppScore = isTeam1 ? m.team2_score : m.team1_score;
    stats.goalsFor += teamScore;
    stats.goalsAgainst += oppScore;
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

  if (!team) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-gray-400">Équipe non trouvée</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </Link>

        {/* Team Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="flex items-center space-x-6">
            {team.flag_url ? (
              team.flag_url.startsWith('data:') || team.flag_url.startsWith('http') ? (
                <img src={team.flag_url} alt={team.name} className="w-24 h-16 object-cover rounded-xl" />
              ) : (
                <span className="text-6xl">{team.flag_url}</span>
              )
            ) : (
              <div className="w-24 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            )}
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
                <p className="text-xs text-gray-400">Diff. buts</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span>Match en cours</span>
            </h2>
            {liveMatches.map(match => (
              <MatchCard key={match.id} match={match} teamId={id} predictions={predictions} />
            ))}
          </section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>Matchs à venir</span>
            </h2>
            <div className="space-y-4">
              {upcomingMatches.map(match => {
                const canPredict = canPredictMatch(match);
                const existingPred = predictions[match.id];
                const input = predictionInputs[match.id] || {
                  team1_score: existingPred?.team1_score ?? '',
                  team2_score: existingPred?.team2_score ?? ''
                };

                return (
                  <motion.div key={match.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                    <div className="flex justify-end mb-2">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeRemaining(match.match_date)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        {renderFlag(match.team1_flag, match.team1_name)}
                        <p className="text-white font-semibold mt-2">{match.team1_name}</p>
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
                              className="w-14 bg-gray-700 border border-gray-600 rounded-lg py-2 px-2 text-white text-center text-xl"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={input.team2_score}
                              onChange={(e) => handlePredictionChange(match.id, 'team2_score', e.target.value)}
                              className="w-14 bg-gray-700 border border-gray-600 rounded-lg py-2 px-2 text-white text-center text-xl"
                            />
                          </div>
                        ) : existingPred ? (
                          <span className="text-xl font-bold text-gray-400">{existingPred.team1_score} - {existingPred.team2_score}</span>
                        ) : (
                          <span className="text-gray-500">VS</span>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(match.match_date).toLocaleDateString('fr-FR')} à {new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex-1 text-center">
                        {renderFlag(match.team2_flag, match.team2_name)}
                        <p className="text-white font-semibold mt-2">{match.team2_name}</p>
                      </div>
                    </div>
                    {canPredict && user && (
                      <div className="mt-4 flex justify-center">
                        <button onClick={() => submitPrediction(match.id)} className="btn-primary text-sm flex items-center space-x-2">
                          <Check className="w-4 h-4" />
                          <span>{existingPred ? 'Modifier' : 'Valider'}</span>
                        </button>
                      </div>
                    )}
                    {existingPred && <p className="text-center text-xs text-green-400 mt-2">✓ Votre prono: {existingPred.team1_score} - {existingPred.team2_score}</p>}
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
              <span>Matchs terminés</span>
            </h2>
            <div className="space-y-4">
              {completedMatches.map(match => {
                const existingPred = predictions[match.id];
                return (
                  <motion.div key={match.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card opacity-80">
                    <div className="flex justify-end mb-2">
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Terminé</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        {renderFlag(match.team1_flag, match.team1_name)}
                        <p className="text-white font-semibold mt-2">{match.team1_name}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-2xl font-bold text-white">{match.team1_score} - {match.team2_score}</div>
                        <p className="text-xs text-gray-500 mt-1">{new Date(match.match_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="flex-1 text-center">
                        {renderFlag(match.team2_flag, match.team2_name)}
                        <p className="text-white font-semibold mt-2">{match.team2_name}</p>
                      </div>
                    </div>
                    {existingPred && (
                      <p className="text-center text-xs text-gray-400 mt-3">
                        Votre prono: {existingPred.team1_score} - {existingPred.team2_score}
                        {existingPred.points_earned > 0 && <span className="text-green-400"> (+{existingPred.points_earned} pts)</span>}
                      </p>
                    )}
                  </motion.div>
                );
              })}
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

// Simple match card component
const MatchCard = ({ match }) => {
  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-2xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-10 h-7 object-cover rounded" />;
    }
    return <span className="text-2xl">{flagUrl}</span>;
  };

  return (
    <div className="card border-red-500/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {renderFlag(match.team1_flag, match.team1_name)}
          <span className="text-white font-semibold">{match.team1_name}</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {match.team1_score ?? '?'} - {match.team2_score ?? '?'}
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-white font-semibold">{match.team2_name}</span>
          {renderFlag(match.team2_flag, match.team2_name)}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
