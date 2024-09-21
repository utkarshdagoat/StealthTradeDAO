"use client";
import OrderBook from "@/components/orderbook";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { OrderCreateParams } from "@/lib/stores/orders";
import { useState } from "react";


export default function Home() {
    const [orderParams, setOrderParams] = useState<OrderCreateParams | null>(null)
    const [proofString, setProofString] = useState("")
    const [outputString, setOutputString] = useState("")

    return (
        <div className="flex gap-1">
            <OrderBook
                buyOrders={[1, 2, 3, 4, 5]}
                sellOrders={[5, 4, 3, 2, 1]}
            />
            <Dialog>
                <DialogTrigger><Button> See Your Orders</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Prove who you are Leave empty if this is your first time</DialogTitle>
                        <DialogDescription>
                            <div className="flex flex-col gap-5 mt-10 mb-10">
                                <Input placeholder="Proof String" onChange={(e) => { setProofString(e.target.value) }} />
                                <Input placeholder="output json string" onChange={(e) => { setOutputString(e.target.value) }} />
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

        </div>
    );
}

