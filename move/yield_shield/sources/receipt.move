/// User receipt proving vault share ownership.
module yield_shield::receipt;

use sui::object::{Self, ID, UID};

public struct ShieldReceipt<phantom T> has key, store {
    id: UID,
    vault_id: ID,
    shares: u64,
}

public(package) fun mint<T>(
    vault_id: ID,
    shares: u64,
    ctx: &mut sui::tx_context::TxContext,
): ShieldReceipt<T> {
    ShieldReceipt {
        id: object::new(ctx),
        vault_id,
        shares,
    }
}

public(package) fun shares<T>(receipt: &ShieldReceipt<T>): u64 {
    receipt.shares
}

public(package) fun vault_id<T>(receipt: &ShieldReceipt<T>): ID {
    receipt.vault_id
}

public(package) fun add_shares<T>(receipt: &mut ShieldReceipt<T>, amount: u64) {
    receipt.shares = receipt.shares + amount;
}

public(package) fun subtract_shares<T>(receipt: &mut ShieldReceipt<T>, amount: u64) {
    receipt.shares = receipt.shares - amount;
}

public(package) fun delete<T>(receipt: ShieldReceipt<T>) {
    let ShieldReceipt { id, vault_id: _, shares: _ } = receipt;
    id.delete();
}
