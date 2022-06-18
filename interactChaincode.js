//const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
let network, gateway; 

async function connectNetwork(){
    const walletPath = '/tmp/hfnode/wallet';
    const wallet = await Wallets.newFileSystemWallet(walletPath);
   gateway = new Gateway();
    await wallet.get("adminCA");
 //   console.log(wallet)
    await gateway.connect(ccp, {
        wallet: wallet,
        identity: "adminCA",
        discovery: {
            enabled: true,
            asLocalhost: true,
        }
    });
    //console.log(gateway)
 network = await gateway.getNetwork('channel1');
  // console.log(network)
}
async function disconnectNetwork(){
    await gateway.disconnect();

}

async function queryCar(id){
    try{
        const contract = network.getContract('fabcar')
        const result = await contract.evaluateTransaction('queryCar', id)
        console.log(JSON.parse(result.toString()))
    } catch(err){
        console.log(err);
    }
}

async function queryAllCars(){
    try{
        const contract = network.getContract('fabcar')
        const result = await contract.evaluateTransaction('queryAllCars')
       console.log(result.toString())
    } catch(err){
        console.log(err);
    }
}

async function changeCarOwner(){
    try{
        const contract = network.getContract('fabcar')

        const result = await contract.submitTransaction('changeCarOwner', 'CAR10', 'SORPRESA')
       console.log(result.toString())
    } catch(err){
        console.log(err);
    }
}




async function createCar(id, make, model, color, owner){
    try{
        const contract = network.getContract('fabcar')
        console.log(contract)
        const result = await contract.submitTransaction('createCar', id, make, model, color, owner)
        console.log("Hola" , result.toString())
    } catch(err){
        console.log(err);
    }
}

async function main() {
    try {
    console.log("Connecting network");
    await connectNetwork();
    //await queryCar('CAR12');
        await changeCarOwner();
    //await createCar('CAR11', "Mazda", "Mx5", "Black", "YoMisma")
     await queryCar('CAR10')
    // console.log("Everything went ok...disconnecting")
    // await disconnectNetwork() 





    } catch (err) {

        console.error(`Failed to submit transaction: ${err}`);
        process.exit(1);
    }
}
main();