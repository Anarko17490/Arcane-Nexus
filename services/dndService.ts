
import { LibraryItem } from '../types';

const API_BASE = 'https://api.open5e.com';

// Generic fetch wrapper
async function fetchFromApi(endpoint: string, query: string, extraParams: string = ''): Promise<any[]> {
    try {
        // If query exists, search. If not, just list items (limit 50).
        let url = `${API_BASE}/${endpoint}/?limit=50${extraParams}`;
        if (query && query.trim()) {
            url += `&search=${encodeURIComponent(query)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return [];
    }
}

export const searchSpells = async (query: string, clazz?: string): Promise<LibraryItem[]> => {
    // Open5e supports filtering by dnd_class
    const extraParams = clazz ? `&dnd_class=${clazz}` : '';
    const results = await fetchFromApi('spells', query, extraParams);
    
    return results.map((item: any) => ({
        name: item.name,
        category: 'spell',
        desc: item.desc,
        slug: item.slug,
        level_int: item.level_int,
        level: item.level_int, // Keep number for sorting
        school: item.school,
        range: item.range,
        duration: item.duration,
        components: item.components,
        classes: item.dnd_class ? item.dnd_class.split(', ') : [],
        descriptionFlavor: item.material ? `Material Component: ${item.material}` : undefined
    }));
};

export const searchMonsters = async (query: string): Promise<LibraryItem[]> => {
    const results = await fetchFromApi('monsters', query);
    return results.map((item: any) => ({
        name: item.name,
        category: 'monster',
        slug: item.slug,
        desc: item.desc || (item.special_abilities ? item.special_abilities.map((a: any) => `**${a.name}.** ${a.desc}`).join('\n\n') : 'No description available.'),
        size: item.size,
        type: item.type,
        subtype: item.subtype,
        alignment: item.alignment,
        ac: item.armor_class,
        hp: `${item.hit_points} (${item.hit_dice})`,
        speed: Object.entries(item.speed || {}).map(([k,v]) => `${k} ${v}`).join(', '),
        stats: {
            STR: item.strength, DEX: item.dexterity, CON: item.constitution, 
            INT: item.intelligence, WIS: item.wisdom, CHA: item.charisma
        },
        cr: item.challenge_rating,
        actions: item.actions ? item.actions.map((a: any) => ({ name: a.name, desc: a.desc })) : [],
        traits: item.special_abilities ? item.special_abilities.map((a: any) => `**${a.name}.** ${a.desc}`) : [],
        senses: item.senses,
        languages: item.languages ? item.languages.split(', ') : []
    }));
};

export const searchWeapons = async (query: string): Promise<LibraryItem[]> => {
    const results = await fetchFromApi('weapons', query);
    return results.map((item: any) => ({
        name: item.name,
        category: 'weapon',
        slug: item.slug,
        desc: `Category: ${item.category}`,
        cost: item.cost,
        damage: `${item.damage_dice} ${item.damage_type}`,
        weight: item.weight,
        properties: item.properties || []
    }));
};

export const searchArmor = async (query: string): Promise<LibraryItem[]> => {
    const results = await fetchFromApi('armor', query);
    return results.map((item: any) => ({
        name: item.name,
        category: 'armor',
        slug: item.slug,
        desc: `Category: ${item.category}`,
        acBonus: parseInt(item.ac_string) || 0, // Simplified parsing
        ac: parseInt(item.ac_string) || 0,
        cost: item.cost,
        weight: item.weight,
        stealthDisadvantage: item.stealth_disadvantage,
        descriptionFlavor: item.strength_requirement ? `Strength Requirement: ${item.strength_requirement}` : undefined
    }));
};

export const searchClasses = async (query: string): Promise<LibraryItem[]> => {
    const results = await fetchFromApi('classes', query);
    return results.map((item: any) => ({
        name: item.name,
        category: 'class',
        slug: item.slug,
        hitDie: item.hit_die,
        desc: `Hit Die: ${item.hit_die}. \n\nArmor: ${item.prof_armor}\nWeapons: ${item.prof_weapons}`,
        proficiencies: [
             ...(item.prof_armor ? item.prof_armor.split(', ') : []),
             ...(item.prof_weapons ? item.prof_weapons.split(', ') : [])
        ],
        savingThrows: item.prof_saving_throws ? item.prof_saving_throws.split(', ') : [],
        descriptionFlavor: item.desc || `The ${item.name} class.`
    }));
};

export const searchRaces = async (query: string): Promise<LibraryItem[]> => {
    const results = await fetchFromApi('races', query);
    return results.map((item: any) => ({
        name: item.name,
        category: 'race',
        slug: item.slug,
        speed: item.speed ? `${item.speed.walk} ft.` : undefined,
        desc: item.desc,
        traits: item.traits ? item.traits.map((t: any) => `**${t.name}:** ${t.desc}`) : [],
        languages: item.languages ? item.languages.map((l: any) => l.name) : [],
        size: item.size,
        abilityBonuses: item.asi ? item.asi.reduce((acc: any, curr: any) => ({ ...acc, [curr.attributes[0]]: curr.value }), {}) : {},
        descriptionFlavor: item.age ? `Age: ${item.age} \nAlignment: ${item.alignment}` : undefined
    }));
};