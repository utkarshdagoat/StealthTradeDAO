// This is the runtime module which manages the treasury for the platform

import { RuntimeModule } from "@proto-kit/module";
import { assert, PublicKey } from "o1js";
import { Balances } from "./balances";
import { inject } from "tsyringe";
import { Balance, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";

interface TreasuryManagerConfig {
    treasuryAddress: PublicKey
}

export class TreasuryManager extends RuntimeModule<TreasuryManagerConfig> {

    constructor(
        @inject("Balances") public balances: Balances
    ) {
        super()
    }
    public async setTreasuryAddress(treasuryAddress: PublicKey) {
        const currentAddress = this.config.treasuryAddress
        assert(currentAddress.equals(this.transaction.sender.value), "Only the treasury can set the treasury address")
        this.config.treasuryAddress = treasuryAddress
    }

    public async getTreasuryAddress() {
        return this.config.treasuryAddress
    }

    public async getTreasuryBalance(token: TokenId): Promise<Balance> {
        const balanceKey = new BalancesKey({
            tokenId: token,
            address: this.config.treasuryAddress
        })
        const balance = await this.balances.balances.get(balanceKey)
        return balance.value
    }

    public async transferToTreasury(tokenId: TokenId, amount: UInt64) {
        await this.balances.transfer(
            tokenId,
            this.transaction.sender.value,
            this.config.treasuryAddress,
            amount
        )
    }

}