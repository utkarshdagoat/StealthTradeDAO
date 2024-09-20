import { Balance, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";
import { PublicKey } from "o1js";

export const modules = VanillaRuntimeModules.with({
  Balances,
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
    Oracle:PublicKey.fromBase58("B62qruwuJG8yrH88zB5923NnHkMjHZNxiqQxcdPU8o41uANBa45DyN2")
  },
};

export default {
  modules,
  config,
};



