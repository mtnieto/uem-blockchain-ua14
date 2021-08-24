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
    await gateway.connect(ccp, {
        wallet: wallet,
        identity: "adminCA",
        discovery: {
            enabled: true,
            asLocalhost: true,
        }
    });
   network = await gateway.getNetwork('channel1');
}
async function disconnectNetwork(){
    await gateway.disconnect();

}
async function createCar(id, make, model, color, owner){
    try{
        const contract = network.getContract('fabcar');

        let result = await contract.submitTransaction('createCar', id, make, model, color, owner);
    
        console.log('Transaction has been submitted with result', result.toString());
    } catch(err){
        throw err;
    }
   
}

async function queryCar(id){
    try{
        const contract = network.getContract('fabcar');
        result = await contract.evaluateTransaction('queryCar', id);
        console.log('Get from chaincode with result', result.toString());
    } catch(err){
        throw err;    
    }
}

async function main() {
    try {
    console.log("Connecting network");
    await connectNetwork();
    console.log("Creating car");
    await createCar('CAR37', 'Mazda', "MAzda3", "white", "Maritere")
    console.log("Querying car");
    await queryCar('CAR37');
    console.log("Everything went ok...disconnecting")
    await disconnectNetwork()





    } catch (err) {

        console.error(`Failed to submit transaction: ${err}`);
        process.exit(1);
    }
}
main();