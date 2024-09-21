import express, { Request, Response } from 'express';
import cors from 'cors';
import { OrderBook } from '../core/orderMatching';
import { Order, Price } from '../core/order';
const app = express();
const PORT = process.env.PORT || 3000;
const orderbook = new OrderBook();
app.use(cors());

app.use(express.json());

app.post('/api/clob/add', (req: Request, res: Response) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const {
        priceNumber,
        amount,
        bidOrAsk,
        orderType,
        pair
    } = req.body;
    const price = new Price(priceNumber);
    const id = orderbook.ordersLength;
    const order = new Order(id, orderType, pair, amount, price, timestamp, bidOrAsk);
    orderbook.addOrder(order, timestamp);
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
