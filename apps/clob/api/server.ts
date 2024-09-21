import express, { Request, Response } from 'express';
import cors from 'cors';
import { Order, Price } from '../core/order';
import { PrivateKey, PublicKey } from 'o1js';
import { OrderBook } from '../core/orderMatching';
const app = express();
const PORT = process.env.PORT || 3030;
const orderbook = new OrderBook();
app.use(cors());

app.use(express.json());

app.post('/api/clob/add', async (req: Request, res: Response) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const {
        priceNumber,
        amount,
        bidOrAsk,
        orderType,
        tokenOne,
        tokenTwo,
        sender,
        leverage
    } = req.body;
    const price = new Price(priceNumber);
    const id = orderbook.ordersLength;
    const order = new Order(id, orderType, amount, price, timestamp, bidOrAsk, tokenOne, tokenTwo, PublicKey.fromBase58(sender), leverage);
    await orderbook.addOrder(order, timestamp);
    res.json(order); // on the frontend now with this order id create a merkle map and add to the runtime
})

app.get('/api/clob/get/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    res.json(orderbook.getOrderById(id));
})


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
