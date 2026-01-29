import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Trophy, Award, Target, Star } from 'lucide-react';
import { scoringAPI, settingsAPI, adminAPI, teamsAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState([]);
  const [scoringRules, setScoringRules] = useState({
    exact_score: 3,
    correct_winner: 2,
    correct_draw: 3,
    tournament_winner: 5
  });
  const [settings, setSettings] = useState({
    predictions_open: 'true',
    show_leaderboard: 'true'
  });
  const [selectedWinner, setSelectedWinner] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, settingsRes, teamsRes] = await Promise.all([
        scoringAPI.getRules(),
        settingsAPI.getAll(),
        teamsAPI.getAll()
      ]);
      
      const rulesObj = {};
      rulesRes.data.forEach(r => { rulesObj[r.rule_type] = r.points; });
      setScoringRules(rulesObj);
      
      const settingsObj = {};
      settingsRes.data.forEach(s => { settingsObj[s.key] = s.value; });
      setSettings(settingsObj);
      
      setTeams(teamsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
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

  const saveSettings = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Paramètres mis à jour');
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const awardTournamentWinner = async () => {
    if (!selectedWinner) {
      toast.error('Sélectionnez une équipe');
      return;
    }
    if (!confirm('Attribuer les points bonus aux utilisateurs ayant prédit cette équipe gagnante ?')) return;
    
    try {
      const res = await adminAPI.awardTournamentWinner({ team_id: parseInt(selectedWinner) });
      toast.success(`${res.data.usersAwarded} utilisateurs ont reçu ${res.data.pointsAwarded} points`);
    } catch (error) {
      toast.error('Erreur');
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
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl gradient-text">Paramètres</h1>
          <p className="text-gray-400 mt-2">Configurez les règles et options</p>
        </div>

        <div className="space-y-8">
          {/* Scoring Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Target className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-bold text-white">Règles de Points</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <label className="text-gray-300">Score exact</label>
                </div>
                <input
                  type="number"
                  value={scoringRules.exact_score || 3}
                  onChange={(e) => setScoringRules({ ...scoringRules, exact_score: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Points pour un score parfait</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-5 h-5 text-green-400" />
                  <label className="text-gray-300">Bon vainqueur</label>
                </div>
                <input
                  type="number"
                  value={scoringRules.correct_winner || 2}
                  onChange={(e) => setScoringRules({ ...scoringRules, correct_winner: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Points pour le bon résultat</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  <label className="text-gray-300">Match nul correct</label>
                </div>
                <input
                  type="number"
                  value={scoringRules.correct_draw || 3}
                  onChange={(e) => setScoringRules({ ...scoringRules, correct_draw: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Points pour un nul prédit</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <label className="text-gray-300">Vainqueur tournoi</label>
                </div>
                <input
                  type="number"
                  value={scoringRules.tournament_winner || 5}
                  onChange={(e) => setScoringRules({ ...scoringRules, tournament_winner: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Bonus équipe gagnante</p>
              </div>
            </div>

            <button
              onClick={saveScoringRules}
              disabled={saving}
              className="btn-primary mt-6 flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Enregistrer les règles</span>
            </button>
          </motion.div>

          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-bold text-white">Paramètres Généraux</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">Pronostics ouverts</p>
                  <p className="text-sm text-gray-400">Autoriser les nouveaux pronostics</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, predictions_open: settings.predictions_open === 'true' ? 'false' : 'true' })}
                  className={`w-14 h-7 rounded-full transition-colors ${
                    settings.predictions_open === 'true' ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.predictions_open === 'true' ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">Afficher le classement</p>
                  <p className="text-sm text-gray-400">Rendre le classement visible</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, show_leaderboard: settings.show_leaderboard === 'true' ? 'false' : 'true' })}
                  className={`w-14 h-7 rounded-full transition-colors ${
                    settings.show_leaderboard === 'true' ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.show_leaderboard === 'true' ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="btn-primary mt-6 flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Enregistrer les paramètres</span>
            </button>
          </motion.div>

          {/* Award Tournament Winner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">Attribuer le Bonus Vainqueur</h2>
            </div>

            <p className="text-gray-400 mb-4">
              Attribuez {scoringRules.tournament_winner || 5} points bonus aux utilisateurs ayant prédit l'équipe gagnante du tournoi.
            </p>

            <div className="flex items-center space-x-4">
              <select
                value={selectedWinner}
                onChange={(e) => setSelectedWinner(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
              >
                <option value="">Sélectionner l'équipe gagnante</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <button
                onClick={awardTournamentWinner}
                className="btn-primary flex items-center space-x-2"
              >
                <Award className="w-5 h-5" />
                <span>Attribuer</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
