/// NAVI lending adapter — mock accounting layer for hackathon MVP.
/// Production: replace with real NAVI deposit/withdraw PTB calls.
module yield_shield::navi_adapter;

/// Record simulated supply to NAVI (funds remain in vault reserve for mock).
public fun mock_supply(supplied: &mut u64, amount: u64) {
    *supplied = *supplied + amount;
}

/// Record simulated withdraw from NAVI.
public fun mock_withdraw(supplied: &mut u64, amount: u64) {
    assert!(*supplied >= amount, 0);
    *supplied = *supplied - amount;
}

public fun supplied_amount(supplied: u64): u64 {
    supplied
}
