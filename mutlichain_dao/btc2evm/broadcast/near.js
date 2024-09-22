import * as nearAPI from 'near-api-js';
const { Near, Account, KeyPair, keyStores } = nearAPI;
import { base_encode, base_decode } from 'near-api-js/lib/utils/serialize';

const {
    REACT_APP_accountId: accountId,
    REACT_APP_secretKey: secretKey,
    REACT_APP_contractId: contractId,
    REACT_APP_mpcContractId: mpcContractId,
} = process.env;

const networkId = 'testnet';
const keyPair = KeyPair.fromString(secretKey);
const keyStore = new keyStores.InMemoryKeyStore();
keyStore.setKey(networkId, accountId, keyPair);
const config = {
    networkId,
    keyStore,
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://testnet.mynearwallet.com/',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://testnet.nearblocks.io',
};
const near = new Near(config);
const { provider } = near.connection;

export const addKey = async ({ accountId, secretKey, publicKey }) => {
    const keyPair = KeyPair.fromString(secretKey);
    keyStore.setKey(networkId, accountId, keyPair);
    const account = new Account(near.connection, accountId);
    const res = await account.addKey(publicKey);
    console.log('addKey res', res);
};

export const getBlockHash = async () => {
    const block = await near.connection.provider.block({ finality: 'final' });
    return block.header.hash;
};

export const getKeys = async ({ accountId }) => {
    const account = new Account(near.connection, accountId);
    return await account.getAccessKeys();
};

export const mpcPublicKey = async () => {
    const account = new Account(near.connection, accountId);
    const res = await account.viewFunction({
        contractId: mpcContractId,
        methodName: 'public_key',
        args: {},
    });
    return res;
};

export const view = async ({ pk, msg, sig }) => {
    const account = new Account(near.connection, accountId);
    const res = await account.viewFunction({
        contractId: 'triial-3.testnet',
        methodName: 'test_view',
        args: { pk, msg, sig },
    });
    console.log(res);
};

export const call = async ({ pk, msg, sig }) => {
    const account = new Account(near.connection, accountId);
    const res = await account.functionCall({
        contractId,
        methodName: 'test_call',
        args: { pk, msg, sig },
        gas: BigInt('300000000000000'),
    });
    return res;
};

export const deleteAccount = async ({ accountId: newAccountId, secretKey }) => {
    const keyPair = KeyPair.fromString(secretKey);
    keyStore.setKey(networkId, newAccountId, keyPair);
    const account = new Account(near.connection, newAccountId);
    await account.deleteAccount(accountId);
};

export const createAccountWithSecpKey = async ({
    accountId: newAccountId,
    secretKey,
    keyToAdd,
}) => {
    const account = new Account(near.connection, accountId);
    await account.sendMoney(newAccountId, BigInt('5000000000000000000000000'));
    const keyPair = KeyPair.fromString(secretKey);
    keyStore.setKey(networkId, newAccountId, keyPair);
    const newAccount = new Account(near.connection, newAccountId);
    await newAccount.addKey(keyToAdd);
};

export const broadcast = async (signedSerializedTx) => {
    const res = await provider.sendJsonRpc('broadcast_tx_commit', [
        Buffer.from(signedSerializedTx).toString('base64'),
    ]);
    return res;
};

// convert low level NEAR TX to JSON that contract can deserialized to near-primitives

const js2coreFields = {
    signerId: 'signer_id',
    publicKey: 'signer_public_key',
    receiverId: 'receiver_id',
    nonce: 'nonce',
    blockHash: 'block_hash',
    actions: 'actions',
};
const js2coreActions = {
    addKey: 'AddKey',
    deleteKey: 'DeleteKey',
    transfer: 'Transfer',
};
export const js2core = (oldTx) => {
    const tx = {};
    Object.entries(js2coreFields).forEach(([k, v]) => {
        tx[v] = oldTx[k];
        if (v !== k) delete tx[k];
        // turn JS objects into strings
        if (v === 'signer_public_key' && typeof tx[v] !== 'string') {
            tx[v] = tx[v].toString();
        }
        if (v === 'block_hash') {
            tx[v] = base_encode(tx[v]);
        }
        if (v === 'nonce') {
            tx[v] = tx[v].toString();
        }
        if (v === 'actions') {
            tx[v] = [];
            for (const oldAction of oldTx[v]) {
                const [k2] = Object.entries(oldAction)[0];
                Object.entries(js2coreActions).forEach(([k, v]) => {
                    if (k !== k2) return;
                    switch (v) {
                        case 'AddKey':
                            tx.actions.push({
                                [v]: {
                                    public_key:
                                        oldAction[k].publicKey.toString(),
                                    access_key: {
                                        nonce: '0',
                                        permission: 'FullAccess',
                                    },
                                },
                            });
                            break;
                        case 'DeleteKey':
                            tx.actions.push({
                                [v]: {
                                    public_key:
                                        oldAction[k].publicKey.toString(),
                                },
                            });
                            break;
                        default:
                            tx.actions.push({
                                [v]: JSON.parse(JSON.stringify(oldAction[k])),
                            });
                    }
                });
            }
        }
    });
    return tx;
};

// transaction fix for JSON for contracts, to JS

const { PublicKey } = nearAPI.utils;
const { base_decode } = nearAPI.utils.serialize;

const core2jsFields = {
    signer_id: 'signerId',
    signer_public_key: 'publicKey',
    receiver_id: 'receiverId',
    nonce: 'nonce',
    block_hash: 'blockHash',
    actions: 'actions',
};
const core2jsActions = {
    AddKey: 'addKey',
    DeleteKey: 'deleteKey',
    Transfer: 'transfer',
};
export const core2js = (transaction) => {
    Object.entries(core2jsFields).forEach(([k, v]) => {
        transaction[v] = transaction[k];
        if (v !== k) delete transaction[k];
        // pre-serialize types from json
        if (v === 'publicKey' && typeof transaction[v] === 'string') {
            transaction[v] = PublicKey.fromString(transaction[v]);
        }
        if (v === 'blockHash') {
            transaction[v] = base_decode(transaction[v]);
        }

        if (v === 'actions') {
            for (const action of transaction[v]) {
                const [k2] = Object.entries(action)[0];
                Object.entries(core2jsActions).forEach(([k, v]) => {
                    if (k !== k2) return;
                    action[v] = action[k];
                    delete action[k];
                    if (v === 'addKey') {
                        action[v] = {
                            publicKey: PublicKey.fromString(
                                action[v].public_key,
                            ),
                            accessKey: {
                                nonce: 0,
                                permission: {
                                    fullAccess: {},
                                },
                            },
                        };
                    }
                    if (v === 'deleteKey') {
                        action[v] = {
                            publicKey: PublicKey.fromString(
                                action[v].public_key,
                            ),
                        };
                    }
                });
            }
        }
    });
    return transaction;
};
