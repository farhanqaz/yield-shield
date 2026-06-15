/// Yield Shield vault — programmable savings with circuit breaker.
module yield_shield::vault;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::TxContext;
use yield_shield::errors;
use yield_shield::navi_adapter;
use yield_shield::receipt::{Self, ShieldReceipt};
use yield_shield::shield_score;

/// Shared vault object — one per asset type deployment.
public struct Vault<phantom T> has key {
    id: UID,
    total_shares: u64,
    reserve: Balance<T>,
    supplied: u64,
    score: u8,
    status: u8,
    utilization_bps: u64,
    volatility_bps: u64,
    health_buffer_bps: u64,
}

public struct AdminCap has key, store {
    id: UID,
    vault_id: ID,
}

public struct VaultCreated has copy, drop {
    vault_id: ID,
}

public struct Deposited has copy, drop {
    vault_id: ID,
    amount: u64,
    shares_minted: u64,
    score: u8,
}

public struct Withdrawn has copy, drop {
    vault_id: ID,
    amount: u64,
    shares_burned: u64,
}

public struct ScoreUpdated has copy, drop {
    vault_id: ID,
    score: u8,
    status: u8,
}

/// One-time vault creation. Transfers AdminCap to sender.
public fun create_vault<T>(ctx: &mut TxContext) {
    let vault = Vault<T> {
        id: object::new(ctx),
        total_shares: 0,
        reserve: balance::zero(),
        supplied: 0,
        score: 100,
        status: shield_score::status_safe(),
        utilization_bps: 0,
        volatility_bps: 0,
        health_buffer_bps: 10_000,
    };
    let vault_id = object::id(&vault);
    transfer::share_object(vault);

    let admin = AdminCap {
        id: object::new(ctx),
        vault_id,
    };
    transfer::transfer(admin, ctx.sender());

    event::emit(VaultCreated { vault_id });
}

/// Deposit USDC, mint 1:1 shares (simplified; production uses exchange rate).
public fun deposit<T>(
    vault: &mut Vault<T>,
    payment: Coin<T>,
    ctx: &mut TxContext,
): ShieldReceipt<T> {
    assert!(shield_score::deposits_allowed(vault.status), errors::paused());

    let amount = payment.value();
    assert!(amount > 0, errors::zero_amount());

    balance::join(&mut vault.reserve, payment.into_balance());

    // 1:1 for MVP; extend with share price from (reserve + supplied)
    let shares = amount;

    vault.total_shares = vault.total_shares + shares;

    navi_adapter::mock_supply(&mut vault.supplied, amount);

    refresh_score_internal(vault);

    event::emit(Deposited {
        vault_id: object::id(vault),
        amount,
        shares_minted: shares,
        score: vault.score,
    });

    receipt::mint(object::id(vault), shares, ctx)
}

/// Add to existing receipt (subsequent deposits).
public fun deposit_into_receipt<T>(
    vault: &mut Vault<T>,
    receipt: &mut ShieldReceipt<T>,
    payment: Coin<T>,
) {
    assert!(shield_score::deposits_allowed(vault.status), errors::paused());
    assert!(receipt::vault_id(receipt) == object::id(vault), errors::wrong_vault());

    let amount = payment.value();
    assert!(amount > 0, errors::zero_amount());

    balance::join(&mut vault.reserve, payment.into_balance());
    vault.total_shares = vault.total_shares + amount;
    receipt::add_shares(receipt, amount);

    navi_adapter::mock_supply(&mut vault.supplied, amount);
    refresh_score_internal(vault);

    event::emit(Deposited {
        vault_id: object::id(vault),
        amount,
        shares_minted: amount,
        score: vault.score,
    });
}

/// Withdraw by burning shares. Always allowed even when paused.
public fun withdraw<T>(
    vault: &mut Vault<T>,
    receipt: &mut ShieldReceipt<T>,
    shares_to_burn: u64,
    ctx: &mut TxContext,
): Coin<T> {
    assert!(receipt::vault_id(receipt) == object::id(vault), errors::wrong_vault());
    assert!(receipt::shares(receipt) >= shares_to_burn, errors::insufficient_shares());

    receipt::subtract_shares(receipt, shares_to_burn);
    vault.total_shares = vault.total_shares - shares_to_burn;

    navi_adapter::mock_withdraw(&mut vault.supplied, shares_to_burn);

    let payout = balance::split(&mut vault.reserve, shares_to_burn).into_coin(ctx);

    event::emit(Withdrawn {
        vault_id: object::id(vault),
        amount: shares_to_burn,
        shares_burned: shares_to_burn,
    });

    payout
}

/// Admin updates risk metrics (oracle keeper / demo stress trigger).
public fun update_metrics<T>(
    admin: &AdminCap,
    vault: &mut Vault<T>,
    utilization_bps: u64,
    volatility_bps: u64,
    health_buffer_bps: u64,
) {
    assert!(admin.vault_id == object::id(vault), errors::not_admin());
    vault.utilization_bps = utilization_bps;
    vault.volatility_bps = volatility_bps;
    vault.health_buffer_bps = health_buffer_bps;
    refresh_score_internal(vault);
}

fun refresh_score_internal<T>(vault: &mut Vault<T>) {
    let util_c = shield_score::util_component_from_bps(vault.utilization_bps);
    let vol_c = shield_score::vol_component_from_bps(vault.volatility_bps);
    let health_c = shield_score::health_component_from_bps(vault.health_buffer_bps);

    let score = shield_score::compute_score(util_c, vol_c, health_c);
    let status = shield_score::status_from_score(score);

    vault.score = score;
    vault.status = status;

    event::emit(ScoreUpdated {
        vault_id: object::id(vault),
        score,
        status,
    });
}

// --- View helpers ---

public fun score<T>(vault: &Vault<T>): u8 { vault.score }
public fun status<T>(vault: &Vault<T>): u8 { vault.status }
public fun total_shares<T>(vault: &Vault<T>): u64 { vault.total_shares }
public fun supplied<T>(vault: &Vault<T>): u64 { vault.supplied }
