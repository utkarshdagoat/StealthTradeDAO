import { Order, BidOrAsk, OrderType, MatchedOrder, Price, FundingRate, UserAccount, Position } from './order';
import { PrivateKey, PublicKey } from "o1js";
import { nodeClient } from "chain";
import { TreasuryManager } from 'chain/dist/runtime/modules/treasuryManager';
import { Balance, TokenId } from '@proto-kit/library';

export class OrderBook {
    public bids: Map<Price, Order[]>;
    public asks: Map<Price, Order[]>;
    public matchedOrdersMarket: MatchedOrder[] = [];
    public matchedOrdersLimit: MatchedOrder[] = [];
    public ordersLength: number = 0;

    public fundingRate: FundingRate;
    public userAccounts: Map<PublicKey, UserAccount> = new Map();

    public publicKey: PublicKey;
    public runtime?: TreasuryManager;
    constructor() {
        this.bids = new Map<Price, Order[]>();
        this.asks = new Map<Price, Order[]>();
        this.fundingRate = { rate: 0.015, timestamp: 0 };

        const privKey = PrivateKey.random();
        const pubKey = privKey.toPublicKey();
        this.publicKey = pubKey;
        nodeClient.start().then(() => {
            this.runtime = nodeClient.runtime.resolve("TreasuryManager");
            nodeClient.setSigner(privKey);
            nodeClient.transaction(pubKey, async () => {
                await this.runtime?.setTreasuryAddress(pubKey);
            }).then((val) => {
                val.sign().then(() => {
                    val.send().then(() => { });
                });
            });

        })
    }

    async addOrder(order: Order, timestamp: number): Promise<this> {
        order.timestamp = timestamp;
        this.ordersLength++;
        const isMarketOrder = order.orderType === OrderType.Market;
        const bidOrAsk = order.bidOrAsk;
        const price = order.price!;
        let matchedOrders: MatchedOrder[] = [];

        if (isMarketOrder) {
            matchedOrders = this.matchMarketOrder(order);
        } else {
            matchedOrders = this.matchLimitOrder(order);
        }

        if (order.amount > 0) {
            const book = bidOrAsk === BidOrAsk.Bid ? this.bids : this.asks;
            const entry = book.get(price) || [];
            entry.push(order);
            book.set(price, entry);
        }

        this.updateUserPosition(order);
        return this;
    }

    updateUserPosition(order: Order): void {
        const user = this.userAccounts.get(order.userId);
        if (!user) return;

        let position = user.positions.find(p => (p.token === order.tokenOne || p.token === order.tokenTwo) && p.bidOrAsk === order.bidOrAsk);
        if (!position) {
            position = {
                id: user.positions.length,
                token: order.tokenOne,
                amount: 0,
                entryPrice: order.price!,
                bidOrAsk: order.bidOrAsk,
                leverage: order.leverage
            };
            user.positions.push(position);
        }
        position.amount += order.amount;
        position.entryPrice = order.price!;
    }

    getAllBids(): Order[] {
        let orders: Order[] = [];
        this.bids.forEach((orderList) => {
            orders = orders.concat(orderList);
        });
        return orders;
    }

    getAllAsks(): Order[] {
        let orders: Order[] = [];
        this.asks.forEach((orderList) => {
            orders = orders.concat(orderList);
        });
        return orders;
    }

    getOrders(): Order[] {
        return this.getAllBids().concat(this.getAllAsks());
    }

    matchAll() {
        const marketOrders = this.getMarketOrdersToMatch();
        const limitOrders = this.getLimitOrdersToMatch();
        marketOrders.forEach(order => this.matchMarketOrder(order));
        limitOrders.forEach(order => this.matchLimitOrder(order));
    }

    getOrderById(id: number): Order | undefined {
        for (const orders of [this.bids, this.asks]) {
            for (const orderList of orders.values()) {
                for (const order of orderList) {
                    if (order.id === id) {
                        return order;
                    }
                }
            }
        }
        return undefined;
    }

    applyFundingRate(): void {
        const bestBid = this.getBestBid()?.toNumber();
        const bestAsk = this.getBestAsk()?.toNumber();
        const midPrice = new Price(bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0);

        for (let [user, userAcc] of this.userAccounts) {
            userAcc.positions.forEach(async position => {
                const fundingPayment = this.calculateFundingPayment(position, this.fundingRate, midPrice);
                if (position.bidOrAsk === BidOrAsk.Bid) {
                    userAcc.balance -= fundingPayment;
                    await this.fromTreasury(position.token, user, fundingPayment);
                } else {
                    userAcc.balance += fundingPayment;
                }
            });
        }
    }

    calculateFundingPayment(position: Position, fundingRate: FundingRate, currentPrice: Price): number {
        return position.amount * currentPrice.toNumber() * fundingRate.rate;
    }

    calculateUnrealizedPnL(position: Position, currentPrice: Price): number {
        const priceDifference = position.bidOrAsk === BidOrAsk.Bid
            ? currentPrice.toNumber() - position.entryPrice.toNumber()
            : position.entryPrice.toNumber() - currentPrice.toNumber();

        return priceDifference * position.amount * position.leverage;
    }

    checkLiquidation(user: UserAccount, currentPrice: Price): void {
        let totalPnL = 0;
        user.positions.forEach(position => {
            totalPnL += this.calculateUnrealizedPnL(position, currentPrice);
        });

        const accountValue = user.balance + totalPnL;
        const maintenanceMargin = user.positions.reduce((sum, pos) => sum + (pos.amount * currentPrice.toNumber()) / pos.leverage, 0) * 0.05;

        if (accountValue < maintenanceMargin) {
            this.liquidateUser(user, currentPrice);
        }
    }

