import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Clock, ChevronLeft, Crown, Check } from 'lucide-react';
import { tournamentsAPI, matchesAPI, tournamentWinnerAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TournamentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winnerPrediction, setWinnerPrediction] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [submittingWinner, setSubmittingWinner] = useState(false);
  const [tournamentStarted, setTournamentStarted] = useState(true); // Default to true (safe)

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    try {
      const [tournamentRes, matchesRes, teamsRes] = await Promise.all([
        tournamentsAPI.getById(id),
        matchesAPI.getByTournament(id),
        tournamentsAPI.getTeams(id)
      ]);

      setTournament(tournamentRes.data);
      setMatches(matchesRes.data || []);
      
      // Get teams - from tournament_teams or extract from matches
      let teamsData = teamsRes.data || [];
      if (teamsData.length === 0 && matchesRes.data?.length > 0) {
        // Extract unique teams from matches
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
      setTeams(teamsData);

      // Check if tournament has started - from backend
      try {
        const startedRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://fotball-backend.onrender.com'}/api/tournaments/${id}/started`);
        const startedData = await startedRes.json();
        setTournamentStarted(startedData.started);
      } catch (e) {
        console.error('Error checking tournament started:', e);
        setTournamentStarted(true); // Default to started (safe)
      }

      // Get user's winner prediction
      if (user) {
        try {
          const predRes = await tournamentWinnerAPI.get(id);
          if (predRes.data) {
            setWinnerPrediction(predRes.data);
            setSelectedWinner(predRes.data.team_id?.toString() || '');
          }
        } catch (e) {
          console.log('No winner prediction yet');
        }
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWinnerPrediction = async () => {
    if (!selectedWinner) {
      toast.error('Sélectionnez une équipe');
      return;
    }

    setSubmittingWinner(true);
    try {
      const res = await tournamentWinnerAPI.predict({
        tournament_id: parseInt(id),
        team_id: parseInt(selectedWinner)
      });
      setWinnerPrediction(res.data);
      toast.success('Prédiction enregistrée !');
      fetchData(); // Refresh to get updated state
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la prédiction');
    } finally {
      setSubmittingWinner(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatMatchDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatMatchTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-2xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-8 h-6 object-cover rounded" />;
    }
    return <span className="text-2xl">{flagUrl}</span>;
  };

  const renderSmallFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-lg">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-6 h-4 object-cover rounded" />;
    }
    return <span className="text-lg">{flagUrl}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Tournoi non trouvé</p>
        <Link to="/tournaments" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
          Retour aux tournois
        </Link>
      </div>
    );
  }

  // Group matches by date
  const matchesByDate = matches.reduce((acc, match) => {
    const dateKey = formatMatchDate(match.match_date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});

  // Check if user can predict (not started and logged in)
  const canPredict = user && !tournamentStarted;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link to="/tournaments" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" />
        Retour aux tournois
      </Link>

      {/* Tournament Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-start space-x-6">
          {tournament.logo_url ? (
            <img src={tournament.logo_url} alt={tournament.name} className="w-24 h-24 rounded-xl object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{tournament.name}</h1>
            {tournament.description && (
              <p className="text-gray-400 mb-4">{tournament.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {tournament.start_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>{matches.length} matchs</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Winner Prediction Section */}
      {teams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Prédire le Vainqueur</h2>
              <p className="text-gray-400 text-sm">
                {tournamentStarted 
                  ? "Les prédictions sont fermées" 
                  : "Qui va remporter ce tournoi ?"}
              </p>
            </div>
          </div>

          {!user ? (
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <p className="text-gray-400">
                <Link to="/login" className="text-primary-400 hover:text-primary-300">Connectez-vous</Link> pour prédire le vainqueur du tournoi
              </p>
            </div>
          ) : tournamentStarted ? (
            <div className="bg-white/5 rounded-lg p-4">
              {winnerPrediction ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-white">Votre prédiction :</span>
                    {renderSmallFlag(winnerPrediction.flag_url, winnerPrediction.team_name)}
                    <span className="font-bold text-white">{winnerPrediction.team_name}</span>
                  </div>
                  {winnerPrediction.points_earned > 0 && (
                    <span className="text-green-400 font-bold">+{winnerPrediction.points_earned} pts</span>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center">Vous n'avez pas fait de prédiction pour ce tournoi</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {winnerPrediction && (
                <div className="flex items-center space-x-2 text-green-400 mb-2">
                  <Check className="w-5 h-5" />
                  <span>Prédiction actuelle : <strong>{winnerPrediction.team_name}</strong></span>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedWinner}
                  onChange={(e) => setSelectedWinner(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white"
                >
                  <option value="">Sélectionnez une équipe...</option>
                  {teams.map(team => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleWinnerPrediction}
                  disabled={submittingWinner || !selectedWinner}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submittingWinner ? (
                    <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Crown className="w-5 h-5" />
                      <span>{winnerPrediction ? 'Modifier' : 'Valider'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Matches */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Matchs</h2>

        {matches.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun match visible pour le moment</p>
            <p className="text-gray-500 text-sm mt-2">Les matchs apparaissent 24h avant leur début</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(matchesByDate).map(([date, dateMatches]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary-400" />
                  {date}
                </h3>
                <div className="space-y-3">
                  {dateMatches.map(match => (
                    <Link
                      key={match.id}
                      to={`/matches/${match.id}`}
                      className="card hover:border-primary-500/50 transition-colors block"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Team 1 */}
                          <div className="flex items-center space-x-2 flex-1 justify-end">
                            <span className="text-white font-medium text-right">{match.team1_name}</span>
                            {renderFlag(match.team1_flag, match.team1_name)}
                          </div>

                          {/* Score or Time */}
                          <div className="px-4 py-2 bg-white/5 rounded-lg min-w-[80px] text-center">
                            {match.status === 'completed' ? (
                              <span className="text-xl font-bold text-white">
                                {match.team1_score} - {match.team2_score}
                              </span>
                            ) : match.status === 'live' ? (
                              <div>
                                <span className="text-xl font-bold text-green-400">
                                  {match.team1_score} - {match.team2_score}
                                </span>
                                <div className="text-xs text-green-400 animate-pulse">EN DIRECT</div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-1 text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{formatMatchTime(match.match_date)}</span>
                              </div>
                            )}
                          </div>

                          {/* Team 2 */}
                          <div className="flex items-center space-x-2 flex-1">
                            {renderFlag(match.team2_flag, match.team2_name)}
                            <span className="text-white font-medium">{match.team2_name}</span>
                          </div>
                        </div>

                        {/* Stage */}
                        {match.stage && (
                          <span className="text-xs text-gray-500 ml-4">{match.stage}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TournamentDetailPage;
