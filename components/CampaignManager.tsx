
import React, { useState, useEffect } from 'react';
import { generateQuest, generateNPC, generateMonster, generateSpell, generateItem, generateSkill, generateStory, generateSceneImage, generateMapImage } from '../services/geminiService';
import { Quest, GeneratedNPC, GameGenre, LibraryItem, Story } from '../types';
import { Scroll, Skull, Gift, UserPlus, Loader2, Sparkles, Sword, Shield, Feather, Book, Menu as MenuIcon, Hammer, History, Trash2, ChevronRight, Save, Image, Map, Share2 } from 'lucide-react';

const TOOLS = [
    { id: 'quest', label: 'Quest Generator', icon: Scroll, color: 'text-amber-500' },
    { id: 'npc', label: 'NPC Creator', icon: UserPlus, color: 'text-indigo-400' },
    { id: 'monster', label: 'Monster Forge', icon: Skull, color: 'text-red-500' },
    { id: 'spell', label: 'Spell Scribe', icon: Sparkles, color: 'text-purple-400' },
    { id: 'item', label: 'Item Smith', icon: Hammer, color: 'text-slate-300' },
    { id: 'skill', label: 'Skill/Feat Designer', icon: Shield, color: 'text-green-500' },
    { id: 'story', label: 'Story Weaver', icon: Feather, color: 'text-pink-400' },
    { id: 'image', label: 'Artificer (Images)', icon: Image, color: 'text-cyan-400' },
    { id: 'map', label: 'Cartographer (Maps)', icon: Map, color: 'text-emerald-600' },
];

const GENRES: GameGenre[] = ['Fantasy', 'Sci-Fi', 'Cyberpunk', 'Post-Apocalyptic', 'Epic War', 'Eldritch Horror', 'Steampunk', 'Western'];

interface HistoryItem {
    id: string;
    toolId: string;
    timestamp: number;
    summary: string;
    subSummary?: string;
    data: any;
}

interface Props {
    onSetScene?: (url: string) => void;
    onSetMap?: (url: string) => void;
    onShare?: (content: string) => void;
}

