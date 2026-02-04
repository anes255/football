import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Award, ArrowRight, Users, Target } from 'lucide-react';
import { tournamentsAPI, matchesAPI, leaderboardAPI } from '../api';

const HomePage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tourRes, matchRes, leadRes] = await Promise.all([
        tournamentsAPI.getActive().catch(() => ({ data: [] })),
        matchesAPI.getVisible().catch(() => ({ data: [] })),
        leaderboardAPI.getAll().catch(() => ({ data: [] }))
      ]);
      
      setTournaments(tourRes.data?.slice(0, 2) || []);
      const upcoming = (matchRes.data || []).filter(m => m.status === 'upcoming');
      setMatches(upcoming.slice(0, 4));
      setLeaderboard(leadRes.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-lg">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-7 h-5 object-cover rounded" />;
    }
    return <span className="text-lg">{flagUrl}</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative pt-24 pb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-600/10 to-transparent"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-6"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="gradient-text">Prediction</span>
            <span className="text-white"> World</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg mb-8 max-w-xl mx-auto"
          >
            Pronostiquez les résultats des matchs et grimpez dans le classement !
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/matchs" className="btn-primary px-6 py-3 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Voir les matchs</span>
            </Link>
            <Link to="/classement" className="btn-secondary px-6 py-3 flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Classement</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Stats Bar */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-4 mb-10"
          >
            <div className="card text-center py-4">
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{tournaments.length}</p>
              <p className="text-xs text-gray-400">Tournois actifs</p>
            </div>
            <div className="card text-center py-4">
              <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{matches.length}</p>
              <p className="text-xs text-gray-400">Matchs à venir</p>
            </div>
            <div className="card text-center py-4">
              <Users className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{leaderboard.length}</p>
              <p className="text-xs text-gray-400">Joueurs</p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Matches */}
            <motion.section 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span>Prochains matchs</span>
                </h2>
                <Link to="/matchs" className="text-primary-400 hover:text-primary-300 text-sm flex items-center">
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="card">
                {matches.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun match programmé</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {matches.map((match) => (
                      <div key={match.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {renderFlag(match.team1_flag, match.team1_name)}
                            <span className="text-white text-sm truncate">{match.team1_name}</span>
                          </div>
                          <div className="px-3 text-center shrink-0">
                            <div className="text-xs text-gray-500">{formatDate(match.match_date)}</div>
                            <div className="text-primary-400 font-semibold">VS</div>
                          </div>
                          <div className="flex items-center space-x-2 flex-1 min-w-0 justify-end">
                            <span className="text-white text-sm truncate">{match.team2_name}</span>
                            {renderFlag(match.team2_flag, match.team2_name)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Leaderboard */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span>Top 5</span>
                </h2>
                <Link to="/classement" className="text-primary-400 hover:text-primary-300 text-sm flex items-center">
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="card">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun joueur</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          index === 0 ? 'bg-yellow-500/10' :
                          index === 1 ? 'bg-gray-400/10' :
                          index === 2 ? 'bg-orange-500/10' : 'bg-white/5'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-500 text-white' : 'bg-white/10 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{player.name}</p>
                        </div>
                        <div className={`font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' : 'text-primary-400'
                        }`}>
                          {player.total_points || 0} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          {/* Tournaments */}
          {tournaments.length > 0 && (
            <motion.section 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span>Tournois</span>
                </h2>
                <Link to="/tournois" className="text-primary-400 hover:text-primary-300 text-sm flex items-center">
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {tournaments.map((tournament) => (
                  <Link key={tournament.id} to={`/tournois/${tournament.id}`} className="card hover:border-primary-500/50 transition-colors group">
                    <div className="flex items-center space-x-4">
                      {tournament.logo_url ? (
                        <img src={tournament.logo_url} alt={tournament.name} className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                          <Trophy className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold group-hover:text-primary-400 transition-colors truncate">{tournament.name}</h3>
                        <p className="text-sm text-gray-400">{tournament.match_count || 0} matchs</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-primary-400 transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

        </div>
      </div>
    </div>
  );
};

export default HomePage;
