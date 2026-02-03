import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, ChevronRight, Award, Clock, Flag } from 'lucide-react';
import { tournamentsAPI, matchesAPI, leaderboardAPI, teamsAPI } from '../api';

const HomePage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tourRes, matchesRes, leaderRes, teamsRes] = await Promise.all([
        tournamentsAPI.getActive(),
        matchesAPI.getVisible(),
        leaderboardAPI.getAll(),
        teamsAPI.getAll()
      ]);
      setTournaments(tourRes.data);
      setUpcomingMatches(matchesRes.data.filter(m => m.status === 'upcoming').slice(0, 3));
      setLeaderboard(leaderRes.data.slice(0, 5));
      setTeams(teamsRes.data);
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
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-5xl md:text-6xl gradient-text mb-4">
            Prediction World
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Faites vos pronostics sur les matchs de football et affrontez vos amis !
          </p>
          <div className="flex justify-center space-x-4 mt-6">
            <Link to="/matchs" className="btn-primary">
              Voir les matchs
            </Link>
            <Link to="/classement" className="btn-secondary">
              Classement
            </Link>
          </div>
        </motion.div>

        {/* Tournaments Section */}
        {tournaments.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-primary-500" />
                <span>Tournois Actifs</span>
              </h2>
              <Link to="/tournois" className="text-primary-400 hover:text-primary-300 flex items-center">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournois/${tournament.id}`}
                  className="card hover:border-primary-500/50 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    {tournament.logo_url ? (
                      <img src={tournament.logo_url} alt={tournament.name} className="w-16 h-16 object-cover rounded-xl" />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-bold group-hover:text-primary-400 transition-colors">
                        {tournament.name}
                      </h3>
                      <p className="text-sm text-gray-400">{tournament.match_count || 0} matchs</p>
                      {tournament.start_date && (
                        <p className="text-xs text-gray-500">
                          {new Date(tournament.start_date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-400" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-primary-500" />
                <span>Prochains Matchs</span>
              </h2>
              <Link to="/matchs" className="text-primary-400 hover:text-primary-300 flex items-center">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {upcomingMatches.map((match) => (
                <Link key={match.id} to="/matchs" className="card hover:border-primary-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {renderFlag(match.team1_flag, match.team1_name)}
                        <span className="text-white font-semibold">{match.team1_name}</span>
                      </div>
                      <span className="text-gray-500">VS</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-semibold">{match.team2_name}</span>
                        {renderFlag(match.team2_flag, match.team2_name)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-primary-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">{getTimeRemaining(match.match_date)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(match.match_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Leaderboard Preview */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Award className="w-6 h-6 text-yellow-500" />
                <span>Top Joueurs</span>
              </h2>
              <Link to="/classement" className="text-primary-400 hover:text-primary-300 flex items-center">
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
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

          {/* Teams Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Flag className="w-6 h-6 text-green-500" />
                <span>Équipes</span>
              </h2>
            </div>
            <div className="card max-h-[320px] overflow-y-auto">
              {teams.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Aucune équipe</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {teams.map((team) => (
                    <Link
                      key={team.id}
                      to={`/equipe/${team.id}`}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {renderFlag(team.flag_url, team.name)}
                      <span className="text-white text-sm truncate">{team.name}</span>
                    </Link>
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
