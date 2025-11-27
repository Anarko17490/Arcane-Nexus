
import React, { useState } from 'react';
import { Friend, AppNotification } from '../types';
import { Users, Bell, UserPlus, Check, X, Search, MessageSquare, Shield, Clock, Trash2, Zap } from 'lucide-react';

interface Props {
    friends: Friend[];
    notifications: AppNotification[];
    onSendRequest: (username: string) => void;
    onAcceptRequest: (friendId: string) => void;
    onDeclineRequest: (friendId: string) => void;
    onMarkRead: (notifId: string) => void;
    onClearNotifications: () => void;
    onSimulateIncoming: () => void; // Debugging tool
    isOpen: boolean;
    onClose: () => void;
}

export default function SocialPanel({ 
    friends, 
    notifications, 
    onSendRequest, 
    onAcceptRequest, 
    onDeclineRequest,
    onMarkRead,
    onClearNotifications,
    onSimulateIncoming,
    isOpen,
    onClose
}: Props) {
    const [activeTab, setActiveTab] = useState<'friends' | 'notifications'>('friends');
    const [inviteName, setInviteName] = useState('');

    if (!isOpen) return null;

    const pendingReceived = friends.filter(f => f.status === 'pending_received');
    const pendingSent = friends.filter(f => f.status === 'pending_sent');
    const acceptedFriends = friends.filter(f => f.status === 'accepted');
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleSend = () => {
        if (inviteName.trim()) {
            onSendRequest(inviteName);
            setInviteName('');
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-[100] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-cinzel font-bold text-amber-500 flex items-center gap-2">
                    <Users size={20}/> Social Hub
                </h2>
                <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                <button 
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'friends' ? 'text-white border-b-2 border-amber-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                >
                    <Users size={16}/> Friends
                    {(pendingReceived.length > 0) && (
                         <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingReceived.length}</span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('notifications')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'notifications' ? 'text-white border-b-2 border-indigo-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                >
                    <Bell size={16}/> Alerts
                    {unreadCount > 0 && (
                        <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
                
                {/* --- FRIENDS TAB --- */}
                {activeTab === 'friends' && (
                    <div className="space-y-6">
                        {/* Invite Section */}
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Add Friend</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <UserPlus className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                    <input 
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Username..."
                                        className="w-full bg-slate-950 border border-slate-600 rounded pl-9 pr-2 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <button onClick={handleSend} className="bg-amber-600 hover:bg-amber-500 text-white px-3 rounded font-bold text-sm">
                                    Add
                                </button>
                            </div>
                            <div className="mt-2 text-[10px] text-slate-500 flex justify-between items-center">
                                <span>Enter any name to simulate invite.</span>
                                <button onClick={onSimulateIncoming} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                    <Zap size={10}/> Sim. Incoming
                                </button>
                            </div>
                        </div>

                        {/* Pending Requests */}
                        {(pendingReceived.length > 0 || pendingSent.length > 0) && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-700 pb-1">Pending Requests</h3>
                                
                                {pendingReceived.map(req => (
                                    <div key={req.id} className="bg-slate-800/50 border border-indigo-500/30 p-2 rounded flex justify-between items-center animate-pulse">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-900 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                                {req.name[0]}
                                            </div>
                                            <span className="text-sm font-bold text-white">{req.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => onAcceptRequest(req.id)} className="p-1.5 bg-green-900 text-green-200 rounded hover:bg-green-700" title="Accept"><Check size={14}/></button>
                                            <button onClick={() => onDeclineRequest(req.id)} className="p-1.5 bg-red-900 text-red-200 rounded hover:bg-red-700" title="Decline"><X size={14}/></button>
                                        </div>
                                    </div>
                                ))}

                                {pendingSent.map(req => (
                                    <div key={req.id} className="bg-slate-800/50 p-2 rounded flex justify-between items-center">
                                        <span className="text-sm text-slate-400">{req.name}</span>
                                        <span className="text-[10px] bg-slate-700 px-2 py-1 rounded text-slate-300">Sent</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Friends List */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-700 pb-1 flex justify-between">
                                <span>Your Party ({acceptedFriends.length})</span>
                                <Search size={12}/>
                            </h3>
                            
                            {acceptedFriends.length === 0 && (
                                <div className="text-center py-8 text-slate-600 italic text-sm">
                                    No companions yet. Invite someone!
                                </div>
                            )}

                            {acceptedFriends.map(friend => (
                                <div key={friend.id} className="flex items-center justify-between group p-2 rounded hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                                                <img src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} alt={friend.name} />
                                            </div>
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${friend.isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-200">{friend.name}</div>
                                            <div className="text-[10px] text-slate-500">{friend.isOnline ? 'Online' : 'Offline'}</div>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white p-2">
                                        <MessageSquare size={16}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- NOTIFICATIONS TAB --- */}
                {activeTab === 'notifications' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <span className="text-xs font-bold text-slate-500 uppercase">Recent Alerts</span>
                            <button onClick={onClearNotifications} className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1">
                                <Trash2 size={10}/> Clear
                            </button>
                        </div>

                        {notifications.length === 0 && (
                             <div className="text-center py-8 text-slate-600 italic text-sm">
                                All quiet on the western front.
                            </div>
                        )}

                        <div className="space-y-2">
                            {notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => onMarkRead(n.id)}
                                    className={`p-3 rounded-lg border flex gap-3 cursor-pointer transition-all ${n.read ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-slate-800 border-indigo-500/30'}`}
                                >
                                    <div className={`mt-1 ${n.read ? 'text-slate-500' : 'text-indigo-400'}`}>
                                        {n.type.includes('friend') ? <UserPlus size={16}/> : <Shield size={16}/>}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-200 leading-tight">{n.message}</p>
                                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                            <Clock size={10}/> {new Date(n.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
