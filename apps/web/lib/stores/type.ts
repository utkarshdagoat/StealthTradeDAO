import { TokenId } from "@proto-kit/library";
import { PublicKey } from "o1js";

export enum BidOrAsk {
    Bid = 'Bid',
    Ask = 'Ask',
}

export enum OrderType {
    Market = 'Market',
    Limit = 'Limit',
}

export class Price {
    public integral: number;
    public fractional: number;
    public scalar: number;

    constructor(price: number) {
        this.scalar = 100000;
        this.integral = Math.floor(price);
        this.fractional = Math.floor((price % 1.0) * this.scalar);
    }

    public integralPart(): number {
        return this.integral;
    }

    public fractionalPart(): number {
        return this.fractional;
    }

    public getScalar(): number {
        return this.scalar;
    }
    public toNumber(): number {
        return this.integral + (this.fractional / this.scalar);
    }
}
export interface UserAccount {
    id: number;
    balance: number;
    margin: number;
    positions: Position[];
}

export interface Position {
    id: number;
    entryPrice: Price;
    amount: number;
    bidOrAsk: BidOrAsk;
    leverage: number;
    token: TokenId;
}


export interface FundingRate {
    rate: number;
    timestamp: number;
}

export class Order {
    public id: number;
    public orderType: OrderType;
    public amount: number;
    public price?: Price;
    public timestamp: number;
    public bidOrAsk: BidOrAsk;
    public tokenOne: TokenId
    public tokenTwo: TokenId
    public userId: PublicKey
    public leverage: number
    constructor(
        id: number,
        orderType: OrderType,
        amount: number,
        price: Price | undefined,
        timestamp: number,
        bidOrAsk: BidOrAsk,
        tokenOne: number,
        tokenTwo: number,
        userId: PublicKey,
        leverage: number 
    ) {
        this.id = id;
        this.orderType = orderType;
        this.amount = amount;
        this.price = price;
        this.timestamp = timestamp || Math.floor(Date.now() / 1000); // Unix timestamp in seconds
        this.bidOrAsk = bidOrAsk;
        this.tokenOne = TokenId.from(tokenOne)
        this.tokenTwo = TokenId.from(tokenTwo)
        this.userId = userId
        this.leverage = leverage
    }

    public static new(
        id: number,
        orderType: OrderType,
        amount: number,
        price: Price | undefined,
        bidOrAsk: BidOrAsk,
        tokenOne: number,
        tokenTwo: number,
        userId: PublicKey,
        leverage: number
    ): Order {
        return new Order(id, orderType, amount, price, Math.floor(Date.now() / 1000), bidOrAsk, tokenOne, tokenTwo, userId,leverage);
    }
}

export class MatchedOrder {
    public id: number;
    public matchedWithId: number;
    public orderType: OrderType;
    public price: Price;
    public amount: number;
    public bidOrAsk: BidOrAsk;

    constructor(
        id: number,
        matchedWithId: number,
        orderType: OrderType,
        price: Price,
        amount: number,
        bidOrAsk: BidOrAsk
    ) {
        this.id = id;
        this.matchedWithId = matchedWithId;
        this.orderType = orderType;
        this.price = price;
        this.amount = amount;
        this.bidOrAsk = bidOrAsk;
    }
}

