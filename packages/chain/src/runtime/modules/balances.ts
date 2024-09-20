import { runtimeModule, state, runtimeMethod } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { UInt224, Balance, Balances as BaseBalances, TokenId } from "@proto-kit/library";
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
  @state() public circulatingSupply = State.from<Balance>(Balance);
  @state() public tokenMetaData = StateMap.from<TokenId, TokenMetaData>(TokenId, TokenMetaData);
  @state() public eightHoursPriceTwap = StateMap.from<TokenId, UInt224>(TokenId, UInt224);



  @runtimeMethod()
  public async setPriceTwap(tokenId: TokenId, price: UInt224): Promise<void> {
    assert(this.transaction.sender.value.equals(this.config.Oracle), "Only the oracle can set the price");
    await this.eightHoursPriceTwap.set(tokenId, price);
  }


  @runtimeMethod()
  public async addToken(
    tokenId: TokenId,
    metaData: TokenMetaData
  ): Promise<void> {
    const existingMetaData = await this.tokenMetaData.get(tokenId)
    assert(existingMetaData.isSome.not(), "Token Already Exists")
    await this.tokenMetaData.set(tokenId, metaData)
  }


  @runtimeMethod()
  public async addBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): Promise<void> {
    const circulatingSupply = await this.circulatingSupply.get();
    const newCirculatingSupply = Balance.from(circulatingSupply.value).add(
      amount
    );
    assert(
      newCirculatingSupply.lessThanOrEqual(this.config.totalSupply),
      "Circulating supply would be higher than total supply"
    );
    await this.circulatingSupply.set(newCirculatingSupply);
    await this.mint(tokenId, address, amount);
  }

}
