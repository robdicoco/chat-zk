// const {zkVerifySession, Library, CurveType, ZkVerifyEvents} = require("zkverifyjs");
const {zkVerifySession, ZkVerifyEvents} = require("zkverifyjs");

// const fs = require("fs");
// const proof = require("./data/proof.json");
// const public = require("./data/public.json");
// const key = require("./data/main.groth16.vkey.json");

const fs = require("fs");
const proof = require("../hasher/proof.json");

require('dotenv').config();
const seedPhrase = process.env.SEED_PHRASE;
if (!seedPhrase) {
    throw new Error("SEED_PHRASE is not set in the .env file");
}
async function main() {
    const session = await zkVerifySession.start().Volta().withAccount(seedPhrase)

    // const {events, regResult} = await session.registerVerificationKey().groth16({library: Library.snarkjs, curve: CurveType.bn128}).execute(key);

    // events.on(ZkVerifyEvents.Finalized, (eventData) => {
    //     console.log('Registration finalized:', eventData);
    //     fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    //     return eventData.statementHash
    // });

    // {
    //     "vkey": "0x828c736b33ab492251a8b275468a29ce06e98fc833c0c7f0bc7f6272b300c05b"
    //   }

    session.subscribe([
        {event: ZkVerifyEvents.NewAggregationReceipt, callback: async(eventData) => {
            console.log('New aggregation receipt:', eventData);
            let statementpath = await session.getAggregateStatementPath(eventData.blockHash, parseInt(eventData.data.domainId), parseInt(eventData.data.aggregationId), statement);
            console.log('Statement path:', statementpath);
            const statementproof = {
                ...statementpath,
                domainId: parseInt(eventData.data.domainId),
                aggregationId: parseInt(eventData.data.aggregationId),
            };
            fs.writeFile("aggregation.json", JSON.stringify(statementproof));
        }, options:{domainId:0}}
    ])

    const {events} = await session.verify().risc0()
    .execute({proofData:{
        proof: proof.proof,
        vk: proof.image_id,
        publicSignals: proof.pub_inputs,
        version: "V2_0" // Mention the R0 version used while proving
    }, domainId: 0})

    events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
        console.log("Included in block", eventData);
        statement = eventData.statement
    })

    // {
    //     "root": "0xef4752160e8d7ccbc254a87f71256990f2fcd8173e15a592f7ccc7e130aa5ab0",
    //     "proof": [
    //       "0x40fbf21f1990ef8d1425d12ec550176fe848a7c63f0c59f7a48101e51c9aceee",
    //       "0x0be311c3643fb3fcd2b59bf4cfd02bdef943caf78f92d94a080659468c38fef9",
    //       "0x2117831ac2000ccdbb51f5deef96d215961ca42920a9196259e8b6e91b9fef53"
    //     ],
    //     "numberOfLeaves": 8,
    //     "leafIndex": 0,
    //     "leaf": "0xc5a8389b231522aad8360d940eb3ce275f0446bba1a9bd188b31d1c7dd37f136",
    //     "domainId": 0,
    //     "aggregationId": 137
    //   }
}

main().catch(console.error);