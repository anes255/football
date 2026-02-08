import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Save, Target, Trophy, User } from 'lucide-react';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminScoring = () => {
  const [rules, setRules] = useState({ exact_score: 3, correct_winner: 2, correct_draw: 3, tournament_winner: 5, best_player: 7, best_goal_scorer: 7 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRules(); }, []);
  
  const fetchRules = async () => { 
    try { 
      const r = await adminAPI.getScoringRules(); 
      const obj = {}; 
      r.data.forEach(rule => { obj[rule.rule_type] = rule.points; }); 
      setRules({ 
        exact_score: obj.exact_score || 3, 
        correct_winner: obj.correct_winner || 2, 
        correct_draw: obj.correct_draw || 3, 
        tournament_winner: obj.tournament_winner || 5,
        best_player: obj.best_player || 7,
        best_goal_scorer: obj.best_goal_scorer || 7
      }); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  const handleSave = async () => { 
    setSaving(true); 
    try { 
      await adminAPI.updateScoringRules(rules); 
      toast.success('Règles mises à jour !'); 
    } catch (e) { 
      toast.error('Erreur'); 
    } finally { 
      setSaving(false); 
    } 
  };

  const ruleCards = [
    { key: 'exact_score', label: 'Score Exact', description: 'Le pronostic correspond exactement au résultat', icon: Target, color: 'green' },
    { key: 'correct_winner', label: 'Vainqueur Correct', description: 'Le bon vainqueur est prédit', icon: Award, color: 'blue' },
    { key: 'correct_draw', label: 'Match Nul Correct', description: 'Un match nul est correctement prédit', icon: Award, color: 'purple' },
    { key: 'tournament_winner', label: 'Vainqueur du Tournoi', description: 'Bonus si l\'équipe prédite remporte le tournoi', icon: Trophy, color: 'yellow' },
    { key: 'best_player', label: 'Meilleur Joueur', description: 'Bonus si le meilleur joueur prédit est le bon', icon: User, color: 'cyan' },
    { key: 'best_goal_scorer', label: 'Meilleur Buteur', description: 'Bonus si le meilleur buteur prédit est le bon', icon: Target, color: 'red' }
  ];

  const getColorClasses = (color) => {
    const map = {
      green: { bg: 'bg-green-500/20', text: 'text-green-500' },
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-500' },
      yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
      cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-500' },
      red: { bg: 'bg-red-500/20', text: 'text-red-500' }
    };
    return map[color] || map.blue;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl gradient-text tracking-wider">Règles de Scoring</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2">
          {saving ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Save className="w-5 h-5" /><span>Sauvegarder</span></>}
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ruleCards.map((rule, i) => {
            const colors = getColorClasses(rule.color);
            return (
              <motion.div key={rule.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <rule.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{rule.label}</h3>
                    <p className="text-sm text-gray-400 mb-4">{rule.description}</p>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="number" 
                        min="0" 
                        value={rules[rule.key]} 
                        onChange={(e) => setRules({ ...rules, [rule.key]: parseInt(e.target.value) || 0 })} 
                        className="w-24 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white text-center text-xl font-bold focus:outline-none focus:border-primary-500" 
                      />
                      <span className="text-gray-400">points</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card mt-8">
        <h2 className="font-display text-2xl text-white mb-4">Aperçu des points</h2>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-gray-300 mb-2">Exemple: Match <span className="text-white font-semibold">Équipe A 2 - 1 Équipe B</span></p>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-400">Pronostic 2-1 (score exact)</span>
              <span className="text-green-500 font-bold">+{rules.exact_score} pts</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">Pronostic 1-0 (bon vainqueur)</span>
              <span className="text-blue-500 font-bold">+{rules.correct_winner} pts</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">Pronostic 0-1 (mauvais)</span>
              <span className="text-red-500 font-bold">0 pt</span>
            </li>
          </ul>
          <div className="border-t border-white/10 mt-3 pt-3">
            <p className="text-gray-300 mb-2">Prédictions de tournoi</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-400">Vainqueur du tournoi correct</span>
                <span className="text-yellow-500 font-bold">+{rules.tournament_winner} pts</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Meilleur joueur correct</span>
                <span className="text-cyan-500 font-bold">+{rules.best_player} pts</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Meilleur buteur correct</span>
                <span className="text-red-500 font-bold">+{rules.best_goal_scorer} pts</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminScoring;
