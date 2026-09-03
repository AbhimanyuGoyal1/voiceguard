export interface VoiceLibraryScenario {
  id: string;
  category: "GENUINE" | "CLONE" | "REPLAY";
  callerLabel: string;
  callerNumber: string;
  locationInfo: string;
  title: string;
  audioUrl: string;
  targetIdentity: string;
  description: string;
  expectedThreat: "LOW" | "HIGH" | "CRITICAL";
}

export const VOICE_LIBRARY: VoiceLibraryScenario[] = [
  {
    id: "genuine_01",
    category: "GENUINE",
    callerLabel: "Primary User (Executive Identity)",
    callerNumber: "+1 (555) 019-4820",
    locationInfo: "New York, USA // Secure VoIP Line",
    title: "Genuine Identity Verification (Session #01)",
    audioUrl: "/audio/samples/genuine/genuine_01.wav",
    targetIdentity: "Primary User",
    description: "Authentic primary user speaking with organic acoustic harmonics and natural vocal dynamics.",
    expectedThreat: "LOW",
  },
  {
    id: "genuine_02",
    category: "GENUINE",
    callerLabel: "Primary User (Executive Identity)",
    callerNumber: "+1 (555) 019-4820",
    locationInfo: "New York, USA // Mobile Carrier Cell #4",
    title: "Genuine Identity Verification (Session #02)",
    audioUrl: "/audio/samples/genuine/genuine_02.wav",
    targetIdentity: "Primary User",
    description: "Authentic primary user authorization phrase with organic wideband vocal frequencies.",
    expectedThreat: "LOW",
  },
  {
    id: "clone_01",
    category: "CLONE",
    callerLabel: "Primary User (Claimed)",
    callerNumber: "+1 (555) 019-4820 [SPOOFED]",
    locationInfo: "Origin: Offshore SIP Trunk #09",
    title: "Targeted AI Voice Clone (Sample #01)",
    audioUrl: "/audio/samples/ai_clone/clone_01.wav",
    targetIdentity: "Primary User",
    description: "Deepfake neural voice synthesis clone matched to Primary User acoustic profile with vocoder cutoff.",
    expectedThreat: "CRITICAL",
  },
  {
    id: "clone_02",
    category: "CLONE",
    callerLabel: "Primary User (Claimed)",
    callerNumber: "+1 (555) 019-4820 [SPOOFED]",
    locationInfo: "Origin: Anonymized VoIP Relay",
    title: "Targeted AI Voice Clone (Sample #02)",
    audioUrl: "/audio/samples/ai_clone/clone_02.wav",
    targetIdentity: "Primary User",
    description: "Zero-shot AI voice cloning attempting unauthorized executive account recovery.",
    expectedThreat: "CRITICAL",
  },
  {
    id: "replay_01",
    category: "REPLAY",
    callerLabel: "Primary User (Voicemail Recording)",
    callerNumber: "+1 (555) 014-9921",
    locationInfo: "Origin: Unknown Gateway",
    title: "Acoustic Replay Transmission",
    audioUrl: "/audio/samples/replay/replay_01.wav",
    targetIdentity: "Primary User",
    description: "Pre-recorded genuine voice authorization replayed over physical speakers with room reverberation.",
    expectedThreat: "HIGH",
  },
];
