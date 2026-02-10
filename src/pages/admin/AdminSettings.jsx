import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Palette, Trophy, Save, Image, Upload, X, Globe, Layout } from 'lucide-react';
import { adminAPI, teamsAPI, tournamentsAPI } from '../../api';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    primary_color: '#6366f1', accent_color: '#8b5cf6', bg_color: '#0f172a', card_color: '#1e293b',
    header_name: 'Prediction World', header_logo: '',
    home_name: 'Prediction World', home_logo: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminAPI.getSettings();
        setSettings(prev => ({ ...prev, ...res.data }));
      } catch (e) { toast.error('Erreur de chargement'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleSettingChange = (key, value) => setSettings({ ...settings, [key]: value });

  const handleLogoUpload = (key) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1000000) { toast.error('Image trop grande (max 1MB)'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setSettings({ ...settings, [key]: reader.result });
    reader.readAsDataURL(file);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Paramètres mis à jour');
    } catch (e) { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div></div>;

  const LogoSection = ({ label, desc, logoKey, nameKey, nameLabel }) => (
    <div className="p-4 bg-white/5 rounded-xl">
      <h3 className="font-semibold text-white mb-4">{label}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">{nameLabel || 'Nom'}</label>
          <input type="text" value={settings[nameKey] || ''} onChange={(e) => handleSettingChange(nameKey, e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white" placeholder="Prediction World" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Logo</label>
          <div className="flex items-center space-x-4">
            {settings[logoKey] ? (
              <div className="relative">
                <img src={settings[logoKey]} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-white/5 p-1" />
                <button onClick={() => handleSettingChange(logoKey, '')} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X className="w-3 h-3 text-white" /></button>
              </div>
            ) : (
              <label className="flex items-center space-x-2 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl cursor-pointer hover:bg-gray-600 transition-colors">
                <Upload className="w-4 h-4 text-gray-400" /><span className="text-gray-400 text-sm">Uploader</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload(logoKey)} className="hidden" />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{desc}</p>
        </div>
      </div>
      {/* Preview */}
      <div className="mt-4 p-3 bg-gray-900/80 rounded-xl border border-white/10 flex items-center space-x-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center overflow-hidden shrink-0">
          {settings[logoKey] ? <img src={settings[logoKey]} alt="Logo" className="w-full h-full object-cover" /> : <Globe className="w-6 h-6 text-white" />}
        </div>
        <span className="font-bold text-lg gradient-text">{settings[nameKey] || 'Prediction World'}</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
        <Settings className="w-8 h-8 text-primary-500" /><span>Paramètres</span>
      </h1>

      {/* Branding */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Image className="w-5 h-5 text-blue-500" /><span>Branding</span>
          </h2>
          <button onClick={saveSettings} disabled={saving} className="btn-primary text-sm flex items-center space-x-2">
            <Save className="w-4 h-4" /><span>Sauvegarder</span>
          </button>
        </div>

        <div className="space-y-6">
          <LogoSection label="En-tête (barre de navigation)" desc="Affiché dans la barre de navigation en haut" logoKey="header_logo" nameKey="header_name" nameLabel="Nom dans l'en-tête" />
          <LogoSection label="Page d'accueil (héro)" desc="Affiché en grand sur la page d'accueil" logoKey="home_logo" nameKey="home_name" nameLabel="Nom sur la page d'accueil" />
        </div>
      </motion.div>

      {/* Colors */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-500" /><span>Couleurs du Site</span>
          </h2>
          <button onClick={saveSettings} disabled={saving} className="btn-primary text-sm flex items-center space-x-2">
            <Save className="w-4 h-4" /><span>Sauvegarder</span>
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
              <div><p className="text-white font-medium">{label}</p><p className="text-sm text-gray-400">{desc}</p></div>
              <div className="flex items-center space-x-3">
                <input type="color" value={settings[key] || '#6366f1'} onChange={(e) => handleSettingChange(key, e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20" />
                <input type="text" value={settings[key] || ''} onChange={(e) => handleSettingChange(key, e.target.value)} className="w-24 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;
