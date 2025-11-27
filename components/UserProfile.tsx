
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, Save, User, Sparkles, Loader2, Dice5, MapPin, Tag } from 'lucide-react';
import { generateSceneImage } from '../services/geminiService';

interface Props {
    profile: UserProfile;
    onSave: (profile: UserProfile) => void;
    onClose: () => void;
}

const PLAY_STYLES = [
    "Roleplay Heavy", "Combat Focused", "Explorer", "Strategist", 
    "Casual", "Hardcore", "Puzzle Solver", "Leader"
];

export default function UserProfileEditor({ profile, onSave, onClose }: Props) {
    const [formData, setFormData] = useState<UserProfile>(profile);
    const [avatarPrompt, setAvatarPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSave = () => {
        if (!formData.username.trim()) return;
        onSave(formData);
        onClose();
    };

    const handleGenerateAvatar = async () => {
        if (!avatarPrompt.trim()) return;
        setIsGenerating(true);
        // Use generateSceneImage with 1:1 ratio for avatar
        const url = await generateSceneImage(`Portrait of ${avatarPrompt}. High fantasy art style, detailed face, rpg character portrait.`, "1:1");
        if (url) {
            setFormData({ ...formData, avatarUrl: url });
        }
        setIsGenerating(false);
    };

    const handleRandomAvatar = () => {
        const seed = Math.random().toString(36).substring(7);
        setFormData({ ...formData, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}` });
    };

    const toggleTag = (tag: string) => {
        const current = formData.playStyles || [];
        if (current.includes(tag)) {
            setFormData({ ...formData, playStyles: current.filter(t => t !== tag) });
        } else {
            if (current.length < 3) {
                setFormData({ ...formData, playStyles: [...current, tag] });
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                    <h2 className="text-xl font-cinzel text-amber-500 flex items-center gap-2">
                        <User size={20}/> Adventurer Profile
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Top Section: Avatar & Basic Info */}
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Avatar Column */}
                        <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
                            <div className="w-32 h-32 rounded-full border-4 border-slate-700 overflow-hidden shadow-lg bg-slate-950 relative group">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                        <User size={48}/>
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-full space-y-2">
                                <button 
                                    onClick={handleRandomAvatar}
                                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded flex items-center justify-center gap-2 border border-slate-600"
                                >
                                    <Dice5 size={14}/> Randomize
                                </button>
                                
                                <div className="pt-2 border-t border-slate-800 mt-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">AI Generator</label>
                                    <div className="flex gap-1 mb-2">
                                        <input 
                                            value={avatarPrompt}
                                            onChange={e => setAvatarPrompt(e.target.value)}
                                            placeholder="e.g. Cyberpunk Orc"
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                        />
                                        <button 
                                            onClick={handleGenerateAvatar}
                                            disabled={isGenerating || !avatarPrompt}
                                            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded disabled:opacity-50"
                                        >
                                            {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Column */}
                        <div className="flex-1 space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Display Name</label>
                                <input 
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold focus:border-amber-500 outline-none"
                                />
                             </div>

                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Location / Timezone</label>
                                <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded p-2">
                                    <MapPin size={16} className="text-slate-500"/>
                                    <input 
                                        value={formData.location || ''}
                                        onChange={e => setFormData({...formData, location: e.target.value})}
                                        className="bg-transparent border-none outline-none text-sm text-white w-full"
                                        placeholder="e.g. New York (EST)"
                                    />
                                </div>
                             </div>

                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Bio</label>
                                <textarea 
                                    value={formData.bio || ''}
                                    onChange={e => setFormData({...formData, bio: e.target.value})}
                                    className="w-full h-24 bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white resize-none focus:border-amber-500 outline-none"
                                    placeholder="Tell us about your adventures..."
                                />
                             </div>
                        </div>
                    </div>

                    {/* Play Styles */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <Tag size={16} className="text-indigo-400"/> Play Style <span className="text-xs font-normal text-slate-500">(Select up to 3)</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {PLAY_STYLES.map(style => {
                                const isSelected = (formData.playStyles || []).includes(style);
                                return (
                                    <button
                                        key={style}
                                        onClick={() => toggleTag(style)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                            isSelected 
                                            ? 'bg-indigo-900 border-indigo-500 text-white' 
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                        }`}
                                    >
                                        {style}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info Footer */}
                    <div className="text-xs text-slate-600 italic text-center pt-4">
                        Member since {new Date(formData.joinedDate).toLocaleDateString()}
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-700 bg-slate-950 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold flex items-center gap-2 shadow-lg"
                    >
                        <Save size={16}/> Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
