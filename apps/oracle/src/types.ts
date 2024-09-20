import {TokenId} from "@proto-kit/library"
import { nodeClient} from "chain";


export interface Token {
    asset: string;
    tokenId:TokenId;
}

export type NodeClient = typeof nodeClient;

