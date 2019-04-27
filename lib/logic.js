/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * Write your transction processor functions here
 */

/**
 * Sample transaction
 * @param {org.net.glassdoor.SampleTransaction} sampleTransaction
 * @transaction
 */
async function sampleTransaction(tx) {
    // Save the old value of the asset.
    const oldValue = tx.asset.value;

    // Update the asset with the new value.
    tx.asset.value = tx.newValue;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('org.net.glassdoor.SampleAsset');
    // Update the asset in the asset registry.
    await assetRegistry.update(tx.asset);

    // Emit an event for the modified asset.
    let event = getFactory().newEvent('org.net.glassdoor', 'SampleEvent');
    event.asset = tx.asset;
    event.oldValue = oldValue;
    event.newValue = tx.newValue;
    emit(event);
}

// @TODO: How to check transaction intitiator is current or past employee... For now, skip it and only checking through ACL whether caller is 
// current employee

/**
 * Post Review Transaction
 * @param {org.net.glassdoor.reviews.PostReview} reviewData
 * @transaction
 */
async function postReview(reviewData) {
    // This tx is supposed to make a new asset of 'Review' type
    // and then add it to the registry.
    
    // It should ensure that the review is posted by a current
    // employee or a former employee for that company. (By ACL OR tx processor)

    // Only a 'Contributor' type participant can post reviews.

    // Once the review has been posted, the 'PostedReview' event 
    // should be emitted.

    let factory = getFactory();

    let reviewerId = reviewData.reviewer.getIdentifier();
    let companyId = reviewData.reviewedCo.getIdentifier();


    let reviewId = getReviewId(reviewerId,companyId,reviewData.postedOn);

    var review = factory.newResource('org.net.glassdoor.reviews','Review',reviewId)
        
        
    review.reviewMsg = reviewData.reviewMsg
    review.reviewer = reviewData.reviewer;
    review.reviewedCo = reviewData.reviewedCo;
        
    let reviewRegistry = await getAssetRegistry('org.net.glassdoor.reviews.Review');
    await reviewRegistry.add(review);

    console.log('Added review!');
}

/**
 * Post Review Transaction
 * @param {org.net.glassdoor.salary.PostSalary} salaryData
 * @transaction
 */
async function postSalary(salaryData) {
    // This tx is supposed to make a new asset of type 'Salary'

    // This tx should ensure that only a current or a past employee 
    // can post the salary. (By ACL OR tx processor)

    let factory = getFactory();

    let salary = factory.newResource('org.net.glassdoor.salary','Salary',salaryData.salaryId);
    
    salary.designation = salaryData.designation;
    salary.postedOn = new Date();
    salary.salary = salaryData.salary;
    salary.company = salaryData.company;
    salary.poster = factory.newRelationship('org.net.glassdoor.participants','Contributor',getCurrentParticipant().getFullyQualifiedIdentifier());

    let salaryRegistry = await getAssetRegistry('org.net.glassdoor.salary.Salary');
    await salaryRegistry.add(salary);

    console.log('Salary added!')
}

// Question:
// Can I have, in a single asset, a single reference pointing to a set of assets?
// e.g: reference in Company asset points to all salaries for that company

/**
 * Post Review Transaction
 * @param {org.net.glassdoor.jobs.PostJob} jobData
 * @transaction
 */
async function postJob(jobData) {
    // This tx is supposed to make a new asset of 'Job' type
    // and then add it to the registry.
    
    // It should ensure that the job is posted by a company.
    // (By ACL OR tx processor)

    // A 'Company' can only post jobs for itself.

    // Once the job has been posted, the 'PostedJob' event 
    // should be emitted.

    let factory = getFactory();

    let job = factory.newResource('org.net.glassdoor.jobs','Job',jobData.jobId);

    job.designation = jobData.designation;
    job.description = jobData.description;
    job.salary = jobData.salary;
    job.company = jobData.company;

    let jobRegistry = await getAssetRegistry('org.net.glassdoor.jobs.Job');
    await jobRegistry.add(job);

    console.log('Job added!')
}

/**
 * Post Review Transaction
 * @param {org.net.glassdoor.participants.UpdateEmployment} employmentData
 * @transaction
 */
async function updateEmployment(employmentData) {
    // Update the employee data
    // Only self can do this
    // or current company
    // there should be an 'unemployment' company
    // made at deployment of network

    var initiator = getCurrentParticipant();
    var initiatorId = initiator.getIdentifier();
    //var office = {};
    if(initiator.getType() != 'NetworkAdmin'){
        var office = initiator.employment.companyId;
    }
    

    //if initiator is neither Employee nor Employee's office nor NetworkAdmin, reject tx
    if(initiatorId != employmentData.contributorId && initiatorId != office && initiator.getType() != 'NetworkAdmin'){
        return;
    }

    let contrRegistry = await getParticipantRegistry('org.net.glassdoor.participants.Contributor');
    //console.log(await contrRegistry.getAll());
    let employee = await contrRegistry.get(employmentData.contributorId);

    employee.designation = employmentData.newDesignation;
    employee.employment = employmentData.newCompany;

    await contrRegistry.update(employee);

    console.log('Employment updated!');
}


/**
 * Post Review Transaction
 * @param {org.net.glassdoor.participants.UpdateInfo} companyData
 * @transaction
 */
async function updateInfo(companyData) {
    // Update the compnay info
    // Only self can do this
    var initiator = getCurrentParticipant();
    var initiatorId = initiator.getIdentifier();
    
    if(initiatorId != companyData.companyId && initiator.getType() != 'NetworkAdmin'){
        return;
    }

    let compRegistry = await getParticipantRegistry('org.net.glassdoor.participants.Company');
    let company = await compRegistry.get(companyData.companyId);

    company.companyDescription = companyData.newDescription;

    await compRegistry.update(company);

    console.log('Company updated!')

}

/** Utilitiy functions */

function getReviewId(reviewerId, companyId, postedOn){
    postedOn = new Date(postedOn);

    let reviewId = `${reviewerId}_${companyId}_${postedOn.getDate()}-${(postedOn.getMonth()+1).toString().padStart(2,0)}-${postedOn.getYear()+1900}`;
    return reviewId;
}