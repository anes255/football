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
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch tournament info first
      console.log('Fetching tournament with id:', id);
      const tourRes = await tournamentsAPI.getById(id);
      console.log('Tournament response:', tourRes.data);
      
      if (!tourRes.data) {
        setError('Tournoi non trouvé');
        setLoading(false);
        return;
      }
      
      setTournament(tourRes.data);
      
      // Fetch matches for this tournament
      try {
        const matchesRes = await matchesAPI.getByTournament(id);
        console.log('Matches response:', matchesRes.data);
        setMatches(matchesRes.data || []);
      } catch (matchErr) {
        console.error('Error fetching matches:', matchErr);
        setMatches([]);
      }
      
      // Fetch teams for this tournament
      try {
        const teamsRes = await tournamentsAPI.getTeams(id);
        console.log('Teams response:', teamsRes.data);
        setTournamentTeams(teamsRes.data || []);
      } catch (teamErr) {
        console.error('Error fetching teams:', teamErr);
        setTournamentTeams([]);
      }

      // Fetch predictions if logged in
      if (user) {
        try {
          const predRes = await predictionsAPI.getMyPredictions();
          const predMap = {};
          (predRes.data || []).forEach(p => { predMap[p.match_id] = p; });
          setPredictions(predMap);
        } catch (e) {
          console.error('Error fetching predictions:', e);
        }

        try {
          const winnerRes = await tournamentWinnerAPI.get(id);
          setWinnerPrediction(winnerRes.data);
          if (winnerRes.data) setSelectedWinner(winnerRes.data.team_id.toString());
        } catch (e) {
          // No winner prediction yet
        }
      }
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Erreur lors du chargement du tournoi');
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

  // Can predict as long as match hasn't started
  const canPredictMatch = (match) => {
    if (match.status === 'completed' || match.status === 'live') return false;
    const now = new Date();
    const matchDate = new Date(match.match_date);
    return now < matchDate;
  };

  // Check if match is within 24 hours (visible to users)
  const isWithin24Hours = (matchDate) => {
    const now = new Date();
    const match = new Date(matchDate);
    const diffMs = match.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffMs > 0 && diffHours <= 24;
  };

  const canPredictWinner = () => {
    if (!matches.length) return true;
    const sortedMatches = [...matches].sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
    const firstMatch = sortedMatches[0];
    return new Date() < new Date(firstMatch.match_date);
  };

  const getTimeRemaining = (matchDate) => {
    const now = new Date();
    const match = new Date(matchDate);
    const diffMs = match.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours >= 24) return `${Math.floor(hours / 24)}j ${hours % 24}h`;
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

  // Group teams by group_name
  const groupedTeams = tournamentTeams.reduce((acc, team) => {
    const group = team.group_name || 'Sans groupe';
    if (!acc[group]) acc[group] = [];
    acc[group].push(team);
    return acc;
  }, {});

  // Filter matches: only show upcoming matches within 24h to users (completed always visible)
  const completedMatches = matches.filter(m => m.status === 'completed');
  const liveMatches = matches.filter(m => m.status === 'live');
  
  // Only show upcoming matches that are within 24 hours
  const upcomingMatches = matches
    .filter(m => m.status === 'upcoming' && isWithin24Hours(m.match_date))
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

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
                  <Calendar className="w-4 h-4" />
                  <span>{matches.length} matchs total</span>
                </span>
                <span className="text-sm text-gray-400 flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{tournamentTeams.length} équipes</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Winner Prediction */}
        {user && tournamentTeams.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-white">Prédire le vainqueur</h2>
            </div>
            
            {canPredictWinner() ? (
              <div className="flex items-center space-x-4">
                <select
                  value={selectedWinner}
                  onChange={(e) => setSelectedWinner(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white"
                >
                  <option value="">Sélectionner une équipe</option>
                  {tournamentTeams.map(team => (
                    <option key={team.team_id} value={team.team_id}>{team.name}</option>
                  ))}
                </select>
                <button onClick={submitWinnerPrediction} className="btn-primary">
                  {winnerPrediction ? 'Modifier' : 'Valider'}
                </button>
              </div>
            ) : (
              <p className="text-gray-400">Les prédictions de vainqueur sont fermées</p>
            )}
            
            {winnerPrediction && (
              <p className="text-green-400 text-sm mt-3">
                ✓ Votre prédiction: {tournamentTeams.find(t => t.team_id === winnerPrediction.team_id)?.name}
              </p>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'matches' ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Matchs
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'teams' ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Équipes
          </button>
        </div>

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {Object.keys(groupedTeams).length === 0 ? (
              <div className="card text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aucune équipe assignée</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(groupedTeams).sort().map(([groupName, teams]) => (
                  <motion.div
                    key={groupName}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card"
                  >
                    <div className="bg-gradient-to-r from-primary-500 to-accent-500 -m-6 mb-4 p-4 rounded-t-2xl">
                      <h3 className="text-lg font-bold text-white text-center">Groupe {groupName}</h3>
                    </div>
                    <div className="space-y-3">
                      {teams.map((team, index) => (
                        <Link 
                          to={`/equipe/${team.team_id}`} 
                          key={team.team_id} 
                          className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full text-sm text-gray-400">
                            {index + 1}
                          </span>
                          {renderFlag(team.flag_url, team.name)}
                          <span className="text-white font-medium text-sm flex-1 truncate hover:text-primary-400">{team.name}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <>
            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  <span>En cours</span>
                </h2>
                <div className="space-y-4">
                  {liveMatches.map(match => (
                    <div key={match.id} className="card border-red-500/50">
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
                          <div className="text-2xl font-bold text-white">{match.team1_score} - {match.team2_score}</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          {renderFlag(match.team2_flag, match.team2_name)}
                          <p className="text-white font-semibold mt-2 text-sm text-center">{match.team2_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Matches (within 24h only) */}
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
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full flex items-center space-x-1 animate-pulse">
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
                            <button onClick={() => submitPrediction(match.id)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                              {existingPred ? 'Modifier' : 'Valider'}
                            </button>
                          </div>
                        )}

                        {existingPred && (
                          <p className="text-center text-xs text-green-400 mt-2">✓ Votre prono: {existingPred.team1_score} - {existingPred.team2_score}</p>
                        )}

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

            {upcomingMatches.length === 0 && liveMatches.length === 0 && completedMatches.length === 0 && (
              <div className="card text-center py-12">
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aucun match disponible</p>
                <p className="text-gray-500 text-sm mt-2">Les matchs apparaissent 24h avant le coup d'envoi</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailPage;
