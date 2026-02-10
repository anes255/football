import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, Clock, Check, AlertCircle, Users, Crown } from 'lucide-react';
import { tournamentsAPI, matchesAPI, predictionsAPI, tournamentWinnerAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import TournamentPredictions from '../components/TournamentPredictions';
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
  const [activeTab, setActiveTab] = useState('matches');
  const [tournamentStarted, setTournamentStarted] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    try {
      const [tourRes, matchesRes, teamsRes] = await Promise.all([
        tournamentsAPI.getById(id),
        matchesAPI.getByTournamentVisible(id),
        tournamentsAPI.getTeams(id)
      ]);
      
      setTournament(tourRes.data);
      setMatches(matchesRes.data || []);
      
      let teamsData = teamsRes.data || [];
      if (teamsData.length === 0 && matchesRes.data?.length > 0) {
        const teamsMap = new Map();
        matchesRes.data.forEach(match => {
          if (match.team1_id && !teamsMap.has(match.team1_id)) {
            teamsMap.set(match.team1_id, {
              team_id: match.team1_id,
              name: match.team1_name,
              flag_url: match.team1_flag
            });
          }
          if (match.team2_id && !teamsMap.has(match.team2_id)) {
            teamsMap.set(match.team2_id, {
              team_id: match.team2_id,
              name: match.team2_name,
              flag_url: match.team2_flag
            });
          }
        });
        teamsData = Array.from(teamsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      }
      setTournamentTeams(teamsData);

      try {
        const startedRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://fotball-backend.onrender.com'}/api/tournaments/${id}/started`);
        const startedData = await startedRes.json();
        setTournamentStarted(startedData.started);
      } catch (e) {
        console.error('Error checking tournament started:', e);
        setTournamentStarted(true);
      }

      if (user) {
        const predRes = await predictionsAPI.getMyPredictions();
        const predMap = {};
        predRes.data.forEach(p => { predMap[p.match_id] = p; });
        setPredictions(predMap);

        try {
          const winnerRes = await tournamentWinnerAPI.get(id);
          setWinnerPrediction(winnerRes.data);
          if (winnerRes.data) setSelectedWinner(winnerRes.data.team_id.toString());
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error:', error);
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

  const canPredictWinner = () => !tournamentStarted;

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

  const groupedTeams = tournamentTeams.reduce((acc, team) => {
    const group = team.group_name || 'Sans groupe';
    if (!acc[group]) acc[group] = [];
    acc[group].push(team);
    return acc;
  }, {});

  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const liveMatches = matches.filter(m => m.status === 'live');
  const completedMatches = matches.filter(m => m.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-4 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/tournois" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Link>

          {tournament && (
            <div className="card mb-8">
              <div className="flex items-center space-x-4 mb-6">
                {tournament.logo_url ? (
                  <img src={tournament.logo_url} alt={tournament.name} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
                    {tournament.is_active ? (
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">En cours</span>
                    ) : (
                      <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-1 rounded-full">Terminé</span>
                    )}
                  </div>
                  {tournament.description && <p className="text-gray-400 mt-1">{tournament.description}</p>}
                </div>
              </div>

              <div className="flex space-x-4 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`pb-3 px-2 transition-colors ${activeTab === 'matches' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Matchs
                </button>
                {tournamentTeams.length > 0 && (
                  <button
                    onClick={() => setActiveTab('teams')}
                    className={`pb-3 px-2 transition-colors ${activeTab === 'teams' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    Équipes
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => setActiveTab('winner')}
                    className={`pb-3 px-2 transition-colors ${activeTab === 'winner' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    Vainqueur
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tournament Predictions - Best Player & Goal Scorer */}
          {user && <TournamentPredictions tournamentId={id} />}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              {Object.entries(groupedTeams).map(([group, teams]) => (
                <div key={group} className="card">
                  <h3 className="text-lg font-bold text-white mb-4">{group}</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {teams.map(team => (
                      <div key={team.team_id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        {renderFlag(team.flag_url, team.name)}
                        <span className="text-white font-medium">{team.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'winner' && (
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <span>Prédire le Vainqueur</span>
              </h2>
              
              {!canPredictWinner() ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                  <p className="text-red-400 text-sm flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Le tournoi a commencé. Vous ne pouvez plus modifier votre prédiction.</span>
                  </p>
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <p className="text-blue-400 text-sm">
                    Sélectionnez l'équipe que vous pensez qui va gagner ce tournoi.
                  </p>
                </div>
              )}

              {winnerPrediction && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                  <p className="text-green-400 text-sm flex items-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>Vous avez prédit: {tournamentTeams.find(t => t.team_id === winnerPrediction.team_id)?.name}</span>
                  </p>
                  {winnerPrediction.points_earned > 0 && (
                    <p className="text-yellow-400 text-sm mt-2">+{winnerPrediction.points_earned} points gagnés !</p>
                  )}
                </div>
              )}

              <select
                value={selectedWinner}
                onChange={(e) => setSelectedWinner(e.target.value)}
                disabled={!canPredictWinner()}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white mb-4 disabled:opacity-50"
              >
                <option value="">Sélectionner une équipe</option>
                {tournamentTeams.map(team => (
                  <option key={team.team_id} value={team.team_id}>{team.name}</option>
                ))}
              </select>

              {canPredictWinner() && (
                <button onClick={submitWinnerPrediction} className="w-full btn-primary">
                  {winnerPrediction ? 'Modifier ma prédiction' : 'Valider ma prédiction'}
                </button>
              )}
            </div>
          )}

          {activeTab === 'matches' && (
            <>
              {liveMatches.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <span>En direct</span>
                  </h2>
                  <div className="space-y-4">
                    {liveMatches.map(match => (
                      <div key={match.id} className="card border-green-500/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs text-gray-400">{match.stage || 'Phase de groupes'}</span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full animate-pulse">EN DIRECT</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-center">
                            {renderFlag(match.team1_flag, match.team1_name)}
                            <p className="text-white font-semibold mt-2 text-sm">{match.team1_name}</p>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-3xl font-bold text-green-400">{match.team1_score} - {match.team2_score}</div>
                          </div>
                          <div className="flex-1 text-center">
                            {renderFlag(match.team2_flag, match.team2_name)}
                            <p className="text-white font-semibold mt-2 text-sm">{match.team2_name}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {upcomingMatches.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
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
                        <div key={match.id} className="card">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs text-gray-400">{match.stage || 'Phase de groupes'}</span>
                            {getTimeRemaining(match.match_date) && (
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{getTimeRemaining(match.match_date)}</span>
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex-1 text-center">
                              {renderFlag(match.team1_flag, match.team1_name)}
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
                                <span className="text-lg font-bold text-gray-400">{existingPred.team1_score} - {existingPred.team2_score}</span>
                              ) : (
                                <span className="text-gray-500">VS</span>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            
                            <div className="flex-1 text-center">
                              {renderFlag(match.team2_flag, match.team2_name)}
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
                            <p className="text-center text-xs text-green-400 mt-2">✓ Votre prono: {existingPred.team1_score} - {existingPred.team2_score}</p>
                          )}

                          {!user && canPredict && (
                            <p className="text-center text-xs text-yellow-400 mt-4">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              <Link to="/connexion" className="hover:text-yellow-300">Connectez-vous pour pronostiquer</Link>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

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
                            <div className="flex-1 text-center">
                              {renderFlag(match.team1_flag, match.team1_name)}
                              <p className="text-white font-semibold mt-2 text-sm">{match.team1_name}</p>
                            </div>
                            <div className="flex-1 text-center">
                              <div className="text-2xl font-bold text-white">{match.team1_score} - {match.team2_score}</div>
                            </div>
                            <div className="flex-1 text-center">
                              {renderFlag(match.team2_flag, match.team2_name)}
                              <p className="text-white font-semibold mt-2 text-sm">{match.team2_name}</p>
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

              {matches.length === 0 && (
                <div className="card text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Aucun match visible pour le moment</p>
                  <p className="text-gray-500 text-sm mt-2">Les matchs apparaissent 24h avant leur début</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TournamentDetailPage;
