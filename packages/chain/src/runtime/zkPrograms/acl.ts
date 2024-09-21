import { Bool, Field, MerkleMapWitness, Poseidon, PublicKey, SelfProof, Struct, UInt64, ZkProgram } from "o1js";

export class AccessControlOutput extends Struct({
    root: Field,
    orderId: UInt64
}) { }

export async function canAccess(
    witness: MerkleMapWitness,
    key: PublicKey,
    orderId: UInt64
): Promise<AccessControlOutput> {
    const hashedKey = Poseidon.hash(key.toFields());
    const value = Poseidon.hash(orderId.toFields());
    const [computedRoot, computedKey] = witness.computeRootAndKeyV2(
        value
    );
    computedKey.assertEquals(hashedKey, "Invalid key");
    return new AccessControlOutput({
        root: computedRoot,
        orderId: orderId
    });
}

export const canAccessProgram = ZkProgram({
    name: "airdrop",
    publicOutput: AccessControlOutput,

    methods: {
        canAccess: {
            privateInputs: [MerkleMapWitness, PublicKey, UInt64],
            method: canAccess,
        },
        canAccessAllTheOrders: {
            privateInputs: [MerkleMapWitness, PublicKey, UInt64, SelfProof],
            method: canAccessAllTheOrders,
        },
    },
});

export async function canAccessAllTheOrders(
    witness: MerkleMapWitness,
    key: PublicKey,
    orderId: UInt64,
    lastProof: SelfProof<Field, AccessControlOutput>
) {
    lastProof.verify()
    //sanity check
    lastProof.publicOutput.orderId.assertGreaterThan(orderId, "Invalid order id")
    const hashedValue = Poseidon.hash(
        [
            ...orderId.toFields(),
            lastProof.publicOutput.root
        ]
    )
    const hashedKey = Poseidon.hash(key.toFields())
    const [computedRoot, computedKey] = witness.computeRootAndKeyV2(
        hashedValue
    );
    computedKey.assertEquals(hashedKey, "Invalid key");
    return new AccessControlOutput({
        root: computedRoot,
        orderId: orderId
    });
};
export class CanAccessProof extends ZkProgram.Proof(canAccessProgram){ }