import { Button } from "@/components/ui/button"

interface ComponentProps {
    buyOrders: number[]
    sellOrders: number[]
}

export default function OrderBook(props: ComponentProps) {
  const maxAmount = Math.max(...props.buyOrders, ...props.sellOrders)
  const maxHeight = 300 

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
          <div className="mt-4 space-y-2">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-lg py-3">Limit Buy</Button>
            <Button className="w-full bg-green-500 hover:bg-green-600 text-lg py-3">Market Buy</Button>
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
                  <div className="h-full w-full opacity-0 hover:opacity-100 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs transition-opacity duration-300">
                    {amount.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Button className="w-full bg-red-500 hover:bg-red-600 text-lg py-3">Limit Sell</Button>
            <Button className="w-full bg-red-500 hover:bg-red-600 text-lg py-3">Market Sell</Button>
          </div>
        </div>
      </div>
    </div>
  )
}