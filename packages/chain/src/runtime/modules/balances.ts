import { runtimeModule, state, runtimeMethod } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { UInt224, Balance, Balances as BaseBalances, TokenId , UInt64 } from "@proto-kit/library";
import { PublicKey, Bytes, Struct } from "o1js";

interface BalancesConfig {
  totalSupply: Balance;
  Oracle: PublicKey;
}

export class TokenMetaData extends Struct({
  logo: Bytes(32),
  name: Bytes(32),
  ticker: Bytes(32)
}) { }

@runtimeModule()
export class Balances extends BaseBalances<BalancesConfig> {

  @runtimeMethod()
  public async addBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): Promise<void> {
    // const circulatingSupply = await this.circulatingSupply.get();
    // const newCirculatingSupply = Balance.from(circulatingSupply.value).add(
    //   amount
    // );
    // assert(
    //   newCirculatingSupply.lessThanOrEqual(this.config.totalSupply),
    //   "Circulating supply would be higher than total supply"
    // );
    // await this.circulatingSupply.set(newCirculatingSupply);
    await this.mint(tokenId, address, amount);
  }


}