export default function CampaignManager({ onSetScene, onSetMap, onShare }: Props) {
  const [activeTool, setActiveTool] = useState(TOOLS[0].id);
  const [genre, setGenre] = useState<GameGenre>('Fantasy');
  const [loading, setLoading] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewMode, setViewMode] = useState<'result' | 'history'>('result');

  // -- INPUT STATES --
  // Quest
  const [questLevel, setQuestLevel] = useState(1);
  const [questTheme, setQuestTheme] = useState('Haunted Forest');
  const [generatedQuest, setGeneratedQuest] = useState<Quest | null>(null);

  // NPC
  const [npcDesc, setNpcDesc] = useState('');
  const [generatedNPC, setGeneratedNPC] = useState<GeneratedNPC | null>(null);

  // Monster
  const [monsterDesc, setMonsterDesc] = useState('');
  const [monsterCR, setMonsterCR] = useState('1');
  const [generatedMonster, setGeneratedMonster] = useState<LibraryItem | null>(null);

  // Spell
  const [spellDesc, setSpellDesc] = useState('');
  const [spellLevel, setSpellLevel] = useState('1');
  const [generatedSpell, setGeneratedSpell] = useState<LibraryItem | null>(null);

  // Item
  const [itemDesc, setItemDesc] = useState('');
  const [itemType, setItemType] = useState('Weapon');
  const [generatedItem, setGeneratedItem] = useState<LibraryItem | null>(null);

  // Skill
  const [skillDesc, setSkillDesc] = useState('');
  const [skillAttr, setSkillAttr] = useState('DEX');
  const [generatedSkill, setGeneratedSkill] = useState<LibraryItem | null>(null);

  // Story
  const [storyPrompt, setStoryPrompt] = useState('');
  const [storyLength, setStoryLength] = useState<'intro' | 'short' | 'long'>('short');
  const [generatedStory, setGeneratedStory] = useState<Story | null>(null);

  // Image (Artificer)
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageRatio, setImageRatio] = useState<string>('16:9');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Map (Cartographer)
  const [mapPrompt, setMapPrompt] = useState('');
  const [generatedMap, setGeneratedMap] = useState<string | null>(null);

  // --- HISTORY LOGIC ---
  useEffect(() => {
      const saved = localStorage.getItem('dnd_arcane_history');
      if (saved) {
          try {
              setHistory(JSON.parse(saved));
          } catch (e) {
              console.error("Failed to load history", e);
          }
      }
  }, []);

  const saveToHistory = (toolId: string, data: any, summary: string, subSummary?: string) => {
      const newItem: HistoryItem = {
          id: Date.now().toString(),
          toolId,
          timestamp: Date.now(),
          summary,
          subSummary,
          data
      };
      const updated = [newItem, ...history].slice(0, 50); // Keep last 50
      setHistory(updated);
      localStorage.setItem('dnd_arcane_history', JSON.stringify(updated));
  };

  const deleteFromHistory = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const updated = history.filter(h => h.id !== id);
      setHistory(updated);
      localStorage.setItem('dnd_arcane_history', JSON.stringify(updated));
  };

  const loadFromHistory = (item: HistoryItem) => {
      switch(item.toolId) {
          case 'quest': setGeneratedQuest(item.data); break;
          case 'npc': setGeneratedNPC(item.data); break;
          case 'monster': setGeneratedMonster(item.data); break;
          case 'spell': setGeneratedSpell(item.data); break;
          case 'item': setGeneratedItem(item.data); break;
          case 'skill': setGeneratedSkill(item.data); break;
          case 'story': setGeneratedStory(item.data); break;
          case 'image': setGeneratedImage(item.data); break;
          case 'map': setGeneratedMap(item.data); break;
      }
      setViewMode('result');
  };

  // --- HANDLERS ---

  const handleGenQuest = async () => {
      setLoading(true);
      const res = await generateQuest(questLevel, questTheme, genre);
      setGeneratedQuest(res);
      if (res) saveToHistory('quest', res, res.title, `Lvl ${questLevel} ${genre} Quest`);
      setViewMode('result');
      setLoading(false);
  };
  const handleGenNPC = async () => {
      setLoading(true);
      const res = await generateNPC(npcDesc, genre);
      setGeneratedNPC(res);
      if (res) saveToHistory('npc', res, res.name, `${res.race} ${res.role}`);
      setViewMode('result');
      setLoading(false);
  };
  const handleGenMonster = async () => {
      setLoading(true);
      const res = await generateMonster(monsterDesc, monsterCR, genre);
      setGeneratedMonster(res);
      if (res) saveToHistory('monster', res, res.name, `CR ${res.cr} ${res.type}`);
      setViewMode('result');
      setLoading(false);
  };
  const handleGenSpell = async () => {
      setLoading(true);
      const res = await generateSpell(spellDesc, spellLevel, genre);
      setGeneratedSpell(res);
      if (res) saveToHistory('spell', res, res.name, `${res.level} ${res.school}`);
      setViewMode('result');
      setLoading(false);
  };
  const handleGenItem = async () => {
      setLoading(true);
      const res = await generateItem(itemDesc, itemType, genre);
      setGeneratedItem(res);
      if (res) saveToHistory('item', res, res.name, res.category || itemType);
      setViewMode('result');
      setLoading(false);
  };
  const handleGenSkill = async () => {
      setLoading(true);
      const res = await generateSkill(skillDesc, skillAttr, genre);
      setGeneratedSkill(res);
      if (res) saveToHistory('skill', res, res.name, `${res.ability} Skill`);
      setViewMode('result');
      setLoading(false);
  };
  const handleGenStory = async () => {
      setLoading(true);
      const res = await generateStory(storyPrompt, storyLength, genre);
      setGeneratedStory(res);
      if (res) saveToHistory('story', res, res.title, "Story Hook");
      setViewMode('result');
      setLoading(false);
  };
  const handleGenImage = async () => {
      setLoading(true);
      const fullPrompt = `${genre} style: ${imagePrompt}`;
      const res = await generateSceneImage(fullPrompt, imageRatio);
      setGeneratedImage(res);
      if (res) saveToHistory('image', res, "Generated Image", `${imageRatio} - ${genre}`);
      setViewMode('result');
      setLoading(false);
  };
  const handleGenMap = async () => {
      setLoading(true);
      const res = await generateMapImage(mapPrompt);
      setGeneratedMap(res);
      if (res) saveToHistory('map', res, "Tactical Map", "Grid Battle Map");
      setViewMode('result');
      setLoading(false);
  };

  // Helper to share content with Markdown Headers for better chat formatting
  const handleShare = (type: string, data: any) => {
      if (!onShare) return;
      let content = "";
      switch(type) {
          case 'quest':
              content = `### 📜 QUEST: ${data.title}\n\n_"${data.hook}"_\n\n**Mission:**\n${data.description}\n\n**Rewards:**\n${data.rewards.join(', ')}`;
              break;
          case 'npc':
              content = `### 👤 NPC: ${data.name}\n${data.race} ${data.role}\n\n**Personality:** _${data.personality}_\n\n**Inventory:** ${data.inventory.join(', ')}`;
              break;
          case 'monster':
              content = `### 💀 MONSTER: ${data.name}\n${data.type} (CR ${data.cr})\nAC: ${data.ac} | HP: ${data.hp}\nSpeed: ${data.speed}\n\n${data.traits?.map((t: string) => `• ${t}`).join('\n') || ''}\n\n**Actions:**\n${data.actions?.map((a:any) => `• **${a.name}:** ${a.desc}`).join('\n') || ''}`;
              break;
          case 'spell':
              content = `### ✨ SPELL: ${data.name}\nLevel ${data.level} ${data.school}\nTime: ${data.castingTime} | Range: ${data.range}\nDuration: ${data.duration}\n\n_${data.desc}_`;
              break;
          case 'item':
              content = `### ⚒️ ITEM: ${data.name}\n_${data.category}_\n\n`;
              if (data.damage) content += `• **Damage:** ${data.damage}\n`;
              if (data.acBonus) content += `• **AC Bonus:** +${data.acBonus}\n`;
              if (data.cost) content += `• **Value:** ${data.cost}\n`;
              if (data.weight) content += `• **Weight:** ${data.weight}\n`;
              if (data.properties && data.properties.length > 0) content += `• **Properties:** ${data.properties.join(', ')}\n`;
              content += `\n${data.desc}`;
              break;
          case 'skill':
              content = `### 🛡️ SKILL: ${data.name} (${data.ability})\n\n${data.desc}`;
              break;
          case 'story':
              content = `### 📖 STORY: ${data.title}\n\n${data.content}`;
              break;
      }
      onShare(content);
  };

  // Switch tools resets view to result
  const handleToolChange = (id: string) => {
      setActiveTool(id);
      setViewMode('result');
  };

  // --- SUB-COMPONENT: OUTPUT WRAPPER ---
  const ToolOutput = ({ 
    children, 
    isEmpty 
  }: { 
    children?: React.ReactNode, 
    isEmpty: boolean 
  }) => {
      const toolHistory = history.filter(h => h.toolId === activeTool);

      return (
          <div className="flex flex-col h-full bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
              {/* Header Toggles */}
              <div className="flex border-b border-slate-700 bg-slate-800 shrink-0">
                  <button 
                    onClick={() => setViewMode('result')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${viewMode === 'result' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}
                  >
                      <Sparkles size={16}/> Generated Result
                  </button>
                  <button 
                    onClick={() => setViewMode('history')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${viewMode === 'history' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}
                  >
                      <History size={16}/> History <span className="text-xs bg-slate-900 px-1.5 py-0.5 rounded-full text-slate-400">{toolHistory.length}</span>
                  </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900/50 relative">
                  {viewMode === 'history' ? (
                      <div className="space-y-3">
                          {toolHistory.length === 0 && (
                              <div className="text-center py-10 text-slate-500 italic">No history yet. Start creating!</div>
                          )}
                          {toolHistory.map(item => (
                              <div key={item.id} onClick={() => loadFromHistory(item)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-lg flex justify-between items-center cursor-pointer group transition-all">
                                  <div>
                                      <div className="font-bold text-white text-sm">{item.summary}</div>
                                      <div className="text-xs text-slate-400 flex items-center gap-2">
                                          <span>{item.subSummary}</span>
                                          <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors"/>
                                      <button 
                                        onClick={(e) => deleteFromHistory(e, item.id)}
                                        className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete"
                                      >
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="h-full">
                          {isEmpty ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                                  <Sparkles size={48} className="mb-4 stroke-1"/>
                                  <p className="italic">The arcane canvas is blank...</p>
                              </div>
                          ) : children}
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderActiveTool = () => {
      switch(activeTool) {
          case 'quest': return (
              <>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-amber-500">Quest Parameters</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-slate-400">Party Level</label><input type="number" min="1" max="20" value={questLevel} onChange={(e)=>setQuestLevel(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"/></div>
                        <div><label className="text-xs text-slate-400">Theme/Setting</label><input value={questTheme} onChange={(e)=>setQuestTheme(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"/></div>
                        <button onClick={handleGenQuest} disabled={loading} className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<Gift size={18}/>} Generate Quest</button>
                    </div>
                </div>
                <ToolOutput isEmpty={!generatedQuest}>
                    {generatedQuest && (
                        <div className="bg-parchment-100 text-slate-900 p-6 rounded-lg border-2 border-amber-800/50 shadow-inner font-fell h-full overflow-y-auto animate-in fade-in">
                            <div className="flex justify-between items-center border-b border-dragon-900/30 pb-2 mb-4">
                                <h2 className="text-3xl font-bold font-cinzel text-dragon-900">{generatedQuest.title}</h2>
                                {onShare && <button onClick={() => handleShare('quest', generatedQuest)} className="p-2 text-dragon-900 hover:text-amber-600" title="Share to Chat"><Share2 size={20}/></button>}
                            </div>
                            <p className="italic text-lg my-4">"{generatedQuest.hook}"</p>
                            <div className="bg-amber-900/10 p-4 rounded mb-4"><h4 className="font-bold text-amber-900 uppercase text-xs tracking-wider mb-1">Mission</h4><p>{generatedQuest.description}</p></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><h4 className="font-bold text-dragon-900 flex items-center gap-1"><Skull size={14}/> Threats</h4><ul className="list-disc pl-5 text-sm">{generatedQuest.enemies.map((e,i)=><li key={i}>{e}</li>)}</ul></div>
                                <div><h4 className="font-bold text-dragon-900 flex items-center gap-1"><Gift size={14}/> Rewards</h4><ul className="list-disc pl-5 text-sm">{generatedQuest.rewards.map((r,i)=><li key={i}>{r}</li>)}</ul></div>
                            </div>
                        </div>
                    )}
                </ToolOutput>
              </>
          );
          case 'npc': return (
              <>
                 <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-indigo-400">NPC Creator</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-slate-400">Brief Description</label><textarea value={npcDesc} onChange={(e)=>setNpcDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-32 resize-none" placeholder="e.g. A nervous goblin shopkeeper..."/></div>
                        <button onClick={handleGenNPC} disabled={loading} className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-3 rounded flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<UserPlus size={18}/>} Summon NPC</button>
                    </div>
                </div>
                <ToolOutput isEmpty={!generatedNPC}>
                    {generatedNPC && (
                        <div className="bg-slate-200 text-slate-900 p-6 rounded-lg border-4 border-double border-slate-400 shadow-xl font-fell h-full overflow-y-auto animate-in fade-in">
                             <div className="border-b-2 border-slate-800 pb-2 mb-4 flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-bold font-cinzel">{generatedNPC.name}</h2>
                                    <span className="text-sm uppercase font-sans tracking-widest text-slate-600">{generatedNPC.race} • {generatedNPC.role}</span>
                                </div>
                                {onShare && <button onClick={() => handleShare('npc', generatedNPC)} className="p-2 text-slate-700 hover:text-indigo-600" title="Share to Chat"><Share2 size={20}/></button>}
                             </div>
                             <p className="mb-2"><span className="font-bold">Personality:</span> {generatedNPC.personality}</p>
                             <p className="bg-red-100 p-2 rounded border border-red-200 text-red-900 mb-4"><span className="font-bold">Secret:</span> {generatedNPC.secret}</p>
                             <div className="mt-4"><h4 className="font-bold border-b border-slate-400 mb-2">Inventory</h4><ul className="grid grid-cols-2 gap-2 text-sm">{generatedNPC.inventory.map((item,i)=><li key={i}>• {item}</li>)}</ul></div>
                        </div>
                    )}
                </ToolOutput>
              </>
          );
          case 'monster': return (
              <>
                 <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-red-500">Monster Forge</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-slate-400">Concept/Name</label><input value={monsterDesc} onChange={(e)=>setMonsterDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="e.g. Crystal Golem"/></div>
                        <div><label className="text-xs text-slate-400">Challenge Rating (CR)</label><input value={monsterCR} onChange={(e)=>setMonsterCR(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="5"/></div>
                        <button onClick={handleGenMonster} disabled={loading} className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-3 rounded flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<Skull size={18}/>} Forge Monster</button>
                    </div>
                </div>
                <ToolOutput isEmpty={!generatedMonster}>
                    {generatedMonster && (
                        <div className="bg-parchment-200 text-slate-900 p-6 rounded-lg border border-slate-500 shadow-xl font-sans h-full overflow-y-auto animate-in fade-in">
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-bold font-cinzel text-red-900">{generatedMonster.name}</h2>
                                {onShare && <button onClick={() => handleShare('monster', generatedMonster)} className="p-2 text-red-900 hover:text-red-600" title="Share to Chat"><Share2 size={20}/></button>}
                            </div>
                            <div className="italic text-sm mb-2">{generatedMonster.type}</div>
                            <div className="bg-red-900 h-1 w-full mb-2"></div>
                            <div className="text-red-900 font-bold">Armor Class <span className="text-black font-normal">{generatedMonster.ac}</span></div>
                            <div className="text-red-900 font-bold">Hit Points <span className="text-black font-normal">{generatedMonster.hp}</span></div>
                            <div className="text-red-900 font-bold mb-2">Speed <span className="text-black font-normal">{generatedMonster.speed}</span></div>
                            <div className="bg-red-900 h-1 w-full mb-2"></div>
                            <div className="grid grid-cols-6 gap-2 text-center text-xs mb-4">
                                {Object.entries(generatedMonster.stats || {}).map(([k,v]) => <div key={k}><div className="font-bold">{k}</div><div>{v}</div></div>)}
                            </div>
                            <div className="bg-red-900 h-1 w-full mb-2"></div>
                             {generatedMonster.traits?.map((t, i) => <div key={i} className="mb-2 text-sm" dangerouslySetInnerHTML={{__html: t.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}}/>)}
                             <h4 className="text-lg font-cinzel border-b border-red-900 text-red-900 mt-4 mb-2">Actions</h4>
                             {generatedMonster.actions?.map((a, i) => <div key={i} className="mb-2 text-sm"><span className="font-bold italic">{a.name}.</span> {a.desc}</div>)}
                        </div>
                    )}
                </ToolOutput>
              </>
          );
          case 'spell': return (
              <>
                 <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-purple-400">Spell Scribe</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-slate-400">Name/Effect</label><input value={spellDesc} onChange={(e)=>setSpellDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="e.g. Gravity Crush"/></div>
                        <div><label className="text-xs text-slate-400">Spell Level</label><input value={spellLevel} onChange={(e)=>setSpellLevel(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="3rd-level"/></div>
                        <button onClick={handleGenSpell} disabled={loading} className="w-full bg-purple-900 hover:bg-purple-800 text-white font-bold py-3 rounded flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<Sparkles size={18}/>} Inscribe Spell</button>
                    </div>
                </div>
                <ToolOutput isEmpty={!generatedSpell}>
                     {generatedSpell && (
                         <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg text-white font-sans h-full overflow-y-auto animate-in fade-in">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-cinzel text-purple-400">{generatedSpell.name}</h2>
                                    <div className="text-sm italic text-slate-400">{generatedSpell.level} {generatedSpell.school}</div>
                                </div>
                                {onShare && <button onClick={() => handleShare('spell', generatedSpell)} className="p-2 text-purple-400 hover:text-white" title="Share to Chat"><Share2 size={20}/></button>}
                             </div>
                             <div className="grid grid-cols-2 gap-4 text-sm text-slate-300 my-4">
                                 <div><span className="font-bold text-purple-400">Casting Time:</span> {generatedSpell.castingTime || "1 Action"}</div>
                                 <div><span className="font-bold text-purple-400">Range:</span> {generatedSpell.range || "60 ft"}</div>
                                 <div><span className="font-bold text-purple-400">Components:</span> {generatedSpell.components || "V, S"}</div>
                                 <div><span className="font-bold text-purple-400">Duration:</span> {generatedSpell.duration || "Instant"}</div>
                             </div>
                             <p className="text-slate-200 leading-relaxed border-t border-slate-700 pt-4">{generatedSpell.desc}</p>
                             <div className="text-xs text-slate-500 mt-4">Classes: {generatedSpell.classes?.join(', ')}</div>
                         </div>
                     )}
                </ToolOutput>
              </>
          );
          case 'item': return (
              <>
                 <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-slate-300">Item Smith</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-slate-400">Description</label><input value={itemDesc} onChange={(e)=>setItemDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="e.g. Dagger of Venom"/></div>
                        <div><label className="text-xs text-slate-400">Type</label>
                            <select value={itemType} onChange={(e)=>setItemType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                                <option>Weapon</option><option>Armor</option><option>Wondrous Item</option><option>Potion</option>
                            </select>
                        </div>
                        <button onClick={handleGenItem} disabled={loading} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<Hammer size={18}/>} Craft Item</button>
                    </div>
                </div>
                <ToolOutput isEmpty={!generatedItem}>
                     {generatedItem && (
                         <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg text-white font-sans h-full overflow-y-auto animate-in fade-in space-y-4">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-cinzel text-amber-200">{generatedItem.name}</h2>
                                    <div className="text-sm italic text-slate-400">{generatedItem.category}, {generatedItem.rarity || 'Common'}</div>
                                </div>
                                {onShare && <button onClick={() => handleShare('item', generatedItem)} className="p-2 text-slate-400 hover:text-white" title="Share to Chat"><Share2 size={20}/></button>}
                             </div>
                             {generatedItem.descriptionFlavor && <div className="italic text-slate-400 border-l-2 border-slate-700 pl-3">{generatedItem.descriptionFlavor}</div>}
                             <div className="grid grid-cols-2 gap-2 text-sm">
                                 {generatedItem.damage && <div><span className="font-bold text-red-400">Damage:</span> {generatedItem.damage}</div>}
                                 {generatedItem.acBonus && <div><span className="font-bold text-blue-400">AC Bonus:</span> +{generatedItem.acBonus}</div>}
                                 {generatedItem.cost && <div><span className="font-bold text-amber-500">Value:</span> {generatedItem.cost}</div>}
                                 {generatedItem.weight && <div><span className="font-bold text-slate-400">Weight:</span> {generatedItem.weight}</div>}
                             </div>
                             <p className="text-slate-200">{generatedItem.desc}</p>
                         </div>
                     )}
                </ToolOutput>
              </>
          );
          case 'skill': return (
              <>
                 <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-green-500">Skill / Feat</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-slate-400">Concept</label><input value={skillDesc} onChange={(e)=>setSkillDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="e.g. Wall Running"/></div>
                        <div><label className="text-xs text-slate-400">Attribute</label>
                            <select value={skillAttr} onChange={(e)=>setSkillAttr(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                                <option>STR</option><option>DEX</option><option>CON</option><option>INT</option><option>WIS</option><option>CHA</option>
                            </select>
                        </div>
                        <button onClick={handleGenSkill} disabled={loading} className="w-full bg-green-800 hover:bg-green-700 text-white font-bold py-3 rounded flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<Shield size={18}/>} Design Skill</button>
                    </div>
                </div>
                <ToolOutput isEmpty={!generatedSkill}>
                     {generatedSkill && (
                         <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg text-white font-sans h-full overflow-y-auto animate-in fade-in space-y-4">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-cinzel text-green-400">{generatedSkill.name}</h2>
                                    <div className="text-sm font-bold text-slate-500 uppercase">{generatedSkill.ability} Based</div>
                                </div>
                                {onShare && <button onClick={() => handleShare('skill', generatedSkill)} className="p-2 text-green-400 hover:text-white" title="Share to Chat"><Share2 size={20}/></button>}
                             </div>
                             <p className="text-slate-200">{generatedSkill.desc}</p>
                             {generatedSkill.situations && (
                                 <div className="bg-slate-800 p-3 rounded">
                                     <h4 className="font-bold text-green-500 text-xs uppercase mb-2">Applications</h4>
                                     <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                                         {generatedSkill.situations.map((s,i)=><li key={i}>{s}</li>)}
                                     </ul>
                                 </div>
                             )}
                         </div>
                     )}
                </ToolOutput>
              </>
          );
          case 'story': return (
               <>
                 <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-pink-400">Story Weaver</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400">Prompt / Hook</label>
                            <textarea value={storyPrompt} onChange={(e)=>setStoryPrompt(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-32 resize-none" placeholder="e.g. A mystery involving a disappearing tower..."/>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Story Length</label>
                            <select 
                                value={storyLength} 
                                onChange={(e) => setStoryLength(e.target.value as 'intro' | 'short' | 'long')}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-pink-500"
                            >
                                <option value="intro">Intro / Hook (Short)</option>
                                <option value="short">Standard Scene (Medium)</option>
                                <option value="long">Detailed Narrative (Long)</option>
                            </select>
                        </div>
                        <button onClick={handleGenStory} disabled={loading} className="w-full bg-pink-900 hover:bg-pink-800 text-white font-bold py-3 rounded flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<Feather size={18}/>} Weave Story</button>
                    </div>
                </div>
                <ToolOutput isEmpty={!generatedStory}>
                     {generatedStory && (
                         <div className="bg-parchment-100 text-slate-900 p-8 rounded-lg border-2 border-slate-400 shadow-xl font-fell h-full overflow-y-auto animate-in fade-in leading-relaxed relative">
                             <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                                <h2 className="text-3xl font-bold font-cinzel text-center flex-1">{generatedStory.title}</h2>
                                {onShare && <button onClick={() => handleShare('story', generatedStory)} className="p-2 text-slate-600 hover:text-pink-600" title="Share to Chat"><Share2 size={20}/></button>}
                             </div>
                             <div className="italic text-center mb-6 text-slate-600 font-sans">"{generatedStory.hook}"</div>
                             <div className="whitespace-pre-wrap text-lg">{generatedStory.content}</div>
                         </div>
                     )}
                </ToolOutput>
              </>
          );
          case 'image': return (
              <>
                 <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-cyan-400">Artificer (Visuals)</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-slate-400">Description</label><textarea value={imagePrompt} onChange={(e)=>setImagePrompt(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-24 resize-none" placeholder="e.g. A glowing magical sword resting on a stone..."/></div>
                        <div>
                            <label className="text-xs text-slate-400">Aspect Ratio</label>
                            <select value={imageRatio} onChange={(e)=>setImageRatio(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                                <option value="16:9">Landscape (16:9)</option>
                                <option value="1:1">Square (1:1) - Best for Tokens</option>
                                <option value="3:4">Portrait (3:4) - Best for Characters</option>
                            </select>
                        </div>
                        <button onClick={handleGenImage} disabled={loading} className="w-full bg-cyan-900 hover:bg-cyan-800 text-white font-bold py-3 rounded flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<Image size={18}/>} Generate Art</button>
                    </div>
                </div>
                <ToolOutput isEmpty={!generatedImage}>
                     {generatedImage && (
                         <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 h-full flex flex-col items-center justify-center animate-in fade-in">
                             <img src={generatedImage} alt="Generated Art" className="max-w-full max-h-full rounded shadow-2xl border-2 border-slate-700" />
                             {onSetScene && (
                                <button 
                                    onClick={() => onSetScene(generatedImage)}
                                    className="mt-4 px-6 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded shadow-lg flex items-center gap-2"
                                >
                                    <Image size={18}/> Set as Scene
                                </button>
                             )}
                         </div>
                     )}
                </ToolOutput>
              </>
          );
          case 'map': return (
              <>
                 <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-emerald-600">Cartographer</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-slate-400">Location Description</label><textarea value={mapPrompt} onChange={(e)=>setMapPrompt(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-24 resize-none" placeholder="e.g. A ruined temple courtyard with lava flows..."/></div>
                        <div className="text-xs text-slate-500 italic">Generates a top-down, gridded tactical map suitable for combat.</div>
                        <button onClick={handleGenMap} disabled={loading} className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-3 rounded flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<Map size={18}/>} Draft Map</button>
                    </div>
                </div>
                <ToolOutput isEmpty={!generatedMap}>
                     {generatedMap && (
                         <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 h-full flex flex-col items-center justify-center animate-in fade-in">
                             <img src={generatedMap} alt="Generated Map" className="max-w-full max-h-full rounded shadow-2xl border-2 border-slate-700" />
                             {onSetMap && (
                                <button 
                                    onClick={() => onSetMap(generatedMap)}
                                    className="mt-4 px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded shadow-lg flex items-center gap-2"
                                >
                                    <Map size={18}/> Set as Battle Map
                                </button>
                             )}
                         </div>
                     )}
                </ToolOutput>
              </>
          );
          default: return null;
      }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
             <div className="bg-slate-800 p-4 rounded-lg border border-slate-600 mb-2">
                 <h2 className="text-xl font-cinzel text-white flex items-center gap-2"><Hammer size={20} className="text-amber-500"/> Arcane Tools</h2>
             </div>
             
             {/* Genre Selector - Global for Tools */}
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-4">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">World Setting</label>
                 <select 
                    value={genre} 
                    onChange={(e) => setGenre(e.target.value as GameGenre)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-amber-500 outline-none"
                 >
                     {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
             </div>

             <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                 {TOOLS.map(tool => (
                     <button
                        key={tool.id}
                        onClick={() => handleToolChange(tool.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                            activeTool === tool.id 
                            ? 'bg-slate-800 text-white border-l-4 border-amber-500 shadow-md' 
                            : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                        }`}
                     >
                         <tool.icon size={18} className={activeTool === tool.id ? tool.color : 'text-slate-600'} />
                         <span className="font-bold text-sm">{tool.label}</span>
                     </button>
                 ))}
             </div>
        </div>

        {/* MAIN TOOL AREA */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {renderActiveTool()}
            </div>
        </div>
    </div>
  );
}
