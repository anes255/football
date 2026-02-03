import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Award, ChevronRight, Clock, Globe } from 'lucide-react';
import { tournamentsAPI, matchesAPI, leaderboardAPI } from '../api';

const HomePage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
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
      setTournaments(tourRes.data.slice(0, 3));
      setUpcomingMatches(matchesRes.data.filter(m => m.status === 'upcoming').slice(0, 3));
      setLeaderboard(leaderRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-2xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-8 h-6 object-cover rounded" />;
    }
    return <span className="text-2xl">{flagUrl}</span>;
  };

  const getTimeRemaining = (matchDate) => {
    const diff = new Date(matchDate) - new Date();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}j ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
              <Globe className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="font-display text-5xl md:text-6xl gradient-text mb-4">
            Prediction World
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Faites vos pronostics sur les matchs de football et affrontez vos amis !
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/matchs" className="btn-primary">
              Voir les matchs
            </Link>
            <Link to="/classement" className="btn-secondary">
              Classement
            </Link>
          </div>
        </motion.div>

        {/* Active Tournaments */}
        {tournaments.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-primary-500" />
                <span>Tournois Actifs</span>
              </h2>
              <Link to="/tournois" className="text-primary-400 hover:text-primary-300 text-sm flex items-center">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {tournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournois/${tournament.id}`}
                  className="card hover:border-primary-500/50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    {tournament.logo_url ? (
                      <img src={tournament.logo_url} alt={tournament.name} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-white font-semibold">{tournament.name}</h3>
                      <p className="text-xs text-gray-400">{tournament.match_count || 0} matchs</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upcoming Matches */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span>Prochains Matchs</span>
              </h2>
              <Link to="/matchs" className="text-primary-400 hover:text-primary-300 text-sm flex items-center">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="card">
              {upcomingMatches.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Aucun match à venir</p>
              ) : (
                <div className="space-y-4">
                  {upcomingMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-2 flex-1">
                        {renderFlag(match.team1_flag, match.team1_name)}
                        <span className="text-white text-sm font-medium truncate">{match.team1_name}</span>
                      </div>
                      <div className="px-3 text-center">
                        <div className="text-xs text-primary-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeRemaining(match.match_date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-1 justify-end">
                        <span className="text-white text-sm font-medium truncate">{match.team2_name}</span>
                        {renderFlag(match.team2_flag, match.team2_name)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>

          {/* Leaderboard */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span>Top Joueurs</span>
              </h2>
              <Link to="/classement" className="text-primary-400 hover:text-primary-300 text-sm flex items-center">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="card">
              {leaderboard.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Aucun classement</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-white/10 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-white font-medium">{user.name}</span>
                      </div>
                      <span className="text-primary-400 font-bold">{user.total_points} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
