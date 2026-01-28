import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Trophy, Users } from 'lucide-react';
import { settingsAPI, adminAPI, teamsAPI } from '../../api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [settings, setSettings] = useState({ predictions_open: true, show_leaderboard: true });
  const [teams, setTeams] = useState([]);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, teamsRes] = await Promise.all([settingsAPI.getAll(), teamsAPI.getAll()]);
      const settingsObj = {};
      settingsRes.data.forEach(s => { settingsObj[s.key] = s.value === 'true'; });
      setSettings({ predictions_open: settingsObj.predictions_open ?? true, show_leaderboard: settingsObj.show_leaderboard ?? true });
      setTeams(teamsRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings({ predictions_open: settings.predictions_open.toString(), show_leaderboard: settings.show_leaderboard.toString() });
      toast.success('Paramètres mis à jour !');
    } catch (e) { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const handleAwardWinner = async () => {
    if (!selectedWinner) { toast.error('Sélectionnez une équipe'); return; }
    if (!confirm('Attribuer les points bonus aux utilisateurs ayant prédit cette équipe comme vainqueur ?')) return;
    setAwarding(true);
    try {
      const result = await adminAPI.awardTournamentWinner({ team_id: parseInt(selectedWinner) });
      toast.success(`Points attribués à ${result.data.usersAwarded} utilisateurs !`);
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
    finally { setAwarding(false); }
  };

  return (
    <div className="min-h-screen pt-16 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl gradient-text tracking-wider">Paramètres</h1>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2">
            {saving ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Save className="w-5 h-5" /><span>Sauvegarder</span></>}
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="w-6 h-6 text-primary-500" />
                <h2 className="font-display text-2xl text-white">Paramètres généraux</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Pronostics ouverts</p>
                    <p className="text-sm text-gray-400">Permettre aux utilisateurs de faire des pronostics</p>
                  </div>
                  <button onClick={() => setSettings({ ...settings, predictions_open: !settings.predictions_open })} className={`w-14 h-8 rounded-full transition-all duration-300 ${settings.predictions_open ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${settings.predictions_open ? 'ml-7' : 'ml-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Afficher le classement</p>
                    <p className="text-sm text-gray-400">Rendre le classement visible aux utilisateurs</p>
                  </div>
                  <button onClick={() => setSettings({ ...settings, show_leaderboard: !settings.show_leaderboard })} className={`w-14 h-8 rounded-full transition-all duration-300 ${settings.show_leaderboard ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${settings.show_leaderboard ? 'ml-7' : 'ml-1'}`} />
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
              <div className="flex items-center space-x-3 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="font-display text-2xl text-white">Vainqueur du tournoi</h2>
              </div>
              <p className="text-gray-400 mb-4">Attribuez les points bonus aux utilisateurs ayant prédit le vainqueur du tournoi</p>
              <div className="flex items-center space-x-4">
                <select value={selectedWinner} onChange={(e) => setSelectedWinner(e.target.value)} className="input flex-1">
                  <option value="">Sélectionner l'équipe gagnante</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button onClick={handleAwardWinner} disabled={awarding} className="btn-primary flex items-center space-x-2">
                  {awarding ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Trophy className="w-5 h-5" /><span>Attribuer les points</span></>}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
              <div className="flex items-center space-x-3 mb-6">
                <Users className="w-6 h-6 text-blue-500" />
                <h2 className="font-display text-2xl text-white">Informations</h2>
              </div>
              <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm text-gray-400">
                <p>• Les pronostics se ferment automatiquement au début de chaque match</p>
                <p>• Les points sont calculés automatiquement à la saisie du résultat</p>
                <p>• Le bonus vainqueur ne peut être attribué qu'une seule fois</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
