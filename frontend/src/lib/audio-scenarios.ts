export interface AudioSampleScenario {
  id: string;
  category: "GENUINE" | "CLONE" | "REPLAY" | "UNKNOWN";
  callerLabel: string;
  phoneOrigin: string;
  title: string;
  description: string;
  targetIdentity: string;
  audioUrl: string;
  expectedThreat: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  expectedVerdict: string;
}

export const PREDEFINED_AUDIO_SCENARIOS: AudioSampleScenario[] = [
  {
    id: "genuine_sample_1",
    category: "GENUINE",
    callerLabel: "Primary User (Authentic)",
    phoneOrigin: "+1 (555) 019-4820 // Secure Line",
    title: "Authorized Identity Verification",
    description: "Primary User speaking with natural human pitch micro-variance and wideband vocal harmonics.",
    targetIdentity: "Primary User",
    audioUrl: "/audio/samples/genuine_primary_1.wav",
    expectedThreat: "LOW",
    expectedVerdict: "GENUINE HUMAN SPEAKER",
  },
  {
    id: "clone_sample_1",
    category: "CLONE",
    callerLabel: "Primary User (Cloned)",
    phoneOrigin: "+1 (555) 019-4820 // SIP Trunk Spoof",
    title: "Targeted Neural Voice Clone",
    description: "Attacker using zero-shot AI voice synthesis matched to Primary User acoustic profile with vocoder cutoff.",
    targetIdentity: "Primary User",
    audioUrl: "/audio/samples/ai_clone_attack_1.wav",
    expectedThreat: "CRITICAL",
    expectedVerdict: "AI VOICE CLONE ATTACK",
  },
  {
    id: "replay_sample_1",
    category: "REPLAY",
    callerLabel: "Recorded Voice Transmission",
    phoneOrigin: "+1 (555) 014-9921 // VoIP Gateway",
    title: "Acoustic Replay Attack",
    description: "Pre-recorded genuine voice authorization played back through loudspeaker with acoustic reverberation.",
    targetIdentity: "Primary User",
    audioUrl: "/audio/samples/replay_attack_1.wav",
    expectedThreat: "HIGH",
    expectedVerdict: "REPLAY TRANSMISSION ATTACK",
  },
  {
    id: "unknown_sample_1",
    category: "UNKNOWN",
    callerLabel: "Unenrolled Caller",
    phoneOrigin: "+1 (555) 018-3342 // Unknown Line",
    title: "Impostor Account Takeover Attempt",
    description: "Organic biological voice from an un-enrolled third party attempting identity bypass.",
    targetIdentity: "Primary User",
    audioUrl: "/audio/samples/unknown_impostor_1.wav",
    expectedThreat: "MODERATE",
    expectedVerdict: "UNVERIFIED IMPOSTOR SPEAKER",
  },
];
