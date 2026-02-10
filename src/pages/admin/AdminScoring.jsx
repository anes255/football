import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Save, Trophy, User, Target, Info } from 'lucide-react';
import { adminAPI, tournamentsAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminScoring = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('global');
  const [scoringRules, setScoringRules] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await tournamentsAPI.getAll();
        setTournaments(res.data || []);
      } catch (e) { console.error(e); }
    };
    fetchTournaments();
  }, []);

  useEffect(() => { fetchRules(); }, [selectedTournament]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      if (selectedTournament === 'global') {
        const res = await adminAPI.getScoringRules();
        const obj = {};
        (res.data || []).forEach(r => { obj[r.rule_type] = r.points; });
        setScoringRules(obj);
      } else {
        const res = await tournamentsAPI.getScoringRules(selectedTournament);
        setScoringRules(res.data || {});
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRuleChange = (ruleType, value) => {
    setScoringRules({ ...scoringRules, [ruleType]: parseInt(value) || 0 });
  };

  const saveRules = async () => {
    setSaving(true);
    try {
      if (selectedTournament === 'global') {
        await adminAPI.updateScoringRules(scoringRules);
      } else {
        await adminAPI.updateTournamentScoringRules(selectedTournament, scoringRules);
      }
      toast.success('Règles sauvegardées');
    } catch (e) { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const ruleLabels = {
    exact_score: { label: 'Score exact', desc: 'Les deux scores parfaitement prédits', example: '2-1 → 2-1', color: 'text-green-400' },
    correct_winner: { label: 'Bon vainqueur', desc: 'Bonne équipe gagnante, score inexact', example: '3-0 prédit, 2-1 réel', color: 'text-yellow-400' },
    correct_draw: { label: 'Match nul correct', desc: 'Nul prédit et résultat nul', example: '1-1 prédit, 0-0 réel', color: 'text-yellow-400' },
    correct_goal_diff: { label: 'Bonne diff. de buts', desc: 'Bonus si différence de buts correcte', example: '2-0 prédit, 3-1 réel', color: 'text-blue-400' },
    one_team_goals: { label: 'Buts d\'une équipe', desc: 'Bonus par équipe avec buts corrects', example: '2-1 prédit, 2-0 réel', color: 'text-blue-400' },
    tournament_winner: { label: 'Vainqueur tournoi', desc: 'Prédiction correcte du vainqueur', example: '', color: 'text-yellow-400' },
    best_player: { label: 'Meilleur joueur', desc: 'Prédiction correcte meilleur joueur', example: '', color: 'text-cyan-400' },
    best_goal_scorer: { label: 'Meilleur buteur', desc: 'Prédiction correcte meilleur buteur', example: '', color: 'text-red-400' },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
          <Award className="w-8 h-8 text-yellow-500" /><span>Scoring</span>
        </h1>
      </div>

      {/* Tournament Selector */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-blue-400" />
          <p className="text-sm text-gray-400">Chaque tournoi peut avoir son propre système de points. Les règles globales servent de valeurs par défaut.</p>
        </div>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white"
        >
          <option value="global">🌐 Règles globales (par défaut)</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>🏆 {t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div></div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {selectedTournament === 'global' ? 'Règles globales' : tournaments.find(t => t.id.toString() === selectedTournament)?.name || 'Tournoi'}
            </h2>
            <button onClick={saveRules} disabled={saving} className="btn-primary text-sm flex items-center space-x-2">
              <Save className="w-4 h-4" /><span>Sauvegarder</span>
            </button>
          </div>

          <div className="space-y-3">
            {Object.keys(ruleLabels).map(ruleType => (
              <div key={ruleType} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex-1">
                  <p className={`font-medium ${ruleLabels[ruleType].color}`}>{ruleLabels[ruleType].label}</p>
                  <p className="text-sm text-gray-400">{ruleLabels[ruleType].desc}</p>
                  {ruleLabels[ruleType].example && <p className="text-xs text-gray-500 mt-1">Ex: {ruleLabels[ruleType].example}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <input type="number" min="0" max="50" value={scoringRules[ruleType] || 0} onChange={(e) => handleRuleChange(ruleType, e.target.value)} className="w-20 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-center" />
                  <span className="text-gray-400 text-sm">pts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Example */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <h3 className="text-blue-400 font-medium mb-2">Exemple de calcul</h3>
            <p className="text-sm text-gray-400">Match réel: <span className="text-white">France 2-1 Maroc</span></p>
            <div className="text-sm text-gray-400 mt-2 space-y-1">
              <p>• Prono <span className="text-green-400">2-1</span> = {scoringRules.exact_score || 0} pts (score exact)</p>
              <p>• Prono <span className="text-yellow-400">3-2</span> = {(scoringRules.correct_winner || 0) + (scoringRules.correct_goal_diff || 0)} pts (bon vainqueur + même diff)</p>
              <p>• Prono <span className="text-yellow-400">2-0</span> = {(scoringRules.correct_winner || 0) + (scoringRules.one_team_goals || 0)} pts (bon vainqueur + buts équipe 1)</p>
              <p>• Prono <span className="text-red-400">0-2</span> = 0 pts (mauvais vainqueur)</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminScoring;
