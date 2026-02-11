import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Target, Check, XCircle, User, Calendar, TrendingUp, Award } from 'lucide-react';
import { predictionsAPI } from '../api';

const UserPredictionsModal = ({ userId, userName, onClose, tournamentFilter }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUserPredictions(); }, [userId]);

  const fetchUserPredictions = async () => {
    try {
      const res = await predictionsAPI.getUserPredictions(userId);
      setData(res.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-sm">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) return <img src={flagUrl} alt={name} className="w-6 h-4 object-cover rounded" />;
    return <span className="text-sm">{flagUrl}</span>;
  };

  const getResultStyle = (pred) => {
    const isExact = pred.team1_score === pred.actual_team1_score && pred.team2_score === pred.actual_team2_score;
    if (isExact) return { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-400', label: 'Score exact!', icon: <Check className="w-3 h-3" /> };
    const actualWinner = pred.actual_team1_score > pred.actual_team2_score ? 1 : pred.actual_team1_score < pred.actual_team2_score ? 2 : 0;
    const predWinner = pred.team1_score > pred.team2_score ? 1 : pred.team1_score < pred.team2_score ? 2 : 0;
    if (actualWinner === predWinner && pred.points_earned > 0) return { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400', label: 'Bon résultat', icon: <Check className="w-3 h-3" /> };
    return { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', label: 'Raté', icon: <XCircle className="w-3 h-3" /> };
  };

  // Filter data by tournament if tournamentFilter is set
  const getFilteredData = () => {
    if (!data) return null;
    if (!tournamentFilter || tournamentFilter === 'all') return data;
    const tid = parseInt(tournamentFilter);
    return {
      ...data,
      predictions: (data.predictions || []).filter(p => p.tournament_id === tid),
      winnerPredictions: (data.winnerPredictions || []).filter(p => p.tournament_id === tid),
      playerPredictions: (data.playerPredictions || []).filter(p => p.tournament_id === tid),
    };
  };

  const filtered = getFilteredData();

  // Compute stats from filtered data
  const computeStats = () => {
    if (!filtered) return { totalPoints: 0, totalPreds: 0, completed: 0, correct: 0, exact: 0, successRate: 0 };

    const preds = filtered.predictions || [];
    const completed = preds.filter(p => p.status === 'completed');
    const correct = completed.filter(p => p.points_earned > 0);
    const exact = completed.filter(p => p.team1_score === p.actual_team1_score && p.team2_score === p.actual_team2_score);

    let totalPoints = completed.reduce((s, p) => s + (p.points_earned || 0), 0);
    (filtered.winnerPredictions || []).forEach(p => totalPoints += (p.points_earned || 0));
    (filtered.playerPredictions || []).forEach(p => totalPoints += (p.points_earned || 0));

    const successRate = completed.length > 0 ? ((correct.length / completed.length) * 100).toFixed(0) : 0;

    return { totalPoints, totalPreds: preds.length, completed: completed.length, correct: correct.length, exact: exact.length, successRate };
  };

  const stats = computeStats();

  const groupByTournament = (predictions) => {
    const groups = {};
    (predictions || []).forEach(p => {
      const key = p.tournament_name || 'Autres';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{(data?.user?.name || userName || '?').charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{data?.user?.name || userName}</h2>
                <p className="text-primary-400 font-semibold text-lg">{stats.totalPoints} points</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-6 h-6 text-gray-400" /></button>
          </div>

          {/* Stats Grid - like ProfilePage */}
          {!loading && (
            <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
              <div className="text-center">
                <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{stats.totalPoints}</p>
                <p className="text-xs text-gray-400">Points</p>
              </div>
              <div className="text-center">
                <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{stats.correct}</p>
                <p className="text-xs text-gray-400">Corrects</p>
              </div>
              <div className="text-center">
                <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{stats.totalPreds}</p>
                <p className="text-xs text-gray-400">Pronos</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{stats.successRate}%</p>
                <p className="text-xs text-gray-400">Réussite</p>
              </div>
            </div>
          )}

          {/* Extra stat: exact scores */}
          {!loading && stats.exact > 0 && (
            <div className="mt-3 flex justify-center">
              <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                ⭐ {stats.exact} score{stats.exact > 1 ? 's' : ''} exact{stats.exact > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-230px)]">
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div></div>
          ) : (
            <>
              {/* Winner Predictions */}
              {filtered?.winnerPredictions?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" /><span>Prédictions Vainqueur</span>
                  </h3>
                  <div className="space-y-2">
                    {filtered.winnerPredictions.map((wp, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          {renderFlag(wp.flag_url, wp.team_name)}
                          <div><p className="text-white font-medium">{wp.team_name}</p><p className="text-xs text-gray-400">{wp.tournament_name}</p></div>
                        </div>
                        {wp.points_earned > 0 && <span className="text-green-400 font-bold">+{wp.points_earned} pts</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Predictions */}
              {filtered?.playerPredictions?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                    <User className="w-5 h-5 text-cyan-500" /><span>Prédictions Joueurs</span>
                  </h3>
                  <div className="space-y-2">
                    {filtered.playerPredictions.map((pp, i) => (
                      <div key={i} className="p-3 bg-white/5 rounded-xl">
                        <p className="text-xs text-gray-400 mb-2">{pp.tournament_name}</p>
                        <div className="space-y-1">
                          {pp.best_player_name && (
                            <div className="flex items-center space-x-2">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-white text-sm">Meilleur joueur: <span className="font-semibold">{pp.best_player_name}</span></span>
                              {pp.best_player_team && <span className="text-xs text-gray-400">({pp.best_player_team})</span>}
                            </div>
                          )}
                          {pp.best_goal_scorer_name && (
                            <div className="flex items-center space-x-2">
                              <Target className="w-4 h-4 text-red-400" />
                              <span className="text-white text-sm">Meilleur buteur: <span className="font-semibold">{pp.best_goal_scorer_name}</span></span>
                              {pp.best_goal_scorer_team && <span className="text-xs text-gray-400">({pp.best_goal_scorer_team})</span>}
                            </div>
                          )}
                        </div>
                        {pp.points_earned > 0 && <p className="text-green-400 font-bold text-sm mt-2">+{pp.points_earned} pts</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Predictions grouped by tournament */}
              <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" /><span>Pronostics ({filtered?.predictions?.length || 0})</span>
              </h3>

              {filtered?.predictions?.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Aucun pronostic terminé</p>
                </div>
              ) : (
                Object.entries(groupByTournament(filtered?.predictions)).map(([tournamentName, preds]) => (
                  <div key={tournamentName} className="mb-6">
                    <h4 className="text-sm font-semibold text-primary-400 mb-2 border-b border-white/10 pb-1">{tournamentName}</h4>
                    <div className="space-y-3">
                      {preds.map((pred, index) => {
                        const style = getResultStyle(pred);
                        return (
                          <motion.div key={pred.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                            className={`p-4 rounded-xl border ${style.bg}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${style.text}`}>
                                {pred.points_earned > 0 ? `+${pred.points_earned} pts` : '0 pts'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 flex items-center space-x-2">
                                {renderFlag(pred.team1_flag, pred.team1_name)}
                                <span className="text-white text-sm truncate">{pred.team1_name}</span>
                              </div>
                              <div className="flex-1 text-center">
                                <div className="text-xs text-gray-400 mb-1">Prono</div>
                                <div className="text-white font-bold">{pred.team1_score} - {pred.team2_score}</div>
                                <div className="text-xs text-gray-400 mt-1">Réel</div>
                                <div className="text-gray-300 text-sm">{pred.actual_team1_score} - {pred.actual_team2_score}</div>
                              </div>
                              <div className="flex-1 flex items-center justify-end space-x-2">
                                <span className="text-white text-sm truncate">{pred.team2_name}</span>
                                {renderFlag(pred.team2_flag, pred.team2_name)}
                              </div>
                            </div>
                            <div className="mt-2 flex justify-center">
                              <span className={`text-xs ${style.text} flex items-center space-x-1`}>
                                {style.icon}<span>{style.label}</span>
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserPredictionsModal;
