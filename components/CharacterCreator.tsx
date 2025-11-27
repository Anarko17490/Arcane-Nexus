

import React, { useState, useEffect } from 'react';
import { Character, Attribute, AppearanceDetails, LibraryItem, GameGenre, InventoryItem } from '../types';
import { ChevronRight, ChevronLeft, Save, Shield, Heart, Dices, Book, Scroll, RefreshCw, CheckCircle, User, Loader2, Sparkles, Sword, Search, Plus, X, AlertTriangle, Globe, Info, Backpack, Gift, Package, Trash2, Coins } from 'lucide-react';
import { generateAvatarImage, generateRandomCharacter } from '../services/geminiService';
import { searchSpells } from '../services/dndService';

const GENRES: GameGenre[] = ['Fantasy', 'Sci-Fi', 'Cyberpunk', 'Post-Apocalyptic', 'Epic War', 'Eldritch Horror', 'Steampunk', 'Western'];

interface RaceInfo { desc: string, bonus: Partial<Record<Attribute, number>> }
interface ClassInfo {
    role: string;
    stat: Attribute;
    feature: string;
    hpDie: number;
    armor: string;
    weapons: string[];
    isCaster: boolean;
    magicType?: 'Known' | 'Prepared' | 'Wizard';
    cantripsKnown?: number;
    spellsKnown?: number; 
    bookStart?: number;
    srdClass?: string; // For API Mapping
}
interface BackgroundInfo { desc: string, skills: string[] }
interface GenreConfig {
    races: Record<string, RaceInfo>;
    classes: Record<string, ClassInfo>;
    backgrounds: Record<string, BackgroundInfo>;
    skillsList: Record<string, string[]>;
}

// --- DATA DEFINITIONS ---

// Helper to create simple spell objects
const createSpell = (name: string, level: number, school: string, desc: string, range = "60 ft"): LibraryItem => ({
    name, level, level_int: level, school, desc, range, components: "V, S", duration: "Instant", category: "spell"
});

const GENRE_SPELLS: Record<string, Record<string, LibraryItem[]>> = {
    'Sci-Fi': {
        'Technomancer': [
            createSpell("Data Spike", 0, "Hacking", "Launch a spike of code at a target, dealing 1d10 necrotic damage.", "120 ft"),
            createSpell("System Shock", 0, "Electric", "Touch a target to deliver 1d8 lightning damage. Target cannot take reactions.", "Touch"),
            createSpell("Light Protocol", 0, "Utility", "Emit bright light from your palm or device.", "Self"),
            createSpell("Firewall", 1, "Defense", "Create a barrier of hard-light code. +5 AC until start of next turn.", "Self"),
            createSpell("Logic Bomb", 1, "Explosive", "Create a digital explosion dealing 3d8 thunder damage.", "150 ft"),
            createSpell("Override", 1, "Control", "Force a robotic/cybernetic target to make a WIS save or obey a command.", "60 ft"),
            createSpell("Identify Tech", 1, "Divination", "Analyze the properties of a technological item.", "Touch")
        ],
        'Medic': [
            createSpell("Stabilize", 0, "Medical", "Stop a dying creature from bleeding on.", "Touch"),
            createSpell("Scan Vitals", 0, "Divination", "Know the current HP and ailments of a target.", "30 ft"),
            createSpell("Nanite Repair", 1, "Healing", "Inject nanites to heal 1d8 + Mod HP.", "Touch"),
            createSpell("Stim Pack", 1, "Buff", "Target gains temporary HP equal to your Mod + 5.", "Touch"),
            createSpell("Purge Toxin", 1, "Medical", "Cure one disease or neutralize one poison.", "Touch"),
            createSpell("Adrenaline Surge", 1, "Buff", "Target adds 1d4 to attacks and saves for 1 minute.", "30 ft")
        ]
    },
    'Post-Apocalyptic': {
        'Psyker': [
            createSpell("Mind Sliver", 0, "Psionic", "1d6 Psychic damage and -1d4 to next save.", "60 ft"),
            createSpell("Telekinetic Shove", 0, "Force", "Push a target 5ft away. STR save.", "30 ft"),
            createSpell("Mental Message", 0, "Telepathy", "Send a short message to a creature's mind.", "120 ft"),
            createSpell("Psionic Blast", 1, "Psychic", "3d6 Psychic damage in a cone. DEX save.", "15 ft Cone"),
            createSpell("Inertial Barrier", 1, "Defense", "Gain 10 Temp HP and resistance to Force damage.", "Self"),
            createSpell("Mind Control", 1, "Enchantment", "Target must make WIS save or be charmed.", "30 ft")
        ],
        'Doctor': [
             createSpell("Cauterize", 0, "Medical", "Stop bleeding on a target.", "Touch"),
             createSpell("Rad Sense", 0, "Divination", "Detect radiation sources.", "Self"),
             createSpell("Field Dressing", 1, "Healing", "Heal 1d8 + Mod HP.", "Touch"),
             createSpell("Rad-Away", 1, "Restoration", "Reduce radiation levels/poison in target.", "Touch"),
             createSpell("Combat Stims", 1, "Buff", "Target gains advantage on next STR check.", "Touch")
        ]
    },
    'Cyberpunk': {
        'Technomancer': [
            createSpell("Short Circuit", 0, "Electric", "1d8 Lightning damage, advantage vs metal armor.", "60 ft"),
            createSpell("Glitch", 0, "Illusion", "Create a minor visual or auditory hologram.", "30 ft"),
            createSpell("Ping", 0, "Divination", "Highlight enemy locations within 30ft.", "Self"),
            createSpell("Crash", 1, "Disruption", "Target robot/cyborg takes 3d8 thunder damage. CON save.", "Touch"),
            createSpell("Invisibility Cloak", 1, "Stealth", "Bend light to become invisible for 1 hour.", "Touch"),
            createSpell("Haste Protocol", 1, "Buff", "Double speed and +2 AC for 1 minute.", "30 ft")
        ],
        'Medic': [
             createSpell("Bio-Monitor", 0, "Divination", "Check target health status.", "Touch"),
             createSpell("Pain Killer", 0, "Abjuration", "Target gains resistance to next damage source.", "Touch"),
             createSpell("Trauma Patch", 1, "Healing", "Heal 1d8 + Mod HP.", "Touch"),
             createSpell("Defib", 1, "Necromancy", "Revive a creature that died within 1 minute. (Costly)", "Touch")
        ]
    }
};

