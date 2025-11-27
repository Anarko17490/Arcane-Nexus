

import React, { useState, useEffect } from 'react';
import { Player, GameGenre, GameSettings, Character, ScheduledCampaign, Friend } from '../types';
import { Loader2, Copy, Rocket, Skull, Zap, Swords, Ghost, Calendar, Clock, Plus, MapPin, User, UserPlus, Play, ChevronUp, ChevronDown, Bot } from 'lucide-react';

interface Props {
    onJoin: (player: Player, settings?: GameSettings) => void;
    username: string;
    character: Character | null;
    friends: Friend[];
    onInviteFriend: (friendName: string, campaignTitle: string) => void;
    onSelectCharacter: (char: Character) => void;
}

const GENRES: { id: GameGenre, label: string, icon: any, color: string }[] = [
    { id: 'Fantasy', label: 'Fantasy', icon: Swords, color: 'text-amber-500' },
    { id: 'Sci-Fi', label: 'Sci-Fi', icon: Rocket, color: 'text-blue-400' },
    { id: 'Cyberpunk', label: 'Cyberpunk', icon: Zap, color: 'text-fuchsia-400' },
    { id: 'Post-Apocalyptic', label: 'Post-Apo', icon: Skull, color: 'text-stone-400' },
    { id: 'Epic War', label: 'Epic War', icon: Swords, color: 'text-red-500' },
    { id: 'Eldritch Horror', label: 'Horror', icon: Ghost, color: 'text-purple-600' },
];

