import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Lock, Check, AlertCircle, Trophy } from 'lucide-react';
import { matchesAPI, predictionsAPI, tournamentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MatchesPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [predictionInputs, setPredictionInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterTournament, setFilterTournament] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [matchesRes, tourRes] = await Promise.all([
        matchesAPI.getAll(),  // Changed from getVisible() to getAll() to show all matches
        tournamentsAPI.getAll()
      ]);
      setMatches(matchesRes.data || []);
      setTournaments(tourRes.data || []);

      if (user) {
        try {
          const predRes = await predictionsAPI.getMyPredictions();
          const predMap = {};
          (predRes.data || []).forEach(p => { predMap[p.match_id] = p; });
          setPredictions(predMap);
        } catch (e) {
          console.error('Error fetching predictions:', e);
        }
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
      return <img src={flagUrl} alt={name} className="w-10 h-7 object-cover rounded" />;
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

  const isWithin24Hours = (matchDate) => {
    const diff = new Date(matchDate) - new Date();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
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

  // Filter matches
  let filteredMatches = matches;
  if (filterTournament) {
    filteredMatches = filteredMatches.filter(m => m.tournament_id === parseInt(filterTournament));
  }
  if (filterStatus !== 'all') {
    filteredMatches = filteredMatches.filter(m => m.status === filterStatus);
  }

  // Group by status
  const liveMatches = filteredMatches.filter(m => m.status === 'live');
  const upcomingMatches = filteredMatches.filter(m => m.status === 'upcoming').sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const completedMatches = filteredMatches.filter(m => m.status === 'completed').sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

  // Separate matches within 24 hours
  const matchesWithin24Hours = upcomingMatches.filter(m => isWithin24Hours(m.match_date));
  const matchesAfter24Hours = upcomingMatches.filter(m => !isWithin24Hours(m.match_date));

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const UpcomingMatchCard = ({ match, highlight = false }) => {
    const canPredict = canPredictMatch(match);
    const existingPred = predictions[match.id];
    const input = predictionInputs[match.id] || {
      team1_score: existingPred?.team1_score ?? '',
      team2_score: existingPred?.team2_score ?? ''
    };

    return (
      <motion.div 
        key={match.id} 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className={`card ${highlight ? 'border-orange-500/50 bg-orange-500/5' : ''}`}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            {match.tournament_name && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                {match.tournament_name}
              </span>
            )}
            {match.stage && (
              <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full">
                {match.stage}
              </span>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${highlight ? 'bg-orange-500/20 text-orange-400 animate-pulse' : 'bg-blue-500/20 text-blue-400'}`}>
            <Clock className="w-3 h-3" />
            <span>{getTimeRemaining(match.match_date)}</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Link to={`/equipe/${match.team1_id}`} className="flex-1 text-center hover:opacity-80 transition-opacity">
            {renderFlag(match.team1_flag, match.team1_name)}
            <p className="text-white font-semibold mt-2 hover:text-primary-400 transition-colors">{match.team1_name}</p>
          </Link>

          <div className="flex-1 flex flex-col items-center">
            {canPredict && user ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={input.team1_score}
                  onChange={(e) => handlePredictionChange(match.id, 'team1_score', e.target.value)}
                  className={`w-14 bg-gray-700 border rounded-lg py-2 text-white text-center text-xl ${highlight ? 'border-orange-500/50' : 'border-gray-600'}`}
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={input.team2_score}
                  onChange={(e) => handlePredictionChange(match.id, 'team2_score', e.target.value)}
                  className={`w-14 bg-gray-700 border rounded-lg py-2 text-white text-center text-xl ${highlight ? 'border-orange-500/50' : 'border-gray-600'}`}
                />
              </div>
            ) : existingPred ? (
              <span className="text-xl font-bold text-gray-400">{existingPred.team1_score} - {existingPred.team2_score}</span>
            ) : !canPredict ? (
              <div className="flex items-center space-x-1 text-red-400">
                <Lock className="w-4 h-4" />
                <span>Fermé</span>
              </div>
            ) : (
              <span className="text-gray-500">VS</span>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <Link to={`/equipe/${match.team2_id}`} className="flex-1 text-center hover:opacity-80 transition-opacity">
            {renderFlag(match.team2_flag, match.team2_name)}
            <p className="text-white font-semibold mt-2 hover:text-primary-400 transition-colors">{match.team2_name}</p>
          </Link>
        </div>

        {canPredict && user && (
          <div className="mt-4 flex justify-center">
            <button 
              onClick={() => submitPrediction(match.id)} 
              className={`text-sm flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${highlight ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'btn-primary'}`}
            >
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
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl gradient-text">Matchs</h1>
          <p className="text-gray-400 mt-2">Faites vos pronostics</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={filterTournament}
            onChange={(e) => setFilterTournament(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-xl py-2 px-4 text-white"
          >
            <option value="">Tous les tournois</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-xl py-2 px-4 text-white"
          >
            <option value="all">Tous les matchs</option>
            <option value="upcoming">À venir</option>
            <option value="live">En cours</option>
            <option value="completed">Terminés</option>
          </select>
        </div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span>En cours</span>
            </h2>
            <div className="space-y-4">
              {liveMatches.map(match => (
                <MatchCard key={match.id} match={match} prediction={predictions[match.id]} />
              ))}
            </div>
          </section>
        )}

        {/* Matches Within 24 Hours */}
        {matchesWithin24Hours.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
              <span>Dans les prochaines 24h</span>
              <span className="text-sm font-normal text-orange-400">Pronostiquez maintenant !</span>
            </h2>
            <div className="space-y-4">
              {matchesWithin24Hours.map(match => (
                <UpcomingMatchCard key={match.id} match={match} highlight={true} />
              ))}
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
              {matchesAfter24Hours.map(match => (
                <UpcomingMatchCard key={match.id} match={match} />
              ))}
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
                <MatchCard key={match.id} match={match} prediction={predictions[match.id]} completed />
              ))}
            </div>
          </section>
        )}

        {filteredMatches.length === 0 && (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun match disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MatchCard = ({ match, prediction, completed }) => {
  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-2xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-10 h-7 object-cover rounded" />;
    }
    return <span className="text-2xl">{flagUrl}</span>;
  };

  return (
    <div className={`card ${completed ? 'opacity-80' : 'border-red-500/50'}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          {match.tournament_name && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
              {match.tournament_name}
            </span>
          )}
          {match.stage && (
            <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full">
              {match.stage}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ml-auto ${
          completed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {completed ? 'Terminé' : 'En cours'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <Link to={`/equipe/${match.team1_id}`} className="flex-1 text-center hover:opacity-80 transition-opacity">
          {renderFlag(match.team1_flag, match.team1_name)}
          <p className="text-white font-semibold mt-2 hover:text-primary-400 transition-colors">{match.team1_name}</p>
        </Link>
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-white">{match.team1_score} - {match.team2_score}</div>
          <p className="text-xs text-gray-500 mt-1">{new Date(match.match_date).toLocaleDateString('fr-FR')}</p>
        </div>
        <Link to={`/equipe/${match.team2_id}`} className="flex-1 text-center hover:opacity-80 transition-opacity">
          {renderFlag(match.team2_flag, match.team2_name)}
          <p className="text-white font-semibold mt-2 hover:text-primary-400 transition-colors">{match.team2_name}</p>
        </Link>
      </div>

      {prediction && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Votre prono: {prediction.team1_score} - {prediction.team2_score}
          {prediction.points_earned > 0 && <span className="text-green-400"> (+{prediction.points_earned} pts)</span>}
        </p>
      )}
    </div>
  );
};

export default MatchesPage;
