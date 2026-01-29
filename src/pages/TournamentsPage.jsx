import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, ChevronRight, Users } from 'lucide-react';
import { tournamentsAPI } from '../api';

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await tournamentsAPI.getActive();
      setTournaments(res.data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl gradient-text">Tournois</h1>
          <p className="text-gray-400 mt-2">Découvrez les compétitions en cours</p>
        </div>

        {tournaments.length === 0 ? (
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun tournoi actif pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {tournaments.map((tournament) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:border-primary-500/50 transition-all cursor-pointer"
              >
                <Link to={`/tournois/${tournament.id}`}>
                  <div className="flex items-center space-x-6">
                    {/* Logo */}
                    {tournament.logo_url ? (
                      <img
                        src={tournament.logo_url}
                        alt={tournament.name}
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-white" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white">{tournament.name}</h2>
                      {tournament.description && (
                        <p className="text-gray-400 mt-1">{tournament.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        {tournament.start_date && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(tournament.start_date).toLocaleDateString('fr-FR')}
                              {tournament.end_date && ` - ${new Date(tournament.end_date).toLocaleDateString('fr-FR')}`}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{tournament.match_count || 0} matchs</span>
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentsPage;
