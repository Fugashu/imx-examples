// Metadata Refresh
import { Signer } from '@ethersproject/abstract-signer';
import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import axios from 'axios';
import BN from 'bn.js';
import * as encUtils from 'enc-utils';

type SignatureOptions = {
  r: BN;
  s: BN;
  recoveryParam: number | null | undefined;
};

// used to sign message with L1 keys. Used for registration
function serializeEthSignature(sig: SignatureOptions): string {
  // This is because golang appends a recovery param
  return encUtils.addHexPrefix(
    encUtils.padLeft(sig.r.toString(16), 64) +
      encUtils.padLeft(sig.s.toString(16), 64) +
      encUtils.padLeft(sig.recoveryParam?.toString(16) || '', 2),
  );
}

function importRecoveryParam(v: string): number | undefined {
  return v.trim()
    ? new BN(v, 16).cmp(new BN(27)) !== -1
      ? new BN(v, 16).sub(new BN(27)).toNumber()
      : new BN(v, 16).toNumber()
    : undefined;
}

// used chained with serializeEthSignature. serializeEthSignature(deserializeSignature(...))
function deserializeSignature(sig: string, size = 64): SignatureOptions {
  // eslint-disable-next-line no-param-reassign
  sig = encUtils.removeHexPrefix(sig);
  return {
    r: new BN(sig.substring(0, size), 'hex'),
    s: new BN(sig.substring(size, size * 2), 'hex'),
    recoveryParam: importRecoveryParam(sig.substring(size * 2, size * 2 + 2)),
  };
}

export async function signRaw(
  payload: string,
  signer: Signer,
): Promise<string> {
  const signature = deserializeSignature(await signer.signMessage(payload));
  return serializeEthSignature(signature);
}

export async function signMessage(
  message: string,
  signer: Signer,
): Promise<{ message: string; ethAddress: string; ethSignature: string }> {
  const ethAddress = await signer.getAddress();
  const ethSignature = await signRaw(message, signer);
  return {
    message,
    ethAddress,
    ethSignature,
  };
}

// variables to fill in
const privateKey =
  '58efc89f16ea1c9ff515a6d293e74a6ad96a3b521bbdc3ead3dd1edecdf5da53';
const ethNetwork = 'goerli';
const alchemyApiKey = 'XP9kHDvbUO2XGhrP5HKlsk2brsEuxtJY';
const collectionAddressToRefresh = '0x80AF9cD6fd22d473B1D0E4C385CF86CD4476cdc0';
const tokenIdsToRefresh = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
];
const alchemyProvider = new AlchemyProvider(ethNetwork, alchemyApiKey);

const l1Wallet = new Wallet(privateKey);
const l1Signer = l1Wallet.connect(alchemyProvider);

async function metaDataRefresh() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const eth_signature = await signRaw(timestamp, l1Signer);

  console.log(
    await axios.post(
      'https://api.sandbox.x.immutable.com/v1/metadata-refreshes',
      JSON.stringify({
        collection_address: collectionAddressToRefresh, // required
        token_ids: tokenIdsToRefresh, // required
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'x-imx-eth-address': l1Wallet.address,
          'x-imx-eth-signature': eth_signature,
          'x-imx-eth-timestamp': timestamp,
        },
      },
    ),
  );
}
async function main() {
  await metaDataRefresh();
}

main()
  .then(() => console.log('metaDataRefresh call complete'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

// npx ts-node path/to/file/refresh-metadata.ts
