use crate::*;
use omni_transaction::near::near_transaction::NearTransaction;
use omni_transaction::near::types::BlockHash;

pub fn get_chars(str: &str) -> Chars {
    let first = str[0..1].to_owned();
    let mut chars = str.chars();
    // client side json escapes double quotes
    if first == "\"" {
        chars.next();
        chars.next_back();
    }
    chars
}

pub fn get_string(value: &Value) -> String {
    let str: String = value.to_string();
    let chars = get_chars(&str);
    chars.as_str().to_string()
}

pub fn vec_to_fixed<T, const N: usize>(v: Vec<T>) -> [T; N] {
    v.try_into()
        .unwrap_or_else(|v: Vec<T>| panic!("Expected a Vec of length {} but it was {}", N, v.len()))
}

pub fn get_transactions(data: &Value) -> Vec<NearTransaction> {
    let mut transactions: Vec<NearTransaction> = vec![];
    let json_transactions: Vec<Value> = data.as_array().unwrap().to_vec();

    for jtx in json_transactions.iter() {
        let transaction = NearTransaction::from_json(&jtx.to_string()).unwrap();
        transactions.push(transaction);
    }

    transactions
}

#[test]
fn test_get_transactions() {
    let data = r#"
{
    "transactions": [
        {
            "signer_id": "86a315fdc1c4211787aa2fd78a50041ee581c7fff6cec2535ebec14af5c40381",
            "signer_public_key": "secp256k1:3uB7912GMVBytHZQcvCsExHxbTv7BrBrg9rL73DB4ZDJUT4Lz4BMxytkV8maHxchRjsH3qXEuKATwEmz1pU4QTAa",
            "nonce": 174012292000001,
            "receiver_id": "86a315fdc1c4211787aa2fd78a50041ee581c7fff6cec2535ebec14af5c40381",
            "block_hash": "2dh1xGb9zS5peb18QuzCYKgrptW1WjX5oS519dxb4L3a",
            "actions": [
                {
                    "Transfer": {
                        "deposit": "100000000000000000000000"
                    }
                },
                {
                    "AddKey": {
                        "public_key": "ed25519:6E8sCci9badyRkXb3JoRpBj5p8C6Tw41ELDZoiihKEtp",
                        "access_key": {
                            "nonce": "0",
                            "permission": "FullAccess"
                        }
                    }
                },
                {
                    "DeleteKey": {
                        "public_key": "ed25519:6E8sCci9badyRkXb3JoRpBj5p8C6Tw41ELDZoiihKEtp"
                    }
                }
            ]
        }
    ]
}
    "#;

    let data_value: Value = from_str(data).unwrap();
    let transactions = get_transactions(&data_value["transactions"]);

    for transaction in transactions {
        let encoded = borsh::to_vec(&transaction).expect("failed to serialize NEAR transaction");
        let tx_hash = sha256(&encoded);

        log!("encoded");
        log!("{:?}", encoded.clone());
        log!("tx_hash: {:?}", tx_hash);
    }
}

#[test]
fn test_parse() {
    let sig = r#"
    {"big_r":{"affine_point":"0282EF82B8EE5BA52EC356F7BBEE935B70A67D635F7F8D887FFDC70D2D943088FC"},"s":{"scalar":"6062C50A8A7806284A0C3886E53BA9F2DB23693912F3127ED902020923DD4A8E"},"recovery_id":1}
    "#;
    let sig_value: Value = from_str(&sig).unwrap();
    let big_r: String = parse::get_string(&sig_value["big_r"]["affine_point"]);
    log!("big_r: {:?}", big_r);
    let s: String = parse::get_string(&sig_value["s"]["scalar"]);
    log!("s: {:?}", s);
    let recovery_id: u8 = sig_value["recovery_id"].as_u64().unwrap() as u8;
    log!("recovery_id: {:?}", recovery_id);
}
