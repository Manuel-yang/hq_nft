import { createCandyMachine, createCollection, createProgram, createProvider, getProgramAdminPda, getWallet } from "./utils";
import * as anchor from "@coral-xyz/anchor";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import "dotenv/config"

async function main() {
  const [nodeWallet, keypair] = await getWallet(process.env.PRIVATE_KEY!)
  const provider = await createProvider(nodeWallet)
  const program = await createProgram(provider)

  console.log("start to init...")
  const adminPda = await getProgramAdminPda(program.programId)
  console.log(adminPda)
  // step 1 : init admin pda
  try {
    const initAdminPda = await program.methods.initProgramPda(keypair.publicKey)
      .accounts({
        payer: keypair.publicKey,
        programAdminPda: adminPda,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .rpc()
      console.log(`init admin pda successfully ===> ${initAdminPda}`)
  } catch(error: any) {
    console.error(error)
  }

  // step 2: init candy machine
  const mx = Metaplex.make(provider.connection).use(keypairIdentity(keypair));
  const collectionNft = await createCollection(mx, keypair);
  const { candyMachineId, collectionAddress } = await createCandyMachine(
    mx,
    keypair,
    collectionNft,
    adminPda
  );
  console.log(`CandyMachine:${candyMachineId}, Collection:${collectionAddress}`);
  console.log("=".repeat(60))
}

main()