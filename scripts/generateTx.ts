import * as anchor from "@coral-xyz/anchor";
import { getWallet, createProvider, createProgram, getProgramAdminPda, createConnection } from "../migrations/utils";
import { CANDY_GUARD_PROGRAM_ID, CANDY_MACHINE_PROGRAM_ID, CANDY_MACHINE, COLLECTION_ID, TOKEN_METADATA_PROGRAM_ID, SPL_TOKEN_PROGRAM_ID, SPL_ATA_PROGRAM_ID, ADMIN_ADDRESS } from "./CONSTANTS";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { findCandyGuardPda, mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { publicKey } from "@metaplex-foundation/umi";
import { getAssociatedAddress, getCandyMachineAuthorityPda, getCollectionDelegateRecordPda, getMasterEditionPDA, getMetadataPDA } from "./utils";
import "dotenv/config"
import { Transaction } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { PublicKey } from "@metaplex-foundation/js";

export async function generateTx(userAddress: PublicKey): Promise<Transaction> {
  const [nodeWallet, adminWallet] = await getWallet(process.env.PRIVATE_KEY)
  // const [testNodeWallet, _] = await getWallet(process.env.PRIVATE_KEY_TEST)
  const provider = await createProvider(nodeWallet)
  const program = await createProgram(provider)
  const adminPda = await getProgramAdminPda(program.programId)
  const umi = createUmi(process.env.RPC_URL).use(mplCandyMachine());

  const candyGuardAddress = findCandyGuardPda(umi, { base: publicKey(CANDY_MACHINE) });
  const candyMachineAuthorityPda = await getCandyMachineAuthorityPda(CANDY_MACHINE)
  const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
  const nftMetadata = await getMetadataPDA(mintKeypair.publicKey)
  const nftMasterEdition = await getMasterEditionPDA(mintKeypair.publicKey)
  const tokenAddress = await getAssociatedAddress(mintKeypair.publicKey, userAddress)
  const collectionDelegateRecord = await getCollectionDelegateRecordPda(candyMachineAuthorityPda[0])
  const collectionMetadata = await getMetadataPDA(COLLECTION_ID)
  const collectionMasterEdition = await getMasterEditionPDA(COLLECTION_ID)
  const instruction = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
    units: 500_000,
    });

  try {
    const mintIns = await program.methods.mint()
    .accounts({
        programAdminPda: adminPda,
        admin: ADMIN_ADDRESS,
        candyGuardProgram: CANDY_GUARD_PROGRAM_ID,
        candyGuard: candyGuardAddress[0],
        candyMachineProgram: CANDY_MACHINE_PROGRAM_ID,
        candyMachine: CANDY_MACHINE,
        candyMachineAuthorityPda: candyMachineAuthorityPda[0],
        payer: userAddress,
        minterAuthority: mintKeypair.publicKey,
        nftMint: mintKeypair.publicKey,
        nftMintAuthority: userAddress,
        nftMetadata: nftMetadata[0],
        nftMasterEdition: nftMasterEdition[0],
        tokenAccount: tokenAddress,
        collectionDelegateRecord: collectionDelegateRecord,
        collectionMint: COLLECTION_ID,
        collectionMetadata: collectionMetadata[0],
        collectionMasterEdition: collectionMasterEdition[0],
        collectionUpdateAuthority: adminWallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
        associatedTokenProgram: SPL_ATA_PROGRAM_ID,
        recentSlothashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
        sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
    })
    .instruction()
    
    let tx = new Transaction()
    tx.add(instruction)
    tx.add(mintIns)
    tx.feePayer = userAddress

    // set block hash for tx
    const connection = await createConnection()
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  
    // use mint keypair to sign
    const mintPk = await bs58.encode(mintKeypair.secretKey) 
    const [mintPkNodeWallet, mintPkWallet] = await getWallet(mintPk)
    tx = await mintPkNodeWallet.signTransaction(tx)

    // use admin wallet to sign
    tx = await nodeWallet.signTransaction(tx)

    return tx
    }catch(e: any) {
      console.log(e)
    }
}

// async function main() {
//   await generateTx(new PublicKey("6qQDCEjgvmiDatKVr8Lm2vmNW3cwHdTZ4ytWx6GWXSaR"))
// }

// main()