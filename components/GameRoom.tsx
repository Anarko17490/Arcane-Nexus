
import React, { useState, useEffect, useRef } from 'react';
import { Player, DiceRollResult, ChatMessage, GameSettings, BattleMapState, Token, InitiativeItem, Character, InventoryItem } from '../types';
import ChatInterface from './ChatInterface';
import CharacterSheet from './CharacterSheet';
import TacticalMap from './TacticalMap';
import CampaignManager from './CampaignManager';
import { LogOut, Sword, Shield, Clock, Map, Heart, X, User, Grid, Play, Skull, Volume2, VolumeX, MessageSquare, Hammer, Users, ChevronDown, Edit3 } from 'lucide-react';
import { chatWithDM, generateSceneImage, generateLocationName, analyzeSceneForMap, generateMapImage, generateSpeech } from '../services/geminiService';

interface Props {
    player: Player;
    settings: GameSettings;
    onLeave: () => void;
    character: Character | null;
    onUpdateCharacter: (char: Character) => void;
}

const START_MESSAGES: Record<string, string> = {
    'Fantasy': "Welcome to the table. The tavern is warm, but the night is cold. The party gathers... What do you wish to do?",
    'Sci-Fi': "Systems online. You stand on the bridge of the USS Aegis. The warp drive is humming. What are your orders?",
    'Cyberpunk': "The neon rain hits the pavement. You're in a safehouse in Sector 4. The corpo hit-squad is searching for you. What's the plan?",
    'Post-Apocalyptic': "The dust storm has finally settled. You emerge from the bunker. Supplies are low. How do you survive?",
    'Epic War': "The war horns sound in the distance. Your platoon is stationed in the trenches. The enemy approaches. Prepare yourselves.",
    'Eldritch Horror': "A thick fog rolls in. The old mansion looms before you. You feel eyes watching you from the dark. Do you enter?",
    'Western': "The noon sun beats down on the dusty street. The saloon doors swing open. The sheriff is missing. What's your move, partner?",
    'Steampunk': "The gears of the great airship grind overhead. Steam fills the London streets. A clockwork automaton has gone rogue.",
};

const ROLL_REQUEST_REGEX = /(?:make|roll)\s+(?:a|an)?\s*.*?(?:check|save|throw)|DC\s*:?\s*\d+/i;

