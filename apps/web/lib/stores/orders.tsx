import { create } from "zustand"; import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { Balance, TokenId } from "@proto-kit/library";
import { BidOrAsk, Order, OrderType } from "./type";
import { Client, useClientStore } from "./client";
import axios from "axios"
import { Field, MerkleMap, Poseidon, PublicKey, UInt64 } from "o1js";
import { CREATE_ORDER } from "./endpoint";
import { AccessControlOutput, canAccessProgram, CanAccessProof } from "chain"
import { downloadFile } from "./download";
import { useWalletStore } from "./wallet";
import { useCallback } from "react";

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


            //Transfer Funds
            const walletAddress = PublicKey.fromBase58(wallet)
            const treasuryAddress = Treasury.config.treasuryAddress
            const tx = await client.transaction(walletAddress, async () => {
                await balances.transferSigned(params.token, walletAddress, treasuryAddress, Balance.from(params.amount))
            }, { nonce: 0 })
            await tx.sign()
            await tx.send()
            isPendingTransaction(tx.transaction)


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

            // generate proof of the order
            await canAccessProgram.compile()
            const map = new MerkleMap()
            const hashedKey = Poseidon.hash(walletAddress.toFields())
            const orderId = UInt64.from(data.id)

            if (params.proof && params.publicOuput) {
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
                const newProof = await canAccessProgram.canAccessAllTheOrders(
                    wintness,
                    walletAddress,
                    orderId,
                    reconstructed
                )
                downloadFile(newProof.toJSON(), `${orderId}-proof.json`)
            } else {
                const hashedValue = Poseidon.hash(orderId.toFields())
                map.set(hashedKey, hashedValue)
                const witness = map.getWitness(hashedKey)
                const proof = await canAccessProgram.canAccess(
                    witness,
                    walletAddress,
                    orderId
                )
                downloadFile(proof.toJSON(), `${orderId}-proof.json`)
            }
            return tx.transaction
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
