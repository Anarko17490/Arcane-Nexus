
import React, { useState, useEffect } from 'react';
import { searchSpells, searchMonsters, searchWeapons, searchArmor, searchClasses, searchRaces } from '../services/dndService';
import { generateLibraryEntry } from '../services/geminiService';
import { LibraryItem } from '../types';
import { BookOpen, Sword, Search, ChevronRight, Sparkles, Shield, Skull, Loader2, Feather, User } from 'lucide-react';

const CATEGORIES = [
    { id: 'spell', label: 'Spells', icon: Sparkles, color: 'text-indigo-400' },
    { id: 'monster', label: 'Bestiary', icon: Skull, color: 'text-red-500' },
    { id: 'weapon', label: 'Weapons', icon: Sword, color: 'text-slate-300' },
    { id: 'armor', label: 'Armor', icon: Shield, color: 'text-slate-400' },
    { id: 'class', label: 'Classes', icon: User, color: 'text-amber-500' },
    { id: 'race', label: 'Races', icon: User, color: 'text-emerald-500' },
    { id: 'skill', label: 'Skills', icon: Feather, color: 'text-pink-400' },
];

export default function Library() {
    const [category, setCategory] = useState<string>('spell');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LibraryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAiGenerated, setIsAiGenerated] = useState(false);

    // Initial fetch when category changes
    useEffect(() => {
        setQuery('');
        handleSearch('');
    }, [category]);

    const handleSearch = async (overrideQuery?: string) => {
        const searchQuery = overrideQuery !== undefined ? overrideQuery : query;
        
        setLoading(true);
        setSelectedItem(null);
        setResults([]);
        setIsAiGenerated(false);

        try {
            let res: LibraryItem[] = [];

            // Primary Data Source: Open5e API
            switch(category) {
                case 'spell':
                    res = await searchSpells(searchQuery);
                    break;
                case 'monster':
                    res = await searchMonsters(searchQuery);
                    break;
                case 'weapon':
                    res = await searchWeapons(searchQuery);
                    break;
                case 'armor':
                    res = await searchArmor(searchQuery);
                    break;
                case 'class':
                    res = await searchClasses(searchQuery);
                    break;
                case 'race':
                    res = await searchRaces(searchQuery);
                    break;
                // Skills usually require parsing text rules, so we default to AI for them
                default: 
                    res = [];
            }

            if (res.length > 0) {
                setResults(res);
            } else if (searchQuery.trim()) {
                // Secondary Data Source: AI Generation
                // Only trigger AI if there is a specific query. We don't want AI to "list all".
                await handleAiGenerate(searchQuery);
            }
        } catch (e) {
            console.error("Search failed", e);
            if (searchQuery.trim()) {
                await handleAiGenerate(searchQuery);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAiGenerate = async (q: string) => {
        setIsAiGenerated(true);
        const res = await generateLibraryEntry(category, q);
        if (res) {
            setResults([res]);
            setSelectedItem(res); // Auto-select since it's a single result
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
            {/* Search Pane */}
            <div className="w-full md:w-1/3 bg-slate-800 rounded-lg border border-slate-600 flex flex-col">
                <div className="p-4 border-b border-slate-600 space-y-4">
                    {/* Category Selector */}
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                    category === cat.id 
                                    ? `bg-slate-700 border-white text-white` 
                                    : `border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-700`
                                }`}
                            >
                                <cat.icon size={12} className={category === cat.id ? cat.color : ''} />
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-dragon-500 outline-none"
                            placeholder={`Search ${category}...`}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button 
                            onClick={() => handleSearch()} 
                            disabled={loading}
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>}
                        </button>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {results.length === 0 && !loading && (
                        <div className="text-center text-slate-500 text-xs mt-10 italic">
                            {query ? "No results found in the archives." : "Loading known entries..."}
                        </div>
                    )}
                    {results.map((item: any, idx) => (
                        <button 
                            key={item.slug || idx} 
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left px-3 py-3 rounded flex justify-between items-center transition-colors ${selectedItem === item ? 'bg-indigo-900/50 text-white border border-indigo-500/30' : 'text-slate-300 hover:bg-white/5'}`}
                        >
                            <span className="font-medium truncate">{item.name}</span>
                            <ChevronRight size={14} className="opacity-50"/>
                        </button>
                    ))}
                </div>
            </div>

            {/* Details Pane */}
            <div className="flex-1 bg-slate-900 rounded-lg border border-slate-700 p-6 overflow-y-auto relative">
                {selectedItem ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Header */}
                        <div className="border-b border-slate-600 pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-cinzel text-white">{selectedItem.name}</h2>
                                    <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                        {category}
                                        {isAiGenerated ? 
                                            <span className="text-[10px] bg-indigo-900 text-indigo-200 px-1 rounded border border-indigo-700">AI Generated</span>
                                            : <span className="text-[10px] bg-emerald-900 text-emerald-200 px-1 rounded border border-emerald-700">SRD</span>
                                        }
                                    </div>
                                </div>
                                {selectedItem.cr && <div className="text-xl font-bold text-red-500">CR {selectedItem.cr}</div>}
                                {(selectedItem.level !== undefined || selectedItem.level_int !== undefined) && <div className="text-xl font-bold text-blue-400">Lvl {selectedItem.level || selectedItem.level_int}</div>}
                            </div>
                            
                            {/* Sub-header Stats */}
                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-300">
                                {selectedItem.school && <span>School: <span className="text-white">{selectedItem.school}</span></span>}
                                {selectedItem.castingTime && <span>Time: <span className="text-white">{selectedItem.castingTime}</span></span>}
                                {selectedItem.range && <span>Range: <span className="text-white">{selectedItem.range}</span></span>}
                                {selectedItem.components && <span>Comp: <span className="text-white">{selectedItem.components}</span></span>}
                                {selectedItem.duration && <span>Duration: <span className="text-white">{selectedItem.duration}</span></span>}
                                
                                {selectedItem.type && <span>Type: <span className="text-white">{selectedItem.size} {selectedItem.type} {selectedItem.subtype ? `(${selectedItem.subtype})` : ''}</span></span>}
                                {selectedItem.alignment && <span>Align: <span className="text-white">{selectedItem.alignment}</span></span>}
                                
                                {(selectedItem.ac || selectedItem.armor_class) && <span>AC: <span className="text-white font-bold">{selectedItem.ac || selectedItem.armor_class}</span></span>}
                                {(selectedItem.hp || selectedItem.hit_points) && <span>HP: <span className="text-white font-bold">{selectedItem.hp || selectedItem.hit_points}</span></span>}
                                {selectedItem.speed && <span>Speed: <span className="text-white">{selectedItem.speed}</span></span>}
                                
                                {selectedItem.damage && <span>Dmg: <span className="text-red-400 font-bold">{selectedItem.damage}</span></span>}
                                {selectedItem.cost && <span>Cost: <span className="text-amber-400">{selectedItem.cost}</span></span>}
                                {selectedItem.weight && <span>Wt: <span className="text-slate-400">{selectedItem.weight}</span></span>}
                            </div>
                        </div>

                        {/* Description / Flavor */}
                        {(selectedItem.descriptionFlavor || selectedItem.description || selectedItem.desc) && (
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300 font-serif whitespace-pre-wrap leading-relaxed">
                                {selectedItem.descriptionFlavor && <div className="italic mb-2 text-slate-400">{selectedItem.descriptionFlavor}</div>}
                                {selectedItem.description || selectedItem.desc}
                            </div>
                        )}
                        
                        {/* Dynamic Content based on Data Availability */}
                        
                        {/* Monster Stats */}
                        {selectedItem.stats && (
                            <div className="grid grid-cols-6 gap-2 text-center bg-slate-800 p-2 rounded">
                                {Object.entries(selectedItem.stats).map(([key, val]) => {
                                    const mod = Math.floor(((val as number) - 10) / 2);
                                    return (
                                        <div key={key} className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-500">{key}</span>
                                            <span className="text-lg font-bold text-white">{val}</span>
                                            <span className="text-xs text-slate-400">{mod >= 0 ? `+${mod}` : mod}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Monster Details */}
                        {category === 'monster' && (
                            <div className="space-y-4">
                                {selectedItem.senses && <div className="text-sm"><span className="font-bold text-slate-400">Senses:</span> {selectedItem.senses}</div>}
                                {selectedItem.languages && selectedItem.languages.length > 0 && <div className="text-sm"><span className="font-bold text-slate-400">Languages:</span> {Array.isArray(selectedItem.languages) ? selectedItem.languages.join(', ') : selectedItem.languages}</div>}
                                
                                {selectedItem.traits && selectedItem.traits.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-red-400 border-b border-red-900/30 mb-2">Traits</h4>
                                        <div className="space-y-2 text-sm text-slate-300">
                                            {selectedItem.traits.map((t: string, i: number) => (
                                                <div key={i} dangerouslySetInnerHTML={{__html: t.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-white">$1</span>')}} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedItem.actions && (
                                    <div>
                                        <h4 className="font-bold text-red-400 border-b border-red-900/30 mb-2">Actions</h4>
                                        <div className="space-y-3">
                                            {selectedItem.actions.map((act: any, i: number) => (
                                                <div key={i} className="text-sm">
                                                    <span className="font-bold text-white">{act.name}.</span> <span className="text-slate-300">{act.desc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Class Features */}
                        {selectedItem.category === 'class' && (
                            <div className="space-y-4">
                                {selectedItem.hitDie && (
                                    <div className="flex gap-4">
                                        <div className="bg-slate-800 p-2 rounded text-center min-w-[80px]">
                                            <div className="text-xs text-slate-500 uppercase font-bold">Hit Die</div>
                                            <div className="text-xl text-white font-bold">{selectedItem.hitDie}</div>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedItem.proficiencies && (
                                    <div>
                                        <h4 className="font-bold text-amber-400 mb-1 text-xs uppercase">Proficiencies</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.proficiencies.map((p: string, i: number) => (
                                                <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-600">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedItem.keyFeatures && (
                                    <div>
                                        <h4 className="font-bold text-amber-400 border-b border-amber-900/30 mb-2 mt-4">Key Features</h4>
                                        <div className="space-y-3">
                                            {selectedItem.keyFeatures.map((feat: any, i: number) => (
                                                <div key={i} className="bg-slate-800 p-3 rounded border border-slate-700">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-bold text-white">{feat.name}</span>
                                                        <span className="text-xs bg-slate-900 px-2 py-0.5 rounded text-amber-500">Lvl {feat.level}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400">{feat.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Race Features */}
                        {selectedItem.category === 'race' && (
                            <div className="space-y-4">
                                {selectedItem.abilityBonuses && (
                                    <div>
                                        <h4 className="font-bold text-emerald-400 mb-1 text-xs uppercase">Ability Bonuses</h4>
                                        <div className="flex gap-2">
                                            {Object.entries(selectedItem.abilityBonuses).map(([attr, val]) => (
                                                 <span key={attr} className="px-2 py-1 bg-slate-800 text-emerald-200 text-xs rounded border border-emerald-900 font-bold">
                                                     {attr} +{val as number}
                                                 </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedItem.traits && selectedItem.traits.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-emerald-400 border-b border-emerald-900/30 mb-2">Traits</h4>
                                        <div className="space-y-2 text-sm text-slate-300">
                                            {selectedItem.traits.map((t: string, i: number) => (
                                                <div key={i} dangerouslySetInnerHTML={{__html: t.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-white">$1</span>')}} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Weapon Properties */}
                        {selectedItem.properties && selectedItem.properties.length > 0 && (
                            <div>
                                <h4 className="font-bold text-slate-400 mb-1 text-xs uppercase">Properties</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.properties.map((prop: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-600">{prop}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center opacity-40">
                        <BookOpen size={64} className="mb-4 stroke-1"/>
                        <h3 className="text-xl font-cinzel mb-2">The Bible</h3>
                        <p className="max-w-xs text-sm">Select a category to browse the ancient texts or search to find specific knowledge.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
