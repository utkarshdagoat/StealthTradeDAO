import { create } from "zustand"; import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { Balance, TokenId } from "@proto-kit/library";
import { BidOrAsk, Order, OrderType } from "./type";
import { Client, useClientStore } from "./client";
import axios from "axios"
import { Field, MerkleMap, Poseidon, PublicKey, UInt64 } from "o1js";
import { UInt64 as pUInt } from "@proto-kit/library"
import { CREATE_ORDER } from "./endpoint";
import { AccessControlOutput, canAccessProgram, CanAccessProof } from "chain"
import { downloadFile } from "./download";
import { useWalletStore } from "./wallet";
import { useCallback } from "react";


async function mockProof(
    publicOutput: AccessControlOutput
): Promise<CanAccessProof> {
    console.log("generating mock proof");
    console.time("mockProof");
    const proof = await CanAccessProof.dummy(undefined, publicOutput, 0);
    console.timeEnd("mockProof");
    return proof;
}
export interface OrderCreateParams {
    amount: number,
    token: TokenId,
    bidOrAsk: BidOrAsk,
    orderType: OrderType,
    proof?: string,
    publicOuput?: string
}

export interface OrderState {
    myOrders: Order[],
    loadOrders: (client: Client) => Promise<void>,
    createOrder: (params: OrderCreateParams, client: Client, wallet: string) => Promise<PendingTransaction>,
}

function isPendingTransaction(
    transaction: PendingTransaction | UnsignedTransaction | undefined,
): asserts transaction is PendingTransaction {
    if (!(transaction instanceof PendingTransaction))
        throw new Error("Transaction is not a PendingTransaction");
}

export const tokenId = TokenId.from(0);
export const useOrderStore = create<
    OrderState,
    [["zustand/immer", never]]
>(
    immer((set) => ({
        myOrders: [],
        async loadOrders(client: Client) {
        },
        async createOrder(params: OrderCreateParams, client: Client, wallet: string) {
            const Treasury = client.runtime.resolve("TreasuryManager")
            const balances = client.runtime.resolve("Balances")
            const acl = client.runtime.resolve("OrderBookAccessControlRuntime")

            // // //Transfer Funds
            const walletAddress = PublicKey.fromBase58(wallet)
            // const treasuryAddress = Treasury.config.treasuryAddress
            // const tx = await client.transaction(walletAddress, async () => {
            //     await balances.transferSigned(params.token, walletAddress, treasuryAddress, Balance.from(params.amount))
            // }, { nonce: 0 })
            // await tx.sign()
            // await tx.send()


            const res = await axios.post(CREATE_ORDER, {
                priceNumber: params.amount,
                amount: params.amount,
                bidOrAsk: params.bidOrAsk,
                orderType: params.orderType,
                tokenOne: TokenId.from(0),
                tokenTwo: TokenId.from(1),
                sender: walletAddress,
                leverage: 10
            }, {
                withCredentials: true
            })
            const data = res.data
            console.log(data)

            // // generate proof of the order
            // await canAccessProgram.compile()
            // console.log("Compiled")
            const map = new MerkleMap()
            const hashedKey = Poseidon.hash(walletAddress.toFields())
            const orderId = UInt64.from(data.id)
            let computedProof: CanAccessProof
            if (params.proof && params.proof !== "" && params.publicOuput && params.publicOuput !== "") {
                const ouput = AccessControlOutput.fromJSON(JSON.parse(params.publicOuput))
                const reconstructed = await CanAccessProof.fromJSON<any>({
                    maxProofsVerified: 0,
                    proof: params.proof,
                    publicOutput: [params.publicOuput],
                    publicInput: []
                })
                const hashedValue = Poseidon.hash([
                    ...orderId.toFields(),
                    ouput.root
                ])
                map.set(hashedKey, hashedValue)
                const wintness = map.getWitness(hashedKey)
                computedProof = await canAccessProgram.canAccessAllTheOrders(
                    wintness,
                    walletAddress,
                    orderId,
                    reconstructed
                )
                downloadFile(computedProof.toJSON(), `${orderId}-proof.json`)
            } else {
                const hashedValue = Poseidon.hash(orderId.toFields())
                map.set(hashedKey, hashedValue)
                const witness = map.getWitness(hashedKey)
                console.log(witness)
                computedProof = await mockProof({
                    root: map.getRoot(),
                    orderId: orderId,
                })
                // computedProof = await canAccessProgram.canAccess(
                //     witness,
                //     walletAddress,
                //     orderId
                // )

                downloadFile(computedProof.toJSON(), `${orderId}-proof.json`)
            }
            const pOrderId = pUInt.from(data.id)
            const tx2 = await client.transaction(walletAddress, async () => {
                await acl.setOrderCommitment(pOrderId, computedProof.publicOutput.root)
            }, { nonce: 1 })
            await tx2.sign()
            console.log(tx2)

            await tx2.send()
            // await tx.send()
            isPendingTransaction(tx2.transaction)
            return tx2.transaction
        }
    })),
);

export function useCreateOrder() {
    const client = useClientStore()
    const wallet = useWalletStore()
    const orders = useOrderStore()

    return useCallback(async (params: OrderCreateParams) => {
        if (!client.client || !wallet.wallet) return;

        const pendingTransaction = await orders.createOrder(
            params,
            client.client,
            wallet.wallet,
        );

        wallet.addPendingTransaction(pendingTransaction);
    }, [client.client, wallet.wallet]);
}

function watchAllOrders() { }
