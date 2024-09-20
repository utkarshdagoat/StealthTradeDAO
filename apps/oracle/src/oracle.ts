import { TokenId, UInt224 } from "@proto-kit/library"
import tokenData from "../token.json" assert { type: "json" }
import { NodeClient, Token } from "./types"
import axios from "axios"
import { nodeClient } from "chain"
import { Balances } from "chain/dist/runtime/modules/balances"
import oracleKeys from "chain/oracle.json" assert { type: "json" }
import { PrivateKey, PublicKey } from "o1js"


const EXCHANGE_RATE_API = (symbol: string) =>
    "https://api.mobula.io/api/1/market/data?symbol=" + symbol;

export const getPrice = async (symbol: string, apiKey: string) => {
    const res = await axios.get(EXCHANGE_RATE_API(symbol), {
        headers: {
            Authorization: apiKey,
        },
    });
    const data = await res.data;
    return Number(data.data.price);
};


export class Oracle {

    public tokenWatchList: Token[] = []
    public appChain: NodeClient;
    public balances: Balances;
    oraclePublicKey: PublicKey
    nonce: number = 0

    constructor() {
        Object.entries(tokenData).forEach(([key, value]) => {
            this.tokenWatchList.push({ asset: key, tokenId: TokenId.from(value) })
        })
        this.appChain = nodeClient
        this.appChain.start()
        this.balances = this.appChain.runtime.resolve("Balances");
        this.appChain.setSigner(PrivateKey.fromJSON(oracleKeys.pv))
        this.oraclePublicKey = PublicKey.fromBase58(oracleKeys.publicKey)
    }

    public async updatePrice() {
        for (const token of this.tokenWatchList) {
            console.log("updating price for ", token.asset)
            try {
                setTimeout(async () => {
                    if (!process.env.API_KEY) return;
                    const price = await getPrice(token.asset, process.env.API_KEY)
                    const tx = await this.appChain.transaction(this.oraclePublicKey, async () => {
                        this.balances.setPriceTwap(token.tokenId, UInt224.from(Math.floor(price * 1e8)));
                    },{
                        nonce:this.nonce
                    });
                    this.nonce++
                    await tx.sign()
                    await tx.send()
                    console.log("price updated for ", token.asset, " ", price)
                }, 5000)
            } catch (error) {
                console.error(error)
            }
        }
    }


}