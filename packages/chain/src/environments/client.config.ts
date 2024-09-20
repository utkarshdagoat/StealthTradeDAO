import {  ClientAppChain, AuroSigner } from "@proto-kit/sdk";
import runtime from "../runtime";
import { PrivateKey } from "o1js";


const appChainWeb = ClientAppChain.fromRuntime(runtime.modules, AuroSigner);

appChainWeb.configurePartial({
  Runtime: runtime.config,
  Signer:{}
});

appChainWeb.configurePartial({
  GraphqlClient: {
    url: process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL,
  },
});

export const client = appChainWeb;