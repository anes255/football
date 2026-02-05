import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { adminAPI, matchesAPI, teamsAPI, leaderboardAPI } from '../../api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, matches: 0, teams: 0, predictions: 0 });
  const [topUsers, setTopUsers] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [usersRes, matchesRes, teamsRes, leaderboardRes] = await Promise.all([
        adminAPI.getUsers(), 
        matchesAPI.getAll(), 
        teamsAPI.getAll(), 
        leaderboardAPI.getAll()
      ]);
      setStats({ 
        users: usersRes.data.length, 
        matches: matchesRes.data.length, 
        teams: teamsRes.data.length, 
        predictions: usersRes.data.reduce((s, u) => s + (u.total_predictions || 0), 0) 
      });
      setTopUsers(leaderboardRes.data.slice(0, 5));
      setRecentMatches(matchesRes.data.slice(0, 5));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const statCards = [
    { label: 'Utilisateurs', value: stats.users, icon: Users, color: 'bg-blue-500' },
    { label: 'Matchs', value: stats.matches, icon: Calendar, color: 'bg-green-500' },
    { label: 'Équipes', value: stats.teams, icon: Trophy, color: 'bg-yellow-500' },
    { label: 'Pronostics', value: stats.predictions, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-8">
        <h1 className="font-display text-4xl gradient-text tracking-wider mb-8">Dashboard</h1>
        {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" /></div> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card">
                  <div className="flex items-center space-x-4"><div className={`p-3 rounded-xl ${stat.color}`}><stat.icon className="w-6 h-6 text-white" /></div><div><p className="text-3xl font-bold text-white">{stat.value}</p><p className="text-gray-400">{stat.label}</p></div></div>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
                <h2 className="font-display text-2xl text-white mb-4 tracking-wider">Top 5 Utilisateurs</h2>
                <div className="space-y-3">
                  {topUsers.map((u, i) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center space-x-3"><span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-white/10'}`}>{i + 1}</span><span className="text-white">{u.name}</span></div>
                      <span className="font-bold gradient-text">{u.total_points} pts</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
                <h2 className="font-display text-2xl text-white mb-4 tracking-wider">Matchs Récents</h2>
                <div className="space-y-3">
                  {recentMatches.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center space-x-2"><span className="text-white">{m.team1_name}</span><span className="text-gray-400">vs</span><span className="text-white">{m.team2_name}</span></div>
                      <span className={`text-xs px-2 py-1 rounded ${m.status === 'completed' ? 'bg-green-500/20 text-green-400' : m.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{m.status === 'completed' ? 'Terminé' : m.status === 'live' ? 'En cours' : 'À venir'}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
  );
};

export default AdminDashboard;
