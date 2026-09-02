from typing import List, Dict, Any

SIMULATED_GLOBAL_THREATS: List[Dict[str, Any]] = [
    {
        "id": "THREAT-NA-01",
        "region": "North America",
        "country": "United States",
        "city": "New York",
        "lat": 40.7128,
        "lng": -74.006,
        "attack_type": "Executive AI Voice Clone",
        "target_sector": "Financial Banking / Wire Transfer",
        "incident_volume_24h": 142,
        "severity": "CRITICAL",
        "status": "ACTIVE_CAMPAIGN",
    },
    {
        "id": "THREAT-EU-02",
        "region": "Europe",
        "country": "United Kingdom",
        "city": "London",
        "lat": 51.5074,
        "lng": -0.1278,
        "attack_type": "Replay Transmission Injection",
        "target_sector": "Telecom Customer Support",
        "incident_volume_24h": 88,
        "severity": "HIGH",
        "status": "MITIGATED",
    },
    {
        "id": "THREAT-APAC-03",
        "region": "Asia-Pacific",
        "country": "Singapore",
        "city": "Singapore",
        "lat": 1.3521,
        "lng": 103.8198,
        "attack_type": "Real-time Neural Voice Morphing",
        "target_sector": "Fintech & Crypto Custody",
        "incident_volume_24h": 64,
        "severity": "CRITICAL",
        "status": "ACTIVE_CAMPAIGN",
    },
    {
        "id": "THREAT-EU-04",
        "region": "Europe",
        "country": "Germany",
        "city": "Frankfurt",
        "lat": 50.1109,
        "lng": 8.6821,
        "attack_type": "Synthetic Vocoder Brute-Force",
        "target_sector": "Enterprise SSO Voice Auth",
        "incident_volume_24h": 39,
        "severity": "MODERATE",
        "status": "MONITORING",
    },
    {
        "id": "THREAT-APAC-05",
        "region": "Asia-Pacific",
        "country": "India",
        "city": "Bengaluru",
        "lat": 12.9716,
        "lng": 77.5946,
        "attack_type": "Cross-Lingual Deepfake Impersonation",
        "target_sector": "Retail Banking / UPI Gateway",
        "incident_volume_24h": 115,
        "severity": "HIGH",
        "status": "ACTIVE_CAMPAIGN",
    },
    {
        "id": "THREAT-SA-06",
        "region": "South America",
        "country": "Brazil",
        "city": "São Paulo",
        "lat": -23.5505,
        "lng": -46.6333,
        "attack_type": "Acoustic Sample Replay Spoof",
        "target_sector": "Public Identity Verification",
        "incident_volume_24h": 27,
        "severity": "MODERATE",
        "status": "MONITORING",
    },
]


def get_simulated_threat_intelligence() -> Dict[str, Any]:
    """
    Returns simulated global threat intelligence for contextual SOC visualization.
    Zero real-world targeting. Strictly labeled SIMULATED THREAT INTELLIGENCE.
    """
    total_attacks = sum(t["incident_volume_24h"] for t in SIMULATED_GLOBAL_THREATS)
    return {
        "disclaimer": "SIMULATED THREAT INTELLIGENCE",
        "is_simulated": True,
        "active_campaigns_count": 3,
        "total_24h_incidents": total_attacks,
        "threat_nodes": SIMULATED_GLOBAL_THREATS,
    }
