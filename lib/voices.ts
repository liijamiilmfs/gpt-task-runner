export const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;

export type Voice = typeof VOICES[number];

export const DEFAULT_VOICE: Voice = "alloy";

export const VOICE_LABELS: Record<Voice, string> = {
  alloy: "Alloy - Deep, mysterious, versatile",
  echo: "Echo - Resonant, ceremonial quality", 
  fable: "Fable - Warm, storytelling tone",
  onyx: "Onyx - Darker, more dramatic",
  nova: "Nova - Bright, energetic",
  shimmer: "Shimmer - Soft, ethereal"
};











