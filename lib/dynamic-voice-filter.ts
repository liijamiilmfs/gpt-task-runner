// Dynamic Voice Filter System
// Converts user prompts into specific voice characteristics for TTS generation

export interface VoiceCharacteristics {
  // Core voice properties
  pitch: number; // 0.5 - 2.0
  speed: number; // 0.5 - 2.0
  volume: number; // 0.1 - 1.0
  emphasis: number; // 0.1 - 1.0
  
  // Emotional and tonal qualities
  warmth: number; // 0.0 - 1.0
  authority: number; // 0.0 - 1.0
  mystery: number; // 0.0 - 1.0
  energy: number; // 0.0 - 1.0
  
  // Librán-specific characteristics
  formality: number; // 0.0 - 1.0 (0=casual, 1=ceremonial)
  ancientness: number; // 0.0 - 1.0 (how ancient/mystical it sounds)
  solemnity: number; // 0.0 - 1.0 (how serious/ritualistic)
  
  // Technical parameters
  pauseLength: number; // 0.5 - 2.0 (multiplier for pauses)
  breathiness: number; // 0.0 - 1.0
  clarity: number; // 0.0 - 1.0
}

export interface VoiceFilter {
  id: string;
  name: string;
  prompt: string;
  characteristics: VoiceCharacteristics;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

// Default voice characteristics (neutral)
export const DEFAULT_VOICE_CHARACTERISTICS: VoiceCharacteristics = {
  pitch: 1.0,
  speed: 1.0,
  volume: 0.8,
  emphasis: 0.5,
  warmth: 0.5,
  authority: 0.5,
  mystery: 0.5,
  energy: 0.5,
  formality: 0.5,
  ancientness: 0.5,
  solemnity: 0.5,
  pauseLength: 1.0,
  breathiness: 0.3,
  clarity: 0.8
};

// Keyword mappings for voice characteristics
const VOICE_KEYWORDS = {
  // Pitch keywords
  pitch: {
    'deep': 0.6, 'low': 0.7, 'bass': 0.6, 'baritone': 0.7,
    'high': 1.4, 'soprano': 1.5, 'shrill': 1.6, 'squeaky': 1.7,
    'medium': 1.0, 'normal': 1.0, 'average': 1.0
  },
  
  // Speed keywords
  speed: {
    'slow': 0.6, 'sluggish': 0.5, 'deliberate': 0.7, 'measured': 0.8,
    'fast': 1.4, 'rapid': 1.5, 'quick': 1.3, 'hurried': 1.4,
    'normal': 1.0, 'moderate': 1.0, 'steady': 1.0
  },
  
  // Volume keywords
  volume: {
    'quiet': 0.4, 'soft': 0.5, 'whisper': 0.3, 'hushed': 0.4,
    'loud': 0.9, 'booming': 1.0, 'thunderous': 1.0, 'resonant': 0.8,
    'normal': 0.8, 'moderate': 0.8
  },
  
  // Emotional qualities
  warmth: {
    'warm': 0.8, 'friendly': 0.7, 'kind': 0.8, 'gentle': 0.7,
    'cold': 0.2, 'harsh': 0.3, 'stern': 0.2, 'icy': 0.1,
    'neutral': 0.5, 'calm': 0.6
  },
  
  authority: {
    'authoritative': 0.9, 'commanding': 0.8, 'powerful': 0.8, 'strong': 0.7,
    'weak': 0.2, 'timid': 0.3, 'shy': 0.2, 'meek': 0.1,
    'confident': 0.7, 'assured': 0.6
  },
  
  mystery: {
    'mysterious': 0.9, 'enigmatic': 0.8, 'cryptic': 0.7, 'secretive': 0.6,
    'clear': 0.1, 'obvious': 0.2, 'transparent': 0.1, 'direct': 0.2,
    'mystical': 0.8, 'arcane': 0.7
  },
  
  energy: {
    'energetic': 0.9, 'lively': 0.8, 'dynamic': 0.8, 'vibrant': 0.7,
    'tired': 0.2, 'lethargic': 0.1, 'sluggish': 0.2, 'dull': 0.3,
    'active': 0.7, 'spirited': 0.6
  },
  
  // Librán-specific characteristics
  formality: {
    'formal': 0.9, 'ceremonial': 1.0, 'ritualistic': 0.9, 'solemn': 0.8,
    'casual': 0.1, 'informal': 0.2, 'relaxed': 0.3, 'conversational': 0.2,
    'dignified': 0.8, 'reverent': 0.9
  },
  
  ancientness: {
    'ancient': 1.0, 'old': 0.8, 'archaic': 0.9, 'primordial': 1.0,
    'modern': 0.1, 'contemporary': 0.2, 'new': 0.1, 'fresh': 0.2,
    'timeless': 0.7, 'eternal': 0.8
  },
  
  solemnity: {
    'solemn': 0.9, 'serious': 0.8, 'grave': 0.9, 'reverent': 0.8,
    'playful': 0.1, 'light': 0.2, 'cheerful': 0.1, 'jovial': 0.2,
    'dignified': 0.7, 'stately': 0.8
  }
};

// Parse a voice prompt and generate characteristics
export function parseVoicePrompt(prompt: string): VoiceCharacteristics {
  const words = prompt.toLowerCase().split(/\s+/);
  const characteristics = { ...DEFAULT_VOICE_CHARACTERISTICS };
  
  console.log('Parsing voice prompt:', prompt);
  console.log('Words found:', words);
  
  // Process each keyword category
  Object.entries(VOICE_KEYWORDS).forEach(([category, keywords]) => {
    const matchingWords = words.filter(word => word in keywords);
    
    if (matchingWords.length > 0) {
      // Average the values of matching keywords
      const avgValue = matchingWords.reduce((sum, word) => sum + (keywords as Record<string, number>)[word], 0) / matchingWords.length;
      characteristics[category as keyof VoiceCharacteristics] = avgValue;
      console.log(`Category ${category}: matched words [${matchingWords.join(', ')}] -> value ${avgValue}`);
    }
  });
  
  // Special handling for Librán-specific prompts
  if (words.some(word => ['libran', 'ancient', 'mystical', 'sacred'].includes(word))) {
    characteristics.ancientness = Math.max(characteristics.ancientness, 0.8);
    characteristics.formality = Math.max(characteristics.formality, 0.7);
    characteristics.mystery = Math.max(characteristics.mystery, 0.6);
  }
  
  // Handle intensity modifiers
  if (words.includes('very') || words.includes('extremely')) {
    Object.keys(characteristics).forEach(key => {
      const char = characteristics[key as keyof VoiceCharacteristics];
      if (char > 0.5) {
        characteristics[key as keyof VoiceCharacteristics] = Math.min(1.0, char * 1.2);
      } else {
        characteristics[key as keyof VoiceCharacteristics] = Math.max(0.0, char * 0.8);
      }
    });
  }
  
  console.log('Generated characteristics:', characteristics);
  return characteristics;
}

// Convert characteristics to TTS parameters
export function characteristicsToTTSParams(characteristics: VoiceCharacteristics) {
  return {
    // OpenAI TTS parameters
    speed: Math.max(0.5, Math.min(2.0, characteristics.speed || 1.0)),
    
    // Custom voice styling (to be applied in post-processing or via prompt engineering)
    voiceStyle: {
      pitch: Math.max(0.5, Math.min(2.0, characteristics.pitch || 1.0)),
      volume: Math.max(0.1, Math.min(1.0, characteristics.volume || 0.8)),
      emphasis: Math.max(0.1, Math.min(1.0, characteristics.emphasis || 0.5)),
      warmth: Math.max(0.0, Math.min(1.0, characteristics.warmth || 0.5)),
      authority: Math.max(0.0, Math.min(1.0, characteristics.authority || 0.5)),
      mystery: Math.max(0.0, Math.min(1.0, characteristics.mystery || 0.5)),
      energy: Math.max(0.0, Math.min(1.0, characteristics.energy || 0.5)),
      formality: Math.max(0.0, Math.min(1.0, characteristics.formality || 0.5)),
      ancientness: Math.max(0.0, Math.min(1.0, characteristics.ancientness || 0.5)),
      solemnity: Math.max(0.0, Math.min(1.0, characteristics.solemnity || 0.5)),
      pauseLength: Math.max(0.5, Math.min(2.0, characteristics.pauseLength || 1.0)),
      breathiness: Math.max(0.0, Math.min(1.0, characteristics.breathiness || 0.3)),
      clarity: Math.max(0.0, Math.min(1.0, characteristics.clarity || 0.8))
    }
  };
}

// Validate and sanitize voice filter data
export function validateVoiceFilter(filter: any): VoiceFilter | null {
  if (!filter || typeof filter !== 'object') return null;
  
  // Check if we have characteristics (required)
  if (!filter.characteristics || typeof filter.characteristics !== 'object') {
    return null;
  }
  
  // Create a valid VoiceCharacteristics object with defaults
  const characteristics = filter.characteristics;
  const validCharacteristics: VoiceCharacteristics = {
    pitch: Math.max(0.5, Math.min(2.0, characteristics.pitch || 1.0)),
    speed: Math.max(0.5, Math.min(2.0, characteristics.speed || 1.0)),
    volume: Math.max(0.1, Math.min(1.0, characteristics.volume || 0.8)),
    emphasis: Math.max(0.1, Math.min(1.0, characteristics.emphasis || 0.5)),
    warmth: Math.max(0.0, Math.min(1.0, characteristics.warmth || 0.5)),
    authority: Math.max(0.0, Math.min(1.0, characteristics.authority || 0.5)),
    mystery: Math.max(0.0, Math.min(1.0, characteristics.mystery || 0.5)),
    energy: Math.max(0.0, Math.min(1.0, characteristics.energy || 0.5)),
    formality: Math.max(0.0, Math.min(1.0, characteristics.formality || 0.5)),
    ancientness: Math.max(0.0, Math.min(1.0, characteristics.ancientness || 0.5)),
    solemnity: Math.max(0.0, Math.min(1.0, characteristics.solemnity || 0.5)),
    pauseLength: Math.max(0.5, Math.min(2.0, characteristics.pauseLength || 1.0)),
    breathiness: Math.max(0.0, Math.min(1.0, characteristics.breathiness || 0.3)),
    clarity: Math.max(0.0, Math.min(1.0, characteristics.clarity || 0.8))
  };
  
  // Create a minimal VoiceFilter object
  return {
    id: filter.id || `temp_${Date.now()}`,
    name: filter.name || 'Custom Voice',
    prompt: filter.prompt || 'Custom voice filter',
    characteristics: validCharacteristics,
    createdAt: filter.createdAt ? new Date(filter.createdAt) : new Date(),
    lastUsed: filter.lastUsed ? new Date(filter.lastUsed) : undefined,
    useCount: Math.max(0, Number(filter.useCount) || 0)
  };
}

// Create a voice filter from JSON data
export function createVoiceFilterFromJSON(jsonData: any): VoiceFilter | null {
  try {
    const filter = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    return validateVoiceFilter(filter);
  } catch (error) {
    console.error('Failed to parse voice filter JSON:', error);
    return null;
  }
}

// Generate a voice filter from a prompt
export function createVoiceFilter(prompt: string, name?: string): VoiceFilter {
  const characteristics = parseVoicePrompt(prompt);
  
  return {
    id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name || `Voice: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`,
    prompt,
    characteristics,
    createdAt: new Date(),
    useCount: 0
  };
}

// Save voice filter to localStorage
export function saveVoiceFilter(filter: VoiceFilter): void {
  try {
    const saved = getSavedVoiceFilters();
    const existing = saved.find(f => f.id === filter.id);
    
    if (existing) {
      // Update existing filter
      const updated = saved.map(f => f.id === filter.id ? filter : f);
      localStorage.setItem('voiceFilters', JSON.stringify(updated));
    } else {
      // Add new filter
      saved.push(filter);
      localStorage.setItem('voiceFilters', JSON.stringify(saved));
    }
  } catch (error) {
    console.error('Failed to save voice filter:', error);
  }
}

// Load saved voice filters from localStorage
export function getSavedVoiceFilters(): VoiceFilter[] {
  try {
    const saved = localStorage.getItem('voiceFilters');
    if (!saved) return [];
    
    const filters = JSON.parse(saved);
    return filters.map((f: any) => ({
      ...f,
      createdAt: new Date(f.createdAt),
      lastUsed: f.lastUsed ? new Date(f.lastUsed) : undefined
    }));
  } catch (error) {
    console.error('Failed to load voice filters:', error);
    return [];
  }
}

// Delete a voice filter
export function deleteVoiceFilter(filterId: string): void {
  try {
    const saved = getSavedVoiceFilters();
    const filtered = saved.filter(f => f.id !== filterId);
    localStorage.setItem('voiceFilters', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete voice filter:', error);
  }
}

// Update filter usage statistics
export function updateFilterUsage(filterId: string): void {
  try {
    const saved = getSavedVoiceFilters();
    const updated = saved.map(f => 
      f.id === filterId 
        ? { ...f, lastUsed: new Date(), useCount: f.useCount + 1 }
        : f
    );
    localStorage.setItem('voiceFilters', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update filter usage:', error);
  }
}

// Generate a descriptive text for voice characteristics
export function describeVoiceCharacteristics(characteristics: VoiceCharacteristics): string {
  const descriptions = [];
  
  // Pitch description
  if (characteristics.pitch < 0.7) descriptions.push('deep, low-pitched');
  else if (characteristics.pitch > 1.3) descriptions.push('high-pitched, bright');
  else descriptions.push('medium-pitched');
  
  // Speed description
  if (characteristics.speed < 0.7) descriptions.push('slow, deliberate');
  else if (characteristics.speed > 1.3) descriptions.push('fast, energetic');
  else descriptions.push('moderate pace');
  
  // Volume description
  if (characteristics.volume < 0.5) descriptions.push('quiet, soft');
  else if (characteristics.volume > 0.8) descriptions.push('loud, resonant');
  else descriptions.push('moderate volume');
  
  // Emotional qualities
  if (characteristics.warmth > 0.7) descriptions.push('warm, friendly');
  if (characteristics.authority > 0.7) descriptions.push('authoritative, commanding');
  if (characteristics.mystery > 0.7) descriptions.push('mysterious, enigmatic');
  if (characteristics.energy > 0.7) descriptions.push('energetic, lively');
  
  // Librán-specific
  if (characteristics.formality > 0.7) descriptions.push('formal, ceremonial');
  if (characteristics.ancientness > 0.7) descriptions.push('ancient, timeless');
  if (characteristics.solemnity > 0.7) descriptions.push('solemn, reverent');
  
  return descriptions.join(', ');
}
