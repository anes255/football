import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, Users, Clock, Check, AlertCircle } from 'lucide-react';
import { tournamentsAPI, matchesAPI, predictionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TournamentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [groups, setGroups] = useState({});
  const [groupNames, setGroupNames] = useState([]);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [predictionInputs, setPredictionInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('groups');

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    try {
      const [groupsRes, matchesRes] = await Promise.all([
        tournamentsAPI.getGroups(id),
        matchesAPI.getByTournamentVisible(id)
      ]);
      
      setTournament(groupsRes.data.tournament);
      setGroups(groupsRes.data.groups);
      setGroupNames(groupsRes.data.groupNames);
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

  const renderFlag = (flagUrl, name, size = 'md') => {
    const sizeClass = size === 'lg' ? 'w-10 h-7' : size === 'sm' ? 'w-6 h-4' : 'w-8 h-6';
    if (!flagUrl) return <span className={size === 'lg' ? 'text-2xl' : 'text-xl'}>🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className={`${sizeClass} object-cover rounded`} />;
    }
    return <span className={size === 'lg' ? 'text-2xl' : 'text-xl'}>{flagUrl}</span>;
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
        <div className="max-w-6xl mx-auto">
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

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/tournois" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux tournois</span>
        </Link>

        {/* Tournament Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
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
              {tournament.description && <p className="text-gray-400">{tournament.description}</p>}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{matches.length} matchs</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{tournament.team_count || 0} équipes</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'groups' ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Groupes
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'matches' ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Matchs ({matches.length})
          </button>
        </div>

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {groupNames.length === 0 ? (
              <div className="col-span-full card text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aucun groupe configuré</p>
              </div>
            ) : (
              groupNames.map((groupName) => (
                <motion.div
                  key={groupName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">{groupName}</span>
                    </div>
                    <span>Groupe {groupName}</span>
                  </h3>
                  
                  {/* Group Table */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 text-xs text-gray-500 pb-2 border-b border-white/10">
                      <div className="col-span-6">Équipe</div>
                      <div className="col-span-2 text-center">Pts</div>
                      <div className="col-span-2 text-center">J</div>
                      <div className="col-span-2 text-center">+/-</div>
                    </div>
                    
                    {groups[groupName]?.map((team, index) => (
                      <Link
                        key={team.team_id}
                        to={`/equipe/${team.team_id}`}
                        className={`grid grid-cols-12 items-center py-2 rounded-lg hover:bg-white/5 transition-colors ${
                          index < 2 ? 'bg-green-500/10' : ''
                        }`}
                      >
                        <div className="col-span-6 flex items-center space-x-2">
                          <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                          {renderFlag(team.flag_url, team.name, 'sm')}
                          <span className="text-white text-sm truncate">{team.name}</span>
                        </div>
                        <div className="col-span-2 text-center text-white font-bold">{team.points}</div>
                        <div className="col-span-2 text-center text-gray-400 text-sm">{team.played}</div>
                        <div className="col-span-2 text-center text-gray-400 text-sm">
                          {team.goals_for - team.goals_against > 0 ? '+' : ''}{team.goals_for - team.goals_against}
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Upcoming */}
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
                          <span className="text-xs text-gray-400">{match.stage || 'Groupes'}</span>
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{getTimeRemaining(match.match_date)}</span>
                          </span>
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
                          <span className="text-xs text-gray-400">{match.stage || 'Groupes'}</span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Terminé</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-center">
                            {renderFlag(match.team1_flag, match.team1_name)}
                            <p className="text-white font-semibold mt-2 text-sm">{match.team1_name}</p>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-2xl font-bold text-white">
                              {match.team1_score} - {match.team2_score}
                            </div>
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
                <p className="text-gray-400">Aucun match programmé</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailPage;
