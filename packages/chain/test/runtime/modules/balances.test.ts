import { TestingAppChain } from "@proto-kit/sdk";
import { Bytes, method, PrivateKey } from "o1js";
import { Balances, TokenMetaData } from "../../../src/runtime/modules/balances";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt224, UInt64 } from "@proto-kit/library";
import "reflect-metadata"
log.setLevel("ERROR");

describe("balances", () => {
  const oraclePv = PrivateKey.random();
  const oracle = oraclePv.toPublicKey();
  let appChain = TestingAppChain.fromRuntime({
    Balances,
  });

  const tokenId = TokenId.from(0);

  const alicePrivateKey = PrivateKey.random();
  const alice = alicePrivateKey.toPublicKey();
  let balances : Balances;

  beforeAll(async () => {
    appChain = TestingAppChain.fromRuntime({
      Balances,
    });
    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
          Oracle: oracle,
        },
      },
    });

    await appChain.start();

    appChain.setSigner(alicePrivateKey);

    balances = appChain.runtime.resolve("Balances");

  }, 1_000_000)

  it("should demonstrate how balances work", async () => {
    const tx1 = await appChain.transaction(alice, async () => {
      await balances.addBalance(tokenId, alice, UInt64.from(1000));
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();
    console.log("started")

    const key = new BalancesKey({ tokenId, address: alice });
    const balance = await appChain.query.runtime.Balances.balances.get(key);

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(balance?.toBigInt()).toBe(1000n);

  }, 1_000_000);



  it("should set price by oracle", async () => {
    appChain.setSigner(oraclePv);
    const tx2 = await appChain.transaction(oracle, async () => {
      await balances.setPriceTwap(tokenId, UInt224.from(100));
    });
    await tx2.sign();
    await tx2.send();

    const block = await appChain.produceBlock();
    const price = await appChain.query.runtime.Balances.eightHoursPriceTwap.get(tokenId);

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(price?.toBigInt()).toBe(100n);
  });


  it("Should add token metadata", async () => {

    const tokenMetaData = new TokenMetaData({
      logo: Bytes(32).fromString("logo"),
      name: Bytes(32).fromString("name"),
      ticker: Bytes(32).fromString("ticker"),
    })
    appChain.setSigner(alicePrivateKey)

    const tx3 = await appChain.transaction(alice, async () => {
      await balances.addToken(tokenId, tokenMetaData);
    });
    await tx3.sign();
    await tx3.send();
    const decoder =  new TextDecoder()

    const block = await appChain.produceBlock();
    const metaData = await appChain.query.runtime.Balances.tokenMetaData.get(tokenId);
    console.log(decoder.decode(metaData?.name.toBytes()).toString()) // prints "name"
    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    // expect(decoder.decode(metaData?.name.toBytes()).toString()).toBe("name");
    // expect(metaData?.ticker.toBytes()).toBe("ticker");
    // expect(metaData?.logo.toBytes()).toBe("logo");
  })

});
