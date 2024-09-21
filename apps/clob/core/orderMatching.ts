import BTreeMap from 'sorted-btree';
import { Order, BidOrAsk, OrderType, MatchedOrder, Price, FundingRate, UserAccount, Position } from './order';


export class OrderBook {
    public bids: BTreeMap<Price, Order[]>;
    public asks: BTreeMap<Price, Order[]>;
    public matchedOrdersMarket: MatchedOrder[] = [];
    public matchedOrdersLimit: MatchedOrder[] = [];
    public ordersLength: number = 0;

    public fundingRate: FundingRate;
    public userAccounts: Map<number, UserAccount> = new Map();
    constructor() {
        this.bids = new BTreeMap<Price, Order[]>();
        this.asks = new BTreeMap<Price, Order[]>();
        this.fundingRate = { rate: 0.015, timestamp: 0 };
    }

    addOrder(order: Order, timestamp: number): this {
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

        if (matchedOrders.length > 0) {
            const totalMatched = matchedOrders.reduce((sum, o) => sum + o.amount, 0);
            order.amount -= totalMatched;
        }

        if (order.amount > 0) {
            const book = bidOrAsk === BidOrAsk.Bid ? this.bids : this.asks;
            const entry = book.get(price) || [];
            entry.push(order);
            book.set(price, entry);
        }

        return this;
    }

    getAllBids(): Order[] {
        let orders: Order[] = [];
        this.bids.forEachPair((price, orderList) => {
            orders = orders.concat(orderList);
        })
        return orders;
    }

    getAllAsks(): Order[] {
        let orders: Order[] = [];
        for (const orderList of this.asks.values()) {
            orders = orders.concat(orderList);
        }
        return orders;
    }

    getOrders(): Order[] {
        return this.getAllBids().concat(this.getAllAsks());
    }

    getOrderById(id: number): Order | undefined {
        for (const orders of [this.bids, this.asks]) {
            orders.forEach((orderList, _) => {
                for (const order of orderList) {
                    if (order.id === id) {
                        return order;
                    }
                }
            })
        }
        return undefined;
    }

    applyFundingRate(): void {
        const bestBid = this.getBestBid()?.toNumber();
        const bestAsk = this.getBestAsk()?.toNumber();
        const midPrice =new Price(bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0);

        this.userAccounts.forEach(user => {
            user.positions.forEach(position => {
                const fundingPayment = this.calculateFundingPayment(position, this.fundingRate, midPrice);
                if (position.bidOrAsk === BidOrAsk.Bid) {
                    user.balance -= fundingPayment;
                } else {
                    user.balance += fundingPayment;
                }
            });
        });
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
        let totalPnL = 0;

        user.positions.forEach(position => {
            totalPnL += this.calculateUnrealizedPnL(position, currentPrice);
        });

        user.balance = 0; // Balance reduced to 0 upon liquidation
        user.positions = []; // All positions closed
    }


    getMarketOrdersToMatch(): Order[] {
        let orders: Order[] = [];

        this.bids.forEachPair((price, orderList) => {
            orders = orders.concat(orderList.filter(order => order.orderType === OrderType.Market));
        })

        this.asks.forEachPair((price, orderList) => {
            orders = orders.concat(orderList.filter(order => order.orderType === OrderType.Market));
        })
        return orders;
    }

    getLimitOrdersToMatch(): Order[] {
        let orders: Order[] = [];
        this.bids.forEachPair((price, orderList) => {
            orders = orders.concat(orderList.filter(order => order.orderType === OrderType.Limit));
        })
        this.asks.forEachPair((price, orderList) => {
            orders = orders.concat(orderList.filter(order => order.orderType === OrderType.Limit));
        })
        return orders;
    }

    getBestBid(): Price | undefined {
        return this.bids.maxKey();
    }

    getBestAsk(): Price | undefined {
        return this.asks.minKey();
    }

    matchMarketOrder(marketOrder: Order): MatchedOrder[] {
        const matchedOrders: MatchedOrder[] = [];
        let removalCandidates: Price[] = [];
        let remainingAmount = marketOrder.amount;

        const book = marketOrder.bidOrAsk === BidOrAsk.Bid ? this.asks : this.bids;

        while (remainingAmount > 0) {
            const nextPrice = book.minKey();
            if (!nextPrice) break;

            const ordersAtPrice = book.get(nextPrice)!;

            while (ordersAtPrice.length > 0 && remainingAmount > 0) {
                const order = ordersAtPrice.shift()!;
                const fillAmount = Math.min(order.amount, remainingAmount);
                remainingAmount -= fillAmount;

                matchedOrders.push({
                    id: marketOrder.id,
                    matchedWithId: order.id,
                    orderType: marketOrder.orderType,
                    price: nextPrice,
                    amount: fillAmount,
                    bidOrAsk: marketOrder.bidOrAsk
                });

                if (order.amount > fillAmount) {
                    order.amount -= fillAmount;
                    ordersAtPrice.unshift(order);
                    break;
                }
            }

            if (ordersAtPrice.length === 0) {
                removalCandidates.push(nextPrice);
            }
        }

        removalCandidates.forEach(price => book.delete(price));
        this.matchedOrdersMarket.concat(matchedOrders);


        return matchedOrders;
    }

    matchLimitOrder(limitOrder: Order): MatchedOrder[] {
        const matchedOrders: MatchedOrder[] = [];
        let remainingAmount = limitOrder.amount;

        const book = limitOrder.bidOrAsk === BidOrAsk.Bid ? this.asks : this.bids;

        while (remainingAmount > 0) {
            const nextPrice = book.minKey();
            if (!nextPrice || this.isPriceOutOfRange(nextPrice, limitOrder)) break;

            const ordersAtPrice = book.get(nextPrice)!;

            while (ordersAtPrice.length > 0 && remainingAmount > 0) {
                const order = ordersAtPrice.shift()!;
                const fillAmount = Math.min(order.amount, remainingAmount);
                remainingAmount -= fillAmount;

                matchedOrders.push({
                    id: limitOrder.id,
                    matchedWithId: order.id,
                    orderType: limitOrder.orderType,
                    price: nextPrice,
                    amount: fillAmount,
                    bidOrAsk: limitOrder.bidOrAsk
                });

                if (order.amount > fillAmount) {
                    order.amount -= fillAmount;
                    ordersAtPrice.unshift(order);
                    break;
                }
            }

            if (ordersAtPrice.length === 0) {
                book.delete(nextPrice);
            }
        }

        this.matchedOrdersLimit.concat(matchedOrders);

        return matchedOrders;
    }

    private isPriceOutOfRange(price: Price, order: Order): boolean {
        if (order.bidOrAsk === BidOrAsk.Bid) {
            return price > order.price!;
        }
        return price < order.price!;
    }
}
