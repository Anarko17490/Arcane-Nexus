


import React, { useState, useEffect } from 'react';
import CharacterSheet from './components/CharacterSheet';
import CampaignManager from './components/CampaignManager';
import Library from './components/Library';
import CharacterCreator from './components/CharacterCreator';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import Login from './components/Login';
import CharacterDashboard from './components/CharacterDashboard';
import SocialPanel from './components/SocialPanel';
import UserProfileEditor from './components/UserProfile';
import { Player, GameSettings, Character, Friend, AppNotification, UserProfile } from './types';
import { LayoutDashboard, User, Users, Sparkles, LogOut, Book, Grid, Bell, Map, Scroll, Menu as MenuIcon, X, Hammer, Dices } from 'lucide-react';

const NavBtn = ({ active, onClick, icon, label, className = '' }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; className?: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-md font-bold text-sm transition-all ${
            active 
            ? 'bg-slate-800 text-amber-500 shadow-inner border border-slate-700' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        } ${className}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const BottomNavBtn = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-all active:scale-95 ${
            active 
            ? 'text-amber-500' 
            : 'text-slate-500 hover:text-slate-300'
        }`}
    >
        <div className={`p-1 rounded-full ${active ? 'bg-slate-800' : ''}`}>
            {icon}
        </div>
        <span className="text-[10px] font-bold mt-1">{label}</span>
    </button>
);

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
      const savedProfile = localStorage.getItem('dnd_user_profile');
      if (savedProfile) return JSON.parse(savedProfile);
      
      // Fallback for migration from simple username
      const legacyName = localStorage.getItem('dnd_username');
      if (legacyName) {
          return {
              username: legacyName,
              joinedDate: Date.now()
          };
      }
      return null;
  });

  const [character, setCharacter] = useState<Character | null>(() => {
      const saved = localStorage.getItem('dnd_character');
      return saved ? JSON.parse(saved) : null;
  });

  // Flow State Management
  const [activeTab, setActiveTab] = useState(() => {
      if (!localStorage.getItem('dnd_user_profile') && !localStorage.getItem('dnd_username')) return 'login';
      return 'dashboard';
  });

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>({ genre: 'Fantasy', maxPlayers: 4 });

  // Social State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  
  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- SOCIAL SYSTEM (Mock Backend) ---
  useEffect(() => {
      // Load Social Data
      const savedFriends = localStorage.getItem('dnd_friends');
      if (savedFriends) setFriends(JSON.parse(savedFriends));

      const savedNotifs = localStorage.getItem('dnd_notifications');
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
  }, []);

  const saveFriends = (newFriends: Friend[]) => {
      setFriends(newFriends);
      localStorage.setItem('dnd_friends', JSON.stringify(newFriends));
  };

  const saveNotifications = (newNotifs: AppNotification[]) => {
      setNotifications(newNotifs);
      localStorage.setItem('dnd_notifications', JSON.stringify(newNotifs));
  };

  const addNotification = (type: AppNotification['type'], message: string, data?: any) => {
      const newNotif: AppNotification = {
          id: Date.now().toString(),
          type,
          message,
          timestamp: Date.now(),
          read: false,
          data
      };
      saveNotifications([newNotif, ...notifications]);
  };

  const handleSendRequest = (name: string) => {
      if (friends.find(f => f.name.toLowerCase() === name.toLowerCase())) {
          alert("Friend already in list or pending.");
          return;
      }

      const newFriend: Friend = {
          id: Date.now().toString(),
          name: name,
          status: 'pending_sent',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          isOnline: false
      };
      
      saveFriends([...friends, newFriend]);

      // SIMULATION: Automatically accept after 3 seconds for demo purposes
      setTimeout(() => {
          setFriends(prev => prev.map(f => {
              if (f.id === newFriend.id) {
                  return { ...f, status: 'accepted', isOnline: true };
              }
              return f;
          }));
          addNotification('friend_accept', `${name} accepted your friend request!`);
      }, 3000);
  };

  const handleSimulateIncoming = () => {
      const names = ["Gandalf_The_Grey", "Cyber_Ninja", "Vader42", "Lara_Croft"];
      const randomName = names[Math.floor(Math.random() * names.length)];
      
      const incoming: Friend = {
          id: Date.now().toString(),
          name: randomName,
          status: 'pending_received',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}`
      };
      
      saveFriends([...friends, incoming]);
      addNotification('friend_request', `${randomName} sent you a friend request.`, { friendId: incoming.id });
  };

  const handleAcceptRequest = (id: string) => {
      const updated = friends.map(f => f.id === id ? { ...f, status: 'accepted', isOnline: true } as Friend : f);
      saveFriends(updated);
  };

  const handleDeclineRequest = (id: string) => {
      const updated = friends.filter(f => f.id !== id);
      saveFriends(updated);
  };

  const handleMarkRead = (id: string) => {
      const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(updated);
  };
  
  const handleClearNotifications = () => {
      saveNotifications([]);
  };

  const handleCampaignInvite = (friendName: string, campaignTitle: string) => {
      alert(`Invitation sent to ${friendName} for "${campaignTitle}"`);
  };

  // --- AUTH & NAV ---

  const handleLogin = (name: string) => {
      const newProfile: UserProfile = {
          username: name,
          joinedDate: Date.now(),
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` // Default random avatar
      };
      
      localStorage.setItem('dnd_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('dnd_username', name); // Keep legacy for simplicity in other components
      setUserProfile(newProfile);
      setActiveTab('dashboard');
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
      setUserProfile(newProfile);
      localStorage.setItem('dnd_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('dnd_username', newProfile.username); // Sync
  };

  const handleCharacterComplete = () => {
      setActiveTab('dashboard');
  };

  const handleSelectCharacter = (char: Character) => {
      setCharacter(char);
      localStorage.setItem('dnd_character', JSON.stringify(char));
  };

  const handleUpdateCharacter = (newChar: Character) => {
      setCharacter(newChar);
      localStorage.setItem('dnd_character', JSON.stringify(newChar));
  };

  const handleCreateNew = () => {
      setActiveTab('creator');
  };

  const handleJoinGame = (player: Player, settings?: GameSettings) => {
      setCurrentPlayer(player);
      if (settings) setGameSettings(settings);
      setActiveTab('game');
  };

  const handleLeaveGame = () => {
      setCurrentPlayer(null);
      setActiveTab('lobby');
  };

  const handleLogout = () => {
      localStorage.removeItem('dnd_username');
      localStorage.removeItem('dnd_user_profile');
      setUserProfile(null);
      setActiveTab('login');
  };

  if (activeTab === 'login') {
      return <Login onLogin={handleLogin} />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-dragon-500/30 pb-20 md:pb-0">
      
      {/* DESKTOP HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-dragon-900 to-amber-600 rounded rotate-45 flex items-center justify-center shadow-lg border border-white/10">
                      <Dices size={16} className="text-white -rotate-45"/>
                  </div>
                  <h1 className="text-xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                      Arcane Nexus
                  </h1>
              </div>

              {/* Desktop Nav */}
              <nav className="flex items-center gap-2">
                  <NavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18}/>} label="Dashboard" />
                  <NavBtn active={activeTab === 'lobby'} onClick={() => setActiveTab('lobby')} icon={<Map size={18}/>} label="Campaigns" />
                  <NavBtn active={activeTab === 'forge'} onClick={() => setActiveTab('forge')} icon={<Hammer size={18}/>} label="Arcane Tools" />
                  <NavBtn active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Book size={18}/>} label="Bible" />
                  <NavBtn active={isSocialOpen} onClick={() => setIsSocialOpen(!isSocialOpen)} icon={<Users size={18}/>} label="Friends" />
              </nav>

              {/* User / Actions */}
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsSocialOpen(!isSocialOpen)}
                    className="relative p-2 text-slate-400 hover:text-white transition-colors"
                  >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                      )}
                  </button>
                  <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                      <div className="text-right hidden lg:block">
                          <div className="text-sm font-bold text-white">{userProfile?.username}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{character ? `Playing: ${character.name}` : 'No Hero Selected'}</div>
                      </div>
                      <button 
                        onClick={() => setIsProfileOpen(true)}
                        className="w-9 h-9 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden hover:border-amber-500 transition-colors"
                        title="Edit Profile"
                      >
                          {userProfile?.avatarUrl ? (
                              <img src={userProfile.avatarUrl} alt="User" className="w-full h-full object-cover"/>
                          ) : (
                              <User size={20} className="text-slate-400"/>
                          )}
                      </button>
                      <button onClick={handleLogout} className="text-slate-500 hover:text-red-400" title="Logout">
                          <LogOut size={18} />
                      </button>
                  </div>
              </div>
          </div>
      </header>

      {/* MOBILE HEADER (Top) */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 md:hidden flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-dragon-900 to-amber-600 rounded rotate-45 flex items-center justify-center shadow-lg border border-white/10">
                    <Dices size={16} className="text-white -rotate-45"/>
                </div>
                <h1 className="text-lg font-cinzel font-bold text-amber-500">
                    Arcane Nexus
                </h1>
          </div>
          <div className="flex items-center gap-3">
               <button 
                    onClick={() => setIsSocialOpen(!isSocialOpen)}
                    className="relative p-2 text-slate-400 hover:text-white"
               >
                   <Bell size={22} />
                   {unreadCount > 0 && (
                       <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                   )}
               </button>
               <button 
                 onClick={() => setIsProfileOpen(true)}
                 className="w-8 h-8 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden"
               >
                    {userProfile?.avatarUrl ? (
                        <img src={userProfile.avatarUrl} alt="User" className="w-full h-full object-cover"/>
                    ) : (
                        <User size={18} className="text-slate-400"/>
                    )}
               </button>
          </div>
      </header>

      {/* MOBILE BOTTOM NAV (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-2 md:hidden z-40 pb-safe">
          <BottomNavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <BottomNavBtn active={activeTab === 'lobby'} onClick={() => setActiveTab('lobby')} icon={<Map size={20}/>} label="Campaigns" />
          <BottomNavBtn active={activeTab === 'forge'} onClick={() => setActiveTab('forge')} icon={<Hammer size={20}/>} label="Tools" />
          <BottomNavBtn active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Book size={20}/>} label="Bible" />
          <BottomNavBtn active={isSocialOpen} onClick={() => setIsSocialOpen(!isSocialOpen)} icon={<Users size={20}/>} label="Friends" />
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
          {activeTab === 'dashboard' && (
              <CharacterDashboard 
                onSelectCharacter={handleSelectCharacter} 
                onCreateNew={handleCreateNew} 
              />
          )}
          
          {activeTab === 'creator' && (
              <CharacterCreator onComplete={handleCharacterComplete} />
          )}

          {activeTab === 'lobby' && userProfile && (
              <Lobby 
                username={userProfile.username} 
                character={character} 
                onJoin={handleJoinGame} 
                friends={friends}
                onInviteFriend={handleCampaignInvite}
                onSelectCharacter={handleSelectCharacter}
              />
          )}

          {activeTab === 'forge' && <CampaignManager />}
          
          {activeTab === 'library' && <Library />}

          {activeTab === 'game' && currentPlayer && (
              <div className="fixed inset-0 z-[100] bg-black">
                  <GameRoom 
                    player={currentPlayer} 
                    settings={gameSettings} 
                    onLeave={handleLeaveGame}
                    character={character}
                    onUpdateCharacter={handleUpdateCharacter}
                  />
              </div>
          )}

          {/* Fallback View for when a sheet needs to be viewed but not in game */}
          {activeTab === 'sheet' && (
              <div className="max-w-4xl mx-auto">
                   <div className="mb-4">
                       <button onClick={() => setActiveTab('dashboard')} className="text-slate-400 hover:text-white flex items-center gap-2">
                           ← Back to Dashboard
                       </button>
                   </div>
                   <CharacterSheet />
              </div>
          )}
      </main>

      {/* Social Panel Overlay */}
      <SocialPanel 
        isOpen={isSocialOpen}
        onClose={() => setIsSocialOpen(false)}
        friends={friends}
        notifications={notifications}
        onSendRequest={handleSendRequest}
        onAcceptRequest={handleAcceptRequest}
        onDeclineRequest={handleDeclineRequest}
        onMarkRead={handleMarkRead}
        onClearNotifications={handleClearNotifications}
        onSimulateIncoming={handleSimulateIncoming}
      />

      {/* User Profile Editor Modal */}
      {isProfileOpen && userProfile && (
          <UserProfileEditor 
            profile={userProfile}
            onSave={handleUpdateProfile}
            onClose={() => setIsProfileOpen(false)}
          />
      )}

    </div>
  );
}