import { TestingAppChain } from "@proto-kit/sdk"
import { OrderBookAccessControlRuntime } from "../../../src/runtime/modules/acl"
import "reflect-metadata"
import { UInt64 } from "@proto-kit/library"
import { MerkleMap, Poseidon, PrivateKey, Bool, MerkleMapWitness, PublicKey } from "o1js"
import { canAccessProgram } from "../../../src/runtime/zkPrograms/acl"

describe("Access control list", () => {
    let appchain = TestingAppChain.fromRuntime({
        OrderBookAccessControlRuntime
    })
    const orderId = UInt64.from(1);
    const alice = PrivateKey.random();
    const alicePublicKey = alice.toPublicKey();
    const bob = PrivateKey.random();
    const bobPublicKey = bob.toPublicKey();

    const notAllowed = PrivateKey.random()
    const notAllowedPublicKey = notAllowed.toPublicKey()

    let acl: OrderBookAccessControlRuntime;

    const map = new MerkleMap()
    const aliceKey = Poseidon.hash(alicePublicKey.toFields())
    const bobKey = Poseidon.hash(bobPublicKey.toFields())
    const notAllowedKey = Poseidon.hash(notAllowedPublicKey.toFields())
    map.set(aliceKey, Bool(true).toField())
    map.set(bobKey, Bool(true).toField())

    const witness = map.getWitness(aliceKey)
    const badWitness = map.getWitness(notAllowedKey)



    beforeAll(async () => {
        appchain = TestingAppChain.fromRuntime({
            OrderBookAccessControlRuntime
        })
        appchain.configurePartial({
            Runtime:{
                OrderBookAccessControlRuntime:{},
                Balances:{}
            }
        })
        await appchain.start()
        appchain.setSigner(alice)
        acl = appchain.runtime.resolve("OrderBookAccessControlRuntime")
    }, 1_000_000)

    async function realProof(witness: MerkleMapWitness, key: PublicKey) {
        await canAccessProgram.compile()
        const proof = await canAccessProgram.canAccess(witness, key)
        return proof
    }

    it("Be able to create commitments", async () => {
        const tx = await appchain.transaction(alicePublicKey, async () => {
            await acl.setOrderCommitment(orderId, map.getRoot())
        })
        await tx.sign()
        await tx.send()

        const block = await appchain.produceBlock()
        expect(block?.transactions[0].status.toBoolean()).toBe(true)
        const commitment = await appchain.query.runtime.OrderBookAccessControlRuntime.orderIdToCommitment.get(orderId)

        expect(commitment?.toBigInt()).toBe(map.getRoot().toBigInt())
    },1_000_000)

    it("Should allow someone with a valid proof to access the order", async () => {
        const aliceProof = await realProof(witness, alicePublicKey)
        const tx = await appchain.transaction(alicePublicKey, async () => {
            await acl.canAccessOrder(orderId, aliceProof)
        })
        await tx.sign()
        await tx.send()

        const block = await appchain.produceBlock()
        expect(block?.transactions[0].status.toBoolean()).toBe(true)
    },1_000_000)

    it("Should not allow someone with an invalid proof to access the order", async () => {
        const notAllowedProof = await realProof(badWitness, notAllowedPublicKey)
        appchain.setSigner(notAllowed)
        const tx = await appchain.transaction(notAllowedPublicKey, async () => {
            await acl.canAccessOrder(orderId, notAllowedProof)
        })
        await tx.sign()
        await tx.send()
        const block = await appchain.produceBlock()
        expect(block?.transactions[0].status.toBoolean()).toBe(false)
    },1_000_000)
})