export default function Lobby({ onJoin, username, character, friends, onInviteFriend, onSelectCharacter }: Props) {
    const [view, setView] = useState<'instant' | 'board' | 'schedule'>('board');
    const [loading, setLoading] = useState(false);
    
    // Instant Game State
    const [roomCode, setRoomCode] = useState('');
    const [isCreatingInstant, setIsCreatingInstant] = useState(true);
    const [instantGenre, setInstantGenre] = useState<GameGenre>('Fantasy');
    const [instantMaxPlayers, setInstantMaxPlayers] = useState<number>(4);
    const [instantAiEnabled, setInstantAiEnabled] = useState(true);

    // Scheduling State
    const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([]);
    
    // Form State
    const [formTitle, setFormTitle] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');
    const [formGenre, setFormGenre] = useState<GameGenre>('Fantasy');
    const [formMax, setFormMax] = useState(4);
    const [formDesc, setFormDesc] = useState('');
    const [formAiEnabled, setFormAiEnabled] = useState(true);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]); // For invites

    // Character Selector State
    const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
    const [isCharSelectorOpen, setIsCharSelectorOpen] = useState(false);

    useEffect(() => {
        // Load campaigns
        const saved = localStorage.getItem('dnd_campaigns');
        if (saved) {
            setCampaigns(JSON.parse(saved));
        } else {
            // Add some mock data if empty
            const mocks: ScheduledCampaign[] = [
                {
                    id: 'mock1',
                    title: 'The Whispering Shadows',
                    hostName: 'GrandMasterDM',
                    date: '2025-10-31',
                    time: '20:00',
                    genre: 'Eldritch Horror',
                    maxPlayers: 5,
                    aiEnabled: true,
                    registeredPlayers: [{id: 'npc1', name: 'Alice'}, {id: 'npc2', name: 'Bob'}],
                    description: 'An investigation into the disappearance of the town mayor turns into a cosmic nightmare.'
                },
                {
                    id: 'mock2',
                    title: 'Neon Nights Heist',
                    hostName: 'CyberPunk_2099',
                    date: '2025-11-02',
                    time: '18:00',
                    genre: 'Cyberpunk',
                    maxPlayers: 4,
                    aiEnabled: true,
                    registeredPlayers: [],
                    description: 'High stakes corporate extraction. Bring your best netrunning gear.'
                }
            ];
            setCampaigns(mocks);
            localStorage.setItem('dnd_campaigns', JSON.stringify(mocks));
        }

        // Load characters for selector
        const savedChars = localStorage.getItem('dnd_characters');
        if (savedChars) {
            setAvailableCharacters(JSON.parse(savedChars));
        }
    }, []);

    useEffect(() => {
        if (isCreatingInstant) {
            setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
        }
    }, [isCreatingInstant]);

    // Force Genre if character is selected (for Instant Game)
    useEffect(() => {
        if (character && character.genre) {
            setInstantGenre(character.genre);
            setFormGenre(character.genre);
        }
    }, [character]);

    const getCharacterDesc = () => {
        if (!character) return "";
        let charDesc = "";
        if (character.appearance) {
            const a = character.appearance;
            charDesc = `${character.race} ${character.class}. Hair: ${a.hair}, Eyes: ${a.eyes}, Body: ${a.bodyType}, Wearing: ${a.clothing}.`;
        }
        return charDesc;
    };

    const handleEnterInstant = () => {
        if (!character) {
            alert("No character found! Please return to Character Creation.");
            return;
        }

        setLoading(true);
        const charDesc = getCharacterDesc();

        setTimeout(() => {
            const player: Player = {
                id: Date.now().toString(),
                name: character.name, 
                role: isCreatingInstant ? 'DM' : 'Player',
                isReady: true,
                avatar: character.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}`,
                characterDescription: charDesc
            };
            
            const settings: GameSettings | undefined = isCreatingInstant ? {
                genre: instantGenre,
                maxPlayers: instantMaxPlayers,
                aiEnabled: instantAiEnabled
            } : undefined;

            onJoin(player, settings);
        }, 1500);
    };

    const handleScheduleSubmit = () => {
        if (!formTitle || !formDate || !formTime) return;

        const newCampaign: ScheduledCampaign = {
            id: Date.now().toString(),
            title: formTitle,
            hostName: username,
            date: formDate,
            time: formTime,
            genre: formGenre,
            maxPlayers: formMax,
            aiEnabled: formAiEnabled,
            description: formDesc || "No description provided.",
            registeredPlayers: [{
                id: 'host',
                name: username,
                avatar: character?.avatarUrl
            }]
        };

        const updated = [...campaigns, newCampaign];
        setCampaigns(updated);
        localStorage.setItem('dnd_campaigns', JSON.stringify(updated));
        
        // Handle Invites
        selectedFriends.forEach(fName => {
             onInviteFriend(fName, formTitle);
        });

        setView('board');
        
        // Reset Form
        setFormTitle('');
        setFormDesc('');
        setSelectedFriends([]);
        setFormAiEnabled(true);
    };

    const handleJoinCampaign = (c: ScheduledCampaign) => {
        if (!character) {
             alert("Create a character first!");
             return;
        }
        if (c.registeredPlayers.find(p => p.name === username)) {
             alert("You are already registered.");
             return;
        }

        const updatedCampaigns = campaigns.map(camp => {
            if (camp.id === c.id) {
                return {
                    ...camp,
                    registeredPlayers: [...camp.registeredPlayers, {
                        id: Date.now().toString(),
                        name: username, // Use username for registration, character name for game
                        avatar: character.avatarUrl
                    }]
                };
            }
            return camp;
        });
        
        setCampaigns(updatedCampaigns);
        localStorage.setItem('dnd_campaigns', JSON.stringify(updatedCampaigns));
    };

    const handleStartCampaign = (c: ScheduledCampaign) => {
        const gameTime = new Date(`${c.date}T${c.time}`);
        const now = new Date();
        const diff = gameTime.getTime() - now.getTime();
        
        // If game is more than 30 mins in future, warn
        if (diff > 30 * 60 * 1000) {
            if (!confirm(`This game is scheduled for ${c.date} at ${c.time}. It is currently ${now.toLocaleString()}. Start anyway?`)) {
                return;
            }
        }

        if (!character) {
            alert("No character selected to host with.");
            return;
        }
        
        setLoading(true);
        const charDesc = getCharacterDesc();

        setTimeout(() => {
            const player: Player = {
                id: Date.now().toString(),
                name: character.name,
                role: 'DM', // Host is always DM in this logic
                isReady: true,
                avatar: character.avatarUrl,
                characterDescription: charDesc
            };

            onJoin(player, {
                genre: c.genre,
                maxPlayers: c.maxPlayers,
                aiEnabled: c.aiEnabled ?? true
            });
        }, 1000);
    };

    const toggleInvite = (friendName: string) => {
        setSelectedFriends(prev => 
            prev.includes(friendName) ? prev.filter(n => n !== friendName) : [...prev, friendName]
        );
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-8">
            <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                
                {/* SIDEBAR NAVIGATION */}
                <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col gap-2">
                    <h2 className="text-xl font-cinzel text-dragon-500 mb-6 flex items-center gap-2">
                        <MapPin /> The Hub
                    </h2>
                    
                    <button 
                        onClick={() => setView('board')}
                        className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${view === 'board' ? 'bg-slate-800 text-white border-l-4 border-dragon-500' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}
                    >
                        <span className="flex items-center gap-2"><Calendar size={18}/> Campaign Board</span>
                    </button>
                    
                    <button 
                        onClick={() => setView('schedule')}
                        className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${view === 'schedule' ? 'bg-slate-800 text-white border-l-4 border-indigo-500' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}
                    >
                        <span className="flex items-center gap-2"><Plus size={18}/> Post Campaign</span>
                    </button>

                    <div className="border-t border-slate-800 my-2"></div>

                    <button 
                        onClick={() => setView('instant')}
                        className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${view === 'instant' ? 'bg-slate-800 text-white border-l-4 border-emerald-500' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}
                    >
                         <span className="flex items-center gap-2"><Zap size={18}/> Quick Play</span>
                    </button>

                    <div className="mt-auto relative z-20">
                        {isCharSelectorOpen && (
                             <div className="absolute bottom-full left-0 w-full bg-slate-900 border border-slate-700 rounded-t-lg shadow-xl mb-1 max-h-60 overflow-y-auto">
                                <div className="p-2 border-b border-slate-800 text-[10px] text-slate-500 font-bold uppercase sticky top-0 bg-slate-900">Select Character</div>
                                {availableCharacters.length === 0 && (
                                    <div className="p-3 text-xs text-slate-500 text-center">No characters found.</div>
                                )}
                                {availableCharacters.map(char => (
                                    <button 
                                        key={char.id}
                                        onClick={() => {
                                            onSelectCharacter(char);
                                            setIsCharSelectorOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-2 p-2 hover:bg-slate-800 transition-colors text-left ${character?.id === char.id ? 'bg-indigo-900/30 border-l-2 border-indigo-500' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                             <img src={char.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${char.name}`} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-white truncate">{char.name}</div>
                                            <div className="text-[10px] text-slate-400 truncate">{char.race} {char.class}</div>
                                        </div>
                                    </button>
                                ))}
                             </div>
                        )}

                        <div className="bg-slate-900 p-4 rounded border border-slate-800">
                             <div className="flex justify-between items-center mb-2">
                                 <div className="text-xs text-slate-500 uppercase font-bold">Active Hero</div>
                                 <button 
                                     onClick={() => setIsCharSelectorOpen(!isCharSelectorOpen)}
                                     className="text-xs text-indigo-400 hover:text-white flex items-center gap-1 transition-colors"
                                 >
                                     {isCharSelectorOpen ? <ChevronDown size={12}/> : <ChevronUp size={12}/>} Change
                                 </button>
                             </div>
                             {character ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden border border-slate-600">
                                         <img src={character.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}`} alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-sm font-bold truncate text-white">{character.name}</div>
                                </div>
                             ) : (
                                 <div className="text-xs text-red-400 flex items-center gap-1"><User size={12}/> No Hero Selected</div>
                             )}
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 bg-slate-900 p-6 md:p-8 overflow-y-auto">
                    
                    {/* VIEW: CAMPAIGN BOARD */}
                    {view === 'board' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <h3 className="text-2xl font-cinzel text-white border-b border-slate-800 pb-4">Upcoming Campaigns</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {campaigns.length === 0 && (
                                    <div className="text-center py-20 text-slate-500 italic">No campaigns posted. Be the first to host!</div>
                                )}
                                {campaigns.map(camp => {
                                    const Icon = GENRES.find(g => g.id === camp.genre)?.icon || Swords;
                                    const isFull = camp.registeredPlayers.length >= camp.maxPlayers;
                                    const isJoined = camp.registeredPlayers.some(p => p.name === username);
                                    const isHost = camp.hostName === username;
                                    const isAiEnabled = camp.aiEnabled !== false;

                                    return (
                                        <div key={camp.id} className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-500 transition-colors relative overflow-hidden group">
                                            {/* Genre Badge */}
                                            <div className="absolute top-0 right-0 bg-slate-900 px-3 py-1 rounded-bl-lg border-b border-l border-slate-700 text-xs font-bold text-slate-400 flex items-center gap-2">
                                                <Icon size={14} /> {camp.genre}
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-1">
                                                    <h4 className="text-xl font-bold text-indigo-100 mb-1 font-cinzel flex items-center gap-2">
                                                        {camp.title}
                                                        {isAiEnabled && <Bot size={16} className="text-indigo-400" title="AI DM Enabled"/>}
                                                    </h4>
                                                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                                                        <span className="flex items-center gap-1"><User size={14}/> Host: {camp.hostName}</span>
                                                        <span className="flex items-center gap-1"><Calendar size={14}/> {camp.date}</span>
                                                        <span className="flex items-center gap-1"><Clock size={14}/> {camp.time}</span>
                                                    </div>
                                                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">{camp.description}</p>
                                                    
                                                    {/* Players */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase text-slate-500">Party ({camp.registeredPlayers.length}/{camp.maxPlayers})</span>
                                                        <div className="flex -space-x-2">
                                                            {camp.registeredPlayers.map((p, i) => (
                                                                <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-slate-800 overflow-hidden" title={p.name}>
                                                                    {p.avatar ? <img src={p.avatar} alt={p.name} /> : <div className="w-full h-full flex items-center justify-center text-[8px]">{p.name[0]}</div>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col justify-center min-w-[140px] gap-2">
                                                    {isHost ? (
                                                        <button 
                                                            onClick={() => handleStartCampaign(camp)}
                                                            className="w-full py-2 bg-dragon-900 hover:bg-dragon-600 text-white rounded font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            {loading ? <Loader2 className="animate-spin" size={16}/> : <Play size={16}/>} Start Game
                                                        </button>
                                                    ) : isJoined ? (
                                                        <button disabled className="w-full py-2 bg-green-900/50 text-green-400 border border-green-800 rounded font-bold text-sm cursor-default">
                                                            Registered
                                                        </button>
                                                    ) : isFull ? (
                                                        <button disabled className="w-full py-2 bg-slate-900 text-slate-600 border border-slate-800 rounded font-bold text-sm">
                                                            Full
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleJoinCampaign(camp)}
                                                            className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded font-bold text-sm transition-colors shadow-lg"
                                                        >
                                                            Join Quest
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* VIEW: SCHEDULE FORM */}
                    {view === 'schedule' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <h3 className="text-2xl font-cinzel text-white border-b border-slate-800 pb-4">Schedule a New Campaign</h3>
                            
                            <div className="grid grid-cols-1 gap-6 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Campaign Title</label>
                                    <input 
                                        value={formTitle} onChange={e => setFormTitle(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-indigo-500 outline-none"
                                        placeholder="The Legend of..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Date</label>
                                        <input 
                                            type="date"
                                            value={formDate} onChange={e => setFormDate(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Time</label>
                                        <input 
                                            type="time"
                                            value={formTime} onChange={e => setFormTime(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Genre</label>
                                        <select 
                                            value={formGenre} onChange={e => setFormGenre(e.target.value as GameGenre)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-indigo-500 outline-none"
                                        >
                                            {GENRES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Max Players</label>
                                        <input 
                                            type="number" min="2" max="8"
                                            value={formMax} onChange={e => setFormMax(parseInt(e.target.value))}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* AI Toggle */}
                                <div className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-600">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white flex items-center gap-2"><Bot size={16}/> AI Dungeon Master</span>
                                        <span className="text-xs text-slate-400">Enable automated storytelling & NPC responses</span>
                                    </div>
                                    <button 
                                        onClick={() => setFormAiEnabled(!formAiEnabled)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${formAiEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formAiEnabled ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Description / Hook</label>
                                    <textarea 
                                        value={formDesc} onChange={e => setFormDesc(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-indigo-500 outline-none h-32 resize-none"
                                        placeholder="Describe the setting and the call to adventure..."
                                    />
                                </div>

                                {/* Invite Friends */}
                                {friends.length > 0 && (
                                    <div className="bg-slate-950 p-4 rounded border border-slate-800">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                            <UserPlus size={14}/> Invite Friends
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {friends.filter(f => f.status === 'accepted').map(friend => (
                                                <button
                                                    key={friend.id}
                                                    onClick={() => toggleInvite(friend.name)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                                        selectedFriends.includes(friend.name)
                                                        ? 'bg-indigo-600 text-white border-indigo-500'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                                    }`}
                                                >
                                                    {friend.name}
                                                    {selectedFriends.includes(friend.name) && <Plus size={10} className="rotate-45"/>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={handleScheduleSubmit}
                                    disabled={!formTitle || !formDate || !formTime}
                                    className="w-full py-4 bg-dragon-900 hover:bg-dragon-700 text-white font-bold rounded shadow-lg transition-colors disabled:opacity-50"
                                >
                                    Post Campaign
                                </button>
                            </div>
                        </div>
                    )}

                    {/* VIEW: INSTANT GAME (Original Lobby Content) */}
                    {view === 'instant' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             <div className="text-center mb-8">
                                <h2 className="text-2xl font-cinzel text-emerald-400">Quick Play Lobby</h2>
                                <p className="text-slate-400">Jump straight into the action.</p>
                            </div>

                             <div className="flex bg-slate-950 rounded-lg p-1 max-w-md mx-auto mb-8">
                                <button 
                                    onClick={() => setIsCreatingInstant(true)}
                                    className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${isCreatingInstant ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Create Room
                                </button>
                                <button 
                                    onClick={() => setIsCreatingInstant(false)}
                                    className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${!isCreatingInstant ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Join Room
                                </button>
                            </div>

                            <div className="max-w-md mx-auto space-y-4">
                                {!isCreatingInstant && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Room Code</label>
                                        <input 
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono tracking-widest uppercase focus:border-indigo-500 outline-none"
                                            placeholder="XYZ123"
                                        />
                                    </div>
                                )}

                                {isCreatingInstant && (
                                    <>
                                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase">Room Code</label>
                                                <span className="text-2xl font-mono text-emerald-400 tracking-widest">{roomCode}</span>
                                            </div>
                                            <button className="p-2 hover:bg-slate-800 rounded text-slate-400">
                                                <Copy size={18} />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Max Players: {instantMaxPlayers}</label>
                                            <input 
                                                type="range" 
                                                min="1" max="6" 
                                                value={instantMaxPlayers}
                                                onChange={(e) => setInstantMaxPlayers(parseInt(e.target.value))}
                                                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-600">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white flex items-center gap-2"><Bot size={16}/> AI Dungeon Master</span>
                                                <span className="text-xs text-slate-400">Enable automated storytelling</span>
                                            </div>
                                            <button 
                                                onClick={() => setInstantAiEnabled(!instantAiEnabled)}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${instantAiEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${instantAiEnabled ? 'left-7' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                    </>
                                )}

                                <button 
                                    onClick={handleEnterInstant}
                                    disabled={loading || !character}
                                    className={`w-full py-4 rounded-lg font-bold font-cinzel text-lg flex items-center justify-center gap-2 transition-all mt-6 ${
                                        isCreatingInstant 
                                        ? 'bg-emerald-900 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-900/20' 
                                        : 'bg-indigo-900 hover:bg-indigo-800 text-white shadow-lg shadow-indigo-900/20'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loading ? (
                                        <><Loader2 className="animate-spin" /> Summoning...</>
                                    ) : (
                                        <>{isCreatingInstant ? 'Start Adventure' : 'Join Party'}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}