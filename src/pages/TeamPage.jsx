import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flag, Search, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { teamsAPI } from '../api';

const TeamsPage = () => {
  const [teamsByTournament, setTeamsByTournament] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTournaments, setExpandedTournaments] = useState({});

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    try {
      const res = await teamsAPI.getByTournament();
      setTeamsByTournament(res.data || []);
      // Auto-expand all tournaments
      const expanded = {};
      (res.data || []).forEach(t => { expanded[t.tournament_id] = true; });
      setExpandedTournaments(expanded);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-2xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) return <img src={flagUrl} alt={name} className="w-10 h-7 object-cover rounded" />;
    return <span className="text-2xl">{flagUrl}</span>;
  };

  const toggleTournament = (id) => {
    setExpandedTournaments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Group data by tournament, then by group
  const tournaments = {};
  teamsByTournament
    .filter(t => !searchTerm || t.team_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .forEach(row => {
      if (!tournaments[row.tournament_id]) {
        tournaments[row.tournament_id] = {
          id: row.tournament_id,
          name: row.tournament_name,
          logo: row.tournament_logo,
          is_active: row.is_active,
          groups: {}
        };
      }
      const groupName = row.group_name || 'Autres';
      if (!tournaments[row.tournament_id].groups[groupName]) {
        tournaments[row.tournament_id].groups[groupName] = [];
      }
      tournaments[row.tournament_id].groups[groupName].push(row);
    });

  const tournamentList = Object.values(tournaments);

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
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl gradient-text">Équipes</h1>
          <p className="text-gray-400 mt-2">Équipes par tournoi et groupes</p>
        </div>

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

        {tournamentList.length === 0 ? (
          <div className="card text-center py-12">
            <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{searchTerm ? `Aucune équipe trouvée pour "${searchTerm}"` : 'Aucune équipe dans les tournois'}</p>
          </div>
        ) : (
          tournamentList.map((tournament, tIndex) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tIndex * 0.1 }}
              className="mb-8"
            >
              {/* Tournament Header */}
              <button
                onClick={() => toggleTournament(tournament.id)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-xl mb-4 hover:bg-primary-500/20 transition-all"
              >
                <div className="flex items-center space-x-3">
                  {tournament.logo ? (
                    <img src={tournament.logo} alt={tournament.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  )}
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-white">{tournament.name}</h2>
                    <p className="text-xs text-gray-400">{Object.values(tournament.groups).flat().length} équipes • {Object.keys(tournament.groups).length} groupes</p>
                  </div>
                  {tournament.is_active && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Actif</span>}
                </div>
                {expandedTournaments[tournament.id] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {/* Groups */}
              {expandedTournaments[tournament.id] && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.keys(tournament.groups).sort().map(groupName => (
                    <div key={groupName} className="card">
                      <h3 className="text-sm font-bold text-primary-400 mb-3 border-b border-white/10 pb-2">
                        {groupName === 'Autres' ? 'Autres' : `Groupe ${groupName}`}
                      </h3>
                      <div className="space-y-2">
                        {tournament.groups[groupName].map(team => (
                          <Link
                            key={team.team_id}
                            to={`/equipe/${team.team_id}`}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-all"
                          >
                            {renderFlag(team.flag_url, team.team_name)}
                            <div>
                              <p className="text-white text-sm font-medium">{team.team_name}</p>
                              {team.team_code && <p className="text-xs text-gray-500">{team.team_code}</p>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
