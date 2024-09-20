import { UInt64 } from "@proto-kit/library";
import { runtimeMethod, RuntimeModule, state } from "@proto-kit/module";
import { StateMap,assert } from "@proto-kit/protocol";
import { Field } from "o1js";
import { CanAccessProof } from "../zkPrograms/acl";



export class OrderBookAccessControlRuntime extends RuntimeModule<unknown> {

    @state() public orderIdToCommitment = StateMap.from<UInt64, Field>(UInt64, Field)


    @runtimeMethod()
    public async setOrderCommitment(orderId: UInt64, commitment: Field) {
        await this.orderIdToCommitment.set(orderId, commitment)
    }

    @runtimeMethod()
    public async canAccessOrder(orderId: UInt64, proof: CanAccessProof) {
        proof.verify()
        const commitment = await this.orderIdToCommitment.get(orderId)
        assert(
            commitment.value.equals(proof.publicOutput),
            "Invalid Proof for the order Id"
        )
    }
}