import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flag, Search, Trophy, ChevronRight } from 'lucide-react';
import { tournamentsAPI } from '../api';

const TeamsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentTeams, setTournamentTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await tournamentsAPI.getAll();
        const list = res.data || [];
        setTournaments(list);
        // Auto-select first active tournament
        const active = list.find(t => t.is_active) || list[0];
        if (active) selectTournament(active);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchTournaments();
  }, []);

  const selectTournament = async (tournament) => {
    setSelectedTournament(tournament);
    setTeamsLoading(true);
    setSearchTerm('');
    try {
      const res = await tournamentsAPI.getTeams(tournament.id);
      setTournamentTeams(res.data || []);
    } catch (e) { console.error(e); setTournamentTeams([]); }
    finally { setTeamsLoading(false); }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-2xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http'))
      return <img src={flagUrl} alt={name} className="w-10 h-7 object-cover rounded" />;
    return <span className="text-2xl">{flagUrl}</span>;
  };

  // Group teams by group_name
  const filtered = tournamentTeams.filter(t =>
    !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const groups = {};
  filtered.forEach(t => {
    const g = t.group_name || 'Autres';
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  });
  const sortedGroups = Object.keys(groups).sort();

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
        <div className="text-center mb-6">
          <h1 className="font-display text-4xl gradient-text">Équipes</h1>
          <p className="text-gray-400 mt-2">Sélectionnez un tournoi pour voir ses équipes</p>
        </div>

        {/* Tournament Selector */}
        <div className="flex justify-center mb-6">
          <select
            value={selectedTournament?.id || ''}
            onChange={(e) => {
              const t = tournaments.find(t => t.id.toString() === e.target.value);
              if (t) selectTournament(t);
            }}
            className="bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-500 min-w-[200px]"
          >
            <option value="" disabled>Sélectionner un tournoi</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}{t.is_active ? ' ●' : ''}</option>
            ))}
          </select>
        </div>

        {tournaments.length === 0 && (
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun tournoi disponible</p>
          </div>
        )}

        {selectedTournament && (
          <>
            {/* Tournament Info Bar */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-xl mb-6">
              <div className="flex items-center space-x-3">
                {selectedTournament.logo_url ? (
                  <img src={selectedTournament.logo_url} alt={selectedTournament.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <Trophy className="w-8 h-8 text-yellow-500" />
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedTournament.name}</h2>
                  <p className="text-xs text-gray-400">{tournamentTeams.length} équipes • {sortedGroups.length} groupe{sortedGroups.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <Link
                to={`/tournois/${selectedTournament.id}`}
                className="text-primary-400 hover:text-primary-300 text-sm flex items-center"
              >
                Voir tournoi <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Search */}
            {tournamentTeams.length > 0 && (
              <div className="relative mb-6 max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une équipe..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            )}

            {/* Teams Grid */}
            {teamsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
              </div>
            ) : tournamentTeams.length === 0 ? (
              <div className="card text-center py-12">
                <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aucune équipe dans ce tournoi</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aucune équipe trouvée pour "{searchTerm}"</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedGroups.map((groupName, gIndex) => (
                  <motion.div
                    key={groupName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gIndex * 0.05 }}
                    className="card"
                  >
                    <h3 className="text-sm font-bold text-primary-400 mb-3 border-b border-white/10 pb-2">
                      {groupName === 'Autres' ? 'Autres' : `Groupe ${groupName}`}
                    </h3>
                    <div className="space-y-2">
                      {groups[groupName].map(team => (
                        <Link
                          key={team.team_id || team.id}
                          to={`/equipes/${team.team_id || team.id}`}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-all group"
                        >
                          {renderFlag(team.flag_url, team.name)}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium group-hover:text-primary-400 transition-colors truncate">{team.name}</p>
                            {team.code && <p className="text-xs text-gray-500">{team.code}</p>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
