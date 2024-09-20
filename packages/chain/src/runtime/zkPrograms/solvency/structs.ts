import { Field, Struct, UInt64 } from "o1js";

export class CexAssetInfo extends Struct({
    TotalEquity: UInt64,
    TotalDebt: UInt64,
    BasePrice: UInt64,
}) { }

export class UserAssetInfo extends Struct({
    Equity: UInt64,
    Debt: UInt64,
}){}


export class BatchCreateUser extends Struct({
    beforeAccountTreeRoot: Field,
    afterAccountTreeRoot: Field,
    beforeAccountCexAssetCommitment: Field,
    afterAccountCexAssetCommitment: Field,
}){}

