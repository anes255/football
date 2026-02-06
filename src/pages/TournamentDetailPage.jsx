import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, Clock, Check, AlertCircle, Users, Crown } from 'lucide-react';
import { tournamentsAPI, matchesAPI, predictionsAPI, tournamentWinnerAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TournamentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [predictionInputs, setPredictionInputs] = useState({});
  const [winnerPrediction, setWinnerPrediction] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id, user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const tourRes = await tournamentsAPI.getById(id);
      if (!tourRes.data) {
        setError('Tournoi non trouvé');
        setLoading(false);
        return;
      }
      setTournament(tourRes.data);
      
      // Fetch matches - backend already filters to only show visible matches (24h rule)
      try {
        const matchesRes = await matchesAPI.getByTournament(id);
        setMatches(matchesRes.data || []);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setMatches([]);
      }
      
      // Fetch teams for winner prediction dropdown
      try {
        const teamsRes = await tournamentsAPI.getTeams(id);
        setTournamentTeams(teamsRes.data || []);
      } catch (err) {
        setTournamentTeams([]);
      }

      // Fetch user predictions
      if (user) {
        try {
          const predRes = await predictionsAPI.getMyPredictions();
          const predMap = {};
          (predRes.data || []).forEach(p => { predMap[p.match_id] = p; });
          setPredictions(predMap);
        } catch (e) {}

        try {
          const winnerRes = await tournamentWinnerAPI.get(id);
          setWinnerPrediction(winnerRes.data);
          if (winnerRes.data) setSelectedWinner(winnerRes.data.team_id.toString());
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-8 h-6 object-cover rounded" />;
    }
    return <span className="text-xl">{flagUrl}</span>;
  };

  const canPredictMatch = (match) => {
    if (match.status === 'completed' || match.status === 'live') return false;
    return new Date() < new Date(match.match_date);
  };

  const canPredictWinner = () => {
    if (!matches.length) return true;
    const sortedMatches = [...matches].sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
    return new Date() < new Date(sortedMatches[0]?.match_date);
  };

  const getTimeRemaining = (matchDate) => {
    const now = new Date();
    const match = new Date(matchDate);
    const diffMs = match.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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

  const submitWinnerPrediction = async () => {
    if (!user) {
      toast.error('Connectez-vous pour pronostiquer');
      return;
    }
    if (!selectedWinner) {
      toast.error('Sélectionnez une équipe');
      return;
    }
    try {
      await tournamentWinnerAPI.predict({
        tournament_id: parseInt(id),
        team_id: parseInt(selectedWinner)
      });
      toast.success('Prédiction du vainqueur enregistrée !');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // Filter matches by status
  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches
    .filter(m => m.status === 'upcoming')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const completedMatches = matches.filter(m => m.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/tournois" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Link>
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{error || 'Tournoi non trouvé'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/tournois" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux tournois</span>
        </Link>

        {/* Tournament Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
          <div className="flex items-center space-x-6">
            {tournament.logo_url ? (
              <img src={tournament.logo_url} alt={tournament.name} className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
              {tournament.description && <p className="text-gray-400 mt-1">{tournament.description}</p>}
              <div className="flex items-center space-x-4 mt-3">
                <span className="text-sm text-gray-400 flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{tournamentTeams.length} équipes</span>
                </span>
                {liveMatches.length > 0 && (
                  <span className="text-sm text-red-400 flex items-center space-x-1 animate-pulse">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>{liveMatches.length} en cours</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Winner Prediction */}
        {tournamentTeams.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-6 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center space-x-2 mb-4">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-lg font-bold text-white">Prédire le vainqueur du tournoi</h2>
            </div>
            
            {user ? (
              canPredictWinner() ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <select
                    value={selectedWinner}
                    onChange={(e) => setSelectedWinner(e.target.value)}
                    className="flex-1 bg-gray-700 border border-yellow-500/50 rounded-xl py-3 px-4 text-white"
                  >
                    <option value="">Sélectionner une équipe</option>
                    {tournamentTeams.map(team => (
                      <option key={team.team_id} value={team.team_id}>{team.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={submitWinnerPrediction} 
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <Crown className="w-5 h-5" />
                    <span>{winnerPrediction ? 'Modifier' : 'Valider'}</span>
                  </button>
                </div>
              ) : (
                <p className="text-gray-400">Les prédictions de vainqueur sont fermées (le tournoi a commencé)</p>
              )
            ) : (
              <p className="text-yellow-400 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Connectez-vous pour prédire le vainqueur et gagner des points bonus !</span>
              </p>
            )}
            
            {winnerPrediction && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-green-400 flex items-center space-x-2">
                  <Check className="w-5 h-5" />
                  <span>
                    Votre prédiction: <strong>{tournamentTeams.find(t => t.team_id === winnerPrediction.team_id)?.name}</strong>
                    {winnerPrediction.points_earned > 0 && (
                      <span className="ml-2 text-yellow-400">(+{winnerPrediction.points_earned} pts gagnés !)</span>
                    )}
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span>En cours</span>
            </h2>
            <div className="space-y-4">
              {liveMatches.map(match => {
                const pred = predictions[match.id];
                return (
                  <div key={match.id} className="card border-red-500/50 bg-red-500/5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-gray-400">{match.stage || 'Phase de groupes'}</span>
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full animate-pulse">🔴 En cours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex flex-col items-center">
                        {renderFlag(match.team1_flag, match.team1_name)}
                        <p className="text-white font-semibold mt-2 text-sm text-center">{match.team1_name}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-3xl font-bold text-red-400">{match.team1_score ?? 0} - {match.team2_score ?? 0}</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        {renderFlag(match.team2_flag, match.team2_name)}
                        <p className="text-white font-semibold mt-2 text-sm text-center">{match.team2_name}</p>
                      </div>
                    </div>
                    {pred && (
                      <p className="text-center text-xs text-gray-400 mt-3">Votre prono: {pred.team1_score} - {pred.team2_score}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              <span>À venir</span>
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
                  <div key={match.id} className="card border-orange-500/30 bg-orange-500/5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-gray-400">{match.stage || 'Phase de groupes'}</span>
                      <span className="text-xs px-2 py-1 rounded-full flex items-center space-x-1 bg-orange-500/20 text-orange-400 animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeRemaining(match.match_date)}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex flex-col items-center">
                        {renderFlag(match.team1_flag, match.team1_name)}
                        <p className="text-white font-semibold mt-2 text-sm text-center">{match.team1_name}</p>
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
                          <span className="text-lg font-bold text-gray-400">{existingPred.team1_score} - {existingPred.team2_score}</span>
                        ) : (
                          <span className="text-gray-500">VS</span>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center">
                        {renderFlag(match.team2_flag, match.team2_name)}
                        <p className="text-white font-semibold mt-2 text-sm text-center">{match.team2_name}</p>
                      </div>
                    </div>

                    {canPredict && user && (
                      <div className="mt-4 flex justify-center">
                        <button onClick={() => submitPrediction(match.id)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
                          {existingPred ? 'Modifier' : 'Valider'}
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
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed */}
        {completedMatches.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Terminés</span>
            </h2>
            <div className="space-y-4">
              {completedMatches.map(match => {
                const pred = predictions[match.id];
                return (
                  <div key={match.id} className="card opacity-80">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-gray-400">{match.stage || 'Phase de groupes'}</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Terminé</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex flex-col items-center">
                        {renderFlag(match.team1_flag, match.team1_name)}
                        <p className="text-white font-semibold mt-2 text-sm text-center">{match.team1_name}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-2xl font-bold text-white">{match.team1_score} - {match.team2_score}</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        {renderFlag(match.team2_flag, match.team2_name)}
                        <p className="text-white font-semibold mt-2 text-sm text-center">{match.team2_name}</p>
                      </div>
                    </div>

                    {pred && (
                      <p className="text-center text-xs text-gray-400 mt-3">
                        Votre prono: {pred.team1_score} - {pred.team2_score}
                        {pred.points_earned > 0 && <span className="text-green-400"> (+{pred.points_earned} pts)</span>}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {liveMatches.length === 0 && upcomingMatches.length === 0 && completedMatches.length === 0 && (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun match disponible</p>
            <p className="text-gray-500 text-sm mt-2">Les matchs apparaissent 24h avant le coup d'envoi</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailPage;
