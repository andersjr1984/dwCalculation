//accept some list of public water systems

//a list comprised of each pws in the database
//only pull active pws
//the key is the public water system (pws) identifier
//each list will be for a different area
//example facility can be found here: https://echo.epa.gov/detailed-facility-report?fid=CA1400020&sys=SDWIS
//most information is in header table
const pwsListCommunity = {CA1400020: {currentComplianceStatus: 'Violation Identified', qtrsWithNc: 12, formalEa:1, populationServed: 23}}

//have another list of all other pws that are not identified as community water systems
//this would be "non-transient non-community" and "transient non-community" water systems
//avoid using any unregulated water system
//example facility can be found here: https://echo.epa.gov/detailed-facility-report?fid=CA1900061&sys=SDWIS
const pwsListOther = {CA1900061: {currentComplianceStatus: 'Violation Identified', qtrsWithNc: 12, formalEa:0, populationServed: 50}}

const score = areaScore();

console.log(score)

//create a function to calculate an area score
function areaScore () {
    const csKeys = Object.keys(pwsListCommunity);
    const otherKeys = Object.keys(pwsListOther);
    let communityScore=0;
    let otherScore=0;
    //check to see if there are community systems in area
    if (csKeys.length !== 0){
        //calculate a score for all the community water systems
        communityScore = scoreCalc(csKeys, pwsListCommunity)
    }
    if (otherKeys.length !== 0){
        //calculate a score for all other water systems
        otherScore = scoreCalc(otherKeys, pwsListOther)
    }

    if (communityScore!==0 && otherScore!==0){
        //60% weight given to the community score
        //40% weight given to all other facilities
        return (.6*communityScore+.4*otherScore)
    } else {
        //return a score in the rare circumstances that there is only one type of facility in area
        return (max(communityScore, otherScore))
    }
}

//create a function to go through list and combine each facility's score
function scoreCalc (keys, list){
    let score = 0;
    
    //create a variable to keep track of the total population served by each facility
    let population = 0;

    //call individual facility score function and divide answer by keys.length
    //this will average a total score
    keys.forEach(key=>{
        score += individualFacilityScore(list[key]);
        population += list[key].populationServed;
    })

    //return total score divided by population in area
    return score/population;
}

//function that will calculate score of individual facility
function individualFacilityScore(facility){
    //each individual facility can have a maximum score of 1 multiplied by thier population
    let facilityScore = 0;
    
    //may have to use another identifier than 'Violation Identified' depending on if it differs by state
    //current compliance status has a weight of 30%
    if (facility.currentComplianceStatus !== 'Violation Identified'){
        //facility does not have current violation
        facilityScore += .3;
    }
    
    //calculate a historical score with a weight of 40%
    facilityScore += .4*((facility.qtrsWithNc-12)/12)

    //final 30% weight will be based on the amount of major EAs the facility has had
    //if there are more than 12 EAs, facility recieves nothing for this score
    if (facility.majorEA<12){
        facilityScore += .3*((facility.majorEA-12)/12)
    }
        
    //return the facility score multiplied by the population served
    return facilityScore*facility.populationServed;
}
