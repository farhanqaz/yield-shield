/// Pure ShieldScore calculation and status thresholds.
module yield_shield::shield_score;

const STATUS_SAFE: u8 = 0;
const STATUS_CAUTION: u8 = 1;
const STATUS_PAUSED: u8 = 2;

const THRESHOLD_CAUTION: u8 = 60;
const THRESHOLD_PAUSED: u8 = 30;

const WEIGHT_UTIL: u64 = 40;
const WEIGHT_VOL: u64 = 35;
const WEIGHT_HEALTH: u64 = 25;

/// Compute composite score (0–100) from normalized sub-scores (each 0–100).
public fun compute_score(
    util_component: u8,
    vol_component: u8,
    health_component: u8,
): u8 {
    let weighted = (
        (util_component as u64) * WEIGHT_UTIL
            + (vol_component as u64) * WEIGHT_VOL
            + (health_component as u64) * WEIGHT_HEALTH
    ) / 100;
    if (weighted > 100) 100 else (weighted as u8)
}

/// Map utilization basis points (0–10000) to a 0–100 safety component.
/// Higher utilization → lower safety.
public fun util_component_from_bps(utilization_bps: u64): u8 {
    let util_pct = utilization_bps / 100;
    if (util_pct >= 100) {
        0
    } else {
        (100 - (util_pct as u8))
    }
}

/// Map volatility basis points to a 0–100 safety component.
public fun vol_component_from_bps(volatility_bps: u64): u8 {
    let penalty = volatility_bps / 50;
    if (penalty >= 100) {
        0
    } else {
        (100 - (penalty as u8))
    }
}

/// Health buffer ratio in basis points (0–10000) → component.
public fun health_component_from_bps(buffer_bps: u64): u8 {
    let pct = buffer_bps / 100;
    if (pct >= 100) {
        100
    } else {
        (pct as u8)
    }
}

public fun status_from_score(score: u8): u8 {
    if (score < THRESHOLD_PAUSED) {
        STATUS_PAUSED
    } else if (score < THRESHOLD_CAUTION) {
        STATUS_CAUTION
    } else {
        STATUS_SAFE
    }
}

public fun deposits_allowed(status: u8): bool {
    status != STATUS_PAUSED
}

public fun status_safe(): u8 { STATUS_SAFE }
public fun status_caution(): u8 { STATUS_CAUTION }
public fun status_paused(): u8 { STATUS_PAUSED }
