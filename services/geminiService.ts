import { GoogleGenAI, Type, Modality, FunctionDeclaration, Tool } from "@google/genai";
import { GeneratedNPC, Quest, GameGenre, LibraryItem, MapAnalysisResult, Story } from "../types";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const MODEL_TEXT = 'gemini-2.5-flash';
const MODEL_IMAGE = 'gemini-2.5-flash-image'; 
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// --- TOOLS DEFINITION ---
const GAME_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'modify_hp',
        description: 'Updates the player character\'s current HP. Use negative values for damage, positive for healing.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The amount to add or subtract." },
            reason: { type: Type.STRING, description: "Short reason for the change (e.g., 'goblin attack', 'potion')." }
          },
          required: ['amount']
        }
      },
      {
        name: 'modify_inventory',
        description: 'Adds or removes an item from the player\'s inventory.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.STRING, description: "Name of the item." },
            action: { type: Type.STRING, enum: ['add', 'remove'], description: "Whether to add or remove the item." }
          },
          required: ['item', 'action']
        }
      },
      {
        name: 'modify_gold',
        description: 'Adds or removes gold/money from the player.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Amount of gold (positive to add, negative to spend/lose)." }
          },
          required: ['amount']
        }
      }
    ]
  }
];

export const generateQuest = async (level: number, theme: string, genre: GameGenre = 'Fantasy'): Promise<Quest | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: `Generate a D&D 5e style quest for a party of level ${level}. Theme: ${theme}. Genre: ${genre}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            description: { type: Type.STRING },
            enemies: { type: Type.ARRAY, items: { type: Type.STRING } },
            rewards: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "hook", "description", "enemies", "rewards"]
        }
      }
    });
    
    return JSON.parse(response.text || '{}') as Quest;
  } catch (error) {
    console.error("Error generating quest:", error);
    return null;
  }
};

export const generateNPC = async (description: string, genre: GameGenre = 'Fantasy'): Promise<GeneratedNPC | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: `Create a unique NPC for a ${genre} setting based on this description: ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            race: { type: Type.STRING },
            role: { type: Type.STRING },
            personality: { type: Type.STRING },
            secret: { type: Type.STRING },
            inventory: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "race", "role", "personality", "secret"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as GeneratedNPC;
  } catch (error) {
    console.error("Error generating NPC:", error);
    return null;
  }
};

export const generateMonster = async (description: string, cr: string, genre: GameGenre = 'Fantasy'): Promise<LibraryItem | null> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Generate a balanced D&D 5e stat block for a monster in a ${genre} setting. 
            Concept: ${description}. 
            Challenge Rating (CR): ${cr}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        ac: { type: Type.NUMBER },
                        hp: { type: Type.STRING, description: "e.g. 50 (5d10 + 10)" },
                        speed: { type: Type.STRING },
                        stats: { 
                             type: Type.OBJECT,
                             properties: {
                                 STR: { type: Type.NUMBER }, DEX: { type: Type.NUMBER }, CON: { type: Type.NUMBER },
                                 INT: { type: Type.NUMBER }, WIS: { type: Type.NUMBER }, CHA: { type: Type.NUMBER }
                             }
                        },
                        traits: { type: Type.ARRAY, items: { type: Type.STRING } },
                        actions: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: { name: { type: Type.STRING }, desc: { type: Type.STRING } }
                            }
                        },
                        descriptionFlavor: { type: Type.STRING }
                    },
                    required: ["name", "ac", "hp", "stats", "actions"]
                }
            }
        });
        const data = JSON.parse(response.text || '{}');
        return { ...data, category: 'monster', cr: cr } as LibraryItem;
    } catch (error) {
        console.error("Error generating Monster:", error);
        return null;
    }
}

export const generateSpell = async (description: string, level: string, genre: GameGenre = 'Fantasy'): Promise<LibraryItem | null> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Generate a D&D 5e spell for a ${genre} setting. 
            Concept: ${description}. 
            Level: ${level}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        school: { type: Type.STRING },
                        level: { type: Type.STRING },
                        castingTime: { type: Type.STRING },
                        range: { type: Type.STRING },
                        components: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        desc: { type: Type.STRING },
                        classes: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "school", "desc", "level"]
                }
            }
        });
        const data = JSON.parse(response.text || '{}');
        return { ...data, category: 'spell' } as LibraryItem;
    } catch (error) {
        console.error("Error generating Spell:", error);
        return null;
    }
}

