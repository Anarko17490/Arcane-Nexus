

export type Attribute = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface AppearanceDetails {
    hair: string;
    eyes: string;
    skin: string;
    height: string;
    weight: string;
    age: string;
    bodyType: string;
    clothing: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    equipped: boolean;
    quantity: number;
    isQuestItem?: boolean;
    description?: string;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hp: { current: number; max: number };
  ac: number;
  stats: Record<Attribute, number>;
  skills: string[];
  inventory: InventoryItem[];
  notes: string;
  // New visual fields
  avatarUrl?: string;
  appearance?: AppearanceDetails;
  // New Magic System
  spells?: {
    cantrips: string[];
    level1: string[];
  };
  genre?: GameGenre;
}

export interface UserProfile {
    username: string;
    avatarUrl?: string;
    bio?: string;
    playStyles?: string[]; // e.g., "Roleplay Heavy", "Combat Focused"
    location?: string;
    joinedDate: number;
}

export interface Player {
  id: string;
  name: string;
  role: 'DM' | 'Player' | 'Spectator';
  isReady: boolean;
  avatar?: string;
  isSpeaking?: boolean; // For voice chat UI
  characterDescription?: string; // To pass visual context to the scene generator
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: 'user' | 'model' | 'system';
  content: string; // Text content
  imageUrl?: string; // If the DM generates a visual
  type: 'text' | 'roll' | 'image' | 'voice_transcript';
  timestamp: number;
}

export interface Quest {
  title: string;
  hook: string;
  difficulty: string;
  enemies: string[];
  rewards: string[];
  description: string;
}

export interface GeneratedNPC {
  name: string;
  race: string;
  role: string;
  personality: string;
  secret: string;
  inventory: string[];
}

export interface Story {
    title: string;
    content: string;
    hook: string;
}

export interface DiceRollResult {
  id: string;
  playerId: string;
  playerName: string;
  formula: string;
  total: number;
  rolls: number[];
  timestamp: number;
}

export type GameGenre = 'Fantasy' | 'Sci-Fi' | 'Cyberpunk' | 'Post-Apocalyptic' | 'Epic War' | 'Eldritch Horror' | 'Steampunk' | 'Western';

export interface GameSettings {
    genre: GameGenre;
    maxPlayers: number;
    aiEnabled?: boolean;
}

export interface ScheduledCampaign {
    id: string;
    title: string;
    hostName: string;
    description: string;
    genre: GameGenre;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    maxPlayers: number;
    aiEnabled?: boolean;
    registeredPlayers: { id: string, name: string, avatar?: string }[];
}

// Unified Library Item for API and AI results
export interface LibraryItem {
    category?: string;
    name: string;
    description?: string; // AI Generic
    desc?: string; // Open5e Generic
    slug?: string; // Open5e
    // Common AI fields
    imagePrompt?: string;
    descriptionFlavor?: string;
    // Monster specific
    hit_points?: number; // Open5e
    armor_class?: number; // Open5e
    hp?: string; // AI often returns "7 (2d6)"
    ac?: number; // AI
    cr?: string;
    type?: string;
    subtype?: string;
    alignment?: string;
    speed?: string;
    stats?: Record<string, number>;
    actions?: { name: string, desc: string }[];
    traits?: string[];
    senses?: string;
    languages?: string[];
    // Spell specific
    level_int?: number; // Open5e
    level?: number | string; // AI or API
    school?: string;
    range?: string;
    duration?: string;
    components?: string;
    classes?: string[];
    // Weapon/Armor specific
    damage?: string;
    properties?: string[];
    cost?: string;
    weight?: string;
    acBonus?: number;
    stealthDisadvantage?: boolean;
    // Skill specific
    ability?: string;
    situations?: string[];
    // Class/Race specific
    hitDie?: string;
    primaryAbility?: string;
    proficiencies?: string[];
    savingThrows?: string[];
    keyFeatures?: { level: number, name: string, desc: string }[];
    subraces?: string[];
    abilityBonuses?: Record<string, number>;
}

// --- Map & Token Types ---

export interface MapAnalysisResult {
    needsMap: boolean;
    sceneType: 'combat' | 'exploration' | 'social' | 'rest';
    mapDescription?: string;
    gridWidth?: number;
    gridHeight?: number;
}

export interface Token {
    id: string;
    type: 'player' | 'enemy';
    x: number;
    y: number;
    avatar?: string;
    name: string;
    color?: string;
}

export interface BattleMapState {
    imageUrl: string;
    gridWidth: number; // cells
    gridHeight: number; // cells
    tokens: Token[];
}

export interface InitiativeItem {
    id: string;
    name: string;
    value: number; // Total roll
    dexMod: number;
    isEnemy: boolean;
    avatar?: string;
}

// --- Social & Notification Types ---

export interface Friend {
    id: string;
    name: string;
    status: 'pending_sent' | 'pending_received' | 'accepted';
    avatar?: string;
    isOnline?: boolean;
}

export interface AppNotification {
    id: string;
    type: 'friend_request' | 'friend_accept' | 'system' | 'campaign_invite';
    message: string;
    timestamp: number;
    read: boolean;
    data?: any; // To store friend ID or Campaign ID
}