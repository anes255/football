import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, ChevronRight, Search } from 'lucide-react';
import { tournamentsAPI } from '../api';

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await tournamentsAPI.getAll();
      setTournaments(res.data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search tournaments
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && tournament.is_active) || 
      (filter === 'inactive' && !tournament.is_active);
    return matchesSearch && matchesFilter;
  });

  // Separate active and inactive tournaments
  const activeTournaments = filteredTournaments.filter(t => t.is_active);
  const inactiveTournaments = filteredTournaments.filter(t => !t.is_active);

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
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 mb-4"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="font-display text-4xl gradient-text">Tournois</h1>
          <p className="text-gray-400 mt-2">Découvrez tous les tournois et participez aux pronostics</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un tournoi..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex space-x-2">
            {['all', 'active', 'inactive'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-primary-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Terminés'}
              </button>
            ))}
          </div>
        </div>

        {/* Active Tournaments */}
        {activeTournaments.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Tournois Actifs</span>
            </h2>
            <div className="grid gap-4">
              {activeTournaments.map((tournament, index) => (
                <TournamentCard key={tournament.id} tournament={tournament} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Inactive Tournaments */}
        {inactiveTournaments.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
              <span>Tournois Passés</span>
            </h2>
            <div className="grid gap-4">
              {inactiveTournaments.map((tournament, index) => (
                <TournamentCard key={tournament.id} tournament={tournament} index={index} inactive />
              ))}
            </div>
          </section>
        )}

        {/* No Tournaments */}
        {filteredTournaments.length === 0 && (
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm ? `Aucun tournoi trouvé pour "${searchTerm}"` : 'Aucun tournoi disponible'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const TournamentCard = ({ tournament, index, inactive }) => {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/tournois/${tournament.id}`}
        className={`card hover:border-primary-500/50 transition-all group block ${inactive ? 'opacity-70' : ''}`}
      >
        <div className="flex items-center space-x-4">
          {/* Logo */}
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors truncate">
                {tournament.name}
              </h3>
              {!tournament.is_active ? (
                <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-1 rounded-full">
                  Terminé
                </span>
              ) : tournament.has_started ? (
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                  En cours
                </span>
              ) : (
                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                  Pas commencé
                </span>
              )}
            </div>
            
            {tournament.description && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-1">{tournament.description}</p>
            )}
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {tournament.start_date && formatDate(tournament.start_date)}
                  {tournament.end_date && ` - ${formatDate(tournament.end_date)}`}
                </span>
              </span>
              {tournament.match_count !== undefined && (
                <span>{tournament.match_count} matchs</span>
              )}
              {tournament.team_count !== undefined && (
                <span>{tournament.team_count} équipes</span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-primary-400 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
};

export default TournamentsPage;