// Helper to decode raw PCM data from Gemini
function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
): AudioBuffer {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            // Convert Int16 to Float32 [-1.0, 1.0]
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export default function GameRoom({ player, settings, onLeave, character, onUpdateCharacter }: Props) {
    // Determine if user is Human DM
    const isHumanDM = player.role === 'DM' && settings.aiEnabled === false;

    // UI State
    const [leftPanel, setLeftPanel] = useState<'sheet' | 'map'>('map');
    const [mobileTab, setMobileTab] = useState<'game' | 'chat'>('game');
    const [unreadChat, setUnreadChat] = useState(false);
    
    const [isThinking, setIsThinking] = useState(false);
    
    // Voice State
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Game Data State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [locationName, setLocationName] = useState("Unknown Location");
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    
    // Saved Messages State
    const [savedMessages, setSavedMessages] = useState<ChatMessage[]>([]);

    // Map State
    const [mapState, setMapState] = useState<BattleMapState | null>(null);
    const [currentTurnId, setCurrentTurnId] = useState<string>(player.id);
    
    // Waiting for Roll Logic
    const [isWaitingForRoll, setIsWaitingForRoll] = useState(false);

    // --- DM TOOLS STATE ---
    const [isArcaneToolsOpen, setIsArcaneToolsOpen] = useState(false);
    const [isPartyManagerOpen, setIsPartyManagerOpen] = useState(false);
    const [simulatedParty, setSimulatedParty] = useState<Character[]>([]);
    const [editingCharId, setEditingCharId] = useState<string | null>(null);
    
    const messagesEndRef = useRef<number>(0);

    // Determine Equipped Weapon safely
    const equippedWeapon = character?.inventory?.find(i => 
        i.equipped && (
            i.name.toLowerCase().includes('sword') || 
            i.name.toLowerCase().includes('axe') || 
            i.name.toLowerCase().includes('bow') ||
            i.name.toLowerCase().includes('dagger') ||
            i.name.toLowerCase().includes('staff') ||
            i.name.toLowerCase().includes('mace') || 
            i.name.toLowerCase().includes('hammer') ||
            i.name.toLowerCase().includes('blade')
        )
    )?.name || "Unarmed";

    // Init Logic
    useEffect(() => {
        const initGame = async () => {
            setIsThinking(true);
            
            // 1. Set Initial Location Name based on Genre
            const initialLoc = settings.genre === 'Sci-Fi' ? "Orbit Station Alpha" : "The Prancing Pony";
            setLocationName(initialLoc);

            // 2. Generate Initial Scene Image (Parallel requests for speed)
            // Only generate if AI is enabled OR it's the first load
            if (!backgroundImage) {
                 const scenePrompt = `${settings.genre} setting, ${initialLoc}, cinematic, detailed`;
                 try {
                     const imgUrl = await generateSceneImage(scenePrompt);
                     if (imgUrl) setBackgroundImage(imgUrl);
                 } catch (e) {
                     console.error("Failed to gen image", e);
                 }
            }

            // 3. Initial Message Logic
            if (messages.length === 0) {
                if (settings.aiEnabled !== false) {
                    const startMsg = START_MESSAGES[settings.genre] || START_MESSAGES['Fantasy'];
                    setMessages([{
                        id: 'init',
                        senderId: 'ai',
                        senderName: 'Dungeon Master',
                        role: 'model',
                        content: startMsg,
                        type: 'text',
                        timestamp: Date.now()
                    }]);
                } else {
                     setMessages([{
                        id: 'init-sys',
                        senderId: 'system',
                        senderName: 'System',
                        role: 'system',
                        content: `Campaign started. Manual Mode Active. ${player.name} is the Game Master. Use the Arcane Tools to manage the world!`,
                        type: 'text',
                        timestamp: Date.now()
                    }]);
                }
            }
            
            // Load Saved Messages
            const saved = localStorage.getItem('dnd_saved_messages');
            if (saved) {
                setSavedMessages(JSON.parse(saved));
            }

            setIsThinking(false);
        };
        
        initGame();
        
        // Cleanup Audio Context
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []); // Run once on mount

    // Load Simulated Party for Human DM
    useEffect(() => {
        if (isHumanDM) {
            // In a real app, this would come from the server/websocket.
            // Here we just grab all other characters from local storage to simulate a party.
            const stored = localStorage.getItem('dnd_characters');
            if (stored) {
                const allChars: Character[] = JSON.parse(stored);
                // Filter out the DM's character if they selected one, or just show all
                setSimulatedParty(allChars);
            }
        }
    }, [isHumanDM]);

    // Handle DM Editing a Player Character
    const handleDmUpdateCharacter = (updatedChar: Character) => {
        // Update local state
        setSimulatedParty(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
        
        // Update persistent storage
        const stored = localStorage.getItem('dnd_characters');
        if (stored) {
            const allChars: Character[] = JSON.parse(stored);
            const newAllChars = allChars.map(c => c.id === updatedChar.id ? updatedChar : c);
            localStorage.setItem('dnd_characters', JSON.stringify(newAllChars));
        }

        // Notify chat
        const sysMsg: ChatMessage = {
             id: Date.now().toString() + "-sys",
             senderId: 'system',
             senderName: 'System',
             role: 'system',
             content: `GM updated ${updatedChar.name}'s sheet.`,
             type: 'text',
             timestamp: Date.now()
        };
        setMessages(prev => [...prev, sysMsg]);
    };

    // Track unread messages on mobile
    useEffect(() => {
        if (mobileTab === 'game' && messages.length > messagesEndRef.current) {
             setUnreadChat(true);
        }
        messagesEndRef.current = messages.length;
    }, [messages, mobileTab]);

    useEffect(() => {
        if (mobileTab === 'chat') {
            setUnreadChat(false);
        }
    }, [mobileTab]);

    // --- SAVED MESSAGES HANDLING ---
    const handleSaveMessage = (msg: ChatMessage) => {
        if (savedMessages.find(m => m.id === msg.id)) return;
        const updated = [...savedMessages, msg];
        setSavedMessages(updated);
        localStorage.setItem('dnd_saved_messages', JSON.stringify(updated));
    };

    const handleDeleteSavedMessage = (id: string) => {
        const updated = savedMessages.filter(m => m.id !== id);
        setSavedMessages(updated);
        localStorage.setItem('dnd_saved_messages', JSON.stringify(updated));
    };


    // --- VOICE LOGIC ---
    const toggleVoiceMode = () => {
        setIsVoiceMode(!isVoiceMode);
        // Initialize context on user interaction if needed
        if (!audioContextRef.current) {
             const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
             audioContextRef.current = new AudioCtor({ sampleRate: 24000 });
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    const playAudioResponse = async (arrayBuffer: ArrayBuffer) => {
        try {
             if (!audioContextRef.current) {
                 const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
                 audioContextRef.current = new AudioCtor({ sampleRate: 24000 });
             }
             const ctx = audioContextRef.current;
             if (ctx.state === 'suspended') await ctx.resume();

             // Decode Raw PCM instead of using decodeAudioData (which requires headers)
             const uint8Array = new Uint8Array(arrayBuffer);
             const audioBuffer = decodeAudioData(uint8Array, ctx);
             
             const source = ctx.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(ctx.destination);
             source.start(0);
        } catch (e) {
            console.error("Audio Playback Error:", e);
        }
    };

    // --- AUTOMATIC UPDATES (TOOL HANDLING) ---

    const executeToolCalls = (toolCalls: any[]) => {
        if (!character) return;
        let newChar = { ...character };
        let updates: string[] = [];

        toolCalls.forEach(call => {
            const args = call.args;
            if (call.name === 'modify_hp') {
                const amount = args.amount;
                const newCurrent = Math.min(newChar.hp.max, Math.max(0, newChar.hp.current + amount));
                const diff = newCurrent - newChar.hp.current;
                if (diff !== 0) {
                    newChar.hp = { ...newChar.hp, current: newCurrent };
                    updates.push(`HP ${diff > 0 ? '+' : ''}${diff}`);
                }
            }
            else if (call.name === 'modify_inventory') {
                const { item, action } = args;
                if (action === 'add') {
                    // Create proper inventory object
                    const newItem: InventoryItem = {
                        id: `item-${Date.now()}-${Math.random()}`,
                        name: item,
                        equipped: false,
                        quantity: 1,
                        isQuestItem: false
                    };
                    newChar.inventory = [...newChar.inventory, newItem];
                    updates.push(`Acquired: ${item}`);
                } else if (action === 'remove') {
                    const idx = newChar.inventory.findIndex(i => i.name.toLowerCase() === item.toLowerCase());
                    if (idx > -1) {
                         const newInv = [...newChar.inventory];
                         newInv.splice(idx, 1);
                         newChar.inventory = newInv;
                         updates.push(`Removed: ${item}`);
                    }
                }
            }
            else if (call.name === 'modify_gold') {
                const amount = args.amount;
                // Find Wealth string in inventory (e.g., "Wealth: 50 gp" or "100 credits")
                let wealthIdx = newChar.inventory.findIndex(i => i.name.toLowerCase().startsWith('wealth') || i.name.toLowerCase().includes('gold') || i.name.toLowerCase().includes('gp') || i.name.toLowerCase().includes('credits') || i.name.toLowerCase().includes('caps'));
                
                if (wealthIdx === -1) {
                    // Create if not exists
                    newChar.inventory.push({
                        id: `wealth-${Date.now()}`,
                        name: `Wealth: ${amount} Gold`,
                        equipped: false,
                        quantity: 1
                    });
                    updates.push(`Wealth ${amount > 0 ? '+' : ''}${amount}`);
                } else {
                    const wealthItem = newChar.inventory[wealthIdx];
                    // Simple parsing: Look for numbers
                    const match = wealthItem.name.match(/(-?\d+)/);
                    if (match) {
                        const currentVal = parseInt(match[0]);
                        const newVal = currentVal + amount;
                        // Preserve the text around it if possible, defaulting to simple replacement if complex
                        const suffix = wealthItem.name.replace(/.*?(-?\d+)\s*/, '') || 'Gold';
                        newChar.inventory[wealthIdx] = { ...wealthItem, name: `Wealth: ${newVal} ${suffix}` };
                        updates.push(`Wealth ${amount > 0 ? '+' : ''}${amount}`);
                    }
                }
            }
        });

        if (updates.length > 0) {
             onUpdateCharacter(newChar);
             // Add a system message to chat log
             const sysMsg: ChatMessage = {
                 id: Date.now().toString() + "-sys",
                 senderId: 'system',
                 senderName: 'System',
                 role: 'system',
                 content: `[Auto-Update] ${updates.join(', ')}`,
                 type: 'text',
                 timestamp: Date.now() + 1
             };
             setMessages(prev => [...prev, sysMsg]);
        }
    };

    // --- TRANSFER ITEM ---
    const handleTransfer = (item: InventoryItem, target: string) => {
        const sysMsg: ChatMessage = {
             id: Date.now().toString() + "-transfer",
             senderId: 'system',
             senderName: 'System',
             role: 'system',
             content: `${player.name} transferred ${item.name} to ${target}.`,
             type: 'text',
             timestamp: Date.now()
        };
        setMessages(prev => [...prev, sysMsg]);
    };

    // --- DM MANUAL CONTROLS ---
    
    const handleSetScene = (url: string) => {
        setBackgroundImage(url);
        setMapState(null);
        setLeftPanel('map');
        
        const msg: ChatMessage = {
            id: Date.now().toString() + "-scene",
            senderId: 'system',
            senderName: 'System',
            role: 'system',
            content: `The DM changed the scene visual.`,
            type: 'text',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, msg]);
        setIsArcaneToolsOpen(false); 
    };

    const handleSetMap = (url: string) => {
        const partyTokens: Token[] = simulatedParty.map((c, i) => ({
            id: c.id,
            type: 'player',
            name: c.name,
            avatar: c.avatarUrl,
            x: (i + 1) % 8,
            y: 1
        }));
        
        // Fallback if no party loaded
        const finalTokens = partyTokens.length > 0 ? partyTokens : [{ id: 'hero', type: 'player', x: 2, y: 2, name: 'Hero' }];
        
        setMapState({
            imageUrl: url,
            gridWidth: 8,
            gridHeight: 8,
            tokens: finalTokens
        });
        setLeftPanel('map');
        
        const msg: ChatMessage = {
            id: Date.now().toString() + "-map",
            senderId: 'system',
            senderName: 'System',
            role: 'system',
            content: `The DM deployed a tactical battle map.`,
            type: 'text',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, msg]);
        setIsArcaneToolsOpen(false); 
    };

    const handleShareContent = (content: string) => {
        const msg: ChatMessage = {
            id: Date.now().toString() + "-share",
            senderId: 'gm-share',
            senderName: 'GM Shared',
            role: 'system',
            content: content,
            type: 'text',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, msg]);
        
        // Ensure chat is visible on mobile
        if (window.innerWidth < 768) {
            setMobileTab('chat');
        }
        setIsArcaneToolsOpen(false);
    };

    // --- CORE GAME LOOP ---

    const processAiResponse = async (responseText: string) => {
        // 1. Analyze for Map requirement
        const analysis = await analyzeSceneForMap(responseText);
        
        if (analysis.needsMap && analysis.mapDescription) {
            // Generate Map
            const mapImg = await generateMapImage(analysis.mapDescription);
            if (mapImg) {
                // Initialize Tokens
                const newTokens: Token[] = [
                    { id: player.id, type: 'player', x: 2, y: 2, name: player.name, avatar: player.avatar }
                ];
                // Add enemies if combat
                if (analysis.sceneType === 'combat') {
                    newTokens.push({ id: 'enemy1', type: 'enemy', x: 4, y: 4, name: 'Enemy', color: '#ef4444' });
                }

                setMapState({
                    imageUrl: mapImg,
                    gridWidth: analysis.gridWidth || 8,
                    gridHeight: analysis.gridHeight || 8,
                    tokens: newTokens
                });
                setLeftPanel('map'); // Switch view to map
            }
        }

        // 2. Check for Roll Requests
        if (ROLL_REQUEST_REGEX.test(responseText)) {
            setIsWaitingForRoll(true);
        } else {
            setIsWaitingForRoll(false);
        }

        // 3. Update Visuals (Location Name) if scene changed significantly
        if (responseText.length > 100 && Math.random() > 0.7) {
            const newTitle = await generateLocationName(responseText.substring(0, 200));
            setLocationName(newTitle);
        }

        // 4. Voice Synthesis (if enabled)
        if (isVoiceMode) {
             const speechBuffer = await generateSpeech(responseText);
             if (speechBuffer) {
                 playAudioResponse(speechBuffer);
             }
        }
    };

    const handleSendMessage = async (text: string) => {
        // Optimistic UI Update
        const newUserMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: player.id,
            senderName: player.name,
            role: 'user',
            content: text,
            type: 'text',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newUserMsg]);
        setIsThinking(true);

        // If AI is disabled, we stop here. The user (DM) has spoken.
        if (settings.aiEnabled === false) {
            setIsThinking(false);
            return;
        }

        try {
            // 1. Get AI Response
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            
            // Add visual context if exists
            let contextPrompt = text;
            if (player.characterDescription && messages.length < 3) {
                contextPrompt = `[Context: I am playing a ${player.characterDescription}] ${text}`;
            }

            const { text: responseText, toolCalls } = await chatWithDM(history, contextPrompt, settings.genre);
            
            // 2. Execute any tools (auto-updates)
            if (toolCalls && toolCalls.length > 0) {
                executeToolCalls(toolCalls);
            }

            // 3. Add AI Message
            const newAiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                senderId: 'ai',
                senderName: 'Dungeon Master',
                role: 'model',
                content: responseText,
                type: 'text',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, newAiMsg]);

            // 4. Process Side Effects (Map, Voice, etc)
            await processAiResponse(responseText);

        } catch (error) {
            console.error("Game Loop Error:", error);
        } finally {
            setIsThinking(false);
        }
    };

    const handleRollRequest = () => {
        // Simple D20 for now
        const roll = Math.floor(Math.random() * 20) + 1;
        const msg = `I rolled a ${roll} (d20).`;
        
        const rollMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: player.id,
            senderName: player.name,
            role: 'user',
            content: msg,
            type: 'roll',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, rollMsg]);
        
        // Send to AI context immediately if AI enabled
        handleSendMessage(msg);
        setIsWaitingForRoll(false);
    };

    const handleTokenMove = (tokenId: string, x: number, y: number) => {
        if (!mapState) return;
        setMapState({
            ...mapState,
            tokens: mapState.tokens.map(t => t.id === tokenId ? { ...t, x, y } : t)
        });
    };

    const renderCharacterCard = (char: Character) => (
        <button
            key={char.id}
            onClick={() => setEditingCharId(char.id)}
            className="bg-slate-800 border border-slate-600 rounded-lg p-4 hover:border-indigo-500 hover:bg-slate-700 transition-all text-left flex items-center gap-4 group"
        >
            <div className="w-12 h-12 rounded bg-black border border-slate-500 overflow-hidden shrink-0">
                {char.avatarUrl ? <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover"/> : <User className="w-full h-full p-2 text-slate-600"/>}
            </div>
            <div className="min-w-0">
                <div className="font-bold text-white text-lg truncate">{char.name}</div>
                <div className="text-sm text-slate-400 truncate">{char.race} {char.class} • Lvl {char.level}</div>
                <div className="text-xs text-indigo-400 mt-1 flex items-center gap-1 group-hover:underline">
                    <Edit3 size={10}/> Edit Sheet
                </div>
            </div>
        </button>
    );

    return (
        <div className="w-full h-[100dvh] flex flex-col md:flex-row bg-slate-950 overflow-hidden relative">
            
            {/* --- MODALS FOR HUMAN DM --- */}
            
            {/* Arcane Tools Modal */}
            {isArcaneToolsOpen && (
                <div className="absolute inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-900 w-full max-w-6xl h-full max-h-[90vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                            <h2 className="text-xl font-cinzel text-amber-500 flex items-center gap-2"><Hammer size={20}/> Arcane Tools (DM)</h2>
                            <button onClick={() => setIsArcaneToolsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors">
                                <X size={24}/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <CampaignManager 
                                onSetScene={handleSetScene}
                                onSetMap={handleSetMap}
                                onShare={handleShareContent}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Party Manager Modal */}
            {isPartyManagerOpen && (
                <div className="absolute inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-900 w-full max-w-4xl h-full max-h-[80vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                            <h2 className="text-xl font-cinzel text-indigo-400 flex items-center gap-2"><Users size={20}/> Manage Party</h2>
                            <button onClick={() => {setIsPartyManagerOpen(false); setEditingCharId(null);}} className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors">
                                <X size={24}/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            {!editingCharId ? (
                                <div className="space-y-6">
                                    {/* DM Section */}
                                    {simulatedParty.some(c => c.id === character?.id) && (
                                        <div>
                                            <h3 className="text-amber-500 font-bold uppercase text-xs tracking-wider mb-3 border-b border-slate-700 pb-1 flex items-center gap-2">
                                                <Shield size={14}/> Game Master
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {simulatedParty.filter(c => c.id === character?.id).map(char => renderCharacterCard(char))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Players Section */}
                                    <div>
                                         <h3 className="text-indigo-400 font-bold uppercase text-xs tracking-wider mb-3 border-b border-slate-700 pb-1 flex items-center gap-2">
                                            <Users size={14}/> Adventuring Party
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {simulatedParty.filter(c => c.id !== character?.id).map(char => renderCharacterCard(char))}
                                            {simulatedParty.filter(c => c.id !== character?.id).length === 0 && (
                                                <div className="col-span-full text-center py-8 text-slate-500 italic border border-dashed border-slate-800 rounded-lg">
                                                    No other players connected.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <button 
                                        onClick={() => setEditingCharId(null)}
                                        className="mb-4 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold"
                                    >
                                        ← Back to Party List
                                    </button>
                                    <div className="flex-1 overflow-auto border border-slate-700 rounded-lg">
                                        {/* Find the char and render sheet */}
                                        {(() => {
                                            const charToEdit = simulatedParty.find(c => c.id === editingCharId);
                                            if (charToEdit) {
                                                return <CharacterSheet character={charToEdit} onUpdate={handleDmUpdateCharacter} isGMView={true} />;
                                            }
                                            return <div>Character not found.</div>;
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* LEFT PANEL: VISUALS & TOOLS (Hidden on mobile if chat active) */}
            <div className={`flex-1 flex flex-col relative ${leftPanel === 'map' ? 'bg-black' : 'bg-slate-900'} border-r border-slate-800 transition-all duration-300 ${mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                
                {/* Visual Header */}
                <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
                    <div className="pointer-events-auto">
                        <h2 className="text-2xl font-cinzel text-white shadow-black drop-shadow-md">{locationName}</h2>
                        <div className="text-xs text-slate-300 flex items-center gap-2">
                             <Clock size={12}/> Session Active {isHumanDM && <span className="text-amber-500 font-bold ml-2">[GM MODE]</span>}
                        </div>
                    </div>
                    <div className="flex gap-2 pointer-events-auto">
                         <button 
                            onClick={() => setLeftPanel(leftPanel === 'sheet' ? 'map' : 'sheet')}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded backdrop-blur-sm border border-slate-600"
                            title={leftPanel === 'sheet' ? "View Map" : "View Character"}
                         >
                             {leftPanel === 'sheet' ? <Map size={20}/> : <User size={20}/>}
                         </button>
                         <button 
                            onClick={onLeave}
                            className="p-2 bg-red-900/80 hover:bg-red-800 text-white rounded backdrop-blur-sm border border-red-700 hidden md:block"
                            title="Leave Game"
                         >
                             <LogOut size={20}/>
                         </button>
                    </div>
                </div>

                {/* Main Visual Content */}
                <div className="flex-1 overflow-hidden relative">
                    {/* Background Layer (Only visible when sheet is active or as fallback for map) */}
                    {backgroundImage && leftPanel === 'sheet' && (
                         <div className="absolute inset-0 z-0">
                             <img src={backgroundImage} alt="Scene" className="w-full h-full object-cover opacity-40" />
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
                         </div>
                    )}

                    {leftPanel === 'sheet' ? (
                        <div className="relative z-10 h-full overflow-y-auto p-4 pt-20">
                             {/* Show own sheet if Player, or Party List if DM (maybe?) For now keeping own sheet for DM reference or allow them to view others via bottom bar */}
                             <CharacterSheet 
                                character={character} 
                                onUpdate={onUpdateCharacter}
                                onTransferItem={handleTransfer}
                             />
                        </div>
                    ) : (
                        <div className="h-full pt-16 pb-4 px-4">
                            {mapState ? (
                                <TacticalMap 
                                    mapState={mapState} 
                                    currentPlayerId={player.id}
                                    onTokenMove={handleTokenMove}
                                />
                            ) : backgroundImage ? (
                                <div className="w-full h-full rounded-lg overflow-hidden border border-slate-800 relative shadow-2xl animate-in fade-in duration-1000">
                                     <img src={backgroundImage} alt="Scene" className="w-full h-full object-cover" />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8 pointer-events-none">
                                         <h3 className="text-2xl md:text-3xl font-cinzel text-white mb-2 drop-shadow-lg text-shadow">{locationName}</h3>
                                         <div className="h-1 w-20 bg-dragon-500 mb-4 rounded-full"></div>
                                         <p className="text-slate-200 italic font-serif text-sm md:text-lg max-w-2xl leading-relaxed drop-shadow-md">
                                            "{messages.length > 0 && messages[messages.length-1].senderId === 'ai' ? 
                                                (messages[messages.length-1].content.length > 200 ? messages[messages.length-1].content.substring(0, 200) + "..." : messages[messages.length-1].content) 
                                                : "The adventure continues..."}"
                                         </p>
                                     </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg bg-slate-900/50">
                                    <div className="animate-pulse flex flex-col items-center">
                                        <Map size={48} className="mb-4 opacity-50 text-dragon-500"/>
                                        <p className="font-cinzel text-xl text-slate-400">Visualizing the Realm...</p>
                                        <p className="text-xs text-slate-600 mt-2">Generating scene context</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* BOTTOM BAR: Dynamic based on Role */}
                {isHumanDM ? (
                    <div className="h-16 bg-slate-950 border-t border-slate-800 flex items-center justify-around px-4 z-20 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                        <button 
                            onClick={() => setIsArcaneToolsOpen(true)}
                            className="flex flex-col items-center justify-center text-amber-500 hover:text-amber-400 transition-colors w-full h-full border-r border-slate-800/50"
                        >
                            <Hammer size={24} className="mb-1"/>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Arcane Tools</span>
                        </button>
                        <button 
                            onClick={() => setIsPartyManagerOpen(true)}
                            className="flex flex-col items-center justify-center text-indigo-400 hover:text-indigo-300 transition-colors w-full h-full"
                        >
                            <Users size={24} className="mb-1"/>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Manage Party</span>
                        </button>
                    </div>
                ) : (
                    // Default Player HUD
                    <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-4 z-20 shrink-0 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Heart className="text-red-600 w-8 h-8 fill-red-900" />
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">HP</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-white leading-none">
                                    {character?.hp.current || 0}
                                    <span className="text-sm text-slate-500">/{character?.hp.max || 0}</span>
                                </span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-700"></div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Shield className="text-slate-400 w-8 h-8" />
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900">AC</span>
                            </div>
                            <span className="text-lg font-bold text-white leading-none">{character?.ac || 10}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-700"></div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Sword className="text-amber-500 w-8 h-8" />
                            </div>
                            <span className="text-sm font-bold text-slate-300 hidden md:inline truncate max-w-[100px]">{equippedWeapon}</span>
                            <span className="text-sm font-bold text-slate-300 md:hidden truncate max-w-[60px]">{equippedWeapon}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: CHAT & LOG */}
            <div className={`w-full md:w-[400px] lg:w-[450px] flex flex-col border-l border-slate-800 bg-slate-950 z-20 shadow-xl ${mobileTab === 'game' ? 'hidden md:flex' : 'flex h-full'}`}>
                {/* Header Actions */}
                <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                     <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${settings.aiEnabled !== false ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {settings.aiEnabled === false ? "Manual Mode" : "Live Session"}
                         </span>
                     </div>
                     <button 
                        onClick={toggleVoiceMode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            isVoiceMode 
                            ? 'bg-indigo-900 text-indigo-200 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                        }`}
                        title={settings.aiEnabled === false ? "Voice unavailable in Manual Mode" : "Toggle Voice"}
                        disabled={settings.aiEnabled === false}
                     >
                         {isVoiceMode ? <Volume2 size={14} /> : <VolumeX size={14}/>}
                         {isVoiceMode ? 'Voice ON' : 'Voice OFF'}
                     </button>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 overflow-hidden">
                    <ChatInterface 
                        currentPlayer={player}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onRollRequest={handleRollRequest}
                        isThinking={isThinking}
                        isMyTurn={currentTurnId === player.id}
                        currentTurnName={player.name}
                        isWaitingForRoll={isWaitingForRoll}
                        onSaveMessage={handleSaveMessage}
                        savedMessages={savedMessages}
                        onDeleteSavedMessage={handleDeleteSavedMessage}
                    />
                </div>
            </div>

            {/* MOBILE NAV BAR */}
            <div className="md:hidden h-14 bg-slate-900 border-t border-slate-800 flex shrink-0 z-50">
                <button 
                    onClick={() => setMobileTab('game')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === 'game' ? 'text-white bg-slate-800' : 'text-slate-500'}`}
                >
                    {leftPanel === 'sheet' ? <User size={20}/> : <Map size={20}/>}
                    <span className="text-[10px] font-bold uppercase">Game</span>
                </button>
                <button 
                    onClick={() => setMobileTab('chat')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 relative ${mobileTab === 'chat' ? 'text-white bg-slate-800' : 'text-slate-500'}`}
                >
                    <MessageSquare size={20}/>
                    <span className="text-[10px] font-bold uppercase">Chat</span>
                    {unreadChat && (
                        <span className="absolute top-2 right-[35%] w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                    )}
                </button>
                <button 
                    onClick={onLeave}
                    className="w-16 flex flex-col items-center justify-center gap-1 text-red-400 border-l border-slate-800 bg-slate-900"
                >
                    <LogOut size={20}/>
                    <span className="text-[10px] font-bold uppercase">Exit</span>
                </button>
            </div>

        </div>
    );
}