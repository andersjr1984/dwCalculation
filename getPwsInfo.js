const states = [
    "AL",  "AK",  "AS",  "AZ",  "AR",  "CA",  "CO",  "CT",
    "DE",  "DC",  "FM",  "FL",  "GA",  "GU",  "HI",  "ID",
    "IL",  "IN",  "IA",  "KS",  "KY",  "LA",  "ME",  "MH",
    "MD",  "MA",  "MI",  "MN",  "MS",  "MO",  "MT",  "NE",
    "NV",  "NH",  "NJ",  "NM",  "NY",  "NC",  "ND",  "MP",
    "OH",  "OK",  "OR",  "PW",  "PA",  "PR",  "RI",  "SC",
    "SD",  "TN",  "TX",  "UT",  "VT",  "VI",  "VA",  "WA",
    "WV",  "WI",  "WY"
];

let failedStates = [];

const ObjectsToCsv = require('objects-to-csv');

const getAllStateInfo = async () => {    
    console.log(states.length)
    await states.forEach((state)=>{createStateFile(state)})
}

const createStateFile = async (state) => {
    //call build state array
    //first argument is the state to look at
    //second argument is the number of rows to iterate through on each jump
    const stateArray = await buildStateArray(state, 100)
    const csv = new ObjectsToCsv(stateArray);
    await csv.toDisk(`./stateCSVFiles/${state}.csv`)
    console.log(`${state} array created.`)
    console.log(`Current failed states: ${failedStates.join()}`)
}

const buildStateArray = async (state, rows) => {
    //start with empty array
    let stateArray = [];
    //for loop that will stop after 10 iterations
    //in production, can assume that 10 iterations is more than enough
    //if going through 10,000 rows at a time, 10 iterations will be 100,000 facilities
    //there are only 150,000 facilities in the US
    for (i=0; i<1000; i++) {
        //get the information from server
        const newArr = await getEpaData(state, i*rows, i*rows+rows, 1);
        //can break for loop if we start getting null values
        //this will also happen if there is an error with the database
        //can review log data to see if there were any errors
        if (newArr===null) {break};
        //update state array by concat new array
        stateArray = stateArray.concat(newArr);
        if (stateArray.length<rows) {
            console.log(`End of ${state}'s DB.`)
            break
        };
    }
    return stateArray;
}

const getEpaData = async (state, startRow, endRow, tries) => {
    //check to make sure data exists
    try {
        //1. set up the request URL
        const requestURL = `http://iaspub.epa.gov/enviro/efservice/WATER_SYSTEM/PWS_ACTIVITY_CODE/=/A/PWSID/BEGINNING/${state}/ROWS/${startRow}:${endRow}/JSON`;
        //2. load request-promise to fullfill request
        const requestPromise = require('request-promise');
        //3. call database
        const pwsDataJSON = await requestPromise({uri: requestURL});
        //4a. test to see if the return is valid
        if (pwsDataJSON!=='[]'){
            //4. parse the data
            const pwsData = JSON.parse(pwsDataJSON);
            //5. let user know what data has been collected
            return convertData(pwsData);
        } else {
            console.log(`End of ${state} data.`)
            return null;
        }
    } catch (error) {
        //make 100 attempts to get data
        if(tries<=1000){
            return getEpaData(state, startRow, endRow, tries+1);
        } else {
            console.log(`Attempt on ${state}'s data from rows ${startRow} to ${endRow} ended in failure.`)
            failedStates.push(state)
            return null
        }
    }
}

const convertData = (sites) => {
    if(sites.length===0){return null}
    //map through epaData valuse to get an array with only relevant information
    const siteData = sites.map((indSite)=>{
        return ({PWSID: indSite.PWSID, PWS_NAME: indSite.PWS_NAME, PWS_TYPE_CODE: indSite.PWS_TYPE_CODE, 
            ADDRESS_LINE1: indSite.ADDRESS_LINE1, ADDRESS_LINE2: indSite.ADDRESS_LINE2, ZIP_CODE: 
            indSite.ZIP_CODE, CITY_NAME: indSite.CITY_NAME, EPA_REGION: indSite.EPA_REGION, PRIMACY_AGENCY_CODE: indSite.PRIMACY_AGENCY_CODE, 
            POPULATION_SERVED_COUNT: indSite.POPULATION_SERVED_COUNT, ORG_NAME: indSite.ORG_NAME, STATE_CODE: indSite.STATE_CODE, 
            COUNTIES_SERVED: indSite.COUNTIES_SERVED})
    })
    return siteData;
}

getAllStateInfo();