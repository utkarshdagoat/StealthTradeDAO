// ZkProgram for proof of solvency https://github.com/binance/zkmerkle-proof-of-solvency/tree/main

import { assert, Field, MerkleMap, MerkleMapWitness, Poseidon, Provable, SelfProof, Struct, UInt64, ZkProgram } from "o1js";
import { BatchCreateUser, CreateUserOperations } from "./structs";
import { readFile, writeFile } from "fs/promises";
import path from "path";



/**
 * 
 * CexAssetInfo -> Merkle Map
 */

export async function verifyAssetList(
    witness: MerkleMapWitness,
    elementId: UInt64,
    TotalEquity: UInt64,
    TotalDebt: UInt64,
    USDTPrice: UInt64,
    assetListCommitment: Field
): Promise<Field> {
    const value = Poseidon.hash([
        ...elementId.toFields(),
        ...TotalEquity.toFields(),
        ...TotalDebt.toFields(),
        ...USDTPrice.toFields()
    ])
    const key = Poseidon.hash(elementId.toFields())

    const [computedRoot, computedKey] = witness.computeRootAndKeyV2(
        value
    )
    assert(computedKey.equals(key), "Invalid Key")
    assert(computedRoot.equals(assetListCommitment), "Invalid Commitment")
    return assetListCommitment
}

export async function verifyAssetListRecursive(
    witness: MerkleMapWitness,
    elementId: UInt64,
    TotalEquity: UInt64,
    TotalDebt: UInt64,
    USDTPrice: UInt64,
    assetListCommitment: Field,
    proof: SelfProof<Field, Field>
): Promise<Field> {
    proof.verify()
    const value = Poseidon.hash([
        ...elementId.toFields(),
        ...TotalEquity.toFields(),
        ...TotalDebt.toFields(),
        ...USDTPrice.toFields()
    ])
    const key = Poseidon.hash(elementId.toFields())

    const [computedRoot, computedKey] = witness.computeRootAndKeyV2(
        value
    )
    computedKey.assertEquals(key, "Invalid Key")
    computedRoot.assertEquals(assetListCommitment, "Invalid Commitment")
    return assetListCommitment
}

export const assetListProgram = ZkProgram({
    name: "Asset List Verification",
    publicOutput: Field,
    methods: {
        base: {
            privateInputs: [MerkleMapWitness, UInt64, UInt64, UInt64, UInt64, Field],
            method: verifyAssetList
        },
        final: {
            privateInputs: [MerkleMapWitness, UInt64, UInt64, UInt64, UInt64, Field, SelfProof],
            method: verifyAssetListRecursive
        }
    }
})


export class AssetListProof extends ZkProgram.Proof(assetListProgram) { }

export class UserBatchOutput extends Struct({
    root: Field,
    calculatedAssetCommitment: Field
}) { }


async function writeToDB(merkleMap: MerkleMap, file: string) {
    const FILE_PATH = path.join(__dirname, file)
    const data = JSON.stringify(merkleMap)
    await writeFile(FILE_PATH, data)
}

async function readFromDB(file: string): Promise<MerkleMap | null | boolean> {
    const FILE_PATH = path.join(__dirname, file);
    try {
        const data = await readFile(FILE_PATH);
        return JSON.parse(data.toString());
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            console.error(`File not found: ${file}`);
            return true
        }
    }
    return null
}

export class AfterAsset extends Struct({
    afterCexAssetCalculatedRoot: Field,
    userAssetCommitement: Field,
    totalUserEquity: UInt64,
    totalUserDebt: UInt64,
    AssetIndex: UInt64,
    AccountId: Field
}) { }

