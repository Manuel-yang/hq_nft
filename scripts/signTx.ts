import { getWallet, createProvider, createConnection} from "../migrations/utils";
import "dotenv/config"
import { Transaction } from "@solana/web3.js";
import { PublicKey } from "@metaplex-foundation/js";
import { generateTx } from "./generateTx";

async function signTx(tx: Transaction): Promise<string> {
  // user wallet
  const [userNodeWallet, _] = await getWallet(process.env.PRIVATE_KEY_TEST)
  try {
    // use user wallet to sign
    tx = await userNodeWallet.signTransaction(tx)

    // serialize the tx
    const rawTx = tx.serialize()
    const connection = await createConnection()
    const res = await connection.sendRawTransaction(rawTx)
    return res
  } catch(e: any) {
    console.log(e)
  }
}

async function main() {
  let tx = await generateTx(new PublicKey("6qQDCEjgvmiDatKVr8Lm2vmNW3cwHdTZ4ytWx6GWXSaR"))
  let res= await signTx(tx)
  console.log(`tx signature ===> ${res}`)
}
main()