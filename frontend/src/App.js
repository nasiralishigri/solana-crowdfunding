import './App.css';
import { useEffect , useState} from "react";
import idl from './idl.json';
import {Connection, PublicKey, clusterApiUrl, SystemProgram} from '@solana/web3.js';
import {Program, AnchorProvider, web3, utils, BN} from '@project-serum/anchor';
// import {Button} from "react-dom"
import {Buffer} from 'buffer';
const programID =  new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
window.Buffer = Buffer;
const opts = {
  preflightCommitment:"processed",
}

const App = () => {
  const [walletAddress , setWalletAddress] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
   const getProvider = ()=>{
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment);
    return provider;
   }

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet Found!")
          const response = await solana.connect();
          console.log("Public Key of Wallet is :", response.publicKey.toString())
          setWalletAddress(response.publicKey.toString())
        }
      } else {
        alert("Solana Object not found! Get fantom Wallet");
      }

    } catch (e) {
      // console.error(e)
      console.log("errr",e)
    }
  }
  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      if (solana.isPhantom) {
        console.log("Phantom wallet Found!")
        const response = await solana.connect();
        console.log("Public Key of Wallet is :", response.publicKey.toString())
        setWalletAddress(response.publicKey.toString())
      }
    } else {
      alert("Solana Object not found! Get fantom Wallet");
    }
   }
   // Donate Sol for Campaign Crowdfunding
   const donate = async (publicKey)=>{
    try{
     const provider = getProvider();
     const program = new Program(idl, programID, provider);
     
     await program.rpc.donate(new BN(0.2* web3.LAMPORTS_PER_SOL), {
      accounts:{
        campaign: publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }
     })
     console.log("Donate Some amount to:", publicKey.toString())
     getCompaigns();
    }catch(error){
console.log("error ", error)
    }

   }
   // Withdraw Fund by Campain Creator
   const withdraw = async(publicKey)=>{
    try{

      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.withdraw(new BN(0.2* web3.LAMPORTS_PER_SOL),{
        accounts:{
          campaign: publicKey ,
          user: provider.wallet.publicKey,
        }
      })
      console.log("Withdraw Fund successfully:", publicKey.toString())
    }catch(error){
      console.log("Error :", error);
    }
   }
// Get Comapaign All existing
const getCompaigns =  async()=>{
  try{

     const connection = new Connection(network,opts.preflightCommitment);
     const provider = getProvider();
     const program = new Program(idl,programID,provider);
     Promise.all((await connection.getProgramAccounts(programID)).map(async campaign=>({
      ...(await program.account.campaign.fetch(campaign.pubkey)),
      pubkey:campaign.pubkey
     }))).then(campaigns=>{
      console.log("Campaigns:", campaigns)
      setCampaigns(campaigns)});

  }catch(error){
    console.log('Error:', error)
  }
}
   // Create New Compains for fund raising
   const createCampaign = async()=>{
    try{
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const [campaign] = await PublicKey.findProgramAddress(
      [
        utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
   let trx = await program.rpc.create("Campain Name-1","Its first campain goes to fund collection", {
      accounts:{
        campaign,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }
    });
    console.log("Program Id is created:", campaign.toString(), trx);
    }catch(error){
      console.log("error :", error)
    }
   }
  const renderNotConnectedContainer = () => (
       <button onClick={connectWallet}> Connect to Wallet</button>
  )
  const renderConnectedContainer = () => (
    <>
    <button onClick={createCampaign}> Create Campain</button>
    <button onClick={getCompaigns}> Get All Campain</button>

    <br/>
    {campaigns.map(campaign=>(<>
    <p>Campain ID: {campaign.pubkey.toString()}</p>
    <p>Balance Is: {campaign.amountDonated/ web3.LAMPORTS_PER_SOL}</p>
    <p>{campaign.name}</p>
    <p>{campaign.description}</p>
    
    <button onClick={()=> { 
      donate(campaign.pubkey._bn)
       }}> Click To Danate</button>

<button onClick={()=> { 
      withdraw(campaign.pubkey._bn)
       }}> Withdraw Campain Fund</button>
    <br/> <br/>

    </>))}
    
    </>
)
  useEffect(() => {
    const onLoad = async () => {
      // await checkIfWalletIsConnected();
    }
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  
  return(
    <>
  <div className="App">
    {!walletAddress &&renderNotConnectedContainer()}
    {walletAddress && renderConnectedContainer()}
    </div>
  </>
  )

}

export default App;
