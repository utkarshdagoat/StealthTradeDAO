import { Button } from "@/components/ui/button"

interface ComponentProps {
  buyOrders: number[]
  sellOrders: number[],
  proofString: string,
  outputString: string
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "./ui/input"
import { OrderCreateParams, useCreateOrder } from "@/lib/stores/orders"
import { useEffect, useState } from "react"
import { BidOrAsk, OrderType } from "@/lib/stores/type"
import { TokenId } from "@proto-kit/library"


export default function OrderBook(props: ComponentProps) {
  const maxAmount = Math.max(...props.buyOrders, ...props.sellOrders)
  const maxHeight = 300
  const [orderParams, setOrderParams] = useState<OrderCreateParams | null>(null)
  const [amount, setAmount] = useState(0)
  const [bidOrAsk, setBidOrAsk] = useState(BidOrAsk.Ask)
  const [orderType, setOrderType] = useState(OrderType.Market)
  const createOrder = useCreateOrder()

  useEffect(() => {
    const params: OrderCreateParams = {
      proof: props.proofString === "" ? undefined : props.proofString,
      publicOuput: props.outputString === "" ? undefined : props.outputString,
      amount:amount,
      token:TokenId.from(0),
      orderType,
      bidOrAsk
    }
    setOrderParams(params)
  }, [amount])

  const handle = async () => {
    if (orderParams)
      createOrder(orderParams)
  }
  return (
    <div className="flex w-[80%] flex-col h-screen bg-background text-foreground justify-center align-center">
      <h2 className="text-3xl font-bold p-4 text-center">Order Book</h2>
      <div className=" flex">
        <div className="flex-1 flex flex-col p-4">
          <h3 className="text-2xl font-semibold mb-4 text-green-500 text-center">Buy Orders</h3>
          <div className="flex-grow flex items-end space-x-1" style={{ height: `${maxHeight}px` }}>
            {props.buyOrders.map((amount, index) => (
              <div key={index} className="flex-1 flex flex-col justify-end">
                <div
                  className="bg-green-500 w-full transition-all duration-300 ease-in-out"
                  style={{ height: `${(amount / maxAmount) * maxHeight}px` }}
                  aria-label={`Buy order: ${amount}`}
                >
                  <div className=" w-full opacity-0 hover:opacity-100 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs transition-opacity duration-300">

                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-5 flex-col mt-2">
            <Dialog>
              <DialogTrigger>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-lg py-3"
                  onClick={() => { setBidOrAsk(BidOrAsk.Bid); setOrderType(OrderType.Limit) }}>Limit Buy</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Place A Limit Buy</DialogTitle>
                  <DialogDescription>
                    <div className="flex gap-2">
                      <Input placeholder="Amount $USD" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} />
                      <Button onClick={handle}> Place </Button>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-lg py-3" onClick={() => { setBidOrAsk(BidOrAsk.Bid); setOrderType(OrderType.Market) }}>Market Buy</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Place A Market Buy</DialogTitle>
                  <DialogDescription>

                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-4">
          <h3 className="text-2xl font-semibold mb-4 text-red-500 text-center">Sell Orders</h3>
          <div className="flex-grow flex items-end space-x-1" style={{ height: `${maxHeight}px` }}>
            {props.sellOrders.map((amount, index) => (
              <div key={index} className="flex-1 flex flex-col justify-end">
                <div
                  className="bg-red-500 w-full transition-all duration-300 ease-in-out"
                  style={{ height: `${(amount / maxAmount) * maxHeight}px` }}
                  aria-label={`Sell order: ${amount}`}
                >
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-5 mt-2">
            <Dialog>
              <DialogTrigger>
                <Button className="w-full bg-red-500 hover:bg-red-600 text-lg py-3"
                  onClick={() => { setBidOrAsk(BidOrAsk.Ask); setOrderType(OrderType.Limit) }}
                >Limit Sell</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Place A Limit Sell</DialogTitle>
                  <DialogDescription>

                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger>
                <Button className="w-full bg-red-500 hover:bg-red-600 text-lg py-3"
                  onClick={() => { setBidOrAsk(BidOrAsk.Ask); setOrderType(OrderType.Market) }}
                > Market Sell</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Place A Market Sell</DialogTitle>
                  <DialogDescription>

                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div >
  )
}