    liquidateUser(user: UserAccount, currentPrice: Price): void {
        console.log(`User ${user.id} has been liquidated!`);
        user.balance = 0; // Balance reduced to 0 upon liquidation
        user.positions = []; // All positions closed
    }

    getMarketOrdersToMatch(): Order[] {
        let orders: Order[] = [];
        this.bids.forEach((orderList) => {
            orders = orders.concat(orderList.filter(order => order.orderType === OrderType.Market));
        });
        this.asks.forEach((orderList) => {
            orders = orders.concat(orderList.filter(order => order.orderType === OrderType.Market));
        });
        return orders;
    }

    getLimitOrdersToMatch(): Order[] {
        let orders: Order[] = [];
        this.bids.forEach((orderList) => {
            orders = orders.concat(orderList.filter(order => order.orderType === OrderType.Limit));
        });
        this.asks.forEach((orderList) => {
            orders = orders.concat(orderList.filter(order => order.orderType === OrderType.Limit));
        });
        return orders;
    }

    getBestBid(): Price | undefined {
        let bestBid: Price | undefined;
        this.bids.forEach((_, price) => {
            if (!bestBid || price.toNumber() > bestBid.toNumber()) {
                bestBid = price;
            }
        });
        return bestBid;
    }

    getBestAsk(): Price | undefined {
        let bestAsk: Price | undefined;
        this.asks.forEach((_, price) => {
            if (!bestAsk || price.toNumber() < bestAsk.toNumber()) {
                bestAsk = price;
            }
        });
        return bestAsk;
    }

    async fromTreasury(tokenId: TokenId, to: PublicKey, amount: number, nonce?: number): Promise<void> {
        const tx = await nodeClient.transaction(this.publicKey, async () => {
            await this.runtime?.trasnferFromTreasury(tokenId, Balance.from(amount), to);
        }, { nonce });
        await tx.sign();
        await tx.send();
    }

    matchMarketOrder(marketOrder: Order): MatchedOrder[] {
        const matchedOrders: MatchedOrder[] = [];
        let removalCandidates: Price[] = [];
        let remainingAmount = marketOrder.amount;

        const book = marketOrder.bidOrAsk === BidOrAsk.Bid ? this.asks : this.bids;

        while (remainingAmount > 0) {
            const nextPrice = this.getNextPrice(book, marketOrder.bidOrAsk);
            if (!nextPrice) break;

            const ordersAtPrice = book.get(nextPrice)!;

            while (ordersAtPrice.length > 0 && remainingAmount > 0) {
                const order = ordersAtPrice.shift()!;
                const fillAmount = Math.min(order.amount, remainingAmount);

                remainingAmount -= fillAmount;
                matchedOrders.push({
                    id: marketOrder.id,
                    matchedWithId: order.id,
                    price: nextPrice,
                    amount: fillAmount,
                    orderType: OrderType.Market,
                    bidOrAsk: marketOrder.bidOrAsk
                });

                order.amount -= fillAmount;
                if (order.amount === 0) removalCandidates.push(nextPrice);
            }
        }

        removalCandidates.forEach(price => {
            if (book.get(price)?.length === 0) {
                book.delete(price);
            }
        });
        return matchedOrders;
    }

    matchLimitOrder(limitOrder: Order): MatchedOrder[] {
        const matchedOrders: MatchedOrder[] = [];
        let removalCandidates: Price[] = [];
        let remainingAmount = limitOrder.amount;

        const book = limitOrder.bidOrAsk === BidOrAsk.Bid ? this.asks : this.bids;

        while (remainingAmount > 0) {
            const nextPrice = this.getNextPrice(book, limitOrder.bidOrAsk);
            if (!nextPrice || (limitOrder.bidOrAsk === BidOrAsk.Bid && nextPrice.toNumber() > limitOrder.price!.toNumber())
                || (limitOrder.bidOrAsk === BidOrAsk.Ask && nextPrice.toNumber() < limitOrder.price!.toNumber())) break;

            const ordersAtPrice = book.get(nextPrice)!;

            while (ordersAtPrice.length > 0 && remainingAmount > 0) {
                const order = ordersAtPrice.shift()!;
                const fillAmount = Math.min(order.amount, remainingAmount);

                remainingAmount -= fillAmount;
                matchedOrders.push({
                    id: limitOrder.id,
                    matchedWithId: order.id,
                    price: nextPrice,
                    amount: fillAmount,
                    orderType: OrderType.Limit,
                    bidOrAsk: limitOrder.bidOrAsk
                });

                order.amount -= fillAmount;
                if (order.amount === 0) removalCandidates.push(nextPrice);
            }
        }

        removalCandidates.forEach(price => {
            if (book.get(price)?.length === 0) {
                book.delete(price);
            }
        });
        return matchedOrders;
    }

    getNextPrice(book: Map<Price, Order[]>, bidOrAsk: BidOrAsk): Price | undefined {
        let nextPrice: Price | undefined;
        if (bidOrAsk === BidOrAsk.Bid) {
            book.forEach((_, price) => {
                if (!nextPrice || price.toNumber() > nextPrice!.toNumber()) {
                    nextPrice = price;
                }
            });
        } else {
            book.forEach((_, price) => {
                if (!nextPrice || price.toNumber() < nextPrice!.toNumber()) {
                    nextPrice = price;
                }
            });
        }
        return nextPrice;
    }
}
