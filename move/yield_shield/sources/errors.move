/// Yield Shield — error codes (EPascalCase, module-internal + public getters).
module yield_shield::errors;

const EPaused: u64 = 1;
const EZeroAmount: u64 = 2;
const EInsufficientShares: u64 = 3;
const EWrongVault: u64 = 4;
const ENotAdmin: u64 = 5;

public fun paused(): u64 { EPaused }
public fun zero_amount(): u64 { EZeroAmount }
public fun insufficient_shares(): u64 { EInsufficientShares }
public fun wrong_vault(): u64 { EWrongVault }
public fun not_admin(): u64 { ENotAdmin }
