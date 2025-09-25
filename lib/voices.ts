export const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;

export type Voice = typeof VOICES[number];

export const DEFAULT_VOICE: Voice = "alloy";

// Voice characteristics for filtering
export type VoiceCharacteristic = 
  | 'mysterious' | 'dramatic' | 'warm' | 'energetic' | 'ethereal' | 'versatile'
  | 'deep' | 'resonant' | 'ceremonial' | 'storytelling' | 'bright' | 'soft'
  | 'solemn' | 'intriguing' | 'suspenseful' | 'intimate' | 'powerful' | 'gentle';

export type VoiceMood = 
  | 'mysterious' | 'dramatic' | 'warm' | 'energetic' | 'ethereal' | 'solemn'
  | 'intriguing' | 'suspenseful' | 'intimate' | 'powerful' | 'gentle' | 'ceremonial';

export type VoiceUseCase = 
  | 'storytelling' | 'ceremonial' | 'narration' | 'dialogue' | 'announcement'
  | 'whisper' | 'declaration' | 'invocation' | 'warning' | 'general';

export type VoiceAccent = 'libran';

export interface VoiceProfile {
  id: Voice;
  name: string;
  description: string;
  characteristics: VoiceCharacteristic[];
  mood: VoiceMood;
  useCases: VoiceUseCase[];
  pitch: 'low' | 'medium' | 'high';
  energy: 'low' | 'medium' | 'high';
  formality: 'casual' | 'formal' | 'ceremonial';
  gender: 'male' | 'female' | 'neutral';
  accent: VoiceAccent;
  libránSuitability: number; // 1-10 scale for how well it fits Librán accent
}

export const VOICE_PROFILES: Record<Voice, VoiceProfile> = {
  alloy: {
    id: 'alloy',
    name: 'Alloy',
    description: 'Deep, mysterious, versatile - perfect for Librán mystique',
    characteristics: ['mysterious', 'versatile', 'deep', 'intriguing'],
    mood: 'mysterious',
    useCases: ['storytelling', 'narration', 'general', 'dialogue'],
    pitch: 'low',
    energy: 'medium',
    formality: 'formal',
    gender: 'neutral',
    accent: 'libran',
    libránSuitability: 9
  },
  echo: {
    id: 'echo',
    name: 'Echo',
    description: 'Resonant, ceremonial quality - ideal for sacred texts',
    characteristics: ['resonant', 'ceremonial', 'powerful', 'solemn'],
    mood: 'ceremonial',
    useCases: ['ceremonial', 'declaration', 'invocation', 'announcement'],
    pitch: 'low',
    energy: 'high',
    formality: 'ceremonial',
    gender: 'male',
    accent: 'libran',
    libránSuitability: 8
  },
  fable: {
    id: 'fable',
    name: 'Fable',
    description: 'Warm, storytelling tone - brings ancient tales to life',
    characteristics: ['warm', 'storytelling', 'intimate', 'gentle'],
    mood: 'warm',
    useCases: ['storytelling', 'narration', 'dialogue', 'general'],
    pitch: 'medium',
    energy: 'medium',
    formality: 'casual',
    gender: 'female',
    accent: 'libran',
    libránSuitability: 7
  },
  onyx: {
    id: 'onyx',
    name: 'Onyx',
    description: 'Darker, more dramatic - perfect for ominous Librán passages',
    characteristics: ['dramatic', 'mysterious', 'powerful', 'suspenseful'],
    mood: 'dramatic',
    useCases: ['storytelling', 'narration', 'warning', 'dialogue'],
    pitch: 'low',
    energy: 'high',
    formality: 'formal',
    gender: 'male',
    accent: 'libran',
    libránSuitability: 9
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    description: 'Bright, energetic - brings vitality to Librán expressions',
    characteristics: ['bright', 'energetic', 'powerful', 'versatile'],
    mood: 'energetic',
    useCases: ['announcement', 'declaration', 'general', 'dialogue'],
    pitch: 'high',
    energy: 'high',
    formality: 'formal',
    gender: 'female',
    accent: 'libran',
    libránSuitability: 6
  },
  shimmer: {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Soft, ethereal - captures the mystical essence of Librán',
    characteristics: ['ethereal', 'soft', 'mysterious', 'gentle'],
    mood: 'ethereal',
    useCases: ['whisper', 'invocation', 'storytelling', 'general'],
    pitch: 'high',
    energy: 'low',
    formality: 'ceremonial',
    gender: 'female',
    accent: 'libran',
    libránSuitability: 8
  }
};