export async function CexAssetsAfterBase(
    Equity: UInt64,
    Debt: UInt64,
    BasePrice: UInt64,
    AccountId: Field
): Promise<AfterAsset> {
    const totalUserEquity = UInt64.from(0)
    const totalUserDebt = UInt64.from(0)
    const AssetIndex = UInt64.from(0)
    const assetKey = Poseidon.hash(AssetIndex.toFields())
    const userAssetKey = Poseidon.hash([...AccountId.toFields(), ...AssetIndex.toFields()])

    const value = Poseidon.hash([
        assetKey,
        ...Equity.toFields(),
        ...Debt.toFields(),
        ...BasePrice.toFields()
    ])
    const finalTotalUserEquity = totalUserEquity.add(Equity.mul(BasePrice))
    const finalTotalUserDebt = totalUserDebt.add(Debt.mul(BasePrice))
    const userMapWitness = Provable.witness(MerkleMapWitness, () => {
        const map = new MerkleMap()
        map.set(userAssetKey, value)
        writeToDB(map, `userMap-${userAssetKey}.json`)
        return map.getWitness(userAssetKey)
    })

    const [_, userAssetCommitement] = userMapWitness.computeRootAndKeyV2(
        value
    )


    const assetValue = Poseidon.hash([
        assetKey,
        ...finalTotalUserEquity.toFields(),
        ...finalTotalUserDebt.toFields(),
        ...BasePrice.toFields()
    ])
    const assetMapWitness = Provable.witness(MerkleMapWitness, async () => {
        const map = await readFromDB("assetMap.json")
        if (map === true) {
            const map = new MerkleMap()
            map.set(assetKey, assetValue)
            writeToDB(map, "assetMap.json")
            return map.getWitness(assetKey)
        } else if (typeof map !== "boolean" && map !== null) {
            map.set(assetKey, assetValue)
            writeToDB(map, "assetMap.json")
            return map.getWitness(assetKey)
        }
    })
    const [, afterCexAssetCalculatedRoot] = assetMapWitness.computeRootAndKeyV2(
        assetValue
    )

    return new AfterAsset({
        afterCexAssetCalculatedRoot,
        userAssetCommitement,
        totalUserEquity: finalTotalUserEquity,
        totalUserDebt: finalTotalUserDebt,
        AssetIndex,
        AccountId
    })
}


export async function CexAssetsAfter(
    proof: SelfProof<Field, AfterAsset>,
    Equity: UInt64,
    Debt: UInt64,
    BasePrice: UInt64
): Promise<AfterAsset> {
    proof.verify()
    const AssetIndex = proof.publicOutput.AssetIndex.add(UInt64.from(1))
    const assetKey = Poseidon.hash(AssetIndex.toFields())
    const userAssetKey = Poseidon.hash([...proof.publicOutput.AccountId.toFields(), ...AssetIndex.toFields()])
    const value = Poseidon.hash([
        assetKey,
        ...Equity.toFields(),
        ...Debt.toFields(),
        ...BasePrice.toFields()
    ])
    const accountId = proof.publicOutput.AccountId
    const finalTotalUserEquity = proof.publicOutput.totalUserEquity.add(Equity.mul(BasePrice))
    const finalTotalUserDebt = proof.publicOutput.totalUserDebt.add(Debt.mul(BasePrice))
    const userMapWitness = Provable.witness(MerkleMapWitness, async () => {
        const map = new MerkleMap()
        map.set(userAssetKey, value)
        await writeToDB(map, `userMap-${userAssetKey}.json`)
        return map.getWitness(userAssetKey)
    })


    const [_, userAssetCommitement] = userMapWitness.computeRootAndKeyV2(
        value
    )


    const assetValue = Poseidon.hash([
        assetKey,
        ...finalTotalUserEquity.toFields(),
        ...finalTotalUserDebt.toFields(),
        ...BasePrice.toFields()
    ])
    const assetMapWitness = Provable.witness(MerkleMapWitness, async () => {
        const map = await readFromDB("assetMap.json")
        if (typeof map !== "boolean" && map !== null) {
            map.set(assetKey, assetValue)
            await writeToDB(map, "assetMap.json")
            return map.getWitness(assetKey)
        }
    })
    const [, afterCexAssetCalculatedRoot] = assetMapWitness.computeRootAndKeyV2(
        assetValue
    )

    finalTotalUserDebt.assertLessThanOrEqual(finalTotalUserEquity, "Invalid Equity debt")

    return new AfterAsset({
        afterCexAssetCalculatedRoot,
        userAssetCommitement,
        totalUserEquity: finalTotalUserEquity,
        totalUserDebt: finalTotalUserDebt,
        AssetIndex,
        AccountId: accountId
    })
}

