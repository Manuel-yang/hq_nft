import { PublicKey } from "@solana/web3.js"
import * as anchor from '@coral-xyz/anchor'
import { CANDY_MACHINE_PROGRAM_ID, COLLECTION_ID, TOKEN_METADATA_PROGRAM_ID } from "./CONSTANTS"

export const getCandyMachineAuthorityPda = async (
  candyMachine: PublicKey
 ) => {
  const data = (await anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("candy_machine"),
      new PublicKey(candyMachine).toBuffer(),
    ],
    CANDY_MACHINE_PROGRAM_ID
  ))
  return data
}

export const getMetadataPDA = async (
  mintKey: PublicKey,
) => {
  const data = (await anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintKey.toBuffer(),

    ],
    TOKEN_METADATA_PROGRAM_ID
  ));
    return data;
}

export const getMasterEditionPDA = async (
  mintKey: PublicKey,
) => {
  const data = (await anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintKey.toBuffer(),
      Buffer.from("edition")
    ],
    TOKEN_METADATA_PROGRAM_ID
  ))
  return data
}

export const getAssociatedAddress = async (
  mint: PublicKey,
  owner: PublicKey
) => {
  const tokenAddress = await anchor.utils.token.associatedAddress({
    mint: mint,
    owner: owner
  })
  return tokenAddress
}

export const getCollectionDelegateRecordPda = async (candyMachineAuthorityPda: PublicKey) : Promise<PublicKey> => {
  const data = (await anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      COLLECTION_ID.toBuffer(),
      Buffer.from("collection_authority"),
      candyMachineAuthorityPda.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  ))
  return data[0]
}