export const VOICE_LABELS: Record<Voice, string> = {
  alloy: "Alloy - Deep, mysterious, versatile",
  echo: "Echo - Resonant, ceremonial quality", 
  fable: "Fable - Warm, storytelling tone",
  onyx: "Onyx - Darker, more dramatic",
  nova: "Nova - Bright, energetic",
  shimmer: "Shimmer - Soft, ethereal"
};

// Select the best voice based on characteristics and accent
export function selectVoiceForCharacteristics(characteristics: any, accentOverride?: string): Voice {
  console.log('=== VOICE SELECTION DEBUG ===');
  console.log('Input characteristics:', characteristics);
  console.log('Accent override:', accentOverride);
  
  // Extract the actual characteristics object - it might be nested
  const actualCharacteristics = characteristics.characteristics || characteristics;
  console.log('Actual characteristics:', actualCharacteristics);
  
  const words = characteristics.prompt?.toLowerCase().split(/\s+/) || [];
  console.log('Words from prompt:', words);
  
  // Check for gender preferences first
  const wantsMale = words.some((word: string) => ['male', 'man', 'masculine', 'deep', 'low', 'bass', 'baritone'].includes(word));
  const wantsFemale = words.some((word: string) => ['female', 'woman', 'feminine', 'high', 'soprano', 'soft', 'gentle'].includes(word));
  
  console.log('Gender preferences:', { wantsMale, wantsFemale });
  
  // Filter voices by gender preference
  let candidateVoices = Object.values(VOICE_PROFILES);
  
  if (wantsMale) {
    candidateVoices = candidateVoices.filter(v => v.gender === 'male');
    console.log('Filtered to male voices:', candidateVoices.map(v => v.name));
  } else if (wantsFemale) {
    candidateVoices = candidateVoices.filter(v => v.gender === 'female');
    console.log('Filtered to female voices:', candidateVoices.map(v => v.name));
  }
  
  // Filter by Librán accent if provided
  if (accentOverride === 'libran') {
    // For Librán accent, prioritize voices with high Librán suitability
    candidateVoices = candidateVoices.filter(v => v.libránSuitability >= 7);
    console.log(`Filtered to Librán-suitable voices:`, candidateVoices.map(v => v.name));
  }
  
  // If no gender preference or no matches, use all voices
  if (candidateVoices.length === 0) {
    candidateVoices = Object.values(VOICE_PROFILES);
    console.log('Using all voices (no gender preference)');
  }
  
  // Ensure we have at least one voice
  if (candidateVoices.length === 0) {
    console.error('No voices available!');
    return 'alloy'; // Fallback to default voice
  }
  
  // Score voices based on characteristics
  let bestVoice = candidateVoices[0];
  let bestScore = 0;
  
  console.log('Scoring voices:');
  for (const voice of candidateVoices) {
    let score = 0;
    
    // Pitch matching - use actualCharacteristics instead of characteristics
    if (actualCharacteristics.pitch < 0.7 && voice.pitch === 'low') score += 3;
    else if (actualCharacteristics.pitch > 1.3 && voice.pitch === 'high') score += 3;
    else if (actualCharacteristics.pitch >= 0.7 && actualCharacteristics.pitch <= 1.3 && voice.pitch === 'medium') score += 2;
    
    // Energy matching - use actualCharacteristics instead of characteristics
    if (actualCharacteristics.energy < 0.3 && voice.energy === 'low') score += 3;
    else if (actualCharacteristics.energy > 0.7 && voice.energy === 'high') score += 3;
    else if (actualCharacteristics.energy >= 0.3 && actualCharacteristics.energy <= 0.7 && voice.energy === 'medium') score += 2;
    
    // Formality matching - use actualCharacteristics instead of characteristics
    if (actualCharacteristics.formality > 0.7 && voice.formality === 'ceremonial') score += 3;
    else if (actualCharacteristics.formality > 0.5 && voice.formality === 'formal') score += 2;
    else if (actualCharacteristics.formality < 0.3 && voice.formality === 'casual') score += 2;
    
      // Librán accent bonus
      if (accentOverride === 'libran' && voice.libránSuitability >= 7) {
        score += 5; // Strong bonus for Librán suitability
      }
    
    // Librán suitability bonus
    score += voice.libránSuitability * 0.5;
    
    console.log(`  ${voice.name} (${voice.gender}, ${voice.accent}): score ${score} (pitch: ${voice.pitch}, energy: ${voice.energy}, formality: ${voice.formality})`);
    
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }
  
  console.log(`=== SELECTED: ${bestVoice.name} (${bestVoice.gender}, ${bestVoice.accent}) with score ${bestScore} ===`);
  return bestVoice.id;
}

