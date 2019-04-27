'use strict'

const ut = require('./ut-harness.js')
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const bnc = new BusinessNetworkConnection({type:'composer-wallet-filesystem'});

let cardName = 'admin@glassdoor';

let bndef={};
let factory={};

let testCo = 'Comp-2000000';
let testContr = 'Contr-2000000'

// Node runtime for testing
async function main(){
    ut.initialize('../.',async (anc,bnc,bndef)=>{
        await test(bnc,bndef);
    });
}

//async function test(bnc,bndef){
return bnc.connect(cardName).then((res)=>{
    
    bndef = bnc.getBusinessNetwork();
    factory = bndef.getFactory();

    return bnc.getRegistry('org.net.glassdoor.participants.Company');

}).then((registry)=>{

    let company = factory.newResource('org.net.glassdoor.participants','Company',testCo);
    company.companyName = 'Elric bros'
    company.companyDescription = 'FMAB'
    return registry.add(company)

}).then(()=>{

    return bnc.getRegistry('org.net.glassdoor.participants.Contributor');

}).then((registry)=>{

    let contributor = factory.newResource('org.net.glassdoor.participants','Contributor',testContr);
    contributor.contributorName = 'Alfred'
    contributor.designation = 'CEO'
    
    let employment = factory.newRelationship('org.net.glassdoor.participants','Company',testCo)

    contributor.employment = employment
    return registry.add(contributor);

}).then(()=>{

    console.log('Made test company and contributor!');

    let postSalaryTx = factory.newTransaction('org.net.glassdoor.jobs','PostJob');
    postSalaryTx.setPropertyValue('jobId','Job-0000002'); // Should be given by tx initiator (e.g. get size of registry elements and +1 to it)
    postSalaryTx.setPropertyValue('salary',10000);
    postSalaryTx.setPropertyValue('description','Zugzug');
    postSalaryTx.setPropertyValue('designation','Junior Developer');
    postSalaryTx.setPropertyValue('company',factory.newRelationship('org.net.glassdoor.participants','Company',testCo));

    return bnc.submitTransaction(postSalaryTx);

}).then(()=>{

    console.log('Submitted PostJob Transaction!')
    return bnc.getAssetRegistry('org.net.glassdoor.jobs.Job');

}).then((registry)=>{

    return registry.getAll();

}).then((res)=>{

    console.log(res);

}).catch(console.log);

//}

main();
/**
    return bnc.getAllTransactionRegistries(true);
}).then((registries)=>{
    console.log(registries);

    /*var nativeKey = bnc.getNativeAPI().createCompositeKey('Participant:org.net.glassdoor.participants.Contributor#testCo',[])
    var res = bnc.getNativeAPI().getHistoryforKey(nativeKey);
    console.log(res);
    console.log(x)
    //    console.log(records)
}).catch(console.log)

//query Select hitorian where */