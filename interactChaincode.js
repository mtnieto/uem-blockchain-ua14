//const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


async function main() {
    try {

        const walletPath = '/tmp/hfnode/wallet';
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();

        await wallet.get("adminCA");
        await gateway.connect(ccp, {
            wallet: wallet,
            identity: "adminCA",
            discovery: {
                enabled: true,
                asLocalhost: true,
            }
        });
        const network = await gateway.getNetwork('channel1');
        console.log("****", network)
            // Get the contract from the netw ork.getContract('cc');
        const contract = network.getContract('fabcar');

        let result = await contract.submitTransaction('createCar', 'CAR36', 'Mazda', "MAzda3", "white", "Maritere");

        console.log('Transaction has been submitted with result', result.toString());

        result = await contract.evaluateTransaction('queryCar', "CAR36");
        console.log('Get from chaincode with result', result.toString());


        await gateway.disconnect();
    } catch (err) {

        console.error(`Failed to submit transaction: ${err}`);
        process.exit(1);
    }
}
main();