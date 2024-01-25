import "dotenv/config"
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from 'bs58';
import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Program } from "@coral-xyz/anchor";
import { NftMint } from "../target/types/nft_mint";
import ProgramIDL from "../target/idl/nft_mint.json";
import { CreateCandyMachineInput, Metaplex, NftWithToken, toBigNumber } from "@metaplex-foundation/js";
import { create32BitsHash } from './hash';

export const createConnection = () => {
  if(process.env.RPC_URL) {
    const connection = new Connection(process.env.RPC_URL)
    return connection
  }
}

/**
 * 
 * @param wallet 
 * @returns provider
 */
export function createProvider(wallet: NodeWallet) : anchor.AnchorProvider {
  const connection = createConnection() as Connection
  // let [wallet, _] = getWallet();
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return provider
}

export async function getWallet(privateKey: string) : Promise<[NodeWallet , Keypair]> {
  const decodedKey= bs58.decode(privateKey as string);
  const keypair = Keypair.fromSecretKey(decodedKey);
  const nodeWallet = new NodeWallet(keypair)
  return [nodeWallet, keypair];
}


/**
 * 
 * @param provider 
 * @returns program
 */
export function createProgram(
    provider: anchor.AnchorProvider,
  ) : anchor.Program<NftMint> {
    const idl = JSON.parse(JSON.stringify(ProgramIDL))
    const programId = ProgramIDL.metadata.address;
    const program = new Program(
      idl,
      programId,
      provider
    ) as Program<NftMint>
    return program
  }


  export const getProgramAdminPda = async (program_id: PublicKey) : Promise<PublicKey> => {
    const data = (await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("program_admin_pda"),
      ],
      program_id
    ))
    return data[0]
  }

  /**
   * 
   * @param mx 
   * @param adminKeypair 
   * @returns collection
   */
  export const createCollection = async (mx: Metaplex, adminKeypair: Keypair) =>{
    const { nft: collectNft } = await mx.nfts().create(
      {
        name: process.env.NAME,
        symbol: process.env.SYMBOL,
        uri: 'https://assets.theseeds.io/metadata/Seqn/collection.json',
        sellerFeeBasisPoints: 500,
        isCollection: true,
        updateAuthority: adminKeypair,
      },
      {
        payer: adminKeypair,
        commitment: 'finalized',
      },
    );
    console.log(
      'collectionUpdateAuthority address:',
      collectNft.updateAuthorityAddress.toBase58(),
    );
    console.log(`collection address:${collectNft.address.toBase58()}`);

    return collectNft;
  }

  /**
 * 创建candy machine
 * @param collectionNft
 */
export const createCandyMachine = async (mx: Metaplex, adminKeypair: Keypair, collectionNft: NftWithToken, guardAddress: PublicKey) => {
  const input = await getCandyMachineData(adminKeypair, collectionNft.address, guardAddress);
  const { candyMachine } = await mx.candyMachines().create(input, {
    payer: adminKeypair,
    commitment: 'finalized',
  });
  console.log(`candyMachine: ${candyMachine.address.toBase58()}`);
  return {
    candyMachine: candyMachine,
    collection: collectionNft,
    collectionAddress: collectionNft.address.toBase58(),
    candyMachineId: candyMachine.address.toBase58(),
  };
}

export const getCandyMachineData = async (adminKeypair: Keypair, collectionAddress: PublicKey, guardAddress: PublicKey): Promise<CreateCandyMachineInput> => {
  return {
    symbol: process.env.SYMBOL,
    itemsAvailable: toBigNumber(20000000000),
    authority: adminKeypair,
    sellerFeeBasisPoints: 0,
    maxEditionSupply: toBigNumber(0),
    isMutable: true,
    itemSettings: {
      type: 'hidden',
      hash: create32BitsHash(process.env.SYMBOL),
      name: 'Seqn #$ID+1$',
      uri: 'https://assets.theseeds.io/metadata/Seqn/$ID+1$.json',
    },
    collection: {
      address: collectionAddress,
      updateAuthority: adminKeypair,
    },
    groups: [
      {
        // only mint by seed platform
        label: process.env.GROUP,
        guards: {
          addressGate: {
            address: new PublicKey(
              guardAddress.toString(), 
            ),
          },
        },
      },
    ],
  };
}