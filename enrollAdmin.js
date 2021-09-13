/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const {Gateway, Wallets, X509WalletMixin} = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { config } = require('process');

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

function connectCA() {
    // Create a new CA client for interacting with the CA.
    const caInfo = ccp.certificateAuthorities['ca.org1.uem.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, {
        trustedRoots: caTLSCACerts,
        verify: false
    }, caInfo.caName);
    return ca;

}

async function configureFileSystemWallet(){
    const walletPath = '/tmp/hfnode/wallet';
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    return wallet;
}

async function enrollAdmin() {
    try {
        const ca = connectCA();
        const wallet = await configureFileSystemWallet();

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.get('adminCA');
        if (adminExists) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            // return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({enrollmentID: 'adminCA', enrollmentSecret: 'adminpw'});
        const identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment
                    .key
                    .toBytes()
            },
            mspId: 'org1MSP',
            type: 'X.509'
        };
        await wallet.put('adminCA', identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Error": ${error}`);
        process.exit(1);
    }
}

async function registerUser(userId, userSecret) {
    try {
        // Check to see if we've already enrolled the user
        const ca = connectCA();
        const wallet = await configureFileSystemWallet();

        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            console.log(`An identity for the user adminCA already exists in the wallet`);
            return;
        }

        // Must use an admin to register a new user
        const adminIdentity = await wallet.get('adminCA');
        if (!adminIdentity) {
            console.log('An identity for the admin user does not exist in the wallet');
            console.log('Enroll the admin user before retrying');
            return;
        }

        // build a user object for authenticating with the CA Create a new CA client for
        // interacting with the CA. build a user object for authenticating with the CA
        const provider = wallet
            .getProviderRegistry()
            .getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'adminCA');

        // Register the user, enroll the user, and import the new identity into the
        // wallet. if affiliation is specified by client, the affiliation value must be
        // configured in CA
        const secret = await ca.register({
            affiliation: 'org1',
            enrollmentID: userId,
            role: 'client',
            enrollmentSecret: userSecret,
            maxEnrollments: -1
        }, adminUser);
        console.log(secret)
       
    } catch (error) {
        console.error(`Failed to register user : ${error}`);
    }
}

async function enrollUser(userId, secret){
    try {
        const ca = connectCA();
        const wallet = await configureFileSystemWallet();
        const enrollment = await ca.enroll({enrollmentID: userId, enrollmentSecret: secret});
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment
                    .key
                    .toBytes()
            },
            mspId: 'org1MSP',
            type: 'X.509'
        };
        await wallet.put(userId, x509Identity);
        console.log(`Successfully registered and enrolled user ${userId} and imported it into the wallet`);
    } catch(err){
        console.log(err)
    }
    

}
async function main() {
    await enrollAdmin();
    await registerUser('user10', 'thisisthepassword');
    await enrollUser('user10', 'thisisthepassword');

}
main();