import { Balance, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";
import { PublicKey } from "o1js";
import { OrderBookAccessControlRuntime } from "./modules/acl";
import { TreasuryManager } from "./modules/treasuryManager";

export const modules = VanillaRuntimeModules.with({
  Balances,
  TreasuryManager,
  OrderBookAccessControlRuntime,
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
    Oracle: PublicKey.fromBase58("B62qruwuJG8yrH88zB5923NnHkMjHZNxiqQxcdPU8o41uANBa45DyN2")
  },
  OrderBookAccessControlRuntime: {},
  TreasuryManager: {
    treasuryAddress: PublicKey.empty(),
  }
};

export default {
  modules,
  config,
};



