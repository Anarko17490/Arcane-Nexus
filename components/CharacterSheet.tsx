import React, { useState, useEffect } from 'react';
import { Character, Attribute, InventoryItem } from '../types';
import { Shield, Heart, Zap, Save, RefreshCw, User, Sparkles, Book, Sword, Package, Trash2, ArrowRightLeft, Lock, CheckCircle, Edit3, Search, Plus, Minus, X } from 'lucide-react';

const DEFAULT_STATS: Record<Attribute, number> = {
  STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10
};

const calcMod = (score: number) => Math.floor((score - 10) / 2);
const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

interface Props {
    onCreateNew?: () => void;
    character?: Character | null;
    onUpdate?: (char: Character) => void;
    onTransferItem?: (item: InventoryItem, target: string) => void;
    isGMView?: boolean; // New prop to indicate DM is viewing/editing
}

const getIconForItem = (item: InventoryItem) => {
    const lower = item.name.toLowerCase();
    if (lower.includes('armor') || lower.includes('shield') || lower.includes('mail') || lower.includes('plate') || lower.includes('helm') || lower.includes('coat')) return <Shield size={16} />;
    if (lower.includes('sword') || lower.includes('bow') || lower.includes('dagger') || lower.includes('axe') || lower.includes('staff') || lower.includes('rifle') || lower.includes('pistol')) return <Sword size={16} />;
    if (lower.includes('key') || lower.includes('map') || item.isQuestItem) return <Lock size={16} />;
    return <Package size={16} />;
};

// Helper to check for quest items based on keywords if flag not set
const isQuestItem = (item: InventoryItem) => {
    if (item.isQuestItem) return true;
    const lower = item.name.toLowerCase();
    return lower.includes('key') || lower.includes('map') || lower.includes('letter') || lower.includes('artifact') || lower.includes('sigil');
};

