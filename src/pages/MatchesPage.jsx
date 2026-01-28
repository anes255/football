import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Check, Lock } from 'lucide-react';
import { matchesAPI, predictionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MatchesPage = () => {
  const { isAuthenticated } = useAuth();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [savingMatch, setSavingMatch] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const matchesRes = await matchesAPI.getAll();
      setMatches(matchesRes.data);
      if (isAuthenticated) {
        const predictionsRes = await predictionsAPI.getMyPredictions();
        const map = {};
        predictionsRes.data.forEach(p => { map[p.match_id] = { team1_score: p.team1_score, team2_score: p.team2_score, points_earned: p.points_earned }; });
        setPredictions(map);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleChange = (matchId, team, value) => {
    const num = parseInt(value) || 0;
    if (num < 0) return;
    setPredictions(prev => ({ ...prev, [matchId]: { ...prev[matchId], [team]: num } }));
  };

  const savePrediction = async (matchId) => {
    const p = predictions[matchId];
    if (p?.team1_score === undefined || p?.team2_score === undefined) { toast.error('Entrez les deux scores'); return; }
    setSavingMatch(matchId);
    try {
      await predictionsAPI.makePrediction({ match_id: matchId, team1_score: p.team1_score, team2_score: p.team2_score });
      toast.success('Pronostic enregistré !');
    } catch (error) { toast.error(error.response?.data?.error || 'Erreur'); }
    finally { setSavingMatch(null); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const canPredict = (m) => m.status === 'upcoming' && new Date(m.match_date) > new Date();
  const filteredMatches = matches.filter(m => filter === 'all' || m.status === filter);

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl gradient-text tracking-wider mb-2">Matchs</h1>
          <p className="text-gray-400">Faites vos pronostics</p>
        </div>
        <div className="flex justify-center space-x-2 mb-8">
          {[{ value: 'all', label: 'Tous' }, { value: 'upcoming', label: 'À venir' }, { value: 'live', label: 'En cours' }, { value: 'completed', label: 'Terminés' }].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={`px-4 py-2 rounded-lg transition-all duration-300 ${filter === f.value ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{f.label}</button>
          ))}
        </div>
        <div className="space-y-4">
          {filteredMatches.length > 0 ? filteredMatches.map((match, i) => (
            <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`card ${match.status === 'completed' ? 'border-green-500/30' : match.status === 'live' ? 'border-red-500/30 animate-pulse-glow' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400"><Calendar className="w-4 h-4" /><span>{formatDate(match.match_date)}</span></div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${match.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' : match.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{match.status === 'upcoming' ? 'À venir' : match.status === 'live' ? 'En cours' : 'Terminé'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center"><div className="w-14 h-14 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center text-3xl">{match.team1_flag || '🏳️'}</div><p className="font-semibold text-white text-sm">{match.team1_name}</p></div>
                <div className="flex-1 flex flex-col items-center">
                  {match.status === 'completed' ? (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{match.team1_score} - {match.team2_score}</div>
                      {predictions[match.id] && <div className="mt-2 text-sm"><span className="text-gray-400">Votre prono: </span><span className="text-primary-500 font-semibold">{predictions[match.id].team1_score} - {predictions[match.id].team2_score}</span>{predictions[match.id].points_earned > 0 && <span className="ml-2 text-green-500">+{predictions[match.id].points_earned} pts</span>}</div>}
                    </div>
                  ) : isAuthenticated && canPredict(match) ? (
                    <div className="flex items-center space-x-2">
                      <input type="number" min="0" value={predictions[match.id]?.team1_score ?? ''} onChange={(e) => handleChange(match.id, 'team1_score', e.target.value)} className="w-14 h-14 text-center text-2xl font-bold bg-dark-200/50 border border-white/10 rounded-lg focus:border-primary-500 focus:outline-none" placeholder="-" />
                      <span className="text-2xl font-display text-gray-500">-</span>
                      <input type="number" min="0" value={predictions[match.id]?.team2_score ?? ''} onChange={(e) => handleChange(match.id, 'team2_score', e.target.value)} className="w-14 h-14 text-center text-2xl font-bold bg-dark-200/50 border border-white/10 rounded-lg focus:border-primary-500 focus:outline-none" placeholder="-" />
                    </div>
                  ) : <div className="flex items-center space-x-2 text-gray-500"><Lock className="w-5 h-5" /><span className="text-sm">{!isAuthenticated ? 'Connectez-vous' : 'Fermé'}</span></div>}
                </div>
                <div className="flex-1 text-center"><div className="w-14 h-14 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center text-3xl">{match.team2_flag || '🏳️'}</div><p className="font-semibold text-white text-sm">{match.team2_name}</p></div>
              </div>
              {isAuthenticated && canPredict(match) && <div className="mt-4 text-center"><button onClick={() => savePrediction(match.id)} disabled={savingMatch === match.id} className="btn-primary px-6 py-2 text-sm">{savingMatch === match.id ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><Check className="w-4 h-4 inline mr-1" />Valider</>}</button></div>}
              <div className="mt-4 text-center"><span className="text-xs text-gray-500">{match.stage}</span></div>
            </motion.div>
          )) : <div className="card text-center py-12"><Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" /><p className="text-gray-400">Aucun match trouvé</p></div>}
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;
