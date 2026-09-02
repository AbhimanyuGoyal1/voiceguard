import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.challenge_service import get_security_challenge, evaluate_challenge_response


def test_get_security_challenge():
    c0 = get_security_challenge(0)
    c1 = get_security_challenge(1)
    assert c0["id"] == "chal_01"
    assert "Blue mountains" in c0["phrase"]
    assert c1["id"] == "chal_02"


def test_evaluate_challenge_response_pass():
    # High match (92%), low synthetic prob (8%) -> PASS
    res = evaluate_challenge_response(speaker_match_score=92.0, synthetic_probability=8.0)
    assert res["status"] == "PASS"
    assert res["overall_passed"] is True
    assert res["speaker_verified"] is True
    assert res["authenticity_verified"] is True
    assert "CHALLENGE PASSED" in res["verdict"]


def test_evaluate_challenge_response_fail_clone():
    # High match (95%), but high synthetic prob (88%) -> FAIL (AI Clone)
    res = evaluate_challenge_response(speaker_match_score=95.0, synthetic_probability=88.0)
    assert res["status"] == "FAIL"
    assert res["overall_passed"] is False
    assert res["speaker_verified"] is True
    assert res["authenticity_verified"] is False
    assert "synthetic deepfake" in res["verdict"]


def test_evaluate_challenge_response_fail_mismatch_speaker():
    # Low match (25%), low synthetic prob (10%) -> FAIL (Unknown Person)
    res = evaluate_challenge_response(speaker_match_score=25.0, synthetic_probability=10.0)
    assert res["status"] == "FAIL"
    assert res["overall_passed"] is False
    assert res["speaker_verified"] is False
    assert res["authenticity_verified"] is True
    assert "Speaker acoustic profile mismatch" in res["verdict"]


@pytest.mark.asyncio
async def test_challenge_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/challenge/next
        res_get = await client.get("/api/challenge/next?index=0")
        assert res_get.status_code == 200
        data = res_get.json()
        assert data["id"] == "chal_01"

        # POST /api/challenge/evaluate (PASS case)
        res_eval = await client.post(
            "/api/challenge/evaluate",
            json={"speaker_match_score": 90.0, "synthetic_probability": 12.0},
        )
        assert res_eval.status_code == 200
        assert res_eval.json()["status"] == "PASS"

        # POST /api/challenge/evaluate (FAIL clone case)
        res_eval_fail = await client.post(
            "/api/challenge/evaluate",
            json={"speaker_match_score": 90.0, "synthetic_probability": 85.0},
        )
        assert res_eval_fail.status_code == 200
        assert res_eval_fail.json()["status"] == "FAIL"
