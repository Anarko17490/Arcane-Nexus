import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { chatWithDM } from '../services/geminiService';
import { Send, Mic, Volume2, User, Bot, Loader2 } from 'lucide-react';

export default function VirtualDM() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
        id: '0', 
        senderId: 'ai',
        senderName: 'DM',
        role: 'model', 
        content: "Welcome, adventurer. I am your Dungeon Master. What tales shall we weave today? Ask me for a scenario, a ruling, or simply begin your journey.", 
        type: 'text',
        timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'user',
        senderName: 'You',
        role: 'user',
        content: input,
        type: 'text',
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Filter messages for history to keep context manageable
    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    const response = await chatWithDM(history, userMsg.content);

    const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: 'ai',
        senderName: 'DM',
        role: 'model',
        content: response.text,
        type: 'text',
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech recognition not supported in this browser.");
        return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
    };

    recognition.start();
  };

  const speakText = (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a nice English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google UK English Male")) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.pitch = 0.9;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-cinzel text-dragon-500 flex items-center gap-2">
                <Bot /> The Dungeon Master
            </h2>
            <div className="text-xs text-slate-500">Gemini 2.5 Flash Powered</div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
            {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user' 
                        ? 'bg-indigo-900/80 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-600'
                    }`}>
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-xs font-bold opacity-50 uppercase">{msg.role === 'model' ? 'DM' : 'You'}</span>
                            {msg.role === 'model' && (
                                <button onClick={() => speakText(msg.content)} className="text-slate-400 hover:text-white">
                                    <Volume2 size={12} />
                                </button>
                            )}
                        </div>
                        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                            {msg.content}
                        </div>
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-slate-800 p-3 rounded-lg rounded-bl-none flex items-center gap-2 text-slate-400">
                        <Loader2 className="animate-spin" size={16} /> The DM is thinking...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
            <div className="flex gap-2">
                <button 
                    onClick={handleVoiceInput}
                    className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-600 animate-pulse text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                    <Mic size={20} />
                </button>
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Describe your action or ask a question..."
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 text-white focus:outline-none focus:border-dragon-500"
                />
                <button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="p-3 bg-dragon-900 hover:bg-dragon-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    </div>
  );
}