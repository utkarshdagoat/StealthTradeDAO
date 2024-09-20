import runtime from "../runtime";
import { PrivateKey } from "o1js";
import { NodeClientAppChain } from "../protocol/appchain";
const appChainNode = NodeClientAppChain.fromRuntime(runtime.modules);
appChainNode.configurePartial({
  Runtime: runtime.config,
  Signer:{
    signer: PrivateKey.random()
  }
});


appChainNode.configurePartial({
  GraphqlClient: {
    url: process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL,
  },
});


export const nodeClient = appChainNode;