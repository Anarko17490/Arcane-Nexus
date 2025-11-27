

import React, { useState, useRef, useEffect } from 'react';
import { BattleMapState, Token } from '../types';
import { Target, Move } from 'lucide-react';

interface Props {
    mapState: BattleMapState;
    currentPlayerId: string;
    onTokenMove: (tokenId: string, x: number, y: number) => void;
}

export default function TacticalMap({ mapState, currentPlayerId, onTokenMove }: Props) {
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter to ensure tokens are within bounds (sanity check)
    const validTokens = mapState.tokens.filter(t => 
        t.x >= 0 && t.x < mapState.gridWidth && t.y >= 0 && t.y < mapState.gridHeight
    );

    const handleGridClick = (x: number, y: number) => {
        if (selectedTokenId) {
            onTokenMove(selectedTokenId, x, y);
            setSelectedTokenId(null);
        }
    };

    const handleTokenClick = (e: React.MouseEvent, t: Token) => {
        e.stopPropagation();
        // Allow moving any token for now (DM mode style) or restrict to own
        // if (t.id === currentPlayerId || t.type === 'enemy') {
            setSelectedTokenId(t.id === selectedTokenId ? null : t.id);
        // }
    };

    return (
        <div className="w-full h-full flex flex-col bg-black">
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
                <div 
                    ref={containerRef}
                    className="relative shadow-2xl border-4 border-slate-800"
                    style={{
                        aspectRatio: `${mapState.gridWidth}/${mapState.gridHeight}`,
                        maxHeight: '100%',
                        maxWidth: '100%'
                    }}
                >
                    {/* Map Image */}
                    <img 
                        src={mapState.imageUrl} 
                        alt="Battle Map" 
                        className="w-full h-full object-cover"
                    />

                    {/* Grid Overlay */}
                    <div 
                        className="absolute inset-0 grid"
                        style={{
                            gridTemplateColumns: `repeat(${mapState.gridWidth}, 1fr)`,
                            gridTemplateRows: `repeat(${mapState.gridHeight}, 1fr)`
                        }}
                    >
                        {Array.from({ length: mapState.gridWidth * mapState.gridHeight }).map((_, i) => {
                            const x = i % mapState.gridWidth;
                            const y = Math.floor(i / mapState.gridWidth);
                            return (
                                <div 
                                    key={i}
                                    onClick={() => handleGridClick(x, y)}
                                    className={`border border-white/10 hover:bg-white/10 transition-colors cursor-pointer ${
                                        selectedTokenId ? 'hover:bg-green-500/20' : ''
                                    }`}
                                />
                            );
                        })}
                    </div>

                    {/* Tokens */}
                    <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${mapState.gridWidth}, 1fr)`,
                            gridTemplateRows: `repeat(${mapState.gridHeight}, 1fr)`
                        }}
                    >
                        {validTokens.map(t => (
                            <div
                                key={t.id}
                                style={{
                                    gridColumnStart: t.x + 1,
                                    gridRowStart: t.y + 1
                                }}
                                className="relative flex items-center justify-center pointer-events-auto"
                            >
                                <div 
                                    onClick={(e) => handleTokenClick(e, t)}
                                    className={`
                                        w-[80%] h-[80%] rounded-full shadow-lg border-2 transition-transform cursor-pointer
                                        flex items-center justify-center overflow-hidden bg-slate-900
                                        ${selectedTokenId === t.id ? 'scale-110 ring-4 ring-green-400 border-white z-10' : 'hover:scale-105 border-white/50'}
                                        ${t.type === 'enemy' ? 'ring-red-500' : ''}
                                    `}
                                >
                                    {t.avatar ? (
                                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${t.type === 'enemy' ? 'bg-red-900 text-red-200' : 'bg-indigo-900 text-indigo-200'}`}>
                                            {t.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                {/* Label */}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[8px] px-1 rounded whitespace-nowrap pointer-events-none">
                                    {t.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="h-12 bg-slate-900 border-t border-slate-700 flex items-center justify-between px-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Target size={14}/>
                    <span>Grid: {mapState.gridWidth}x{mapState.gridHeight}</span>
                </div>
                <div className="text-slate-300 text-sm font-bold flex items-center gap-2">
                    {selectedTokenId ? (
                        <span className="text-green-400 animate-pulse flex items-center gap-1">
                            <Move size={14}/> Click a square to move
                        </span>
                    ) : "Select a token to move"}
                </div>
            </div>
        </div>
    );
}