export const afterAssetVerification = ZkProgram({
    name: "Asset List Verification",
    publicOutput: AfterAsset,
    methods: {
        verify: {
            privateInputs: [UInt64, UInt64, UInt64, Field],
            method: CexAssetsAfterBase
        },
        step: {
            privateInputs: [SelfProof, UInt64, UInt64, UInt64],
            method: CexAssetsAfter
        }
    }
})
export class AfterAssetProof extends ZkProgram.Proof(afterAssetVerification) { }

export async function UserBatchBase(
    createUserOperation: CreateUserOperations,
    afterCexAssetProof: AfterAssetProof
): Promise<UserBatchOutput> {
    const accountHash = Poseidon.hash([
        createUserOperation.accountId,
        afterCexAssetProof.publicOutput.userAssetCommitement
    ])
    const accountKey = Poseidon.hash(createUserOperation.accountId.toFields())

    // In this merkle map witness fetch from the DB the merkle map
    const mapWitness = Provable.witness(MerkleMapWitness, async () => {
        const map = new MerkleMap()
        map.set(accountKey, accountHash)
        await writeToDB(map, "merkleMap.json")
        return map.getWitness(accountKey)
    })

    const [_, root] = mapWitness.computeRootAndKeyV2(
        accountHash
    )

    return new UserBatchOutput({
        root,
        calculatedAssetCommitment: afterCexAssetProof.publicOutput.afterCexAssetCalculatedRoot
    })
}

export async function UserBatch(
    lastOperationProof: SelfProof<Field, UserBatchOutput>,
    createUserOperation: CreateUserOperations,
    afterCexAssetProof: AfterAssetProof
): Promise<UserBatchOutput> {
    lastOperationProof.verify()
    afterCexAssetProof.verify()
    const userAssetCommitment = afterCexAssetProof.publicOutput.userAssetCommitement
    const accountHash = Poseidon.hash([
        createUserOperation.accountId,
        userAssetCommitment
    ])
    const accountKey = Poseidon.hash(createUserOperation.accountId.toFields())

    const mapWitness = Provable.witness(MerkleMapWitness, async () => {
        const map = await readFromDB("merkleMap.json")
        if (typeof map !== "boolean" && map !== null) {
            const root = map.getRoot()
            root.assertEquals(createUserOperation.beforeAccountTreeRoot)
            map.set(accountKey, accountHash)
            await writeToDB(map, "merkleMap.json")
            return map.getWitness(accountKey)
        }
    })

    const [_, root] = mapWitness.computeRootAndKeyV2(
        accountHash
    )

    root.assertEquals(createUserOperation.afterAccountTreeRoot)

    return new UserBatchOutput({
        root,
        calculatedAssetCommitment: afterCexAssetProof.publicOutput.afterCexAssetCalculatedRoot
    })
}


export const batchUpdate = ZkProgram({
    name: "Asset List Verification",
    publicOutput: UserBatchOutput,
    methods: {
        base: {
            privateInputs: [CreateUserOperations, AfterAssetProof],
            method: UserBatchBase
        },
        step: {
            privateInputs: [SelfProof, CreateUserOperations, AfterAssetProof],
            method: UserBatch
        }
    }
})


export class BatchUpdateProofs extends ZkProgram.Proof(batchUpdate) { }



export async function proofOfSolvency(
    beforeAssetListProof: AssetListProof,
    input: BatchCreateUser,
    batchUpdateProof: BatchUpdateProofs
) {
    beforeAssetListProof.verify()
    const actualCommitment = Poseidon.hash([
        input.beforeAccountTreeRoot,
        input.afterAccountTreeRoot,
        input.beforeAccountCexAssetCommitment,
        input.afterAccountCexAssetCommitment
    ])
    actualCommitment.assertEquals(input.batchCommitment, "Invalid Commitment")
    batchUpdateProof.verify()
    batchUpdateProof.publicOutput.calculatedAssetCommitment.assertEquals(input.afterAccountCexAssetCommitment)
}


export const proofOfSolvencyProgram = ZkProgram({
    name: "Asset List Verification",
    methods: {
        base: {
            privateInputs: [AssetListProof, BatchCreateUser, BatchUpdateProofs],
            method: proofOfSolvency
        }
    }
})


export class ProofOfSolvency extends ZkProgram.Proof(proofOfSolvencyProgram) { }