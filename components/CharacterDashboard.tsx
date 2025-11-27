

import React, { useState, useEffect } from 'react';
import { Character, GameGenre } from '../types';
import { Plus, Trash2, Play, User, Globe, Shield, Zap, Skull, Ghost, Rocket } from 'lucide-react';

interface Props {
    onSelectCharacter: (char: Character) => void;
    onCreateNew: () => void;
}

const GENRE_ICONS: Record<string, any> = {
    'Fantasy': Shield,
    'Sci-Fi': Rocket,
    'Cyberpunk': Zap,
    'Post-Apocalyptic': Skull,
    'Eldritch Horror': Ghost,
    'Epic War': Shield,
    'Steampunk': Globe,
    'Western': Globe
};

export default function CharacterDashboard({ onSelectCharacter, onCreateNew }: Props) {
    const [characters, setCharacters] = useState<Character[]>([]);

    useEffect(() => {
        // Load characters
        const savedList = localStorage.getItem('dnd_characters');
        let chars: Character[] = savedList ? JSON.parse(savedList) : [];
        
        // Migration: check for legacy single character
        const legacyChar = localStorage.getItem('dnd_character');
        if (legacyChar && chars.length === 0) {
             const parsedLegacy = JSON.parse(legacyChar);
             // Avoid adding duplicates if it somehow exists
             if (!chars.find(c => c.id === parsedLegacy.id)) {
                 if (!parsedLegacy.genre) parsedLegacy.genre = 'Fantasy';
                 chars.push(parsedLegacy);
                 localStorage.setItem('dnd_characters', JSON.stringify(chars));
             }
        }

        // Default Character Injection for Demo
        if (chars.length === 0) {
            const defaultChar: Character = {
                id: 'default_demo_valen',
                name: 'Valen Shadowheart',
                race: 'Elf',
                class: 'Rogue',
                level: 3,
                hp: { current: 24, max: 24 },
                ac: 15,
                stats: { STR: 10, DEX: 16, CON: 14, INT: 14, WIS: 12, CHA: 10 },
                skills: ['Stealth', 'Acrobatics', 'Perception', 'Deception'],
                inventory: [
                    { id: '1', name: 'Shortsword', equipped: true, quantity: 1, isQuestItem: false },
                    { id: '2', name: 'Shortbow', equipped: true, quantity: 1, isQuestItem: false },
                    { id: '3', name: 'Leather Armor', equipped: true, quantity: 1, isQuestItem: false },
                    { id: '4', name: 'Thieves Tools', equipped: false, quantity: 1, isQuestItem: false },
                    { id: '5', name: 'Cloak of Shadows', equipped: true, quantity: 1, isQuestItem: false }
                ],
                notes: 'A shadow in the night, seeking redemption for a past life of crime.',
                appearance: {
                    hair: 'Silver, long',
                    eyes: 'Emerald Green',
                    skin: 'Pale',
                    height: '5ft 10in',
                    weight: '150lbs',
                    age: '120',
                    bodyType: 'Litmus',
                    clothing: 'Dark leather armor with a hooded cloak'
                },
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Valen',
                genre: 'Fantasy'
            };
            chars.push(defaultChar);
            localStorage.setItem('dnd_characters', JSON.stringify(chars));
        }
        
        setCharacters(chars);
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this character?')) {
            const updated = characters.filter(c => c.id !== id);
            setCharacters(updated);
            localStorage.setItem('dnd_characters', JSON.stringify(updated));
            
            // If deleting the active legacy char, clear it too
            const legacy = localStorage.getItem('dnd_character');
            if (legacy && JSON.parse(legacy).id === id) {
                localStorage.removeItem('dnd_character');
            }
        }
    };

    // Group by Genre
    const grouped = characters.reduce((acc, char) => {
        const g = char.genre || 'Fantasy';
        if (!acc[g]) acc[g] = [];
        acc[g].push(char);
        return acc;
    }, {} as Record<string, Character[]>);

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            
            {/* Header / Hero */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <User size={200} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-2">
                        Character Vault
                    </h1>
                    <p className="text-slate-400 text-lg">Select a hero to begin your journey, or forge a new legend.</p>
                </div>
                <button 
                    onClick={onCreateNew}
                    className="relative z-10 mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-dragon-900 hover:bg-dragon-600 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-105"
                >
                    <Plus size={20}/> Create New Character
                </button>
            </div>

            {/* Empty State */}
            {characters.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                    <User size={64} className="mx-auto text-slate-600 mb-4"/>
                    <h3 className="text-xl font-cinzel text-slate-400 mb-2">The Vault is Empty</h3>
                    <p className="text-slate-500 mb-6">No heroes found. Create your first character to start playing.</p>
                    <button onClick={onCreateNew} className="text-indigo-400 hover:text-indigo-300 font-bold underline">
                        Create Character
                    </button>
                </div>
            )}

            {/* Grouped Lists */}
            {Object.entries(grouped).map(([genre, chars]: [string, Character[]]) => {
                const Icon = GENRE_ICONS[genre] || Globe;
                return (
                    <div key={genre} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 border-b border-slate-700 pb-2">
                            <div className="p-2 bg-slate-800 rounded-lg border border-slate-600 text-slate-300">
                                <Icon size={20} />
                            </div>
                            <h2 className="text-2xl font-cinzel text-white">{genre}</h2>
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-full">{chars.length} Heroes</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {chars.map(char => (
                                <div 
                                    key={char.id}
                                    onClick={() => onSelectCharacter(char)}
                                    className="group relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-dragon-500 transition-all cursor-pointer"
                                >
                                    {/* Card Header/Image */}
                                    <div className="h-32 bg-gradient-to-br from-slate-800 to-black relative">
                                        {char.avatarUrl ? (
                                            <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                                                <User size={48} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                        
                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <div className="bg-dragon-900/90 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
                                                <Play size={16} fill="white" /> Play
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4 relative">
                                        <div className="absolute -top-10 left-4 w-16 h-16 rounded-lg border-2 border-slate-900 bg-slate-800 overflow-hidden shadow-lg z-10">
                                             {char.avatarUrl ? (
                                                <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={24}/></div>
                                            )}
                                        </div>

                                        <div className="ml-20 mb-2">
                                            <h3 className="font-bold text-lg text-white font-cinzel truncate">{char.name}</h3>
                                            <div className="text-xs text-indigo-400 font-bold uppercase">{char.class} • Lvl {char.level}</div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                                            <div className="bg-slate-950 p-2 rounded text-center">
                                                <span className="block font-bold text-slate-300">{char.race}</span>
                                                <span className="opacity-60">Race</span>
                                            </div>
                                            <div className="bg-slate-950 p-2 rounded text-center">
                                                <span className="block font-bold text-slate-300">{char.genre || 'Fantasy'}</span>
                                                <span className="opacity-60">World</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button 
                                        onClick={(e) => handleDelete(char.id, e)}
                                        className="absolute top-2 right-2 p-2 bg-black/50 text-slate-400 hover:text-red-400 hover:bg-black rounded-full opacity-0 group-hover:opacity-100 transition-all z-30"
                                        title="Delete Character"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}