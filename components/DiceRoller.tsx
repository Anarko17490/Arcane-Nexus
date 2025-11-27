import React, { useState } from 'react';
import { DiceRollResult } from '../types';
import { Dices, History, Trash2 } from 'lucide-react';

const DIE_TYPES = [4, 6, 8, 10, 12, 20, 100];

export default function DiceRoller() {
  const [history, setHistory] = useState<DiceRollResult[]>([]);
  const [modifier, setModifier] = useState<number>(0);
  const [numDice, setNumDice] = useState<number>(1);

  const roll = (sides: number) => {
    const rolls = [];
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        const val = Math.floor(Math.random() * sides) + 1;
        rolls.push(val);
        total += val;
    }
    total += modifier;

    const result: DiceRollResult = {
        id: Date.now().toString(),
        playerId: 'local',
        playerName: 'You',
        formula: `${numDice}d${sides} ${modifier >= 0 ? '+' : ''}${modifier !== 0 ? modifier : ''}`,
        total,
        rolls,
        timestamp: Date.now()
    };
    
    setHistory(prev => [result, ...prev].slice(0, 10)); // Keep last 10
  };

  return (
    <div className="bg-slate-800 text-white p-6 rounded-lg shadow-xl border border-slate-600">
      <h2 className="text-2xl font-cinzel mb-4 flex items-center gap-2">
        <Dices className="text-dragon-500" /> Dice Roller
      </h2>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-end bg-slate-900 p-4 rounded">
        <div>
            <label className="block text-xs text-slate-400 mb-1">Count</label>
            <input 
                type="number" 
                min="1" 
                max="10" 
                value={numDice}
                onChange={(e) => setNumDice(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-center"
            />
        </div>
        <div>
            <label className="block text-xs text-slate-400 mb-1">Modifier</label>
            <input 
                type="number" 
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-center"
            />
        </div>
        <button 
            onClick={() => { setNumDice(1); setModifier(0); }}
            className="text-xs text-slate-400 hover:text-white underline pb-2"
        >
            Reset
        </button>
      </div>

      {/* Die Buttons */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {DIE_TYPES.map(sides => (
            <button 
                key={sides}
                onClick={() => roll(sides)}
                className="flex flex-col items-center justify-center p-3 bg-indigo-900/50 hover:bg-indigo-700 border border-indigo-500/50 rounded-lg transition-all active:scale-95"
            >
                <span className="text-lg font-bold">d{sides}</span>
            </button>
        ))}
      </div>

      {/* Display Latest Result */}
      {history.length > 0 && (
          <div className="mb-6 text-center p-6 bg-gradient-to-br from-dragon-900 to-slate-900 rounded-lg border border-dragon-500/50 shadow-inner">
            <span className="text-sm text-dragon-200 uppercase tracking-widest block mb-2">Total Result</span>
            <span className="text-6xl font-cinzel text-white drop-shadow-lg">{history[0].total}</span>
            <div className="mt-2 text-sm text-slate-400">
                Formula: {history[0].formula} <br/>
                Rolls: [{history[0].rolls.join(', ')}]
            </div>
          </div>
      )}

      {/* History */}
      <div className="border-t border-slate-700 pt-4">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2"><History size={16}/> Recent Rolls</h3>
            <button onClick={() => setHistory([])} className="text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
            {history.slice(1).map(h => (
                <div key={h.id} className="flex justify-between items-center text-sm bg-slate-700/30 p-2 rounded">
                    <span className="text-slate-300">{h.formula}</span>
                    <span className="font-bold text-white">{h.total}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}