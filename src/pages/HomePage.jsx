import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Award, ArrowRight, Globe } from 'lucide-react';
import { tournamentsAPI, matchesAPI, leaderboardAPI } from '../api';

const HomePage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tourRes, matchesRes, leaderRes] = await Promise.all([
        tournamentsAPI.getActive(),
        matchesAPI.getVisible(),
        leaderboardAPI.getAll()
      ]);
      setTournaments(tourRes.data.slice(0, 2));
      setUpcomingMatches(matchesRes.data.filter(m => m.status === 'upcoming').slice(0, 3));
      setTopPlayers(leaderRes.data.slice(0, 3));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-gray-900 to-accent-600/20"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative pt-32 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 shadow-2xl shadow-primary-500/30">
                <Globe className="w-14 h-14 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-display text-5xl md:text-7xl mb-4"
            >
              <span className="gradient-text">Prediction</span>
              <span className="text-white">World</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10"
            >
              Pronostiquez les résultats des matchs de football et défiez vos amis pour devenir le meilleur !
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/matchs"
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2"
              >
                <Calendar className="w-5 h-5" />
                <span>Voir les matchs</span>
              </Link>
              <Link
                to="/classement"
                className="btn-secondary text-lg px-8 py-4 flex items-center justify-center space-x-2"
              >
                <Award className="w-5 h-5" />
                <span>Classement</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 pb-16 -mt-4">
        <div className="max-w-6xl mx-auto">
          {/* Tournaments */}
          {tournaments.length > 0 && (
            <motion.section
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <span>Tournois en cours</span>
                </h2>
                <Link to="/tournois" className="text-primary-400 hover:text-primary-300 flex items-center space-x-1 text-sm">
                  <span>Tous les tournois</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {tournaments.map((tournament, index) => (
                  <Link
                    key={tournament.id}
                    to={`/tournois/${tournament.id}`}
                    className="group"
                  >
                    <div className="card border-2 border-transparent hover:border-primary-500/50 transition-all duration-300 h-full">
                      <div className="flex items-center space-x-4">
                        {tournament.logo_url ? (
                          <img
                            src={tournament.logo_url}
                            alt={tournament.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                            {tournament.name}
                          </h3>
                          <p className="text-gray-400 text-sm">{tournament.match_count || 0} matchs</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-primary-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Upcoming Matches - Takes 3 columns */}
            <motion.section
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-3"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-blue-500" />
                  <span>Prochains matchs</span>
                </h2>
                <Link to="/matchs" className="text-primary-400 hover:text-primary-300 flex items-center space-x-1 text-sm">
                  <span>Tous les matchs</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="card">
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Aucun match à venir</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {upcomingMatches.map((match) => (
                      <div key={match.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            {renderFlag(match.team1_flag, match.team1_name)}
                            <span className="text-white font-medium">{match.team1_name}</span>
                          </div>
                          <div className="px-4">
                            <span className="text-xs text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full">
                              {new Date(match.match_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 flex-1 justify-end">
                            <span className="text-white font-medium">{match.team2_name}</span>
                            {renderFlag(match.team2_flag, match.team2_name)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Top Players - Takes 2 columns */}
            <motion.section
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <span>Top 3</span>
                </h2>
                <Link to="/classement" className="text-primary-400 hover:text-primary-300 flex items-center space-x-1 text-sm">
                  <span>Voir tout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="card">
                {topPlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Pas encore de classement</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topPlayers.map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center space-x-4 p-3 rounded-xl ${
                          index === 0 ? 'bg-yellow-500/10' :
                          index === 1 ? 'bg-gray-400/10' :
                          'bg-orange-500/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          'bg-orange-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{player.name}</p>
                          <p className="text-xs text-gray-400">{player.correct_predictions || 0} bons pronos</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            'text-orange-400'
                          }`}>
                            {player.total_points}
                          </p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
