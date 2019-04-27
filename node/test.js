'use strict'

const ut = require('./ut-harness.js')
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
//const bnc = new BusinessNetworkConnection({type:'composer-wallet-filesystem'});

let cardName = 'admin@glassdoor';

//let bndef={};
let factory={};

var testCo = 'Comp-0000007';
var testCo2 = 'Comp-0000070'
var testContr = 'Contr-0000007'

// Node runtime for testing
async function main(){
    //await test();
    ut.initialize('../.',async (anc,bnc,bndef)=>{
        await test(bnc,bndef);
    });
}

async function test(bnc,bndef){
return bnc.connect(cardName).then((res)=>{
    
    //bndef = bnc.getBusinessNetwork();
    factory = bndef.getFactory();

    return bnc.getRegistry('org.net.glassdoor.participants.Company');

}).then((registry)=>{

    let company = factory.newResource('org.net.glassdoor.participants','Company',testCo);
    company.companyName = 'Elric bros'
    company.companyDescription = 'FMAB'

    let company2 = factory.newResource('org.net.glassdoor.participants','Company',testCo2);
    company2.companyName = 'Uchiha bros'
    company2.companyDescription = 'Konoha'

    return registry.addAll([company,company2])

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

    let postSalaryTx = factory.newTransaction('org.net.glassdoor.reviews','PostReview');
    postSalaryTx.setPropertyValue('postedOn',new Date()); // Should be given by tx initiator (e.g. get size of registry elements and +1 to it)
    //postSalaryTx.setPropertyValue('salary',10000);
    //postSalaryTx.setPropertyValue('description','Zugzug');
    postSalaryTx.setPropertyValue('reviewMsg','Something something');
    postSalaryTx.setPropertyValue('reviewer',factory.newRelationship('org.net.glassdoor.participants','Contributor',testContr));
    postSalaryTx.setPropertyValue('reviewedCo',factory.newRelationship('org.net.glassdoor.participants','Company',testCo));

    return bnc.submitTransaction(postSalaryTx);

}).then(()=>{

    console.log('Submitted UpdateEmployment Transaction!')
    return bnc.getRegistry('org.net.glassdoor.participants.Company');

}).then((registry)=>{

    return registry.getAll();

}).then((res)=>{

    console.log(res);

}).catch(console.log);

}

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