export const generateItem = async (description: string, type: string, genre: GameGenre = 'Fantasy'): Promise<LibraryItem | null> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Generate a D&D 5e item (${type}) for a ${genre} setting. 
            Concept: ${description}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        descriptionFlavor: { type: Type.STRING },
                        desc: { type: Type.STRING, description: "Mechanics and rules" },
                        cost: { type: Type.STRING },
                        weight: { type: Type.STRING },
                        properties: { type: Type.ARRAY, items: { type: Type.STRING } },
                        damage: { type: Type.STRING },
                        acBonus: { type: Type.NUMBER }
                    },
                    required: ["name", "desc"]
                }
            }
        });
        const data = JSON.parse(response.text || '{}');
        return { ...data, category: type.toLowerCase() } as LibraryItem;
    } catch (error) {
        console.error("Error generating Item:", error);
        return null;
    }
}

export const generateSkill = async (description: string, attribute: string, genre: GameGenre = 'Fantasy'): Promise<LibraryItem | null> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Create a custom D&D 5e skill or feat for a ${genre} setting. 
            Related Attribute: ${attribute}.
            Concept: ${description}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        desc: { type: Type.STRING },
                        ability: { type: Type.STRING },
                        situations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "desc", "ability"]
                }
            }
        });
        const data = JSON.parse(response.text || '{}');
        return { ...data, category: 'skill' } as LibraryItem;
    } catch (error) {
        console.error("Error generating Skill:", error);
        return null;
    }
}

export const generateStory = async (prompt: string, length: 'intro' | 'short' | 'long', genre: GameGenre = 'Fantasy'): Promise<Story | null> => {
    let constraints = "";
    switch (length) {
        case 'intro':
            constraints = "Write a compelling introduction or campaign hook. Keep it concise, under 100 words. Focus on setting the scene and the immediate call to action.";
            break;
        case 'long':
            constraints = "Write a detailed, immersive narrative. Aim for 600-800 words. Include dialogue, sensory details, and deep lore.";
            break;
        case 'short':
        default:
            constraints = "Write a standard story scene or plot hook. Keep it around 300 words.";
            break;
    }

    try {
         const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Write a story or plot hook for a ${genre} D&D campaign.
            Prompt: ${prompt}.
            Constraint: ${constraints}.
            Format as JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        hook: { type: Type.STRING, description: "One sentence summary" },
                        content: { type: Type.STRING }
                    },
                    required: ["title", "hook", "content"]
                }
            }
        });
        return JSON.parse(response.text || '{}') as Story;
    } catch (error) {
        console.error("Error generating Story:", error);
        return null;
    }
}

export interface DMResponse {
    text: string;
    toolCalls?: any[]; // FunctionCall[]
}

export const chatWithDM = async (history: {role: string, content: string}[], message: string, genre: GameGenre = 'Fantasy'): Promise<DMResponse> => {
    try {
        let genreInstruction = "";
        switch(genre) {
            case 'Sci-Fi': genreInstruction = "The setting is a high-tech Sci-Fi universe with spaceships and blasters. Adapt 5e rules to tech (e.g., Magic Missile -> Homing Dart)."; break;
            case 'Cyberpunk': genreInstruction = "The setting is a gritty Cyberpunk dystopia with neon lights, hackers, and cybernetics. Adapt 5e rules to tech."; break;
            case 'Post-Apocalyptic': genreInstruction = "The setting is a harsh Post-Apocalyptic wasteland. Resources are scarce, survival is key."; break;
            case 'Epic War': genreInstruction = "The setting is a massive active battlefield. The tone is gritty, urgent, and militaristic."; break;
            case 'Eldritch Horror': genreInstruction = "The setting is filled with cosmic horror and madness. The tone is dark, suspenseful, and terrifying."; break;
            case 'Steampunk': genreInstruction = "The setting is Victorian-era technology with steam power and gears. Magic is industrial."; break;
            case 'Western': genreInstruction = "The setting is the Wild West with a fantasy twist. Revolvers, saloons, and outlaws."; break;
            default: genreInstruction = "The setting is traditional High Fantasy Dungeons & Dragons.";
        }

        const chat = ai.chats.create({
            model: MODEL_TEXT,
            config: {
                tools: GAME_TOOLS,
                systemInstruction: `You are an expert Dungeon Master for a Tabletop RPG. 
                ${genreInstruction}
                
                INTERACTIVITY RULES:
                - You have access to tools to update the player's sheet: 'modify_hp', 'modify_inventory', 'modify_gold'.
                - ALWAYS use 'modify_hp' if the player takes damage or heals in the narrative.
                - ALWAYS use 'modify_inventory' if the player finds, drops, or uses an item.
                - ALWAYS use 'modify_gold' if the player spends or earns money/gold/credits.
                - Do not ask for permission to update stats; if it happens in the story, execute the tool.
                
                GENERAL RULES:
                - You are helpful, creative, and strictly adhere to 5e mechanics (or their thematic equivalents). 
                - Keep responses concise but atmospheric. 
                - IMPORTANT: When requiring a die roll from the player, use the following format exactly: "Make a [Ability Name] check." or "Make a [Save Name] save." Include DC.`
            },
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.content }]
            }))
        });

        const result = await chat.sendMessage({ message });
        
        // Extract text and function calls
        let text = result.text || "";
        const toolCalls = result.functionCalls;

        // If the model didn't return text but called a function (rare but possible), ensure we return something
        if (!text && toolCalls && toolCalls.length > 0) {
            text = "(The DM silently updates your status...)";
        } else if (!text) {
             text = "The spirits are silent...";
        }

        return { text, toolCalls };
    } catch (error) {
        console.error("DM Chat Error:", error);
        return { text: "I cannot hear you over the static of the void (API Error)." };
    }
}

