import * as anchor from "@coral-xyz/anchor";
import { getWallet, createProvider, createProgram, getProgramAdminPda } from "../migrations/utils";
import { CANDY_GUARD_PROGRAM_ID, CANDY_MACHINE_PROGRAM_ID, CANDY_MACHINE, COLLECTION_ID, TOKEN_METADATA_PROGRAM_ID, SPL_TOKEN_PROGRAM_ID, SPL_ATA_PROGRAM_ID, ADMIN_ADDRESS } from "./CONSTANTS";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { findCandyGuardPda, mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { publicKey } from "@metaplex-foundation/umi";
import { getAssociatedAddress, getCandyMachineAuthorityPda, getCollectionDelegateRecordPda, getMasterEditionPDA, getMetadataPDA } from "./utils";
import "dotenv/config"
import { Transaction } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { assert } from "chai";

describe("nft_mint", () => {

  it("should fail without admin signs", async () => {
    const [nodeWallet, adminWallet] = await getWallet(process.env.PRIVATE_KEY)
    const [testNodeWallet, testWallet] = await getWallet(process.env.PRIVATE_KEY_TEST)
    const provider = await createProvider(testNodeWallet)
    const program = await createProgram(provider)
    const adminPda = await getProgramAdminPda(program.programId)
    const umi = createUmi(process.env.RPC_URL).use(mplCandyMachine());

    const candyGuardAddress = findCandyGuardPda(umi, { base: publicKey(CANDY_MACHINE) });
    const candyMachineAuthorityPda = await getCandyMachineAuthorityPda(CANDY_MACHINE)
    const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const nftMetadata = await getMetadataPDA(mintKeypair.publicKey)
    const nftMasterEdition = await getMasterEditionPDA(mintKeypair.publicKey)
    const tokenAddress = await getAssociatedAddress(mintKeypair.publicKey, testWallet.publicKey)
    const collectionDelegateRecord = await getCollectionDelegateRecordPda(candyMachineAuthorityPda[0])
    const collectionMetadata = await getMetadataPDA(COLLECTION_ID)
    const collectionMasterEdition = await getMasterEditionPDA(COLLECTION_ID)
    const instruction = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ // 设置计算单元
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
          payer: testWallet.publicKey,
          minterAuthority: mintKeypair.publicKey,
          nftMint: mintKeypair.publicKey,
          nftMintAuthority: testWallet.publicKey,
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
      
      const blockhash = await provider.connection.getLatestBlockhash()
      let tx = new Transaction()
      tx.feePayer = testWallet.publicKey
      tx.recentBlockhash = blockhash.blockhash
      tx.lastValidBlockHeight = blockhash.lastValidBlockHeight
      tx.add(mintIns)
      tx.add(instruction)

      // use test user wallet to sign
      tx = await testNodeWallet.signTransaction(tx)
      const mintPk = await bs58.encode(mintKeypair.secretKey) 
      const [mintPkNodeWallet, _] = await getWallet(mintPk)
      // use mint keypair to sign
      tx = await mintPkNodeWallet.signTransaction(tx)

      await provider.sendAndConfirm(tx)

      // assert.equal(res.value.err, null)
      }catch(e: any) {
        const res = extractBeforeNewline(e.message)
        assert.equal(res, "Signature verification failed.")
      }
  });

  it("should successfully after admin signs", async () => {
    const [nodeWallet, adminWallet] = await getWallet(process.env.PRIVATE_KEY)
    const [testNodeWallet, testWallet] = await getWallet(process.env.PRIVATE_KEY_TEST)
    const provider = await createProvider(testNodeWallet)
    const program = await createProgram(provider)
    const adminPda = await getProgramAdminPda(program.programId)
    const umi = createUmi("https://api.devnet.solana.com").use(mplCandyMachine());

    const candyGuardAddress = findCandyGuardPda(umi, { base: publicKey(CANDY_MACHINE) });
    const candyMachineAuthorityPda = await getCandyMachineAuthorityPda(CANDY_MACHINE)
    const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const nftMetadata = await getMetadataPDA(mintKeypair.publicKey)
    const nftMasterEdition = await getMasterEditionPDA(mintKeypair.publicKey)
    const tokenAddress = await getAssociatedAddress(mintKeypair.publicKey, testWallet.publicKey)
    const collectionDelegateRecord = await getCollectionDelegateRecordPda(candyMachineAuthorityPda[0])
    const collectionMetadata = await getMetadataPDA(COLLECTION_ID)
    const collectionMasterEdition = await getMasterEditionPDA(COLLECTION_ID)
    const instruction = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ // 设置计算单元
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
          payer: testWallet.publicKey,
          minterAuthority: mintKeypair.publicKey,
          nftMint: mintKeypair.publicKey,
          nftMintAuthority: testWallet.publicKey,
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
      
      const blockhash = await provider.connection.getLatestBlockhash()
      let tx = new Transaction()
      tx.add(instruction)
      tx.feePayer = testWallet.publicKey
      tx.recentBlockhash = blockhash.blockhash
      tx.lastValidBlockHeight = blockhash.lastValidBlockHeight
      tx.add(mintIns)

      // use test user wallet to sign
      tx = await testNodeWallet.signTransaction(tx)
      
      // use mint keypair to sign
      const mintPk = await bs58.encode(mintKeypair.secretKey) 
      const [mintPkNodeWallet, _] = await getWallet(mintPk)
      tx = await mintPkNodeWallet.signTransaction(tx)

      // use admin wallet to sign
      tx = await nodeWallet.signTransaction(tx)

      // use test user provider to send tx
      await provider.sendAndConfirm(tx)

      // assert.equal(res.value.err, null)
      }catch(e: any) {
      console.log(e)
      }
  });
});

function extractBeforeNewline(str) {
  var index = str.indexOf("\n");
  if (index !== -1) {
      return str.substring(0, index);
  } else {
      return str;
  }
}
