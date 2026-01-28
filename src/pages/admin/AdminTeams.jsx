import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Upload, Image, Flag } from 'lucide-react';
import { teamsAPI } from '../../api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', flag_url: '', group_name: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [useImageUpload, setUseImageUpload] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchTeams(); }, []);
  
  const fetchTeams = async () => { 
    try { 
      const r = await teamsAPI.getAll(); 
      setTeams(r.data || []); 
    } catch (e) { 
      console.error(e); 
      setTeams([]);
    } finally { 
      setLoading(false); 
    } 
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 500 * 1024) {
      toast.error('Image trop grande (max 500KB)');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Fichier invalide (image uniquement)');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setPreviewImage(base64);
      setFormData({ ...formData, flag_url: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Le nom de l\'équipe est requis');
      return;
    }
    try {
      if (editingTeam) { 
        await teamsAPI.update(editingTeam.id, formData); 
        toast.success('Équipe modifiée !'); 
      } else { 
        await teamsAPI.create(formData); 
        toast.success('Équipe créée !'); 
      }
      fetchTeams(); 
      closeModal();
    } catch (error) { 
      toast.error(error.response?.data?.error || 'Erreur'); 
    }
  };

  const handleDelete = async (id) => { 
    if (!confirm('Supprimer cette équipe ?')) return; 
    try { 
      await teamsAPI.delete(id); 
      toast.success('Équipe supprimée'); 
      fetchTeams(); 
    } catch (e) { 
      toast.error(e.response?.data?.error || 'Erreur'); 
    } 
  };
  
  const openModal = (team = null) => { 
    if (team) { 
      setEditingTeam(team); 
      setFormData({ name: team.name, code: team.code || '', flag_url: team.flag_url || '', group_name: team.group_name || '' }); 
      const isImage = team.flag_url?.startsWith('data:') || team.flag_url?.startsWith('http');
      setPreviewImage(isImage ? team.flag_url : null);
      setUseImageUpload(isImage || !team.flag_url);
    } else { 
      setEditingTeam(null); 
      setFormData({ name: '', code: '', flag_url: '', group_name: '' }); 
      setPreviewImage(null);
      setUseImageUpload(true);
    } 
    setShowModal(true); 
  };
  
  const closeModal = () => { 
    setShowModal(false); 
    setEditingTeam(null); 
    setFormData({ name: '', code: '', flag_url: '', group_name: '' }); 
    setPreviewImage(null);
    setUseImageUpload(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearImage = () => {
    setPreviewImage(null);
    setFormData({ ...formData, flag_url: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderFlag = (team) => {
    if (team.flag_url && (team.flag_url.startsWith('data:') || team.flag_url.startsWith('http'))) {
      return <img src={team.flag_url} alt={team.name} className="w-full h-full object-cover" />;
    }
    return <span className="text-2xl">{team.flag_url || '🏳️'}</span>;
  };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const groupedTeams = filteredTeams.reduce((acc, t) => { 
    const g = t.group_name || 'Sans groupe'; 
    if (!acc[g]) acc[g] = []; 
    acc[g].push(t); 
    return acc; 
  }, {});

  return (
    <div className="min-h-screen pt-16 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl gradient-text tracking-wider">Équipes</h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" /><span>Nouvelle équipe</span>
          </button>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher une équipe..." className="input pl-10" />
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : teams.length === 0 ? (
          <div className="card text-center py-12">
            <Flag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Aucune équipe créée</p>
            <p className="text-gray-500 text-sm mb-4">Créez votre première équipe pour commencer</p>
            <button onClick={() => openModal()} className="btn-primary">
              <Plus className="w-5 h-5 inline mr-2" />Créer une équipe
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTeams).sort().map(([group, gTeams]) => (
              <div key={group}>
                <h2 className="font-display text-xl text-white mb-4 flex items-center">
                  <Flag className="w-5 h-5 mr-2 text-primary-500" />
                  {group === 'Sans groupe' ? 'Sans groupe' : `Groupe ${group}`}
                  <span className="ml-2 text-sm text-gray-400">({gTeams.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gTeams.map((team) => (
                    <motion.div key={team.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                          {renderFlag(team)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{team.name}</p>
                          <p className="text-sm text-gray-400">{team.code || '-'}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => openModal(team)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(team.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl text-white">{editingTeam ? 'Modifier l\'équipe' : 'Nouvelle équipe'}</h2>
                <button onClick={closeModal}><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Flag Type Toggle */}
                <div className="flex space-x-2 mb-4">
                  <button
                    type="button"
                    onClick={() => { setUseImageUpload(true); setFormData({ ...formData, flag_url: previewImage || '' }); }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${useImageUpload ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />Image
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUseImageUpload(false); setPreviewImage(null); }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${!useImageUpload ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    😊 Emoji
                  </button>
                </div>

                {/* Image Upload Section */}
                {useImageUpload ? (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Drapeau de l'équipe</label>
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-white/20 relative">
                        {previewImage ? (
                          <>
                            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={clearImage}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </>
                        ) : (
                          <Image className="w-8 h-8 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full px-4 py-2 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{previewImage ? 'Changer' : 'Uploader'}</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG (max 500KB)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Emoji du drapeau</label>
                    <input 
                      type="text" 
                      value={formData.flag_url} 
                      onChange={(e) => setFormData({ ...formData, flag_url: e.target.value })}
                      className="input text-center text-2xl" 
                      placeholder="🇩🇿"
                    />
                    <p className="text-xs text-gray-500 mt-1">Exemples: 🇩🇿 🇲🇦 🇹🇳 🇪🇬 🇸🇳 🇨🇲 🇳🇬 🇬🇭 🇨🇮 🇲🇱</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Nom de l'équipe *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="input" 
                    placeholder="Ex: Algérie" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Code (3 lettres)</label>
                  <input 
                    type="text" 
                    value={formData.code} 
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().slice(0, 3) })} 
                    className="input" 
                    placeholder="ALG" 
                    maxLength={3} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Groupe</label>
                  <select value={formData.group_name} onChange={(e) => setFormData({ ...formData, group_name: e.target.value })} className="input">
                    <option value="">-- Sélectionner un groupe --</option>
                    {['A', 'B', 'C', 'D', 'E', 'F'].map(g => <option key={g} value={g}>Groupe {g}</option>)}
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20">
                    Annuler
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingTeam ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeams;