const FANTASY_DATA: GenreConfig = {
  races: {
    Human: { desc: "Versatile and ambitious.", bonus: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 } },
    Elf: { desc: "Graceful and magical.", bonus: { DEX: 2 } },
    Dwarf: { desc: "Bold and hardy.", bonus: { CON: 2 } },
    Halfling: { desc: "Small and brave.", bonus: { DEX: 2 } },
  },
  classes: {
    Fighter: { role: "Frontline warrior", stat: "STR", feature: "Fighting Style", hpDie: 10, armor: "Chain Mail", weapons: ["Longsword", "Shield"], isCaster: false },
    Rogue: { role: "Stealthy trickster", stat: "DEX", feature: "Sneak Attack", hpDie: 8, armor: "Leather Armor", weapons: ["Dagger", "Shortbow"], isCaster: false },
    Wizard: { role: "Arcane spellcaster", stat: "INT", feature: "Spellcasting", hpDie: 6, armor: "None", weapons: ["Quarterstaff"], isCaster: true, magicType: 'Wizard', cantripsKnown: 3, bookStart: 6, srdClass: 'Wizard' },
    Cleric: { role: "Divine healer", stat: "WIS", feature: "Divine Domain", hpDie: 8, armor: "Scale Mail", weapons: ["Mace"], isCaster: true, magicType: 'Prepared', cantripsKnown: 3, srdClass: 'Cleric' },
  },
  backgrounds: {
    Soldier: { desc: "You served in an army.", skills: ["Athletics", "Intimidation"] },
    Acolyte: { desc: "You served in a temple.", skills: ["Religion", "Insight"] },
    Criminal: { desc: "You have a history of breaking the law.", skills: ["Deception", "Stealth"] },
    "Folk Hero": { desc: "You saved your village.", skills: ["Animal Handling", "Survival"] },
  },
  skillsList: {
      Fighter: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
      Rogue: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
      Wizard: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
      Cleric: ["History", "Insight", "Medicine", "Persuasion", "Religion"]
  }
};

const SCIFI_DATA: GenreConfig = {
    races: {
        Human: { desc: "Versatile explorers.", bonus: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 } },
        Android: { desc: "Synthetic lifeform, logical.", bonus: { INT: 2, CON: 1 } },
        Cyborg: { desc: "Enhanced organism.", bonus: { STR: 1, CON: 2 } },
        Alien: { desc: "Strange visitor from the stars.", bonus: { WIS: 2 } }
    },
    classes: {
        Soldier: { role: "Elite Trooper", stat: "STR", feature: "Combat Training", hpDie: 10, armor: "Plasteel Armor", weapons: ["Pulse Rifle", "Combat Knife"], isCaster: false },
        Operative: { role: "Covert Agent", stat: "DEX", feature: "Tech Stealth", hpDie: 8, armor: "Mesh Suit", weapons: ["Silenced Pistol", "Mono-Blade"], isCaster: false },
        Technomancer: { role: "Code Weaver", stat: "INT", feature: "Hacking", hpDie: 6, armor: "None", weapons: ["Datapad"], isCaster: true, magicType: 'Wizard', cantripsKnown: 3, bookStart: 6, srdClass: 'Wizard' },
        Medic: { role: "Field Surgeon", stat: "WIS", feature: "Advanced Aid", hpDie: 8, armor: "Hazmat Suit", weapons: ["Med-Pistol"], isCaster: true, magicType: 'Prepared', cantripsKnown: 3, srdClass: 'Cleric' }
    },
    backgrounds: {
        Pilot: { desc: "Ace of the skies/void.", skills: ["Survival", "Perception"] },
        Hacker: { desc: "Information broker.", skills: ["Investigation", "Deception"] },
        Mercenary: { desc: "Gun for hire.", skills: ["Athletics", "Intimidation"] },
        Scientist: { desc: "Researcher of the unknown.", skills: ["Arcana", "Medicine"] } // Arcana maps to Science
    },
    skillsList: {
        Soldier: ["Athletics", "Intimidation", "Survival", "Perception"],
        Operative: ["Stealth", "Deception", "Investigation", "Acrobatics"],
        Technomancer: ["Arcana", "History", "Investigation", "Medicine"],
        Medic: ["Medicine", "Insight", "Survival", "Nature"]
    }
};

const POSTAPO_DATA: GenreConfig = {
    races: {
        Survivor: { desc: "Standard human.", bonus: { CON: 1, DEX: 1, WIS: 1 } },
        Mutant: { desc: "Changed by radiation.", bonus: { STR: 2, CON: 1 } },
        Synth: { desc: "Old world robotics.", bonus: { INT: 2 } },
        Ghoul: { desc: "Irradiated but immune.", bonus: { CON: 2, WIS: 1 } }
    },
    classes: {
        Marauder: { role: "Wasteland Warrior", stat: "STR", feature: "Brutality", hpDie: 10, armor: "Scrap Plate", weapons: ["Sledgehammer", "Shotgun"], isCaster: false },
        Scavenger: { role: "Stealthy Looter", stat: "DEX", feature: "Scrounge", hpDie: 8, armor: "Leather Jacket", weapons: ["Knife", "Crossbow"], isCaster: false },
        Psyker: { role: "Mind-Warper", stat: "INT", feature: "Psionics", hpDie: 6, armor: "Rags", weapons: ["Focus Crystal"], isCaster: true, magicType: 'Wizard', cantripsKnown: 3, bookStart: 6, srdClass: 'Sorcerer' },
        Doctor: { role: "Wasteland Healer", stat: "WIS", feature: "Triage", hpDie: 8, armor: "Reinforced Coat", weapons: ["Scalpel"], isCaster: true, magicType: 'Prepared', cantripsKnown: 3, srdClass: 'Druid' }
    },
    backgrounds: {
        Drifter: { desc: "Wanderer of the wastes.", skills: ["Survival", "Perception"] },
        Raider: { desc: "Takes what they want.", skills: ["Intimidation", "Athletics"] },
        "Vault Dweller": { desc: "Sheltered from the fall.", skills: ["History", "Insight"] },
        Mechanic: { desc: "Fixer of junk.", skills: ["Investigation", "Arcana"] } // Arcana -> Tech
    },
    skillsList: {
        Marauder: ["Athletics", "Intimidation", "Survival"],
        Scavenger: ["Stealth", "Sleight of Hand", "Survival", "Perception"],
        Psyker: ["Arcana", "Insight", "Intimidation"],
        Doctor: ["Medicine", "Nature", "Insight"]
    }
};

