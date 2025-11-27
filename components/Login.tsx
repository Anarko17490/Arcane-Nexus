
import React, { useState } from 'react';
import { User, Sword, Scroll } from 'lucide-react';

interface Props {
    onLogin: (name: string) => void;
}

export default function Login({ onLogin }: Props) {
    const [name, setName] = useState('');

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-200">
            <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Sword size={200} />
                </div>
                
                <div className="text-center mb-10 relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-dragon-900 to-amber-600 rounded-xl rotate-45 mx-auto mb-6 border-2 border-white/20 shadow-[0_0_30px_rgba(185,28,28,0.4)] flex items-center justify-center">
                        <div className="-rotate-45 text-white">
                            <Scroll size={32} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 font-bold mb-2">
                        Arcane Nexus
                    </h1>
                    <p className="text-slate-400 font-serif italic">"Step 1: Identify Thyself"</p>
                </div>

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Player Name</label>
                        <div className="flex items-center gap-3 bg-slate-800 p-4 rounded-lg border border-slate-600 focus-within:border-dragon-500 focus-within:ring-1 focus-within:ring-dragon-500 transition-all shadow-inner">
                            <User className="text-slate-400" />
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-transparent border-none outline-none text-white w-full font-bold text-lg placeholder-slate-600"
                                placeholder="e.g. DungeonMaster99"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && name && onLogin(name)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => name && onLogin(name)}
                        disabled={!name}
                        className="w-full bg-gradient-to-r from-dragon-900 to-red-800 hover:from-dragon-800 hover:to-red-700 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-cinzel text-xl shadow-lg hover:shadow-red-900/30 active:scale-[0.98]"
                    >
                        Enter the Realm
                    </button>
                    
                    <p className="text-center text-xs text-slate-600 mt-4">
                        By entering, you agree to face dragons, dungeons, and destiny.
                    </p>
                </div>
            </div>
        </div>
    );
}
