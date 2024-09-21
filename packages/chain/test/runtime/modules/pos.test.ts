import { afterAssetVerification, assetListProgram, batchUpdate, proofOfSolvencyProgram } from "../../../src/runtime/zkPrograms/solvency/pos"
describe("Proof of solvency", () => {
    it("All programs should compile", async () => {
        await assetListProgram.compile()
        await afterAssetVerification.compile()
        await batchUpdate.compile()
        await proofOfSolvencyProgram.compile()
    }, 1_000_000_000)
})