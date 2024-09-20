import { assert } from "console";
import { Bool, Field, MerkleMapWitness, Poseidon, PublicKey, ZkProgram } from "o1js";



export async function canAccess(
    witness: MerkleMapWitness,
    key: PublicKey
): Promise<Field> {
    const hashedKey = Poseidon.hash(key.toFields());
    const [computedRoot, computedKey] = witness.computeRootAndKeyV2(
       Bool(true).toField() 
    );
    assert(computedKey.equals(hashedKey), "Invalid key");
    return computedRoot;
}

export const canAccessProgram = ZkProgram({
    name: "airdrop",
    publicOutput: Field,

    methods: {
        canAccess: {
            privateInputs: [MerkleMapWitness, PublicKey],
            method: canAccess,
        },
    },
});
export class CanAccessProof extends ZkProgram.Proof(canAccessProgram) { }