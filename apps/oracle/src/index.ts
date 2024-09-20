import { Oracle } from "./oracle";
import dotenv from "dotenv"
dotenv.config()
const oracle = new Oracle()
oracle.updatePrice()
const startOracle = () => {
  setInterval(async () => {
    await oracle.updatePrice()
  }, 60_000)
}
startOracle()