export const generateSceneImage = async (prompt: string, aspectRatio: string = "16:9"): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_IMAGE,
            contents: {
                parts: [
                    { text: `Concept art, cinematic lighting, highly detailed scene: ${prompt}` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Image Gen Error:", error);
        return null;
    }
}

export const generateAvatarImage = async (description: string, race: string, charClass: string): Promise<string | null> => {
    try {
        const fullPrompt = `Full body RPG character portrait of a ${race} ${charClass}. 
        Appearance details: ${description}. 
        Style: High fantasy digital art, detailed, dramatic lighting, isolated on simple background, character concept art.`;

        const response = await ai.models.generateContent({
            model: MODEL_IMAGE,
            contents: {
                parts: [
                    { text: fullPrompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Avatar Gen Error:", error);
        return null;
    }
}

export const generateLocationName = async (description: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Create a very short (2-5 words), atmospheric title for a location described as: "${description}". Do not use quotes. Example: "The Dark Forest", "Sector 7 Slums". Return ONLY the title.`,
        });
        return response.text?.trim() || "Unknown Realm";
    } catch (error) {
        console.error("Title Gen Error:", error);
        return "The Unknown";
    }
}

// LIBRARY GENERATION
const LIBRARY_SYSTEM_PROMPT = `You are an expert Dungeons & Dragons 5th Edition game master and content designer.  
Your task is to generate a single, complete reference entry for a D&D 5e game app.

The user will specify a category and a name.
Return ONLY valid JSON — no markdown, no explanation, no extra text.

Use official D&D 5e rules from the System Reference Document (SRD).
If the item is not in the SRD, invent a balanced, thematic entry that fits D&D 5e.

Include:
- Mechanical accuracy (numbers, bonuses, rules)
- Immersive flavor text (2–3 sentences of in-world description)
- AI-friendly image prompt (for Nano Banana or DALL·E)

Structure your JSON according to the category requested.
`;

export const generateLibraryEntry = async (category: string, name: string): Promise<LibraryItem | null> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `category: "${category}", name: "${name}"`,
            config: {
                responseMimeType: "application/json",
                systemInstruction: LIBRARY_SYSTEM_PROMPT
            }
        });
        return JSON.parse(response.text || '{}') as LibraryItem;
    } catch (error) {
        console.error("Library Gen Error:", error);
        return null;
    }
}

// FULL CHARACTER GENERATION
export const generateRandomCharacter = async (genre: GameGenre = 'Fantasy'): Promise<any | null> => {
    let constraints = "";
    
    switch(genre) {
        case 'Sci-Fi':
        case 'Cyberpunk':
            constraints = `
            - Race must be one of: Human, Android, Cyborg, Alien
            - Class must be one of: Soldier, Operative, Technomancer, Medic
            - Background must be one of: Pilot, Hacker, Corp-Rat, Mercenary`;
            break;
        case 'Post-Apocalyptic':
            constraints = `
            - Race must be one of: Survivor, Mutant, Synth, Ghoul
            - Class must be one of: Scavenger, Marauder, Doctor, Psyker
            - Background must be one of: Drifter, Raider, Vault Dweller, Mechanic`;
            break;
        default: // Fantasy & Others
            constraints = `
            - Race must be one of: Human, Elf, Dwarf, Halfling
            - Class must be one of: Fighter, Rogue, Wizard, Cleric
            - Background must be one of: Soldier, Acolyte, Criminal, Folk Hero`;
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Generate a unique, creative RPG player character for a ${genre} setting. 
            Strictly choose options based on these constraints:
            ${constraints}

            Return JSON with the following keys:
            {
              "name": "string",
              "concept": "short character concept (max 15 words)",
              "race": "string",
              "class": "string",
              "background": "string",
              "spells": "string (comma separated list of 2-3 spells if spellcaster, else empty)",
              "appearance": {
                 "hair": "string",
                 "eyes": "string",
                 "skin": "string",
                 "height": "string",
                 "weight": "string",
                 "age": "string",
                 "bodyType": "string",
                 "clothing": "string"
              },
              "desire": "string",
              "flaw": "string"
            }`,
            config: {
                responseMimeType: "application/json"
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Auto Gen Character Error:", error);
        return null;
    }
}

// MAP ANALYSIS & GENERATION
export const analyzeSceneForMap = async (sceneDescription: string): Promise<MapAnalysisResult> => {
    try {
        const systemPrompt = `You are the AI Dungeon Master for a digital D&D 5e game.  
Your job is to analyze the current scene and decide **whether a top-down tactical battle map should be generated**.

Follow these rules:

1. **DO generate a map ONLY if the scene involves:**
   - Combat (e.g., enemies attacking, initiative, rolling to hit)
   - Tactical movement (e.g., "move across the room", "climb the ledge", "avoid the trap")
   - Spatial puzzles (e.g., "arrange the stones", "navigate the maze")
   - Clear grid-based positioning (e.g., "the chamber is 30 ft wide")

2. **DO NOT generate a map if the scene is:**
   - Social interaction (e.g., tavern talk, bargaining, diplomacy)
   - Resting, shopping, planning, or story narration
   - Abstract or non-physical (e.g., "you feel watched", "a vision appears")

3. **If a map is needed**, also generate:
   - A **concise description** for an image generator (Nano Banana or DALL·E)
   - **Grid size** (width x height in 5-ft squares, typically 4x4 to 8x8)

4. **Output Format:**
   Return **ONLY valid JSON** — no extra text, no markdown.

   {
     "needsMap": true,
     "sceneType": "combat" | "exploration" | "social" | "rest",
     "mapDescription": "string (only if needsMap=true)",
     "gridWidth": number (only if needsMap=true),
     "gridHeight": number (only if needsMap=true)
   }

5. **Image Description Style (if generated):**
   - Top-down orthographic view
   - Clear white grid lines on natural background
   - No characters, tokens, or labels
   - Thematic to the scene (e.g., dungeon, forest, ruins)
   - Example: "Top-down view of a 6x5 grid dungeon room with broken pillars at B2 and E4, a glowing altar at D3, and cracked floor tiles. D&D 5e style, parchment texture, 1024x1024."`;

        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Scene: "${sceneDescription}"`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json"
            }
        });

        return JSON.parse(response.text || '{}') as MapAnalysisResult;
    } catch (error) {
        console.error("Map Analysis Error:", error);
        return { needsMap: false, sceneType: 'social' };
    }
}

export const generateMapImage = async (description: string): Promise<string | null> => {
     try {
        const response = await ai.models.generateContent({
            model: MODEL_IMAGE,
            contents: {
                parts: [
                    { text: `Top down battle map, orthographic, rpg, d&d, grid overlay, 2d game asset: ${description}` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Map Image Gen Error:", error);
        return null;
    }
}

// SPEECH GENERATION
export const generateSpeech = async (text: string, voice: string = 'Encélado'): Promise<ArrayBuffer | null> => {
    try {
        // Truncate text if overly long to ensure responsiveness, typically ~400 chars is a good dialogue chunk
        const safeText = text.substring(0, 400);

        const response = await ai.models.generateContent({
            model: MODEL_TTS,
            contents: [{ parts: [{ text: safeText }] }],
            config: {
                responseModalities: [Modality.AUDIO], 
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const binaryString = atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
        return null;
    } catch (error) {
        console.error("Speech Gen Error:", error);
        return null;
    }
}