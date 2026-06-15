#[test_only]
module yield_shield::shield_score_tests;

use yield_shield::shield_score;

#[test]
fun safe_score_high_util_low() {
    let util = shield_score::util_component_from_bps(2000); // 20% util → 80
    let vol = shield_score::vol_component_from_bps(500); // low vol
    let health = shield_score::health_component_from_bps(8000);
    let score = shield_score::compute_score(util, vol, health);
    assert!(score >= 60, 0);
    assert!(shield_score::status_from_score(score) == shield_score::status_safe(), 1);
}

#[test]
fun stress_triggers_paused() {
    let util = shield_score::util_component_from_bps(9500); // 95% util → 5
    let vol = shield_score::vol_component_from_bps(4000); // high vol
    let health = shield_score::health_component_from_bps(1000);
    let score = shield_score::compute_score(util, vol, health);
    assert!(score < 30, 0);
    assert!(shield_score::status_from_score(score) == shield_score::status_paused(), 1);
    assert!(!shield_score::deposits_allowed(shield_score::status_paused()), 2);
}

#[test]
fun caution_band() {
    let score = 45u8;
    assert!(shield_score::status_from_score(score) == shield_score::status_caution(), 0);
    assert!(shield_score::deposits_allowed(shield_score::status_caution()), 1);
}
