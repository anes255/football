import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import { tournamentsAPI, matchesAPI, predictionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TournamentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [predictionInputs, setPredictionInputs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    try {
      const [tourRes, matchesRes] = await Promise.all([
        tournamentsAPI.getById(id),
        matchesAPI.getByTournamentVisible(id)
      ]);
      
      setTournament(tourRes.data);
      setMatches(matchesRes.data || []);

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

  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const liveMatches = matches.filter(m => m.status === 'live');
  const completedMatches = matches.filter(m => m.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/tournois" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Link>
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Tournoi non trouvé</p>
          </div>
        </div>
      </div>
    );
  }

  const MatchCard = ({ match, showPrediction = true }) => {
    const canPredict = canPredictMatch(match);
    const existingPred = predictions[match.id];
    const input = predictionInputs[match.id] || {
      team1_score: existingPred?.team1_score ?? '',
      team2_score: existingPred?.team2_score ?? ''
    };

    return (
      <div className={`card ${match.status === 'completed' ? 'opacity-80' : ''}`}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-400">{match.stage || 'Match'}</span>
          {match.status === 'upcoming' && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{getTimeRemaining(match.match_date)}</span>
            </span>
          )}
          {match.status === 'live' && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full animate-pulse">🔴 En cours</span>
          )}
          {match.status === 'completed' && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Terminé</span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            {renderFlag(match.team1_flag, match.team1_name)}
            <p className="text-white font-semibold mt-2 text-sm">{match.team1_name}</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center">
            {match.status === 'completed' || match.status === 'live' ? (
              <div className="text-2xl font-bold text-white">{match.team1_score} - {match.team2_score}</div>
            ) : canPredict && user && showPrediction ? (
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
              <span className="text-gray-500 text-lg">VS</span>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {new Date(match.match_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          <div className="flex-1 text-center">
            {renderFlag(match.team2_flag, match.team2_name)}
            <p className="text-white font-semibold mt-2 text-sm">{match.team2_name}</p>
          </div>
        </div>

        {canPredict && user && showPrediction && (
          <div className="mt-4 flex justify-center">
            <button onClick={() => submitPrediction(match.id)} className="btn-primary text-sm">
              {existingPred ? 'Modifier' : 'Valider'}
            </button>
          </div>
        )}

        {existingPred && match.status !== 'upcoming' && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Votre prono: {existingPred.team1_score} - {existingPred.team2_score}
            {existingPred.points_earned > 0 && <span className="text-green-400"> (+{existingPred.points_earned} pts)</span>}
          </p>
        )}

        {!user && canPredict && showPrediction && (
          <p className="text-center text-xs text-yellow-400 mt-4">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Connectez-vous pour pronostiquer
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/tournois" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux tournois</span>
        </Link>

        {/* Tournament Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-8">
          <div className="flex items-center space-x-6">
            {tournament.logo_url ? (
              <img src={tournament.logo_url} alt={tournament.name} className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
              {tournament.description && <p className="text-gray-400 mt-1">{tournament.description}</p>}
              <p className="text-sm text-gray-500 mt-2">{matches.length} matchs</p>
            </div>
          </div>
        </motion.div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span>En direct</span>
            </h2>
            <div className="space-y-4">
              {liveMatches.map(match => <MatchCard key={match.id} match={match} showPrediction={false} />)}
            </div>
          </section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>À venir</span>
            </h2>
            <div className="space-y-4">
              {upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)}
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
              {completedMatches.map(match => <MatchCard key={match.id} match={match} showPrediction={false} />)}
            </div>
          </section>
        )}

        {matches.length === 0 && (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun match programmé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailPage;
