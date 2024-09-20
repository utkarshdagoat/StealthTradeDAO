import { log } from "@proto-kit/common";

import {
  InMemoryStateService,
  Runtime,
  RuntimeModulesRecord,
} from "@proto-kit/module";

import {
  MandatoryProtocolModulesRecord,
  Protocol,
  ProtocolModulesRecord,
  StateServiceProvider,
} from "@proto-kit/protocol";
import {
  VanillaProtocolModules,
  VanillaRuntimeModules,
} from "@proto-kit/library";
import { Sequencer, SequencerModulesRecord } from "@proto-kit/sequencer";
import { container } from "tsyringe";
import { PrivateKey } from "o1js";
import { GraphqlClient } from "@proto-kit/sdk";
import { GraphqlQueryTransportModule } from "@proto-kit/sdk";
import { GraphqlNetworkStateTransportModule } from "@proto-kit/sdk";
import { GraphqlTransactionSender } from "@proto-kit/sdk";
import { AppChain, AppChainModulesRecord } from "@proto-kit/sdk";
import { InMemorySigner } from "@proto-kit/sdk";

export class NodeClientAppChain<
  RuntimeModules extends RuntimeModulesRecord,
  ProtocolModules extends ProtocolModulesRecord &
    MandatoryProtocolModulesRecord,
  SequencerModules extends SequencerModulesRecord,
  AppChainModules extends AppChainModulesRecord,
> extends AppChain<
  RuntimeModules,
  ProtocolModules,
  SequencerModules,
  AppChainModules
> {
  public static fromRuntime<
    RuntimeModules extends RuntimeModulesRecord,
  >(runtimeModules: RuntimeModules) {
    const appChain = new NodeClientAppChain({
      Runtime: Runtime.from({
        modules: VanillaRuntimeModules.with(runtimeModules),
      }),
      Protocol: Protocol.from({
        modules: VanillaProtocolModules.with({}),
      }),
      Sequencer: Sequencer.from({
        modules: {},
      }),

      modules: {
        GraphqlClient,
        Signer: InMemorySigner,
        TransactionSender: GraphqlTransactionSender,
        QueryTransportModule: GraphqlQueryTransportModule,
        NetworkStateTransportModule: GraphqlNetworkStateTransportModule,
      },
    });

    appChain.configurePartial({
      Sequencer: {},
      Protocol: {
        BlockProver: {},
        StateTransitionProver: {},
        AccountState: {},
        BlockHeight: {},
        LastStateRoot: {},
        TransactionFee: {
          tokenId: 0n,
          feeRecipient: PrivateKey.random().toPublicKey().toBase58(),
          baseFee: 0n,
          perWeightUnitFee: 1n,
          methods: {},
        },
      },

      Signer: {
        signer: PrivateKey.random()
      },
      TransactionSender: {},
      QueryTransportModule: {},
      NetworkStateTransportModule: {},
      GraphqlClient: {
        url: "http://127.0.0.1:8080/graphql",
      },
    });

    /**
     * Register state service provider globally,
     * to avoid providing an entire sequencer.
     *
     * Alternatively we could register the state service provider
     * in runtime's container, but i think the event emitter proxy
     * instantiates runtime/runtime modules before we can register
     * the mock state service provider.
     */
    const stateServiceProvider = new StateServiceProvider();
    stateServiceProvider.setCurrentStateService(new InMemoryStateService());
    container.registerInstance("StateServiceProvider", stateServiceProvider);

    return appChain;
  }

  public async start() {
    log.setLevel("ERROR");
    await super.start();
  }

  public async setSigner(signer: PrivateKey) {
    const inMemorySigner = this.resolveOrFail("Signer", InMemorySigner);
    inMemorySigner.config.signer = signer;
  }

}

