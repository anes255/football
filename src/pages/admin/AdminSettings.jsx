import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Palette, Save, Image, Upload, X, Globe, Type, Layout, Zap, Monitor, Mouse } from 'lucide-react';
import { adminAPI } from '../../api';
import { useSettings } from '../../context/SettingsContext';
import toast from 'react-hot-toast';

const FONT_OPTIONS = [
  'Poppins', 'Bebas Neue', 'Inter', 'Roboto', 'Open Sans', 'Montserrat',
  'Lato', 'Oswald', 'Raleway', 'Nunito', 'Ubuntu', 'Rubik', 'Cairo',
  'Playfair Display', 'Merriweather', 'Source Sans 3', 'DM Sans', 'Space Grotesk'
];

const AdminSettings = () => {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('branding');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminAPI.getSettings();
        setSettings(res.data || {});
      } catch (e) { toast.error('Erreur de chargement'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleChange = (key, value) => setSettings({ ...settings, [key]: value });

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
      await refreshSettings();
      toast.success('Paramètres sauvegardés et appliqués !');
    } catch (e) { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div></div>;

  const ColorField = ({ label, settingKey, desc }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-white text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
      <div className="flex items-center space-x-2 shrink-0">
        <input type="color" value={settings[settingKey] || '#000000'} onChange={(e) => handleChange(settingKey, e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/20" />
        <input type="text" value={settings[settingKey] || ''} onChange={(e) => handleChange(settingKey, e.target.value)} className="w-24 bg-gray-700 border border-gray-600 rounded-lg py-1.5 px-2 text-white text-xs" />
      </div>
    </div>
  );

  const LogoSection = ({ label, desc, logoKey, nameKey, nameLabel }) => (
    <div className="p-4 bg-white/5 rounded-xl">
      <h3 className="font-semibold text-white mb-4">{label}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">{nameLabel || 'Nom'}</label>
          <input type="text" value={settings[nameKey] || ''} onChange={(e) => handleChange(nameKey, e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white" placeholder="Prediction World" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Logo</label>
          <div className="flex items-center space-x-4">
            {settings[logoKey] ? (
              <div className="relative">
                <img src={settings[logoKey]} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-white/5 p-1" />
                <button onClick={() => handleChange(logoKey, '')} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X className="w-3 h-3 text-white" /></button>
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
      <div className="mt-4 p-3 bg-gray-900/80 rounded-xl border border-white/10 flex items-center space-x-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center overflow-hidden shrink-0">
          {settings[logoKey] ? <img src={settings[logoKey]} alt="Logo" className="w-full h-full object-cover" /> : <Globe className="w-6 h-6 text-white" />}
        </div>
        <span className="font-bold text-lg gradient-text">{settings[nameKey] || 'Prediction World'}</span>
      </div>
    </div>
  );

  const sections = [
    { id: 'branding', label: 'Branding', icon: Image },
    { id: 'colors', label: 'Couleurs', icon: Palette },
    { id: 'backgrounds', label: 'Arrière-plans', icon: Monitor },
    { id: 'buttons', label: 'Boutons', icon: Mouse },
    { id: 'text', label: 'Texte & Gradients', icon: Type },
    { id: 'status', label: 'Statuts', icon: Zap },
    { id: 'layout', label: 'Layout & Polices', icon: Layout },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
          <Settings className="w-8 h-8 text-primary-500" /><span>Paramètres</span>
        </h1>
        <button onClick={saveSettings} disabled={saving} className="btn-primary flex items-center space-x-2">
          {saving ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Sauvegarde...' : 'Sauvegarder tout'}</span>
        </button>
      </div>

      {/* Section Selector */}
      <select
        value={activeSection}
        onChange={(e) => setActiveSection(e.target.value)}
        className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-500"
      >
        {sections.map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>

      {/* Branding */}
      {activeSection === 'branding' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Image className="w-5 h-5 text-blue-500" /><span>Branding</span>
          </h2>
          <LogoSection label="En-tête (barre de navigation)" desc="Affiché dans la navbar" logoKey="header_logo" nameKey="header_name" nameLabel="Nom dans l'en-tête" />
          <LogoSection label="Page d'accueil (héro)" desc="Affiché en grand sur la page d'accueil" logoKey="home_logo" nameKey="home_name" nameLabel="Nom sur la page d'accueil" />
        </motion.div>
      )}

      {/* Main Colors */}
      {activeSection === 'colors' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-500" /><span>Couleurs Principales</span>
          </h2>
          <ColorField label="Couleur primaire" settingKey="primary_color" desc="Couleur principale du site" />
          <ColorField label="Couleur accent" settingKey="accent_color" desc="Couleur secondaire / accent" />
          <ColorField label="Couleur secondaire" settingKey="secondary_color" desc="Boutons secondaires, succès" />
        </motion.div>
      )}

      {/* Backgrounds */}
      {activeSection === 'backgrounds' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-cyan-500" /><span>Arrière-plans</span>
          </h2>
          <ColorField label="Fond principal" settingKey="bg_color" desc="Couleur de fond du site" />
          <ColorField label="Fond secondaire" settingKey="bg_color_2" desc="2ème couleur du dégradé de fond" />
          <ColorField label="Fond navbar" settingKey="navbar_bg" desc="Arrière-plan de la barre de navigation" />
          <ColorField label="Texte navbar" settingKey="navbar_text" desc="Couleur du texte dans la navbar" />
          <ColorField label="Fond des inputs" settingKey="input_bg" desc="Arrière-plan des champs de saisie" />
          <ColorField label="Bordure des inputs" settingKey="input_border" desc="Bordure des champs de saisie" />
          <ColorField label="Barre de scroll (piste)" settingKey="scrollbar_track" desc="Fond de la scrollbar" />
          <ColorField label="Barre de scroll (poignée)" settingKey="scrollbar_thumb" desc="Couleur de la poignée" />
        </motion.div>
      )}

      {/* Buttons */}
      {activeSection === 'buttons' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Mouse className="w-5 h-5 text-orange-500" /><span>Boutons</span>
          </h2>
          <ColorField label="Bouton primaire" settingKey="btn_primary_bg" desc="Couleur du bouton principal" />
          <ColorField label="Bouton primaire (hover)" settingKey="btn_primary_hover" desc="Couleur au survol" />
          <ColorField label="Bouton secondaire" settingKey="btn_secondary_bg" desc="Couleur du bouton secondaire" />
          <ColorField label="Bouton secondaire (hover)" settingKey="btn_secondary_hover" desc="Couleur au survol" />
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-gray-400 mb-3">Aperçu des boutons :</p>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary">Bouton Primaire</button>
              <button className="btn-secondary">Bouton Secondaire</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Text & Gradients */}
      {activeSection === 'text' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Type className="w-5 h-5 text-pink-500" /><span>Texte & Gradients</span>
          </h2>
          <ColorField label="Couleur du texte" settingKey="text_color" desc="Texte principal (titres, contenu)" />
          <ColorField label="Texte atténué" settingKey="text_muted" desc="Texte secondaire, descriptions" />
          <ColorField label="Gradient — début" settingKey="gradient_start" desc="Début du dégradé des titres" />
          <ColorField label="Gradient — fin" settingKey="gradient_end" desc="Fin du dégradé des titres" />
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-gray-400 mb-2">Aperçu du gradient :</p>
            <h2 className="text-3xl font-bold gradient-text">Prediction World</h2>
          </div>
        </motion.div>
      )}

      {/* Status Colors */}
      {activeSection === 'status' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-500" /><span>Couleurs de Statut</span>
          </h2>
          <ColorField label="Succès" settingKey="success_color" desc="Score exact, validations" />
          <ColorField label="Erreur" settingKey="error_color" desc="Mauvais pronostic, erreurs" />
          <ColorField label="Avertissement" settingKey="warning_color" desc="Alertes, matchs proches" />
          <ColorField label="En direct" settingKey="live_color" desc="Matchs en cours" />
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-gray-400 mb-3">Aperçu :</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{backgroundColor: (settings.success_color || '#22c55e') + '20', color: settings.success_color || '#22c55e'}}>Score exact</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{backgroundColor: (settings.warning_color || '#f59e0b') + '20', color: settings.warning_color || '#f59e0b'}}>Bon vainqueur</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{backgroundColor: (settings.error_color || '#ef4444') + '20', color: settings.error_color || '#ef4444'}}>Mauvais</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium animate-pulse" style={{backgroundColor: (settings.live_color || '#ef4444') + '20', color: settings.live_color || '#ef4444'}}>🔴 En direct</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Layout & Fonts */}
      {activeSection === 'layout' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Layout className="w-5 h-5 text-teal-500" /><span>Layout & Polices</span>
          </h2>
          <div className="p-3 bg-white/5 rounded-xl">
            <p className="text-white text-sm font-medium mb-2">Police des titres</p>
            <select value={settings.font_heading || 'Bebas Neue'} onChange={(e) => handleChange('font_heading', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm">
              {FONT_OPTIONS.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f}</option>)}
            </select>
            <p className="mt-2 text-2xl" style={{fontFamily: settings.font_heading || 'Bebas Neue'}}>Aperçu du titre</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl">
            <p className="text-white text-sm font-medium mb-2">Police du texte</p>
            <select value={settings.font_body || 'Poppins'} onChange={(e) => handleChange('font_body', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm">
              {FONT_OPTIONS.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f}</option>)}
            </select>
            <p className="mt-2 text-sm" style={{fontFamily: settings.font_body || 'Poppins'}}>Aperçu du texte courant avec cette police</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl">
            <p className="text-white text-sm font-medium mb-2">Arrondi des coins (border-radius)</p>
            <div className="flex items-center space-x-4">
              <input
                type="range" min="0" max="24" step="2"
                value={settings.border_radius || 12}
                onChange={(e) => handleChange('border_radius', e.target.value)}
                className="flex-1"
              />
              <span className="text-white text-sm w-12 text-right">{settings.border_radius || 12}px</span>
            </div>
            <div className="mt-3 flex gap-3">
              <div className="p-4 bg-white/10 text-center text-sm text-white" style={{borderRadius: (settings.border_radius || 12) + 'px'}}>Carte</div>
              <button className="btn-primary text-sm" style={{borderRadius: (settings.border_radius || 12) + 'px'}}>Bouton</button>
              <input className="bg-gray-700 border border-gray-600 py-2 px-3 text-white text-sm w-32" style={{borderRadius: (settings.border_radius || 12) + 'px'}} placeholder="Input" readOnly />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminSettings;
