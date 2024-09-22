use external::{mpc_contract, SignRequest};
use hex::decode;
use near_sdk::borsh::{self};
use near_sdk::env::sha256;
use near_sdk::serde_json::{from_str, Value};
use near_sdk::{env, log, near, require, AccountId, Gas, NearToken, Promise};
use std::str::Chars;

const MPC_CONTRACT_ACCOUNT_ID: &str = "v1.signer-dev.testnet";
const ONE_YOCTO: NearToken = NearToken::from_yoctonear(1);
const GAS: Gas = Gas::from_tgas(250);
// hard coding for testing purposes
const PAYLOAD2: [u8; 32] = [
    23, 84, 147, 43, 138, 117, 175, 50, 231, 245, 120, 181, 99, 247, 47, 160, 158, 11, 250, 208,
    116, 241, 228, 64, 23, 163, 17, 175, 218, 138, 202, 6,
];

mod external;
mod owner;
mod parse;

// automatically init the contract
impl Default for Contract {
    fn default() -> Self {
        Self {}
    }
}

#[near(contract_state)]
pub struct Contract {}

#[near]
impl Contract {
    pub fn test_call(&mut self, pk: String, msg: String, sig: String) -> (Promise, Promise) {
        owner::require_btc_owner(&pk, &msg, &sig);
        let data_value: Value = from_str(&msg).unwrap();
        let transactions = parse::get_transactions(&data_value["transactions"]);
        let mut promise = Promise::new(env::current_account_id());
        let PATH2: &str = "0x8fc57d8312dd3034814b3d87336817d40ac513d1";
        let Path3: String = String::from(PATH2);

        let request2: SignRequest = SignRequest {
            payload: PAYLOAD2,
            path: Path3,
            key_version: 0,
        };

        let trial_promise = mpc_contract::ext(MPC_CONTRACT_ACCOUNT_ID.parse().unwrap())
            .with_static_gas(GAS)
            .with_attached_deposit(ONE_YOCTO)
            .sign(request2);

        for transaction in transactions {
            let encoded =
                borsh::to_vec(&transaction).expect("failed to serialize NEAR transaction");

            let payload = sha256(&encoded);

            // mpc sign call args
            let request = SignRequest {
                payload: parse::vec_to_fixed(payload),
                path: pk.clone(),
                key_version: 0,
            };
            // batch promises with .and
            let next_promise = mpc_contract::ext(MPC_CONTRACT_ACCOUNT_ID.parse().unwrap())
                .with_static_gas(GAS)
                .with_attached_deposit(ONE_YOCTO)
                .sign(request);

            promise = promise.then(next_promise);
        }

        (promise, trial_promise)
    }
}