export default function CharacterSheet({ onCreateNew, character: propChar, onUpdate, onTransferItem, isGMView = false }: Props) {
  // Use prop character if available, otherwise load from local storage
  const [localChar, setLocalChar] = useState<Character>(() => {
    if (propChar) return propChar;
    const saved = localStorage.getItem('dnd_character');
    return saved ? JSON.parse(saved) : {
      id: '1',
      name: 'Unnamed Hero',
      race: 'Human',
      class: 'Fighter',
      level: 1,
      hp: { current: 10, max: 10 },
      ac: 10,
      stats: DEFAULT_STATS,
      skills: [],
      inventory: [],
      notes: ''
    };
  });

  // Local state for inventory interactions
  const [filterQuery, setFilterQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Sync state with prop if it changes
  useEffect(() => {
    if (propChar) {
        // Migration logic for legacy Inventory (string[])
        let updatedChar = { ...propChar };
        if (updatedChar.inventory && updatedChar.inventory.length > 0 && typeof updatedChar.inventory[0] === 'string') {
            updatedChar.inventory = (updatedChar.inventory as unknown as string[]).map((str, idx) => ({
                id: `legacy-${idx}-${Date.now()}`,
                name: str,
                equipped: false,
                quantity: 1,
                isQuestItem: str.toLowerCase().includes('key') || str.toLowerCase().includes('map')
            }));
            // Immediate update to fix parent state if possible
             if (onUpdate) onUpdate(updatedChar);
        }
        setLocalChar(updatedChar);
    }
  }, [propChar]);

  // Helper to update character state and propagate changes
  const updateChar = (newChar: Character) => {
      setLocalChar(newChar);
      if (onUpdate) {
          onUpdate(newChar);
      } else {
          localStorage.setItem('dnd_character', JSON.stringify(newChar));
      }
  };

  const [spellSlots, setSpellSlots] = useState<{current: number, max: number}>({current: 2, max: 2});

  const saveCharacter = () => {
    localStorage.setItem('dnd_character', JSON.stringify(localChar));
    alert('Character Saved!');
  };

  const useSpellSlot = () => {
      if (spellSlots.current > 0) {
          setSpellSlots(prev => ({...prev, current: prev.current - 1}));
      }
  };
  
  const restoreSpellSlots = () => {
      setSpellSlots(prev => ({...prev, current: prev.max}));
  }

  // --- Inventory Actions ---

  const toggleEquip = (itemId: string) => {
      const updatedInventory = localChar.inventory.map(item => {
          if (item.id === itemId) {
              return { ...item, equipped: !item.equipped };
          }
          return item;
      });
      updateChar({ ...localChar, inventory: updatedInventory });
  };

  const updateQuantity = (itemId: string, delta: number) => {
      const updatedInventory = localChar.inventory.map(item => {
          if (item.id === itemId) {
              return { ...item, quantity: Math.max(0, (item.quantity || 1) + delta) };
          }
          return item;
      });
      updateChar({ ...localChar, inventory: updatedInventory });
  };

  const handleAddItem = () => {
      if (!newItemName.trim()) return;
      const newItem: InventoryItem = {
          id: Date.now().toString(),
          name: newItemName,
          equipped: false,
          quantity: 1,
          isQuestItem: false
      };
      updateChar({ ...localChar, inventory: [...localChar.inventory, newItem] });
      setNewItemName('');
      setIsAddingItem(false);
  };

  const deleteItem = (itemId: string) => {
      const item = localChar.inventory.find(i => i.id === itemId);
      if (!item) return;

      if (isQuestItem(item) && !isGMView) { // GM can always delete
          alert("Cannot discard quest items!");
          return;
      }

      if (window.confirm(isGMView ? `GM: Delete ${item.name}?` : `Discard ${item.name}?`)) {
          const updatedInventory = localChar.inventory.filter(i => i.id !== itemId);
          updateChar({ ...localChar, inventory: updatedInventory });
      }
  };

  const handleTransferClick = (item: InventoryItem) => {
      if (onTransferItem) {
          const target = prompt(isGMView ? `Force transfer ${item.name} to:` : `Transfer ${item.name} to who? (Enter Name)`);
          if (target && target.trim()) {
              // Update local state by removing item
              const updatedInventory = localChar.inventory.filter(i => i.id !== item.id);
              updateChar({ ...localChar, inventory: updatedInventory });
              
              // Trigger callback
              onTransferItem(item, target.trim());
          }
      } else {
          alert("Transfer not available in this mode.");
      }
  };

  const character = localChar;
  
  // Filtering
  const filteredInventory = character.inventory.filter(i => 
      i.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className={`bg-parchment-100 dark:bg-slate-800 text-slate-900 dark:text-parchment-100 p-6 rounded-lg shadow-xl border ${isGMView ? 'border-amber-500 border-2' : 'border-slate-600'} font-fell relative`}>
      {isGMView && (
          <div className="absolute top-0 left-0 bg-amber-500 text-black px-3 py-1 text-xs font-bold uppercase rounded-br-lg z-10">
              GM EDIT MODE
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start mb-8 border-b-2 border-slate-500 pb-4 mt-2">
        
        {/* Avatar Display */}
        <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-slate-900 rounded-lg border-2 border-dragon-900 overflow-hidden shadow-lg">
            {character.avatarUrl ? (
                <img src={character.avatarUrl} alt="Character Avatar" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <User size={48} />
                </div>
            )}
        </div>

        <div className="flex-1 w-full">
            {/* Read-only Identifiers */}
            <h1 className="text-4xl font-bold font-cinzel flex items-center gap-2">
                {character.name}
                {isGMView && <Edit3 size={16} className="text-slate-500 cursor-pointer hover:text-white" title="Rename (Not Impl)"/>}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-lg opacity-80 font-sans">
                <span>{character.race} {character.class}</span>
                <span className="mx-2">•</span>
                <span>Level {character.level}</span>
            </div>
            {character.appearance && (
                <div className="mt-3 text-xs font-sans opacity-70 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <span>Age: {character.appearance.age}</span>
                    <span>Height: {character.appearance.height}</span>
                    <span>Weight: {character.appearance.weight}</span>
                    <span>Eyes: {character.appearance.eyes}</span>
                </div>
            )}
        </div>
        <div className="flex gap-2 self-start md:self-center">
            {onCreateNew && (
                <button onClick={onCreateNew} className="p-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-full transition-colors" title="Create New">
                    <RefreshCw size={24} />
                </button>
            )}
            {!isGMView && ( // GM updates are usually auto-saved via onUpdate callback
                <button onClick={saveCharacter} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-colors" title="Save">
                    <Save size={24} />
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats */}
        <div className="space-y-6">
            <h3 className="text-xl font-cinzel border-b border-slate-500 inline-block mb-2">Attributes</h3>
            <div className="grid grid-cols-1 gap-4">
            {(Object.keys(character.stats) as Attribute[]).map((stat) => {
                const mod = calcMod(character.stats[stat]);
                return (
                <div key={stat} className="flex items-center justify-between bg-white/10 dark:bg-black/20 p-3 rounded-lg border border-slate-500/30">
                    <div className="flex flex-col items-center w-12">
                        <span className="font-bold text-lg">{stat}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold">
                            {/* In GM View, maybe allow editing score? For now kept simple */}
                            {character.stats[stat]}
                        </span>
                        <span className="text-xs uppercase opacity-70">Score</span>
                    </div>
                    <div className="flex items-center justify-center w-16 h-16 bg-dragon-900 text-white rounded-full border-2 border-dragon-500 shadow-lg">
                        <span className="text-xl font-bold">{formatMod(mod)}</span>
                    </div>
                </div>
                )
            })}
            </div>
        </div>

        {/* Middle Column: Vitals & Inventory */}
        <div className="flex flex-col gap-6">
             {/* Vitals */}
             <div className="flex gap-4 justify-center">
                <div className="flex flex-col items-center p-4 border-2 border-slate-600 rounded-lg w-full bg-slate-200 dark:bg-slate-900">
                    <Shield size={32} className="text-slate-600 dark:text-slate-400 mb-2" />
                    <div className="flex items-center gap-1">
                        <span className="text-sm">AC</span>
                        <input 
                            type="number" 
                            value={character.ac}
                            onChange={(e) => updateChar({...character, ac: parseInt(e.target.value) || 10})}
                            className="w-12 text-center text-3xl font-bold bg-transparent border-b border-white/20 focus:border-amber-500 outline-none"
                            disabled={!isGMView && true} 
                        />
                    </div>
                </div>
                <div className="flex flex-col items-center p-4 border-2 border-dragon-900 rounded-lg w-full bg-red-50 dark:bg-dragon-900/20">
                    <Heart size={32} className="text-dragon-500 mb-2" />
                    <div className="flex items-center gap-2">
                        <input 
                            type="number"
                            className="w-12 text-center text-2xl font-bold bg-transparent border-b border-white/20 focus:border-red-500 outline-none"
                            value={character.hp.current}
                            onChange={(e) => updateChar({...character, hp: {...character.hp, current: parseInt(e.target.value) || 0}})}
                        />
                        <span className="text-xl">/</span>
                        <input 
                             type="number"
                             className="w-10 text-center text-xl opacity-70 bg-transparent border-b border-white/10"
                             value={character.hp.max}
                             onChange={(e) => isGMView && updateChar({...character, hp: {...character.hp, max: parseInt(e.target.value) || character.hp.max}})}
                             disabled={!isGMView}
                        />
                    </div>
                    <span className="text-xs uppercase mt-1">Hit Points</span>
                </div>
             </div>

             {/* Inventory Panel */}
             <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg h-full border border-slate-400 dark:border-slate-700 flex flex-col shadow-inner">
                 <div className="flex justify-between items-center mb-3">
                     <div className="flex items-center gap-2">
                         <h3 className="font-cinzel text-xl font-bold">Inventory</h3>
                         <span className="text-xs bg-slate-300 dark:bg-slate-700 px-2 py-0.5 rounded-full opacity-70">{character.inventory.length}</span>
                     </div>
                     {isGMView && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded border border-amber-500/50 font-bold uppercase tracking-wider">Modify Mode</span>}
                 </div>

                 {/* Search & Add Bar */}
                 <div className="flex gap-2 mb-3">
                     <div className="relative flex-1">
                         <Search className="absolute left-2 top-2 text-slate-400" size={14} />
                         <input 
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            placeholder="Filter items..."
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                         />
                     </div>
                     <button 
                        onClick={() => setIsAddingItem(!isAddingItem)}
                        className={`p-1.5 rounded transition-colors ${isAddingItem ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                        title={isAddingItem ? "Cancel" : "Add Item"}
                     >
                        {isAddingItem ? <X size={16}/> : <Plus size={16}/>}
                     </button>
                 </div>

                 {/* Add Item Form */}
                 {isAddingItem && (
                     <div className="mb-3 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                         <input 
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            placeholder="New item Name..."
                            autoFocus
                            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                         />
                         <button onClick={handleAddItem} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-500">
                             Save
                         </button>
                     </div>
                 )}
                 
                 {/* Item List */}
                 <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-2 custom-scrollbar">
                     {filteredInventory.length === 0 && (
                         <div className="text-center text-slate-500 text-xs py-8 italic border-2 border-dashed border-slate-300 dark:border-slate-800 rounded">
                             {filterQuery ? "No matching items." : "Empty backpack."}
                         </div>
                     )}
                     {filteredInventory.map((item, idx) => (
                         <div key={item.id || idx} className={`group flex flex-col p-2 rounded-lg border transition-all ${
                             item.equipped 
                             ? 'bg-gradient-to-r from-green-50 to-white dark:from-green-900/10 dark:to-slate-800 border-green-200 dark:border-green-900/50' 
                             : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                         }`}>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-md shrink-0 flex items-center justify-center ${
                                        item.equipped ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                                    }`}>
                                        {getIconForItem(item)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm font-bold truncate ${item.equipped ? 'text-green-800 dark:text-green-200' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {item.name}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            {item.isQuestItem && <span className="text-amber-500 font-bold flex items-center gap-0.5"><Lock size={8}/> Quest</span>}
                                            {item.equipped && <span>Equipped</span>}
                                            {!item.equipped && !item.isQuestItem && <span>Item</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 pl-2">
                                     {/* Quantity Controls */}
                                     <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 mr-2">
                                         <button 
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-l transition-colors"
                                         >
                                             <Minus size={10}/>
                                         </button>
                                         <span className="w-8 text-center text-xs font-mono">{item.quantity || 1}</span>
                                         <button 
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-r transition-colors"
                                         >
                                             <Plus size={10}/>
                                         </button>
                                     </div>

                                     {/* Actions */}
                                    <button 
                                        onClick={() => toggleEquip(item.id)} 
                                        className={`p-1.5 rounded transition-colors ${item.equipped ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                        title={item.equipped ? "Unequip" : "Equip"}
                                    >
                                        <Shield size={14}/>
                                    </button>
                                    <button 
                                        onClick={() => handleTransferClick(item)}
                                        className="p-1.5 rounded text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        title="Transfer"
                                    >
                                        <ArrowRightLeft size={14}/>
                                    </button>
                                    <button 
                                        onClick={() => deleteItem(item.id)}
                                        disabled={isQuestItem(item) && !isGMView}
                                        className={`p-1.5 rounded transition-colors ${isQuestItem(item) && !isGMView ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                    <h4 className="font-bold text-sm mb-2 text-slate-600 dark:text-slate-300 uppercase tracking-wider">Notes & Backstory</h4>
                     <textarea 
                        className="w-full h-24 bg-transparent resize-none outline-none font-sans text-sm p-2 border border-slate-300 dark:border-slate-500/20 rounded focus:border-indigo-500 transition-colors text-slate-800 dark:text-slate-300"
                        value={character.notes}
                        onChange={(e) => updateChar({...character, notes: e.target.value})}
                        placeholder="Character notes..."
                     />
                 </div>
             </div>
        </div>

        {/* Right Column: Skills & Magic */}
        <div className="space-y-6">
            <h3 className="text-xl font-cinzel border-b border-slate-500 inline-block mb-2">Capabilities</h3>
            
            {/* Skills */}
            <div className="bg-slate-900/50 p-4 rounded border border-slate-600/50">
                <h4 className="font-bold mb-3 text-indigo-300">Skills (Prof +2)</h4>
                <div className="grid grid-cols-1 gap-1 text-sm font-sans">
                    {(character.skills || []).sort().map(skill => (
                        <div key={skill} className="flex justify-between items-center px-2 py-1 bg-white/5 rounded">
                            <span>{skill}</span>
                            <span className="text-xs bg-indigo-900 px-1 rounded text-white">+2</span>
                        </div>
                    ))}
                    {(!character.skills || character.skills.length === 0) && (
                        <span className="text-xs opacity-50 italic">No skills trained</span>
                    )}
                </div>
            </div>

            {/* Magic Section */}
            {character.spells && (
                <div className="mt-4 p-4 bg-purple-900/20 rounded border border-purple-500/30">
                     <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2 text-purple-400">
                             <Zap size={20} />
                             <h4 className="font-bold">Magic</h4>
                         </div>
                         <div className="flex items-center gap-1 text-xs">
                             <span className="text-slate-400">L1 Slots:</span>
                             <span className={`font-bold text-lg ${spellSlots.current === 0 ? 'text-red-500' : 'text-white'}`}>{spellSlots.current}</span>
                             <span className="text-slate-500">/</span>
                             <span className="text-slate-500">{spellSlots.max}</span>
                             <button onClick={restoreSpellSlots} className="ml-2 hover:text-green-400"><RefreshCw size={12}/></button>
                         </div>
                     </div>
                     
                     {/* Cantrips */}
                     <div className="mb-4">
                        <h5 className="text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-1"><Sparkles size={10}/> Cantrips</h5>
                        <div className="flex flex-wrap gap-2">
                            {character.spells.cantrips.map(s => (
                                <span key={s} className="px-2 py-1 bg-slate-800 text-purple-200 text-xs rounded border border-purple-800/50">
                                    {s}
                                </span>
                            ))}
                        </div>
                     </div>

                     {/* Spells */}
                     <div>
                        <h5 className="text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-1"><Book size={10}/> Level 1</h5>
                        <div className="space-y-1">
                            {character.spells.level1.map(s => (
                                <div key={s} className="flex justify-between items-center px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50 hover:bg-slate-700 transition-colors group">
                                    <span className="text-xs text-white">{s}</span>
                                    <button 
                                        onClick={useSpellSlot}
                                        disabled={spellSlots.current === 0}
                                        className="text-[10px] bg-purple-700 hover:bg-purple-600 px-2 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:bg-slate-700 disabled:opacity-50"
                                    >
                                        Cast
                                    </button>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}