import { wrap } from './state/state';
import * as nearAPI from 'near-api-js';


import { sha256, KeyPairSecp256k1 } from 'noble-hashes/lib/sha256';
let elliptic = require('elliptic');
let ec = new elliptic.ec('secp256k1');
import { base_encode, base_decode } from 'near-api-js/lib/utils/serialize';
import { Overlay } from './components/Overlay';
import { sleep } from './state/utils';
// import { deriveAddress } from './helper';

const { PublicKey } = nearAPI.utils;
import {
    broadcast,
    call,
    core2js,
    getKeys,
    getBlockHash,
    js2core,
    deleteAccount,
    createAccountWithSecpKey,
} from './near/near';

import { generateAddress } from './near/kdf';
import { FunctionCall } from 'near-api-js/lib/transaction';
// contract name : triial-3.testnet
const MPC_PUBLIC_KEY =
    'secp256k1:54hU5wcCmVUPFWLDALXMh1fFToZsVXrx9BbTbHzSfQq1Kd1rJZi52iPa4QQxo6s5TgjWqgpY8HamYuUDzG6fAaUq';

const sampleTX = {
    transactions: [
        {
            signer_id:
                '529aefef9eb3d04db87150d881801f01890facd2d854ecef48b6a8b4735ac533',
            signer_public_key:
                'secp256k1:2zekTfZFn5Faqs2xbNny6uRFscQHtvntLsG7v27GDDHtaNpm3dRLoxVb4CdnJ5hhGkjFBrEcUixexo9yeNjziwU4',
            nonce: 174805236000010,
            receiver_id:
                '7b6151b244deb60a545640d27b4b9d55a5389d20afcd9ad7636147e09437c832',
            block_hash: '4reLvkAWfqk5fsqio1KLudk46cqRz9erQdaHkWZKMJDZ',
            actions: [{
                Transfer: { deposit: '10000000000000000000' }
            }
            ]
        },
    ],
};
// if the FunctionCall error resolved then we can do it like this
const sampleTX2 = {
    transactions: [
        {
            signer_id:
                '529aefef9eb3d04db87150d881801f01890facd2d854ecef48b6a8b4735ac533',
            signer_public_key:
                'secp256k1:2zekTfZFn5Faqs2xbNny6uRFscQHtvntLsG7v27GDDHtaNpm3dRLoxVb4CdnJ5hhGkjFBrEcUixexo9yeNjziwU4',
            nonce: 174805236000010,
            receiver_id:
                '7b6151b244deb60a545640d27b4b9d55a5389d20afcd9ad7636147e09437c832',
            block_hash: '4reLvkAWfqk5fsqio1KLudk46cqRz9erQdaHkWZKMJDZ',
            actions: [{
                Transfer: { deposit: '10000000000000000000' },
                FunctionCall: {
                    contractId: 'v1.sign-dev.testnet',
                    methodName: 'sign',
                    args: {
                        payload: [
                            23, 84, 147, 43, 138, 117, 175, 50, 231, 245, 120, 181, 99, 247, 47, 160, 158, 11, 250, 208,
                            116, 241, 228, 64, 23, 163, 17, 175, 218, 138, 202, 6,
                        ],
                        path: '0x8fc57d8312dd3034814b3d87336817d40ac513d1',// derived eth
                        keyversion: 0,
                    },
                    gas: '300000000000000',
                    deposit: '0'

                }
            }
            ]
        },
    ],
};