const ATTRIBUTES: Attribute[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

interface Props {
  onComplete: () => void;
}

export default function CharacterCreator({ onComplete }: Props) {
  const [step, setStep] = useState(0); 
  
  // Draft State
  const [genre, setGenre] = useState<GameGenre>('Fantasy');
  const [name, setName] = useState('');
  const [concept, setConcept] = useState('');
  const [race, setRace] = useState('');
  const [charClass, setCharClass] = useState('');
  const [stats, setStats] = useState<Record<Attribute, number | null>>({
    STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null
  });
  
  // Stat Generation State
  const [rolledStats, setRolledStats] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const [background, setBackground] = useState('');
  const [selectedClassSkills, setSelectedClassSkills] = useState<string[]>([]);
  
  // MAGIC STATE
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>([]);
  const [selectedLevel1, setSelectedLevel1] = useState<string[]>([]);
  const [spellQuery, setSpellQuery] = useState('');
  const [spellResults, setSpellResults] = useState<LibraryItem[]>([]);
  const [isSearchingSpells, setIsSearchingSpells] = useState(false);
  const [activeSpellTab, setActiveSpellTab] = useState<'cantrip'|'level1'>('level1');
  const [viewingSpell, setViewingSpell] = useState<LibraryItem | null>(null);

  // EQUIPMENT STATE
  const [addedEquipment, setAddedEquipment] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [money, setMoney] = useState<string>('');
  const [isRollingMoney, setIsRollingMoney] = useState(false);

  // Detailed Appearance State
  const [appearance, setAppearance] = useState<AppearanceDetails>({
    hair: '', eyes: '', skin: '', height: '', weight: '', age: '', bodyType: '', clothing: ''
  });
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const [desire, setDesire] = useState('');
  const [flaw, setFlaw] = useState('');

  // Helper to get Data based on Genre
  const getGenreData = (g: GameGenre): GenreConfig => {
      switch(g) {
          case 'Fantasy': return FANTASY_DATA;
          case 'Sci-Fi': return SCIFI_DATA;
          case 'Cyberpunk': return SCIFI_DATA; // Shared for now
          case 'Post-Apocalyptic': return POSTAPO_DATA;
          default: return FANTASY_DATA; // Fallback
      }
  };

  const DATA = getGenreData(genre);

  // Defaults when switching genre
  useEffect(() => {
      const d = getGenreData(genre);
      setRace(Object.keys(d.races)[0]);
      setCharClass(Object.keys(d.classes)[0]);
      setBackground(Object.keys(d.backgrounds)[0]);
      // Reset selections
      setSelectedClassSkills([]);
      setSelectedCantrips([]);
      setSelectedLevel1([]);
      setAddedEquipment([]);
      setMoney('');
  }, [genre]);

  // Derived calculations
  const getStatScore = (attr: Attribute) => {
    const assigned = stats[attr] || 8;
    const bonus = DATA.races[race]?.bonus[attr] || 0;
    return assigned + bonus;
  };
  
  const getMod = (score: number) => Math.floor((score - 10) / 2);

  const calculateHP = () => {
    const cls = DATA.classes[charClass];
    if (!cls) return 10;
    const conMod = getMod(getStatScore('CON'));
    return cls.hpDie + conMod;
  };

  const calculateAC = () => {
    const cls = DATA.classes[charClass];
    if (!cls) return 10;
    const dexMod = getMod(getStatScore('DEX'));
    if (cls.armor.includes('None') || cls.armor.includes('Rags')) return 10 + dexMod;
    if (cls.armor.includes('Leather') || cls.armor.includes('Mesh')) return 11 + dexMod;
    if (cls.armor.includes('Chain') || cls.armor.includes('Plasteel') || cls.armor.includes('Plate')) return 16; 
    if (cls.armor.includes('Scale') || cls.armor.includes('Coat') || cls.armor.includes('Hazmat')) return 14 + Math.min(dexMod, 2);
    return 10 + dexMod;
  };

  const toggleSkill = (skill: string) => {
    const limit = 2; // Simplified choice limit across genres
    if (selectedClassSkills.includes(skill)) {
      setSelectedClassSkills(prev => prev.filter(s => s !== skill));
    } else {
      if (selectedClassSkills.length < limit) {
        setSelectedClassSkills(prev => [...prev, skill]);
      }
    }
  };

  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    const desc = `Hair: ${appearance.hair}, Eyes: ${appearance.eyes}, Skin: ${appearance.skin}, Age: ${appearance.age}, Body: ${appearance.bodyType}, Height: ${appearance.height}, Wearing: ${appearance.clothing}. Genre: ${genre}`;
    const url = await generateAvatarImage(desc, race, charClass);
    if (url) {
        setGeneratedAvatarUrl(url);
    }
    setIsGeneratingAvatar(false);
  };

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    const char = await generateRandomCharacter(genre);
    if (char) {
        setName(char.name);
        setConcept(char.concept);
        
        // Match approximate string keys or fallback
        const raceKey = Object.keys(DATA.races).find(r => r === char.race) || Object.keys(DATA.races)[0];
        setRace(raceKey);

        const classKey = Object.keys(DATA.classes).find(c => c === char.class) || Object.keys(DATA.classes)[0];
        setCharClass(classKey);

        const bgKey = Object.keys(DATA.backgrounds).find(b => b === char.background) || Object.keys(DATA.backgrounds)[0];
        setBackground(bgKey);

        if (char.appearance) setAppearance(char.appearance);
        if (char.desire) setDesire(char.desire);
        if (char.flaw) setFlaw(char.flaw);
    }
    setIsAutoGenerating(false);
  };

  // MAGIC HANDLERS
  const fetchClassSpells = async () => {
      // 1. If Non-Fantasy, look up in local DB
      if (genre !== 'Fantasy') {
          const localSpells = GENRE_SPELLS[genre]?.[charClass] || [];
          // Also check shared genre spells if specific class list is missing (optional fallback logic)
          setSpellResults(localSpells);
          return;
      }

      // 2. If Fantasy, use Open5e API
      const cls = DATA.classes[charClass];
      const targetClass = cls?.srdClass || 'Wizard'; 
      
      setIsSearchingSpells(true);
      try {
          const results = await searchSpells('', targetClass);
          setSpellResults(results);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSearchingSpells(false);
      }
  };

  const handleSpellSearch = async () => {
    setIsSearchingSpells(true);

    // 1. Local Search for Non-Fantasy
    if (genre !== 'Fantasy') {
        const localSpells = GENRE_SPELLS[genre]?.[charClass] || [];
        const filtered = localSpells.filter(s => 
            s.name.toLowerCase().includes(spellQuery.toLowerCase()) || 
            s.desc?.toLowerCase().includes(spellQuery.toLowerCase())
        );
        setSpellResults(filtered);
        setIsSearchingSpells(false);
        return;
    }

    // 2. API Search for Fantasy
    const cls = DATA.classes[charClass];
    const targetClass = cls?.srdClass || undefined; 
    
    try {
        const results = await searchSpells(spellQuery, targetClass);
        setSpellResults(results);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSearchingSpells(false);
    }
  };

  // Fetch spells when entering step 7 (Moved from 9)
  useEffect(() => {
      if (step === 7 && DATA.classes[charClass]?.isCaster && spellResults.length === 0) {
          fetchClassSpells();
      }
  }, [step, charClass]);

  const addSpell = (spell: LibraryItem) => {
    const isCantrip = spell.level === 0 || spell.level_int === 0 || spell.level === 'Cantrip';
    if (isCantrip) {
        if (!selectedCantrips.includes(spell.name)) setSelectedCantrips(prev => [...prev, spell.name]);
    } else {
        if (!selectedLevel1.includes(spell.name)) setSelectedLevel1(prev => [...prev, spell.name]);
    }
  };

  const removeCantrip = (name: string) => setSelectedCantrips(p => p.filter(s => s !== name));
  const removeLevel1 = (name: string) => setSelectedLevel1(p => p.filter(s => s !== name));

  // EQUIPMENT HANDLERS
  const addItem = () => {
      if (newItem.trim()) {
          setAddedEquipment([...addedEquipment, newItem.trim()]);
          setNewItem('');
      }
  };

  const removeItem = (idx: number) => {
      setAddedEquipment(addedEquipment.filter((_, i) => i !== idx));
  };
  
  const generateTrinket = () => {
       const TRINKETS: Record<string, string[]> = {
            'Fantasy': ["A mummified goblin hand", "A crystal that glows faintly", "A piece of an old map", "A key to a forgotten tower", "A stone with a rune"],
            'Sci-Fi': ["A datachip with corrupted files", "A strange alien coin", "A photo of a planet that doesn't exist", "A broken communicator"],
            'Post-Apocalyptic': ["A pristine pre-war soda can", "A geiger counter that clicks randomly", "A locket with no photo", "Matches that never light"],
            'Cyberpunk': ["A retro memory stick", "Neon shoelaces", "A corporate ID badge", "A glitching holographic photo"],
            'Epic War': ["A medal from a lost battle", "A letter to home", "A dented canteen", "Shell casing from a tank"],
            'Eldritch Horror': ["A bone whistle", "A page of mad scribbles", "A vial of black ichor", "A doll with one eye"],
            'Steampunk': ["A brass gear that spins alone", "A monocle with a cracked lens", "A tiny clockwork bird", "A blueprint for a steam engine"],
            'Western': ["A loaded die", "A sheriff's badge with a bullet hole", "A harmonic", "A map to a gold mine"]
       };
       const list = TRINKETS[genre] || TRINKETS['Fantasy'];
       const t = list[Math.floor(Math.random() * list.length)];
       setAddedEquipment([...addedEquipment, t]);
  };

  const rollStartingMoney = () => {
      setIsRollingMoney(true);
      setTimeout(() => {
          let total = 0;
          let currency = '';
          
          switch(genre) {
            case 'Fantasy':
                // 5d4 * 10
                total = Array.from({length: 5}, () => Math.floor(Math.random() * 4) + 1).reduce((a,b)=>a+b,0) * 10;
                currency = 'gp';
                break;
            case 'Sci-Fi':
            case 'Cyberpunk':
                 // 4d6 * 100
                 total = Array.from({length: 4}, () => Math.floor(Math.random() * 6) + 1).reduce((a,b)=>a+b,0) * 100;
                 currency = genre === 'Cyberpunk' ? 'Eddies' : 'Credits';
                 break;
            case 'Post-Apocalyptic':
                // 3d20
                total = Array.from({length: 3}, () => Math.floor(Math.random() * 20) + 1).reduce((a,b)=>a+b,0);
                currency = 'Caps';
                break;
            case 'Steampunk':
                // 4d6 * 5
                total = Array.from({length: 4}, () => Math.floor(Math.random() * 6) + 1).reduce((a,b)=>a+b,0) * 5;
                currency = 'Sovereigns';
                break;
            case 'Western':
                // 3d6 * 10
                total = Array.from({length: 3}, () => Math.floor(Math.random() * 6) + 1).reduce((a,b)=>a+b,0) * 10;
                currency = 'Dollars';
                break;
             case 'Epic War':
                 total = 0;
                 currency = 'Requisition';
                 break;
            default:
                total = 100;
                currency = 'Gold';
          }
          
          setMoney(`${total} ${currency}`);
          setIsRollingMoney(false);
      }, 800);
  }

  const handleSave = () => {
    const finalStats: Record<Attribute, number> = {
        STR: getStatScore('STR'),
        DEX: getStatScore('DEX'),
        CON: getStatScore('CON'),
        INT: getStatScore('INT'),
        WIS: getStatScore('WIS'),
        CHA: getStatScore('CHA'),
    };

    const bgSkills = DATA.backgrounds[background]?.skills || [];
    const finalSkills = Array.from(new Set([...bgSkills, ...selectedClassSkills]));
    const cls = DATA.classes[charClass];
    
    // Construct Object-Based Inventory
    const inventory: InventoryItem[] = [];
    
    // Weapons (Auto-equipped)
    (cls.weapons || []).forEach(w => {
        inventory.push({ id: `weapon-${Date.now()}-${w}`, name: w, equipped: true, quantity: 1, isQuestItem: false });
    });

    // Armor (Auto-equipped)
    if (cls.armor && cls.armor !== 'None') {
        inventory.push({ id: `armor-${Date.now()}`, name: cls.armor, equipped: true, quantity: 1, isQuestItem: false });
    }

    // Money
    if (money) {
        inventory.push({ id: `money-${Date.now()}`, name: `Wealth: ${money}`, equipped: false, quantity: 1, isQuestItem: false });
    }

    // Backpack & Background (Unequipped)
    addedEquipment.forEach(i => {
         inventory.push({ id: `item-${Date.now()}-${Math.random()}`, name: i, equipped: false, quantity: 1, isQuestItem: false });
    });
    inventory.push({ id: `bg-kit-${Date.now()}`, name: `${background} Kit`, equipped: false, quantity: 1, isQuestItem: false });

    const newCharacter: Character = {
      id: Date.now().toString(),
      name: name || 'Unnamed Hero',
      race,
      class: charClass,
      level: 1,
      hp: { current: calculateHP(), max: calculateHP() },
      ac: calculateAC(),
      stats: finalStats,
      skills: finalSkills,
      inventory: inventory,
      notes: `Concept: ${concept}\nDesire: ${desire}\nFlaw: ${flaw}\n\nGenre: ${genre}`,
      appearance: appearance,
      avatarUrl: generatedAvatarUrl || undefined,
      spells: cls.isCaster ? {
          cantrips: selectedCantrips,
          level1: selectedLevel1
      } : undefined,
      genre: genre
    };

    const stored = localStorage.getItem('dnd_characters');
    const characters: Character[] = stored ? JSON.parse(stored) : [];
    characters.push(newCharacter);
    localStorage.setItem('dnd_characters', JSON.stringify(characters));
    localStorage.setItem('dnd_character', JSON.stringify(newCharacter));
    onComplete();
  };

  const rollStats = () => {
      if (rolledStats.length > 0) return;
      setIsRolling(true);
      setStats({STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null});
      let iterations = 0;
      const interval = setInterval(() => {
          const temp = Array.from({length: 6}, () => Math.floor(Math.random() * 13) + 6);
          setRolledStats(temp);
          iterations++;
          if (iterations > 8) {
              clearInterval(interval);
              const finalStats = [];
              for(let i=0; i<6; i++) {
                  const rolls = Array.from({length: 4}, () => Math.floor(Math.random() * 6) + 1);
                  rolls.sort((a,b) => a-b); 
                  const sum = rolls.slice(1).reduce((a,b) => a+b, 0);
                  finalStats.push(sum);
              }
              finalStats.sort((a,b) => b-a);
              setRolledStats(finalStats);
              setIsRolling(false);
          }
      }, 80);
  };

  const getAvailableOptions = (currentAttr: Attribute) => {
      const pool: number[] = rolledStats;
      if (pool.length === 0) return [];
      const poolCounts = pool.reduce((acc: Record<number, number>, val: number) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
      }, {} as Record<number, number>);
      const usedCounts = Object.entries(stats).reduce((acc: Record<number, number>, [attr, val]) => {
          if (attr !== currentAttr && val !== null) {
              const v = val as number;
              acc[v] = (acc[v] || 0) + 1;
          }
          return acc;
      }, {} as Record<number, number>);
      const uniqueValues = Array.from(new Set(pool)).sort((a: number, b: number) => b - a);
      return uniqueValues.filter((val: number) => {
          const total = poolCounts[val] || 0;
          const used = usedCounts[val] || 0;
          return used < total;
      });
  };

  // Steps Rendering
  const renderStep = () => {
    switch(step) {
      case 0:
        return (
            <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500">
                    <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 0: Choose Your World</h3>
                    <p className="text-slate-300 italic">"In what era does your legend unfold?"</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {GENRES.map(g => (
                        <button
                            key={g}
                            onClick={() => setGenre(g)}
                            className={`p-4 rounded-lg border-2 text-center transition-all ${
                                genre === g 
                                ? 'border-dragon-500 bg-dragon-900/30 text-white' 
                                : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            <Globe size={24} className="mx-auto mb-2 opacity-70" />
                            <span className="font-bold text-sm">{g}</span>
                        </button>
                    ))}
                </div>
                <div className="text-xs text-slate-500 text-center italic mt-4">
                    This selection determines available races, classes, and starting gear.
                </div>
            </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h3 className="text-xl font-cinzel text-dragon-400 mb-1">Step 1: Identity</h3>
                  <p className="text-slate-300 italic text-sm">"Who are you in this {genre} world?"</p>
              </div>
              <button 
                  onClick={handleAutoGenerate}
                  disabled={isAutoGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg transition-all disabled:opacity-50 text-sm font-bold"
              >
                  {isAutoGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                  Auto Generate
              </button>
            </div>
            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-bold mb-1">Character Name</label>
                 <input 
                   value={name} onChange={(e) => setName(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-lg font-cinzel text-white focus:border-dragon-500 outline-none transition-colors"
                   placeholder="e.g. Aragorn, Unit 734, The Wanderer..."
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold mb-1">Concept</label>
                 <input 
                   value={concept} onChange={(e) => setConcept(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white focus:border-dragon-500 outline-none transition-colors"
                   placeholder="e.g. A fugitive pilot seeking redemption..."
                 />
               </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500">
              <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 2: Pick a Race</h3>
              <p className="text-slate-300 italic">"Your heritage defines your natural traits."</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DATA.races).map(([r, info]) => (
                <button 
                  key={r}
                  onClick={() => setRace(r)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${race === r ? 'border-dragon-500 bg-dragon-900/20' : 'border-slate-700 bg-slate-800 hover:bg-slate-700'}`}
                >
                  <div className="font-bold text-lg font-cinzel mb-1">{r}</div>
                  <div className="text-sm text-slate-400 mb-2">{info.desc}</div>
                  <div className="text-xs text-indigo-400 font-mono">
                    Bonus: {Object.entries(info.bonus).map(([k, v]) => `+${v} ${k}`).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500">
              <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 3: Choose a Class</h3>
              <p className="text-slate-300 italic">"This is your profession."</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DATA.classes).map(([c, info]) => (
                <button 
                  key={c}
                  onClick={() => setCharClass(c)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${charClass === c ? 'border-dragon-500 bg-dragon-900/20' : 'border-slate-700 bg-slate-800 hover:bg-slate-700'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-lg font-cinzel">{c}</div>
                      <div className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-300">{info.stat}</div>
                  </div>
                  <div className="text-sm text-slate-400 italic mb-2">"{info.role}"</div>
                  <div className="text-xs text-indigo-400">
                    Feature: {info.feature}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500">
              <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 4: Ability Scores</h3>
              <p className="text-slate-300 italic mb-3">
                "Roll 4d6 and drop the lowest. Assign to your attributes."
              </p>
            </div>
            
            <div className="bg-slate-900 p-4 rounded border border-slate-700">
                <div className="mb-6 p-4 bg-slate-800 rounded border border-slate-600 flex flex-col items-center">
                    <div className="flex gap-3 mb-4 flex-wrap justify-center">
                        {rolledStats.length > 0 ? rolledStats.map((val, idx) => (
                            <div key={idx} className="w-12 h-12 bg-dragon-900 rounded border border-dragon-500 flex items-center justify-center font-bold text-xl shadow-lg">
                                {val}
                            </div>
                        )) : (
                            <div className="text-slate-500 italic">Pool empty. Roll the dice to begin.</div>
                        )}
                    </div>
                    <button 
                        onClick={rollStats}
                        disabled={isRolling || rolledStats.length > 0}
                        className="flex items-center gap-2 px-6 py-2 bg-dragon-700 hover:bg-dragon-600 text-white rounded font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <Dices className={isRolling ? 'animate-spin' : ''} /> 
                       {rolledStats.length > 0 ? 'Stats Locked' : 'Roll Stats'}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ATTRIBUTES.map(attr => {
                        const isKey = DATA.classes[charClass]?.stat === attr;
                        const availableOptions = getAvailableOptions(attr);
                        const bonus = DATA.races[race]?.bonus[attr] || 0;
                        
                        return (
                            <div key={attr} className="bg-slate-800 p-3 rounded border border-slate-600">
                                <label className="flex justify-between font-bold mb-2">
                                    <span className={isKey ? "text-dragon-400" : "text-slate-300"}>
                                        {attr} {isKey && '★'}
                                    </span>
                                    {stats[attr] && (
                                        <span className="text-sm text-green-400">
                                            {stats[attr]! + bonus} ({getMod(stats[attr]! + bonus) >= 0 ? '+' : ''}{getMod(stats[attr]! + bonus)})
                                        </span>
                                    )}
                                </label>
                                <select 
                                    value={stats[attr] || ''}
                                    onChange={(e) => setStats({...stats, [attr]: e.target.value ? parseInt(e.target.value) : null})}
                                    disabled={rolledStats.length === 0}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white disabled:opacity-50"
                                >
                                    <option value="">Select...</option>
                                    {stats[attr] !== null && <option value={stats[attr]!}>{stats[attr]!}</option>}
                                    {availableOptions.map(num => (
                                        <option key={`${attr}-${num}`} value={num}>{num}</option>
                                    ))}
                                </select>
                            </div>
                        )
                    })}
                </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
             <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500">
              <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 5: Background</h3>
              <p className="text-slate-300 italic">"Who were you before the adventure began?"</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DATA.backgrounds).map(([b, info]) => (
                <button 
                  key={b}
                  onClick={() => setBackground(b)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${background === b ? 'border-dragon-500 bg-dragon-900/20' : 'border-slate-700 bg-slate-800 hover:bg-slate-700'}`}
                >
                  <div className="font-bold text-lg font-cinzel mb-1">{b}</div>
                  <div className="text-sm text-slate-400 mb-2">{info.desc}</div>
                  <div className="text-xs text-indigo-400">
                    Skills: {info.skills.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        const bgSkills = DATA.backgrounds[background]?.skills || [];
        const classSkills = DATA.skillsList[charClass] || DATA.skillsList['Fighter'] || [];
        
        return (
          <div className="space-y-6">
             <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500">
              <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 6: Skills</h3>
              <p className="text-slate-300 italic">"Choose your training."</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">From Background ({background})</h4>
                  <div className="flex gap-2">
                    {bgSkills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-slate-300 flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" /> {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-slate-400 uppercase">From Class ({charClass})</h4>
                    <span className={`text-xs font-bold ${selectedClassSkills.length === 2 ? 'text-green-400' : 'text-amber-400'}`}>
                      Selected: {selectedClassSkills.length} / 2
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {classSkills.map(skill => {
                      const isBgSkill = bgSkills.includes(skill);
                      const isSelected = selectedClassSkills.includes(skill);
                      const isMaxed = selectedClassSkills.length >= 2;

                      if (isBgSkill) return null;

                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          disabled={!isSelected && isMaxed}
                          className={`px-3 py-2 rounded text-left text-sm border transition-all ${
                            isSelected 
                            ? 'bg-indigo-900 border-indigo-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {skill}
                        </button>
                      )
                    })}
                  </div>
                </div>
            </div>
          </div>
        );
      case 7:
        // Moved SPELLS here (was 9)
        const cls = DATA.classes[charClass];
        const isCaster = cls?.isCaster;
        
        const cantripLimit = cls?.cantripsKnown || 0;
        let spellLimit = 0;
        let limitLabel = '';
        
        if (cls?.magicType === 'Wizard') {
            spellLimit = cls.bookStart || 6;
            limitLabel = 'Book';
        } else if (cls?.magicType === 'Prepared') {
             const mod = Math.max(1, getMod(getStatScore(cls.stat)));
             spellLimit = 1 + mod;
             limitLabel = 'Prepared';
        }

        const cantripFull = selectedCantrips.length >= cantripLimit;
        const spellFull = selectedLevel1.length >= spellLimit;

        // Filter spell results for tabs
        const cantripsList = spellResults.filter(s => s.level === 0 || s.level_int === 0 || s.level === 'Cantrip');
        const level1List = spellResults.filter(s => s.level === 1 || s.level_int === 1);

        return (
            <div className="space-y-6 h-full flex flex-col">
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500 shrink-0">
                    <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 7: Magic / Tech</h3>
                    <p className="text-slate-300 italic">
                        {isCaster ? `Select your abilities.` : "Your path relies on physical prowess."}
                    </p>
                </div>
                
                {isCaster ? (
                    <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                         {/* LEFT: Selected Spells */}
                         <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
                             <h4 className="font-cinzel text-indigo-300 font-bold border-b border-slate-700 pb-1">Your Spellbook</h4>
                             
                             {/* Level 1 Selected */}
                             <div 
                                onClick={() => setActiveSpellTab('level1')}
                                className={`p-4 rounded border cursor-pointer transition-colors ${activeSpellTab === 'level1' ? 'border-purple-500 bg-purple-900/10' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}
                             >
                                 <div className="flex justify-between items-center mb-2">
                                     <h4 className="font-bold text-white flex items-center gap-2"><Book size={16}/> {limitLabel} Spells</h4>
                                     <span className={`text-xs font-bold ${spellFull ? 'text-green-400' : 'text-amber-400'}`}>
                                         {selectedLevel1.length} / {spellLimit}
                                     </span>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                     {selectedLevel1.length === 0 && <span className="text-xs text-slate-500 italic">None selected</span>}
                                     {selectedLevel1.map(s => (
                                         <button 
                                            key={s} 
                                            onClick={(e) => { e.stopPropagation(); removeLevel1(s); }}
                                            className="flex items-center gap-1 bg-purple-700 hover:bg-red-900 px-2 py-1 rounded text-xs text-white"
                                         >
                                             {s} <X size={12}/>
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         </div>

                         {/* RIGHT: Available Options */}
                         <div className="w-full lg:w-2/3 bg-slate-900 rounded border border-slate-700 flex flex-col h-full overflow-hidden">
                             {/* Tabs & Search */}
                             <div className="p-3 bg-slate-800 border-b border-slate-700 flex flex-col gap-3">
                                 <div className="flex gap-2 mb-1">
                                    <button 
                                        onClick={() => setActiveSpellTab('level1')}
                                        className={`flex-1 py-2 text-sm font-bold rounded ${activeSpellTab === 'level1' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                                    >
                                        Level 1
                                    </button>
                                 </div>
                                 <div className="flex gap-2 relative">
                                     <Search size={16} className="absolute left-3 top-2.5 text-slate-500"/>
                                     <input 
                                         value={spellQuery}
                                         onChange={(e) => setSpellQuery(e.target.value)}
                                         onKeyDown={(e) => e.key === 'Enter' && handleSpellSearch()}
                                         className="flex-1 bg-slate-900 border border-slate-600 rounded pl-9 pr-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                         placeholder={`Search ${genre === 'Fantasy' ? (cls.srdClass || 'All') : 'Available'} Spells...`}
                                     />
                                     <button onClick={handleSpellSearch} className="bg-slate-700 px-4 rounded text-white hover:bg-slate-600 text-sm font-bold">
                                         {isSearchingSpells ? <Loader2 className="animate-spin" size={14}/> : "Find"}
                                     </button>
                                 </div>
                             </div>
                             
                             {/* Spell List */}
                             <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-950/30">
                                 {(activeSpellTab === 'cantrip' ? cantripsList : level1List).length === 0 && !isSearchingSpells && (
                                     <div className="text-center py-10 text-slate-500">
                                         <p className="mb-2">No spells found.</p>
                                         <button onClick={fetchClassSpells} className="text-indigo-400 underline text-sm">Refresh Class Spells</button>
                                     </div>
                                 )}

                                 {(activeSpellTab === 'cantrip' ? cantripsList : level1List).map((res, i) => {
                                     const isCantrip = activeSpellTab === 'cantrip';
                                     const isSelected = isCantrip ? selectedCantrips.includes(res.name) : selectedLevel1.includes(res.name);
                                     const canAdd = isCantrip ? !cantripFull : !spellFull;
                                     const isViewing = viewingSpell?.name === res.name;

                                     return (
                                         <div key={i} className={`flex flex-col bg-slate-800 rounded border transition-colors ${isViewing ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-700 hover:border-slate-500'}`}>
                                             <div className="flex justify-between items-center p-3">
                                                <div className="flex-1 cursor-pointer" onClick={() => setViewingSpell(isViewing ? null : res)}>
                                                    <div className="font-bold text-sm text-indigo-100 flex items-center gap-2">
                                                        {res.name}
                                                        <Info size={12} className="text-slate-500"/>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">{res.school} • {res.components || 'V, S'}</div>
                                                </div>
                                                {!isSelected ? (
                                                    <button 
                                                        onClick={() => addSpell(res)}
                                                        disabled={!canAdd}
                                                        className={`p-2 rounded text-white text-xs font-bold flex items-center gap-1 transition-colors ${canAdd ? 'bg-green-700 hover:bg-green-600' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}
                                                    >
                                                        <Plus size={14}/> Add
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => isCantrip ? removeCantrip(res.name) : removeLevel1(res.name)}
                                                        className="p-2 bg-red-900/50 hover:bg-red-900 rounded text-red-200 text-xs font-bold border border-red-800"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                             </div>
                                             
                                             {/* Expanded Details */}
                                             {isViewing && (
                                                 <div className="px-3 pb-3 pt-0 text-xs text-slate-300 border-t border-slate-700/50 mt-1">
                                                     <div className="grid grid-cols-2 gap-2 mt-2 mb-2 text-[10px] uppercase text-slate-500 font-bold">
                                                         <div>Time: {res.duration || 'Instant'}</div>
                                                         <div>Range: {res.range || 'Self'}</div>
                                                     </div>
                                                     <p className="leading-relaxed opacity-90">{res.desc || res.description || "No description available."}</p>
                                                 </div>
                                             )}
                                         </div>
                                     )
                                 })}
                             </div>
                         </div>
                    </div>
                ) : (
                    <div className="bg-slate-900/50 p-8 rounded border border-slate-700 flex flex-col items-center text-center text-slate-500 border-dashed flex-1 justify-center">
                        <Sword size={48} className="mb-4 opacity-20"/>
                        <p className="text-lg font-cinzel">No Magic/Tech</p>
                        <p className="text-sm mt-1">As a {charClass}, you do not need to prepare spells.</p>
                    </div>
                )}
            </div>
        );
      case 8:
        // VITALS (Was 7)
        return (
            <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500">
                    <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 8: Vitals</h3>
                    <p className="text-slate-300 italic">"Your survivability and defense."</p>
                </div>
                <div className="flex gap-8 justify-center py-8">
                     <div className="flex flex-col items-center">
                        <Heart className="text-red-500 mb-2 w-12 h-12" />
                        <span className="text-4xl font-bold font-cinzel">{calculateHP()}</span>
                        <span className="text-sm uppercase tracking-widest text-slate-500">Max HP</span>
                        <span className="text-xs text-slate-600 mt-1">{DATA.classes[charClass]?.hpDie} (Hit Die) + {getMod(getStatScore('CON'))} (CON)</span>
                     </div>
                     <div className="w-px bg-slate-700"></div>
                     <div className="flex flex-col items-center">
                        <Shield className="text-slate-400 mb-2 w-12 h-12" />
                        <span className="text-4xl font-bold font-cinzel">{calculateAC()}</span>
                        <span className="text-sm uppercase tracking-widest text-slate-500">Armor Class</span>
                        <span className="text-xs text-slate-600 mt-1">{DATA.classes[charClass]?.armor}</span>
                     </div>
                </div>
            </div>
        );
      case 9:
        // EQUIPMENT (Was 8 - Improved)
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500">
                    <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 9: Equipment</h3>
                    <p className="text-slate-300 italic">"Gear up. The journey is dangerous."</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Standard Kit */}
                    <div className="bg-slate-900 p-4 rounded border border-slate-700">
                        <h4 className="font-bold text-indigo-400 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <Shield size={14}/> Standard Loadout
                        </h4>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded border border-slate-600">
                                <div className="p-2 bg-slate-700 rounded"><Sword size={16}/></div>
                                <div>
                                    <div className="text-sm font-bold text-white">Weapons</div>
                                    <div className="text-xs text-slate-400">{DATA.classes[charClass]?.weapons.join(', ') || 'None'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded border border-slate-600">
                                <div className="p-2 bg-slate-700 rounded"><Shield size={16}/></div>
                                <div>
                                    <div className="text-sm font-bold text-white">Armor</div>
                                    <div className="text-xs text-slate-400">{DATA.classes[charClass]?.armor || 'None'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded border border-slate-600">
                                <div className="p-2 bg-slate-700 rounded"><Package size={16}/></div> 
                                <div>
                                    <div className="text-sm font-bold text-white">Background Kit</div>
                                    <div className="text-xs text-slate-400">Items from {background} background</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Money & Backpack Column */}
                    <div className="flex flex-col gap-4">
                        {/* Money Card */}
                        <div className="bg-slate-900 p-4 rounded border border-slate-700">
                             <h4 className="font-bold text-yellow-500 mb-2 flex items-center gap-2 uppercase text-xs tracking-wider">
                                 <Coins size={14}/> Starting Wealth
                             </h4>
                             <div className="flex items-center justify-between bg-slate-950 p-3 rounded border border-slate-800">
                                 <div className="font-cinzel text-xl text-white">
                                     {money || <span className="text-slate-600 text-sm font-sans">Not rolled yet</span>}
                                 </div>
                                 <button 
                                     onClick={rollStartingMoney}
                                     disabled={isRollingMoney || !!money}
                                     className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-bold rounded disabled:opacity-50 flex items-center gap-2"
                                 >
                                     {isRollingMoney ? <Loader2 className="animate-spin" size={14}/> : 'Roll Dice'}
                                 </button>
                             </div>
                        </div>
                        
                        {/* Custom/Backpack */}
                        <div className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col flex-1">
                            <h4 className="font-bold text-amber-400 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <Backpack size={14}/> Backpack & Trinkets
                            </h4>
                            
                            {/* Add Item */}
                            <div className="flex gap-2 mb-4">
                                <input 
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                    placeholder="Add custom item..."
                                    className="flex-1 bg-slate-950 border border-slate-600 rounded px-3 text-sm text-white"
                                />
                                <button onClick={addItem} className="p-2 bg-indigo-700 rounded text-white hover:bg-indigo-600">
                                    <Plus size={16}/>
                                </button>
                            </div>

                            {/* List */}
                            <div className="flex-1 bg-slate-950 rounded border border-slate-800 p-2 overflow-y-auto min-h-[150px]">
                                {addedEquipment.length === 0 && (
                                    <div className="text-center text-slate-600 text-xs py-4">Backpack is empty.</div>
                                )}
                                {addedEquipment.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-900 rounded group">
                                        <span className="text-sm text-slate-300">{item}</span>
                                        <button onClick={() => removeItem(idx)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                            </div>

                            {/* Trinket Generator */}
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <button 
                                    onClick={generateTrinket}
                                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-bold rounded border border-slate-600 border-dashed flex items-center justify-center gap-2"
                                >
                                    <Gift size={14}/> Roll for Trinket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
      case 10:
        return (
            <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-dragon-500">
                    <h3 className="text-xl font-cinzel text-dragon-400 mb-2">Step 10: Appearance</h3>
                    <p className="text-slate-300 italic">"What do you look like?"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Appearance Form */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Hair</label>
                                <input value={appearance.hair} onChange={e => setAppearance({...appearance, hair: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Eyes</label>
                                <input value={appearance.eyes} onChange={e => setAppearance({...appearance, eyes: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Height</label>
                                <input value={appearance.height} onChange={e => setAppearance({...appearance, height: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Weight</label>
                                <input value={appearance.weight} onChange={e => setAppearance({...appearance, weight: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Age</label>
                                <input value={appearance.age} onChange={e => setAppearance({...appearance, age: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Skin Tone</label>
                                <input value={appearance.skin} onChange={e => setAppearance({...appearance, skin: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Body Type</label>
                            <input value={appearance.bodyType} onChange={e => setAppearance({...appearance, bodyType: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Clothing/Armor Visual</label>
                            <input value={appearance.clothing} onChange={e => setAppearance({...appearance, clothing: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                        </div>

                        <div className="pt-4 border-t border-slate-700">
                            <label className="block text-xs font-bold text-slate-400 mb-1">Desire</label>
                            <input value={desire} onChange={e => setDesire(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mb-2" placeholder="To find my lost brother..." />
                            
                            <label className="block text-xs font-bold text-slate-400 mb-1">Flaw</label>
                            <input value={flaw} onChange={e => setFlaw(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" placeholder="I trust no one..." />
                        </div>
                    </div>

                    {/* Avatar Generator */}
                    <div className="bg-slate-950 p-6 rounded-lg border border-slate-700 flex flex-col items-center justify-center">
                        {generatedAvatarUrl ? (
                            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden border-2 border-dragon-500 shadow-lg mb-4 group">
                                <img src={generatedAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setGeneratedAvatarUrl(null)}
                                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-red-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="w-full aspect-square bg-slate-900 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-slate-500 mb-4">
                                <User size={48} className="mb-2 opacity-20" />
                                <span className="text-sm">No Avatar Generated</span>
                            </div>
                        )}
                        
                        <button 
                            onClick={handleGenerateAvatar}
                            disabled={isGeneratingAvatar}
                            className="w-full bg-indigo-900 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isGeneratingAvatar ? <Loader2 className="animate-spin" /> : <Sparkles />} 
                            {generatedAvatarUrl ? 'Regenerate Avatar' : 'Generate Avatar'}
                        </button>
                    </div>
                </div>
            </div>
        );
       case 11:
         return (
            <div className="text-center py-10 space-y-6">
                <Dices className="mx-auto w-20 h-20 text-dragon-500 animate-pulse"/>
                <h2 className="text-4xl font-cinzel text-white">Your Legend Begins!</h2>
                <p className="text-xl text-slate-300 max-w-lg mx-auto">
                    "Welcome, <span className="text-dragon-400 font-bold">{name}</span> of the {genre} realms. The dice are ready..."
                </p>
                <button 
                    onClick={handleSave}
                    className="bg-dragon-900 hover:bg-dragon-600 text-white font-bold py-4 px-12 rounded-lg text-xl shadow-lg shadow-dragon-900/50 transition-all transform hover:scale-105"
                >
                    Finish & Save
                </button>
            </div>
         )
      default: return null;
    }
  };

  const isNextDisabled = () => {
      if (step === 1 && (!name || !concept)) return true;
      if (step === 4 && Object.values(stats).some(v => v === null)) return true;
      if (step === 6 && selectedClassSkills.length < 2) return true;
      // Step 7 is now Spells (was 9)
      if (step === 7 && DATA.classes[charClass]?.isCaster) {
          const cls = DATA.classes[charClass];
          if (selectedLevel1.length === 0) return true;
      }
      return false;
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden min-h-[600px] flex flex-col">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-800 w-full">
            <div className="h-full bg-dragon-500 transition-all duration-300" style={{ width: `${(step / 11) * 100}%` }}></div>
        </div>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-950">
            <h2 className="text-2xl font-cinzel text-white">Character Creation</h2>
            <span className="text-slate-500 font-mono">Step {step} of 11</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
            {renderStep()}
        </div>

        {/* Footer Navigation */}
        {step < 11 && (
            <div className="p-6 border-t border-slate-700 bg-slate-950 flex justify-between">
                <button 
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                >
                    <ChevronLeft size={20}/> Back
                </button>

                <button 
                    onClick={() => setStep(s => Math.min(11, s + 1))}
                    disabled={isNextDisabled()}
                    className="flex items-center gap-2 px-8 py-3 bg-dragon-900 hover:bg-dragon-600 text-white rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Next <ChevronRight size={20}/>
                </button>
            </div>
        )}
    </div>
  );
}