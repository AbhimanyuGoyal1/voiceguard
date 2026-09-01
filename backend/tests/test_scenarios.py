import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.scenario_engine import get_scenario_fixture, list_available_scenarios


def test_list_available_scenarios():
    scenarios = list_available_scenarios()
    assert len(scenarios) == 4
    ids = [s["id"] for s in scenarios]
    assert "genuine_voice" in ids
    assert "ai_voice_clone" in ids
    assert "replay_attack" in ids
    assert "unknown_speaker" in ids


def test_scenario_fixture_determinism():
    # Running multiple times must yield identical outputs
    fix1 = get_scenario_fixture("ai_voice_clone")
    fix2 = get_scenario_fixture("ai_voice_clone")

    assert fix1.mode == "DEMO"
    assert fix1.risk.score == fix2.risk.score == 92
    assert fix1.risk.level == "CRITICAL"
    assert fix1.speaker.match_score == fix2.speaker.match_score == 96.4
    assert fix1.authenticity.synthetic_probability == fix2.authenticity.synthetic_probability == 91.8


def test_all_four_scenarios_outputs():
    # 1. Genuine
    gen = get_scenario_fixture("genuine_voice")
    assert gen.risk.level == "LOW"
    assert gen.speaker.status == "MATCHED"
    assert gen.authenticity.classification == "AUTHENTIC"

    # 2. AI Voice Clone
    cln = get_scenario_fixture("ai_voice_clone")
    assert cln.risk.level == "CRITICAL"
    assert cln.speaker.status == "MATCHED"
    assert cln.authenticity.classification == "SYNTHETIC"

    # 3. Replay Attack
    rep = get_scenario_fixture("replay_attack")
    assert rep.risk.level == "HIGH"
    assert rep.authenticity.classification == "SUSPICIOUS"

    # 4. Unknown Speaker
    unk = get_scenario_fixture("unknown_speaker")
    assert unk.risk.level == "MODERATE"
    assert unk.speaker.status == "MISMATCH"
    assert unk.authenticity.classification == "AUTHENTIC"


@pytest.mark.asyncio
async def test_scenarios_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test GET /api/scenarios
        res_list = await client.get("/api/scenarios")
        assert res_list.status_code == 200
        assert len(res_list.json()) == 4

        # Test GET /api/scenarios/ai_voice_clone
        res_clone = await client.get("/api/scenarios/ai_voice_clone")
        assert res_clone.status_code == 200
        clone_data = res_clone.json()
        assert clone_data["mode"] == "DEMO"
        assert clone_data["risk"]["level"] == "CRITICAL"

        # Test GET invalid scenario
        res_invalid = await client.get("/api/scenarios/invalid_scenario_id")
        assert res_invalid.status_code == 404
