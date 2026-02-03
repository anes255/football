import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flag, Search, ChevronRight } from 'lucide-react';
import { teamsAPI } from '../api';

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await teamsAPI.getAll();
      setTeams(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-3xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-12 h-8 object-cover rounded" />;
    }
    return <span className="text-3xl">{flagUrl}</span>;
  };

  // Filter and group teams
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTeams = filteredTeams.reduce((acc, team) => {
    const group = team.group_name || 'Autres';
    if (!acc[group]) acc[group] = [];
    acc[group].push(team);
    return acc;
  }, {});

  const sortedGroups = Object.keys(groupedTeams).sort();

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl gradient-text">Équipes</h1>
          <p className="text-gray-400 mt-2">Découvrez toutes les équipes et leurs matchs</p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une équipe..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        {teams.length === 0 ? (
          <div className="card text-center py-12">
            <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucune équipe disponible</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="card text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucune équipe trouvée pour "{searchTerm}"</p>
          </div>
        ) : (
          sortedGroups.map((group, groupIndex) => (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="mb-8"
            >
              <h2 className="text-lg font-bold text-white mb-4">
                {group === 'Autres' ? 'Autres équipes' : `Groupe ${group}`}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedTeams[group].map((team) => (
                  <Link
                    key={team.id}
                    to={`/equipe/${team.id}`}
                    className="card hover:border-primary-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {renderFlag(team.flag_url, team.name)}
                        <div>
                          <h3 className="text-white font-semibold group-hover:text-primary-400 transition-colors">
                            {team.name}
                          </h3>
                          {team.code && (
                            <p className="text-xs text-gray-500">{team.code}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
