import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Palette, Trophy, Save, RefreshCw } from 'lucide-react';
import { adminAPI, teamsAPI, tournamentsAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [scoringRules, setScoringRules] = useState({});
  const [colors, setColors] = useState({
    primary_color: '#6366f1',
    accent_color: '#8b5cf6',
    bg_color: '#0f172a',
    card_color: '#1e293b'
  });
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedWinner, setSelectedWinner] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, settingsRes, teamsRes, tournamentsRes] = await Promise.all([
        adminAPI.getScoringRules(),
        adminAPI.getSettings(),
        teamsAPI.getAll(),
        tournamentsAPI.getAll()
      ]);
      
      const rulesObj = {};
      rulesRes.data.forEach(r => { rulesObj[r.rule_type] = r.points; });
      setScoringRules(rulesObj);
      setColors({ ...colors, ...settingsRes.data });
      setTeams(teamsRes.data);
      setTournaments(tournamentsRes.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRuleChange = (ruleType, value) => {
    setScoringRules({ ...scoringRules, [ruleType]: parseInt(value) || 0 });
  };

  const handleColorChange = (key, value) => {
    setColors({ ...colors, [key]: value });
  };

  const saveScoringRules = async () => {
    setSaving(true);
    try {
      await adminAPI.updateScoringRules(scoringRules);
      toast.success('Règles de points mises à jour');
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const saveColors = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(colors);
      toast.success('Couleurs mises à jour');
      applyColors(colors);
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const applyColors = (colorSettings) => {
    const root = document.documentElement;
    if (colorSettings.primary_color) {
      root.style.setProperty('--color-primary-500', colorSettings.primary_color);
    }
    if (colorSettings.accent_color) {
      root.style.setProperty('--color-accent-500', colorSettings.accent_color);
    }
    if (colorSettings.bg_color) {
      root.style.setProperty('--color-bg', colorSettings.bg_color);
    }
  };

  const awardTournamentWinner = async () => {
    if (!selectedTournament || !selectedWinner) {
      toast.error('Sélectionnez un tournoi et une équipe');
      return;
    }
    try {
      const res = await adminAPI.awardTournamentWinner({ 
        tournament_id: parseInt(selectedTournament), 
        team_id: parseInt(selectedWinner) 
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const ruleLabels = {
    exact_score: { label: 'Score exact', description: 'Les deux scores sont parfaitement prédits (ex: 2-1 → 2-1)', example: '2-1 → 2-1' },
    correct_winner: { label: 'Bon vainqueur', description: 'La bonne équipe gagnante est prédite mais pas le score exact', example: '3-0 prédit, 2-1 réel' },
    correct_draw: { label: 'Match nul correct', description: 'Un match nul est prédit et le résultat est un nul', example: '1-1 prédit, 0-0 réel' },
    correct_goal_diff: { label: 'Bonne différence de buts', description: 'Bonus si la différence de buts est correcte avec le bon vainqueur', example: '2-0 prédit, 3-1 réel (+1)' },
    one_team_goals: { label: 'Buts d\'une équipe corrects', description: 'Bonus pour chaque équipe dont les buts sont correctement prédits', example: '2-1 prédit, 2-0 réel (+1 pour équipe 1)' },
    tournament_winner: { label: 'Vainqueur du tournoi', description: 'Bonus si l\'utilisateur a prédit la bonne équipe gagnante du tournoi', example: '' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
        <Settings className="w-8 h-8 text-primary-500" />
        <span>Paramètres</span>
      </h1>

      {/* Scoring Rules */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Système de Points</span>
          </h2>
          <button onClick={saveScoringRules} disabled={saving} className="btn-primary text-sm flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Sauvegarder</span>
          </button>
        </div>

        <div className="space-y-4">
          {Object.keys(ruleLabels).map(ruleType => (
            <div key={ruleType} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex-1">
                <p className="text-white font-medium">{ruleLabels[ruleType].label}</p>
                <p className="text-sm text-gray-400">{ruleLabels[ruleType].description}</p>
                {ruleLabels[ruleType].example && (
                  <p className="text-xs text-primary-400 mt-1">Ex: {ruleLabels[ruleType].example}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={scoringRules[ruleType] || 0}
                  onChange={(e) => handleRuleChange(ruleType, e.target.value)}
                  className="w-20 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-center"
                />
                <span className="text-gray-400">pts</span>
              </div>
            </div>
          ))}
        </div>

        {/* Example Calculation */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <h3 className="text-blue-400 font-medium mb-2">Exemple de calcul</h3>
          <p className="text-sm text-gray-400">
            Match réel: <span className="text-white">France 2-1 Maroc</span>
          </p>
          <ul className="text-sm text-gray-400 mt-2 space-y-1">
            <li>• Prono <span className="text-green-400">2-1</span> = {scoringRules.exact_score || 0} pts (score exact)</li>
            <li>• Prono <span className="text-yellow-400">3-2</span> = {(scoringRules.correct_winner || 0) + (scoringRules.correct_goal_diff || 0)} pts (bon vainqueur + même diff buts)</li>
            <li>• Prono <span className="text-yellow-400">2-0</span> = {(scoringRules.correct_winner || 0) + (scoringRules.one_team_goals || 0)} pts (bon vainqueur + buts équipe 1)</li>
            <li>• Prono <span className="text-yellow-400">3-1</span> = {(scoringRules.correct_winner || 0) + (scoringRules.correct_goal_diff || 0) + (scoringRules.one_team_goals || 0)} pts (vainqueur + diff + équipe 2)</li>
            <li>• Prono <span className="text-red-400">0-2</span> = 0 pts (mauvais vainqueur)</li>
          </ul>
        </div>
      </motion.div>

      {/* Site Colors */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-500" />
            <span>Couleurs du Site</span>
          </h2>
          <button onClick={saveColors} disabled={saving} className="btn-primary text-sm flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Sauvegarder</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { key: 'primary_color', label: 'Couleur Primaire', desc: 'Boutons, liens, accents' },
            { key: 'accent_color', label: 'Couleur Accent', desc: 'Éléments secondaires' },
            { key: 'bg_color', label: 'Arrière-plan', desc: 'Fond de page' },
            { key: 'card_color', label: 'Cartes', desc: 'Fond des cartes' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white font-medium">{label}</p>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={colors[key] || '#6366f1'}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20"
                />
                <input
                  type="text"
                  value={colors[key] || ''}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-24 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Color Preview */}
        <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.card_color }}>
          <h3 className="font-medium mb-3 text-white">Aperçu</h3>
          <div className="flex space-x-3">
            <button 
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: colors.primary_color }}
            >
              Bouton Primaire
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: colors.accent_color }}
            >
              Bouton Accent
            </button>
          </div>
        </div>
      </motion.div>

      {/* Award Tournament Winner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 mb-6">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span>Attribuer Bonus Vainqueur Tournoi</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Tournoi</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white"
            >
              <option value="">Sélectionner un tournoi</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Équipe Gagnante</label>
            <select
              value={selectedWinner}
              onChange={(e) => setSelectedWinner(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white"
            >
              <option value="">Sélectionner l'équipe</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={awardTournamentWinner} className="btn-primary flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Attribuer {scoringRules.tournament_winner || 10} pts aux gagnants</span>
        </button>
        <p className="text-sm text-gray-400 mt-2">
          Tous les utilisateurs ayant prédit cette équipe comme vainqueur du tournoi recevront {scoringRules.tournament_winner || 10} points bonus.
        </p>
      </motion.div>
    </div>
  );
};

export default AdminSettings;
