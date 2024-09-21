// This is the runtime module which manages the treasury for the platform

import { runtimeMethod, RuntimeModule } from "@proto-kit/module";
import { assert, PublicKey } from "o1js";
import { Balances } from "./balances";
import { inject } from "tsyringe";
import { Balance, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";

interface TreasuryManagerConfig {
    treasuryAddress: PublicKey
}

export class TreasuryManager extends RuntimeModule<TreasuryManagerConfig> {


    @runtimeMethod()
    public async setTreasuryAddress(treasuryAddress: PublicKey) {
        this.config.treasuryAddress = treasuryAddress
    }

    @runtimeMethod()
    public async getTreasuryAddress() {
        return this.config.treasuryAddress
    }

    // @runtimeMethod()
    // public async getTreasuryBalance(token: TokenId): Promise<Balance> {
    //     const balanceKey = new BalancesKey({
    //         tokenId: token,
    //         address: this.config.treasuryAddress
    //     })
    //     const balance = await this.balances.balances.get(balanceKey)
    //     return balance.value
    // }

    @runtimeMethod()
    public async trasnferFromTreasury(tokenId: TokenId, amount: UInt64,to: PublicKey) {
        // await this.balances.transfer(
        //     tokenId,
        //     this.config.treasuryAddress,
        //     to,
        //     amount
        // )
    }

}