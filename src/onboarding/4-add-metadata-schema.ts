import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { ImLogger, WinstonLogger } from '@imtbl/imlogging';
import {
  AddMetadataSchemaToCollectionParams,
  ImmutableXClient,
  MetadataTypes,
} from '@imtbl/imx-sdk';
import { requireEnvironmentVariable } from 'libs/utils';

import env from '../config/client';
import { loggerConfig } from '../config/logging';

const provider = new AlchemyProvider(env.ethNetwork, env.alchemyApiKey);
const log: ImLogger = new WinstonLogger(loggerConfig);

const component = '[IMX-ADD-COLLECTION-METADATA-SCHEMA]';

(async (): Promise<void> => {
  const privateKey = requireEnvironmentVariable('OWNER_ACCOUNT_PRIVATE_KEY');
  const collectionContractAddress = requireEnvironmentVariable(
    'COLLECTION_CONTRACT_ADDRESS',
  );

  const wallet = new Wallet(privateKey);
  const signer = wallet.connect(provider);

  const user = await ImmutableXClient.build({
    ...env.client,
    signer,
    enableDebug: true,
  });

  log.info(
    component,
    'Adding metadata schema to collection',
    collectionContractAddress,
  );

  /**
   * Edit your values here
   */
  const params: AddMetadataSchemaToCollectionParams = {
    metadata: [
      {
        name: 'name',
        type: MetadataTypes.Text,
      },
      {
        name: 'description',
        type: MetadataTypes.Text,
      },
      {
        name: 'image_url',
        type: MetadataTypes.Text,
      },
      {
        name: 'set',
        type: MetadataTypes.Enum,
        filterable: true,
      },
      {
        name: 'rarity',
        type: MetadataTypes.Enum,
        filterable: true,
      },
      {
        name: 'type',
        type: MetadataTypes.Enum,
        filterable: true,
      },
      {
        name: 'damage',
        type: MetadataTypes.Discrete,
        filterable: true,
      },
      {
        name: 'attackSpeed',
        type: MetadataTypes.Discrete,
        filterable: true,
      },
      {
        name: 'weight',
        type: MetadataTypes.Discrete,
        filterable: true,
      },
      {
        name: 'defense',
        type: MetadataTypes.Discrete,
        filterable: true,
      },
      {
        name: 'effect',
        type: MetadataTypes.Enum,
        filterable: true,
      },
    ],
  };

  const collection = await user.addMetadataSchemaToCollection(
    collectionContractAddress,
    params,
  );

  log.info(
    component,
    'Added metadata schema to collection',
    collectionContractAddress,
  );
  console.log(JSON.stringify(collection, null, 2));
})().catch(e => {
  log.error(component, e);
  process.exit(1);
});
