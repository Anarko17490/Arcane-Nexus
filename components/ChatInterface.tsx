
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Player } from '../types';
import { Send, Mic, Dices, Loader2, Lock, AlertCircle, Bookmark, Trash2, X, BookOpen } from 'lucide-react';

interface Props {
    currentPlayer: Player;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onRollRequest: () => void;
    isThinking: boolean;
    isMyTurn: boolean;
    currentTurnName?: string;
    isWaitingForRoll?: boolean;
    onSaveMessage: (msg: ChatMessage) => void;
    savedMessages: ChatMessage[];
    onDeleteSavedMessage: (id: string) => void;
}

export default function ChatInterface({ 
    currentPlayer, 
    messages, 
    onSendMessage, 
    onRollRequest, 
    isThinking,
    isMyTurn,
    currentTurnName,
    isWaitingForRoll,
    onSaveMessage,
    savedMessages,
    onDeleteSavedMessage
}: Props) {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [showSavedPanel, setShowSavedPanel] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !isMyTurn) return;
        onSendMessage(input);
        setInput('');
    };

    const handleVoiceInput = () => {
        if (!isMyTurn) return; 
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Speech API not available");
            return;
        }
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
        recognition.start();
    };

    // Robust Markdown Parser
    const formatMessage = (content: string) => {
        const lines = content.split('\n');
        return lines.map((line, lineIdx) => {
            // Header handling (### Title)
            if (line.trim().startsWith('### ')) {
                const text = line.replace('### ', '').trim();
                return (
                    <div key={lineIdx} className="mb-2 mt-3 font-cinzel font-bold text-amber-500 text-lg uppercase border-b border-amber-900/50 pb-1">
                        {text}
                    </div>
                );
            }

            // List handling (• Item)
            if (line.trim().startsWith('• ')) {
                 // Inline formatting inside list items
                 const parts = line.split(/(\*\*.*?\*\*|_[^_]+_)/g);
                 return (
                     <div key={lineIdx} className="ml-4 flex items-start gap-2 mb-1">
                         <span className="text-amber-500 mt-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0"></span>
                         <span className="leading-relaxed">
                            {parts.map((part, i) => {
                                if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-amber-200 font-bold">{part.slice(2, -2)}</strong>;
                                if (part.startsWith('_') && part.endsWith('_')) return <em key={i} className="text-indigo-200 italic">{part.slice(1, -1)}</em>;
                                return part;
                            })}
                         </span>
                     </div>
                 );
            }

            // Standard Paragraph
            const parts = line.split(/(\*\*.*?\*\*|_[^_]+_)/g);
            return (
                <div key={lineIdx} className={`${line.trim() === '' ? 'h-2' : 'min-h-[1.2em]'}`}>
                    {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-amber-400 font-bold">{part.slice(2, -2)}</strong>;
                        if (part.startsWith('_') && part.endsWith('_')) return <em key={i} className="text-indigo-200 italic">{part.slice(1, -1)}</em>;
                        return part;
                    })}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 relative">
            
            {/* Header / Saved Toggle */}
            <div className="h-10 border-b border-slate-800 flex items-center justify-between px-3 shrink-0 bg-slate-950">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chat Log</span>
                <button 
                    onClick={() => setShowSavedPanel(!showSavedPanel)}
                    className={`text-xs flex items-center gap-1 font-bold px-2 py-1 rounded transition-colors ${showSavedPanel ? 'bg-amber-900 text-amber-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <BookOpen size={12}/> Saved Notes {savedMessages.length > 0 && `(${savedMessages.length})`}
                </button>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {messages.map((msg) => (
                    <div key={msg.id} className={`group flex flex-col ${msg.role === 'user' ? (msg.senderId === currentPlayer.id ? 'items-end' : 'items-start') : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 opacity-70 w-full">
                            <span className={`text-xs font-bold ${msg.role === 'user' && msg.senderId === currentPlayer.id ? 'ml-auto' : ''}`}>{msg.senderName}</span>
                            <span className="text-[10px]">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {/* Save Button (Visible on Hover) */}
                            {msg.type !== 'roll' && (
                                <button 
                                    onClick={() => onSaveMessage(msg)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-amber-400"
                                    title="Save to Notes"
                                >
                                    <Bookmark size={12}/>
                                </button>
                            )}
                        </div>
                        
                        <div className={`max-w-[95%] rounded-lg p-3 ${
                            msg.type === 'roll' ? 'bg-slate-800 border border-dragon-500/50 text-dragon-100 font-mono' :
                            msg.role === 'model' ? 'bg-slate-800 text-amber-100 border border-slate-600' :
                            msg.senderId === currentPlayer.id ? 'bg-indigo-900 text-white' : 'bg-slate-700 text-slate-200'
                        }`}>
                            <div className="text-sm leading-relaxed">
                                {formatMessage(msg.content)}
                            </div>
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
                        <Loader2 className="animate-spin" size={14} /> The DM is plotting...
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Saved Messages Overlay Panel */}
            {showSavedPanel && (
                <div className="absolute inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-700 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
                    <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                        <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2"><BookOpen size={14}/> Saved Notes</h3>
                        <button onClick={() => setShowSavedPanel(false)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {savedMessages.length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-xs italic">
                                Click the bookmark icon on messages to save them here.
                            </div>
                        )}
                        {savedMessages.map(note => (
                            <div key={note.id} className="bg-slate-800 border border-slate-700 rounded p-3 relative group">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-between">
                                    <span>{note.senderName}</span>
                                    <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="text-xs text-slate-300 max-h-40 overflow-y-auto custom-scrollbar">
                                    {formatMessage(note.content)}
                                </div>
                                <button 
                                    onClick={() => onDeleteSavedMessage(note.id)}
                                    className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Turn Notification / Status Banner */}
            {!isMyTurn ? (
                <div className="bg-slate-800 py-1 px-4 text-center border-t border-slate-700">
                    <span className="text-xs text-amber-500 font-bold animate-pulse flex items-center justify-center gap-2">
                        <Lock size={12} /> Waiting for {currentTurnName}...
                    </span>
                </div>
            ) : isWaitingForRoll ? (
                <div className="bg-dragon-900/50 py-1 px-4 text-center border-t border-dragon-500/50">
                    <span className="text-xs text-red-200 font-bold animate-pulse flex items-center justify-center gap-2">
                        <AlertCircle size={12} /> DM requires a check/roll to continue!
                    </span>
                </div>
            ) : null}

            {/* Input Area */}
            <div className={`p-3 bg-slate-800 border-t border-slate-700 ${!isMyTurn ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="flex gap-2">
                    <button 
                        onClick={onRollRequest}
                        disabled={!isMyTurn}
                        className={`p-2 rounded transition-all disabled:opacity-50 ${isWaitingForRoll ? 'bg-dragon-900 text-white animate-pulse border border-dragon-500' : 'text-slate-400 hover:text-dragon-500 hover:bg-slate-700'}`}
                        title="Roll Dice"
                    >
                        <Dices size={20} />
                    </button>
                    <button 
                        onClick={handleVoiceInput}
                        disabled={!isMyTurn}
                        className={`p-2 rounded transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-white'} disabled:opacity-50`}
                        title="Voice Input"
                    >
                        <Mic size={20} />
                    </button>
                    <input 
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 text-sm text-white focus:outline-none focus:border-dragon-500 disabled:cursor-not-allowed"
                        placeholder={isMyTurn ? (isWaitingForRoll ? "Roll requested..." : "Describe your action...") : "Wait for your turn..."}
                        value={input}
                        disabled={!isMyTurn}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking || !isMyTurn}
                        className="p-2 bg-dragon-900 hover:bg-dragon-600 text-white rounded disabled:opacity-50 transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}