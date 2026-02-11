import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Trophy, Target, Check, ChevronLeft, ChevronRight, Calendar, Flame, Award } from 'lucide-react';
import { dailyWinnersAPI } from '../api';
import UserPredictionsModal from '../components/UserPredictionsModal';

const DailyWinnersPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => { fetchData(); }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await dailyWinnersAPI.get(selectedDate);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const changeDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    const today = new Date().toISOString().split('T')[0];
    if (d.toISOString().split('T')[0] <= today) {
      setSelectedDate(d.toISOString().split('T')[0]);
    }
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-sm">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) return <img src={flagUrl} alt={name} className="w-6 h-4 object-cover rounded" />;
    return <span className="text-sm">{flagUrl}</span>;
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-5xl gradient-text mb-2">Gagnants du Jour</h1>
          <p className="text-gray-400">Les meilleurs pronostiqueurs de la journée</p>
        </motion.div>

        {/* Date Navigator */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-5 h-5 text-primary-400" />
                <span className="text-white font-semibold text-lg">{formatDate(selectedDate)}</span>
              </div>
              {isToday && (
                <span className="text-xs bg-primary-500/20 text-primary-400 px-3 py-0.5 rounded-full mt-1 inline-block">Aujourd'hui</span>
              )}
            </div>
            <button onClick={() => changeDate(1)} disabled={isToday} className={`p-2 rounded-lg transition-colors ${isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'}`}>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-16"><div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div></div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card text-center">
                <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{data?.total_matches || 0}</p>
                <p className="text-xs text-gray-400">Matchs terminés</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card text-center">
                <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{data?.winners?.length || 0}</p>
                <p className="text-xs text-gray-400">Joueurs gagnants</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card text-center">
                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {data?.winners?.reduce((s, w) => s + w.exact_count, 0) || 0}
                </p>
                <p className="text-xs text-gray-400">Scores exacts</p>
              </motion.div>
            </div>

            {/* Matches of the Day */}
            {data?.matches?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-6">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-orange-500" /><span>Matchs du jour</span>
                </h2>
                <div className="space-y-2">
                  {data.matches.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-2 flex-1">
                        {renderFlag(m.team1_flag, m.team1_name)}
                        <span className="text-white text-sm truncate">{m.team1_name}</span>
                      </div>
                      <div className="px-4 text-center">
                        <span className="text-white font-bold text-lg">{m.team1_score} - {m.team2_score}</span>
                        {m.tournament_name && <p className="text-xs text-gray-500">{m.tournament_name}</p>}
                      </div>
                      <div className="flex items-center space-x-2 flex-1 justify-end">
                        <span className="text-white text-sm truncate">{m.team2_name}</span>
                        {renderFlag(m.team2_flag, m.team2_name)}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Winners List */}
            {data?.winners?.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-yellow-500" /><span>Classement du jour</span>
                </h2>
                <div className="space-y-3">
                  {data.winners.map((w, idx) => (
                    <motion.div
                      key={w.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      onClick={() => setSelectedUser(w)}
                      className={`p-4 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all ${
                        idx === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                        idx === 1 ? 'bg-gray-400/10 border-gray-400/30' :
                        idx === 2 ? 'bg-orange-500/10 border-orange-500/30' :
                        'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 text-center">
                            {idx === 0 ? <span className="text-2xl">🥇</span> :
                             idx === 1 ? <span className="text-2xl">🥈</span> :
                             idx === 2 ? <span className="text-2xl">🥉</span> :
                             <span className="text-gray-400 font-bold">#{idx + 1}</span>}
                          </div>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0 ? 'bg-yellow-500 text-black' :
                            idx === 1 ? 'bg-gray-400 text-black' :
                            idx === 2 ? 'bg-orange-500 text-white' :
                            'bg-white/10 text-white'
                          }`}>
                            {w.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{w.user_name}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              {w.exact_count > 0 && (
                                <span className="text-green-400 flex items-center space-x-1">
                                  <Star className="w-3 h-3" /><span>{w.exact_count} exact{w.exact_count > 1 ? 's' : ''}</span>
                                </span>
                              )}
                              {w.correct_count > 0 && (
                                <span className="text-yellow-400 flex items-center space-x-1">
                                  <Check className="w-3 h-3" /><span>{w.correct_count} correct{w.correct_count > 1 ? 's' : ''}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-primary-400'
                          }`}>+{w.total_points}</p>
                          <p className="text-xs text-gray-500">pts aujourd'hui</p>
                        </div>
                      </div>

                      {/* Predictions detail */}
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        {w.predictions.map((pred, pi) => (
                          <div key={pi} className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                            pred.prediction_type === 'exact' ? 'bg-green-500/10' : 'bg-yellow-500/10'
                          }`}>
                            <div className="flex items-center space-x-2 flex-1">
                              {renderFlag(pred.team1_flag, pred.team1_name)}
                              <span className="text-white truncate">{pred.team1_name}</span>
                            </div>
                            <div className="text-center px-2">
                              <span className="text-gray-400">{pred.team1_score}-{pred.team2_score}</span>
                              <span className="text-gray-600 mx-1">→</span>
                              <span className="text-white font-semibold">{pred.actual_team1_score}-{pred.actual_team2_score}</span>
                            </div>
                            <div className="flex items-center space-x-2 flex-1 justify-end">
                              <span className="text-white truncate">{pred.team2_name}</span>
                              {renderFlag(pred.team2_flag, pred.team2_name)}
                            </div>
                            <span className={`ml-2 px-2 py-0.5 rounded-full font-medium ${
                              pred.prediction_type === 'exact' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {pred.prediction_type === 'exact' ? '⭐' : '✓'} +{pred.points_earned}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-16">
                {data?.total_matches === 0 ? (
                  <>
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Aucun match terminé ce jour</p>
                    <p className="text-gray-500 text-sm mt-1">Revenez après les matchs pour voir les résultats !</p>
                  </>
                ) : (
                  <>
                    <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Aucun pronostic correct aujourd'hui</p>
                    <p className="text-gray-500 text-sm mt-1">{data?.total_matches} match{data?.total_matches > 1 ? 's' : ''} terminé{data?.total_matches > 1 ? 's' : ''}, mais personne n'a trouvé le bon résultat</p>
                  </>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {selectedUser && (
        <UserPredictionsModal userId={selectedUser.user_id} userName={selectedUser.user_name} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
};

export default DailyWinnersPage;
