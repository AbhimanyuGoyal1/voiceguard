import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.scenario_engine import get_scenario_fixture
from backend.services.analyst_service import (
    generate_deterministic_analyst_briefing,
    generate_ai_analyst_briefing,
)


def test_deterministic_analyst_briefing_clone():
    clone_fixture = get_scenario_fixture("ai_voice_clone")
    briefing = generate_deterministic_analyst_briefing(clone_fixture)

    assert briefing["is_fallback"] is True
    assert "CRITICAL ALERT" in briefing["executive_summary"]
    assert "TERMINATE SESSION" in briefing["recommended_action"]
    assert len(briefing["forensic_reasoning"]) >= 3


def test_deterministic_analyst_briefing_genuine():
    gen_fixture = get_scenario_fixture("genuine_voice")
    briefing = generate_deterministic_analyst_briefing(gen_fixture)

    assert briefing["is_fallback"] is True
    assert "NORMAL / AUTHENTIC" in briefing["executive_summary"]
    assert "APPROVE SESSION" in briefing["recommended_action"]


@pytest.mark.asyncio
async def test_ai_analyst_forced_timeout_fallback():
    clone_fixture = get_scenario_fixture("ai_voice_clone")
    # Forced timeout triggers deterministic fallback
    briefing = await generate_ai_analyst_briefing(clone_fixture, force_timeout=True)
    assert briefing["is_fallback"] is True
    assert "CRITICAL ALERT" in briefing["executive_summary"]


@pytest.mark.asyncio
async def test_analyst_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/analyst/scenario/ai_voice_clone
        res_clone = await client.get("/api/analyst/scenario/ai_voice_clone")
        assert res_clone.status_code == 200
        data = res_clone.json()
        assert data["is_fallback"] is True
        assert "CRITICAL" in data["executive_summary"]

        # GET /api/analyst/scenario/genuine_voice?force_timeout=true
        res_gen = await client.get("/api/analyst/scenario/genuine_voice?force_timeout=true")
        assert res_gen.status_code == 200
        assert res_gen.json()["is_fallback"] is True
