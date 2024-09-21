import { TestingAppChain } from "@proto-kit/sdk"
import { OrderBookAccessControlRuntime } from "../../../src/runtime/modules/acl"
import "reflect-metadata"
import { UInt64 } from "@proto-kit/library"
import { MerkleMap, Poseidon, PrivateKey, Bool, MerkleMapWitness, PublicKey, UInt64 as oUInt64 } from "o1js"
import { canAccessProgram, CanAccessProof } from "../../../src/runtime/zkPrograms/acl"

describe("Access control list", () => {
    // let appchain = TestingAppChain.fromRuntime({
    //     OrderBookAccessControlRuntime
    // })
    // const orderId = UInt64.from(1);
    // const o1orderId = oUInt64.from(1);

    // const orderId2 = UInt64.from(2);
    // const o1orderId2 = oUInt64.from(2);


    // const alice = PrivateKey.random();
    // const alicePublicKey = alice.toPublicKey();
    // const bob = PrivateKey.random();
    // const bobPublicKey = bob.toPublicKey();

    // const notAllowed = PrivateKey.random()
    // const notAllowedPublicKey = notAllowed.toPublicKey()

    // let acl: OrderBookAccessControlRuntime;

    // const map = new MerkleMap()
    // const aliceKey = Poseidon.hash(alicePublicKey.toFields())
    // const bobKey = Poseidon.hash(bobPublicKey.toFields())
    // const notAllowedKey = Poseidon.hash(notAllowedPublicKey.toFields())
    // map.set(aliceKey, Bool(true).toField())
    // map.set(bobKey, Bool(true).toField())

    // const witness = map.getWitness(aliceKey)
    // const badWitness = map.getWitness(notAllowedKey)

    // let aliceProof: CanAccessProof;
    // let notAllowedProof: CanAccessProof;


    // beforeAll(async () => {
    //     appchain = TestingAppChain.fromRuntime({
    //         OrderBookAccessControlRuntime
    //     })
    //     appchain.configurePartial({
    //         Runtime: {
    //             OrderBookAccessControlRuntime: {},
    //             Balances: {}
    //         }
    //     })
    //     await appchain.start()
    //     appchain.setSigner(alice)
    //     acl = appchain.runtime.resolve("OrderBookAccessControlRuntime")

    //     await canAccessProgram.compile()
    //     aliceProof = await realProof(witness, alicePublicKey)
    //     notAllowedProof = await realProof(badWitness, notAllowedPublicKey)
    // }, 1_000_000)

    // async function realProof(witness: MerkleMapWitness, key: PublicKey) {
    //     const proof = await canAccessProgram.canAccess(witness, key, o1orderId)
    //     return proof
    // }

    // async function realProofRecursive(witness: MerkleMapWitness, key: PublicKey, proof: CanAccessProof) {
    //     const newProof = await canAccessProgram.canAccessAllTheOrders(witness, key, o1orderId2, proof)
    //     return newProof
    // }




    // it("Be able to create commitments", async () => {
    //     const tx = await appchain.transaction(alicePublicKey, async () => {
    //         await acl.setOrderCommitment(orderId, map.getRoot())
    //     })
    //     await tx.sign()
    //     await tx.send()

    //     const block = await appchain.produceBlock()
    //     expect(block?.transactions[0].status.toBoolean()).toBe(true)
    //     const commitment = await appchain.query.runtime.OrderBookAccessControlRuntime.orderIdToCommitment.get(orderId)

    //     expect(commitment?.toBigInt()).toBe(map.getRoot().toBigInt())
    // }, 1_000_000)

    // it("Should allow someone with a valid proof to access the order", async () => {
    //     const tx = await appchain.transaction(alicePublicKey, async () => {
    //         await acl.canAccessOrder(orderId, aliceProof)
    //     })
    //     await tx.sign()
    //     await tx.send()

    //     const block = await appchain.produceBlock()
    //     expect(block?.transactions[0].status.toBoolean()).toBe(true)
    // }, 1_000_000)

    // it("Should not allow someone with an invalid proof to access the order", async () => {
    //     appchain.setSigner(notAllowed)
    //     const tx = await appchain.transaction(notAllowedPublicKey, async () => {
    //         await acl.canAccessOrder(orderId, notAllowedProof)
    //     })
    //     await tx.sign()
    //     await tx.send()
    //     const block = await appchain.produceBlock()
    //     expect(block?.transactions[0].status.toBoolean()).toBe(false)
    // }, 1_000_000)
    // it("Should not allow someone with an invalid proof to access the order", async () => {
    //     const newProof = await realProofRecursive(witness, alicePublicKey, )
    //     expect(block?.transactions[0].status.toBoolean()).toBe(false)
    // })
    // it("Should allow for new order to be set", async () => {
    //     const newProof = await realProofRecursive(witness, alicePublicKey, aliceProof)
    //     const tx1 = await appchain.transaction(alicePublicKey, async () => {
    //         await acl.setOrderCommitment(orderId2,newProof.publicOutput.root)
    //     })
    //     await tx1.sign()
    //     await tx1.send()
    //     const block = await appchain.produceBlock()
    //     expect(block?.transactions[0].status.toBoolean()).toBe(true)
    //     const tx2 = await appchain.transaction(alicePublicKey, async () => {
    //         await acl.canAccessOrder(orderId, newProof)
    //     })
    //     await tx.sign()
    // })
})