// Filter options for dynamic voice selection
export interface VoiceFilter {
  characteristics?: VoiceCharacteristic[];
  mood?: VoiceMood[];
  useCases?: VoiceUseCase[];
  pitch?: ('low' | 'medium' | 'high')[];
  energy?: ('low' | 'medium' | 'high')[];
  formality?: ('casual' | 'formal' | 'ceremonial')[];
  minLibránSuitability?: number;
  searchQuery?: string;
}

// Filter voices based on criteria
export function filterVoices(filter: VoiceFilter): VoiceProfile[] {
  const allVoices = Object.values(VOICE_PROFILES);
  
  return allVoices.filter(voice => {
    // Filter by characteristics
    if (filter.characteristics && filter.characteristics.length > 0) {
      const hasMatchingCharacteristic = filter.characteristics.some(char => 
        voice.characteristics.includes(char)
      );
      if (!hasMatchingCharacteristic) return false;
    }

    // Filter by mood
    if (filter.mood && filter.mood.length > 0) {
      if (!filter.mood.includes(voice.mood)) return false;
    }

    // Filter by use cases
    if (filter.useCases && filter.useCases.length > 0) {
      const hasMatchingUseCase = filter.useCases.some(useCase => 
        voice.useCases.includes(useCase)
      );
      if (!hasMatchingUseCase) return false;
    }

    // Filter by pitch
    if (filter.pitch && filter.pitch.length > 0) {
      if (!filter.pitch.includes(voice.pitch)) return false;
    }

    // Filter by energy
    if (filter.energy && filter.energy.length > 0) {
      if (!filter.energy.includes(voice.energy)) return false;
    }

    // Filter by formality
    if (filter.formality && filter.formality.length > 0) {
      if (!filter.formality.includes(voice.formality)) return false;
    }

    // Filter by minimum Librán suitability
    if (filter.minLibránSuitability !== undefined) {
      if (voice.libránSuitability < filter.minLibránSuitability) return false;
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const searchableText = [
        voice.name,
        voice.description,
        ...voice.characteristics,
        voice.mood,
        ...voice.useCases
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) return false;
    }

    return true;
  });
}

// Get all available filter options
export function getFilterOptions() {
  const allVoices = Object.values(VOICE_PROFILES);
  
  return {
    characteristics: Array.from(new Set(allVoices.flatMap(v => v.characteristics))).sort(),
    moods: Array.from(new Set(allVoices.map(v => v.mood))).sort(),
    useCases: Array.from(new Set(allVoices.flatMap(v => v.useCases))).sort(),
    pitches: Array.from(new Set(allVoices.map(v => v.pitch))).sort(),
    energies: Array.from(new Set(allVoices.map(v => v.energy))).sort(),
    formalities: Array.from(new Set(allVoices.map(v => v.formality))).sort()
  };
}

// Get voice recommendations based on text content
export function getVoiceRecommendations(text: string, variant: 'ancient' | 'modern'): VoiceProfile[] {
  const words = text.toLowerCase().split(/\s+/);
  const recommendations: { voice: VoiceProfile; score: number }[] = [];
  
  // Score voices based on text content
  Object.values(VOICE_PROFILES).forEach(voice => {
    let score = voice.libránSuitability;
    
    // Boost score for ancient variant
    if (variant === 'ancient') {
      score += voice.formality === 'ceremonial' ? 2 : voice.formality === 'formal' ? 1 : 0;
    }
    
    // Boost score based on text content
    const mysteriousWords = ['mystery', 'secret', 'hidden', 'ancient', 'forgotten', 'whisper', 'shadow'];
    const dramaticWords = ['danger', 'warning', 'threat', 'battle', 'storm', 'darkness'];
    const ceremonialWords = ['sacred', 'holy', 'divine', 'blessing', 'ritual', 'ceremony'];
    const storytellingWords = ['story', 'tale', 'legend', 'once', 'long ago', 'narrator'];
    
    if (mysteriousWords.some(word => words.some(w => w.includes(word)))) {
      score += voice.characteristics.includes('mysterious') ? 3 : 0;
    }
    
    if (dramaticWords.some(word => words.some(w => w.includes(word)))) {
      score += voice.characteristics.includes('dramatic') ? 3 : 0;
    }
    
    if (ceremonialWords.some(word => words.some(w => w.includes(word)))) {
      score += voice.characteristics.includes('ceremonial') ? 3 : 0;
    }
    
    if (storytellingWords.some(word => words.some(w => w.includes(word)))) {
      score += voice.characteristics.includes('storytelling') ? 2 : 0;
    }
    
    recommendations.push({ voice, score });
  });
  
  return recommendations
    .sort((a, b) => b.score - a.score)
    .map(r => r.voice);
}











