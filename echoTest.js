
//2. load request-promise to fullfill request
const requestPromise = require('request-promise');
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');

const states = [
    '01',  '02',  '03',  '04',  '05',  '06',  '07',  '08',
    '09',  '10',
    "AL",  "AK",  "AS",  "AZ",  "AR",  "CA",  "CO",  "CT",
    "DE",  "DC",  "FM",  "FL",  "GA",  "GU",  "HI",  "ID",
    "IL",  "IN",  "IA",  "KS",  "KY",  "LA",  "ME",  "MH",
    "MD",  "MA",  "MI",  "MN",  "MS",  "MO",  "MT",  "NE",
    "NV",  "NH",  "NJ",  "NM",  "NY",  "NC",  "ND",  "MP",
    "OH",  "OK",  "OR",  "PW",  "PA",  "PR",  "RI",  "SC",
    "SD",  "TN",  "TX",  "UT",  "VT",  "VI",  "VA",  "WA",
    "WV",  "WI",  "WY"
];

var stateGlobal = '';

const retry = 2;

const getAllStateInfo = async (hotNum) => {
    setTimeout(()=>{
        createStateFile(states[hotNum]);
        hotNum++;
        if(hotNum<states.length){
            getAllStateInfo(hotNum);
        }
    }, 10000)
}

const createStateFile = async (state) => {
    stateGlobal = state;
    //call build state array
    //first argument is the state to look at
    //second argument is the number of rows to iterate through on each jump
    const stateArray = await getEpaData(state, 'A', 1)
    console.log(`${state}'s A-array is ${stateArray.length} sites.`);
    const csv = new ObjectsToCsv(stateArray);
    await csv.toDisk(`./stateCSVFiles/${state}.csv`)
    console.log(`${state} array created.`)
};

const getEpaData = async (state, active, tries) => {
    //check to make sure data exists
    try {
        //1. set up the request URL
        const requestURL = `https://ofmpub.epa.gov/echo/sdw_rest_services.get_systems?output=JSON&p_st=${state}&p_act=${active}`;
        //3. call database
        const queryDataJSON = await requestPromise({uri: requestURL});
        const queryData = JSON.parse(queryDataJSON);
        if (queryData.Results.QueryID){
            console.log(`${state}'s ${active} qid = ${queryData.Results.QueryID}`)
            //5. let user know what data has been collected
            return getFacilities(queryData.Results.QueryID, 1, 1, []);
        } else {
            console.log(`${state} has no results`)
            return []
        }
    } catch (error) {
        if (tries<retry){return setTimeout(getEpaData(state,active,tries+1),2000)
        } else {
            console.log(error)
            console.log(`Attempt on ${state}'s data ended in failure in retrieving qid for ${active} sites.`)
            return []
        }
    }
};

const getFacilities = async (qid, tries, page, returnArr) => {
    //check to make sure data exists
    try {
        //1. set up the request URL
        const requestURL = `https://ofmpub.epa.gov/echo/sdw_rest_services.get_qid?output=JSON&qid=${qid}&pageno=${page}`;
        //2. call database
        const pwsDataJSON = await requestPromise({uri: requestURL});
        //2a. save the JSON files
        saveJSON(pwsDataJSON, page);
        //3. PARSE THE JSON RESPONSE
        const pwsData = JSON.parse(pwsDataJSON);
        //4. get the specific rows from the facilities results return
        const facArr = convertData(pwsData.Results.WaterSystems);
        //5. Add the facility array to the return array
        const joinedArr = returnArr.concat(facArr);
        if (facArr.length===5000){
            //when there are 5000 results, there are more on next page
            return getFacilities(qid, 1, page+1, joinedArr);
        } else {
            //when there are less than 5000 results, there are no more results
            return joinedArr
        }
    } catch (error) {   ``
        if (tries<retry){return setTimeout(getFacilities(qid, tries+1, page, returnArr),2000)
        } else {
            console.log(error)
            console.log(`Attempt on ${qid}'s data ended in failure in retrieving qid for ${active} sites.`)
            return []
        }
    }
};

const saveJSON = (pwsDataJSON, page) => {
    fs.writeFileSync(`./stateJSON/${stateGlobal}page${page}`, pwsDataJSON, err=> {
        console.log(err)
        console.log(`${state} on page ${page}`);
    })
}

//need to return: PWSName, PWSId, StateCode, CountiesServed, EPARegion, PWSTypeCode, PopulationServedCount, DfrUrl

const convertData = (sites) => {
    if(sites.length===0){return []}
    //map through epaData valuse to get an array with only relevant information
    const siteData = sites.map((indSite)=>{
        return ({PWSName:indSite.PWSName, PWSId:indSite.PWSId, StateCode:indSite.StateCode, CountiesServed:indSite.CountiesServed, 
            ZipCode: indSite.ZipCodesServed,
            EPARegion:indSite.EPARegion, PWSTypeCode:indSite.PWSTypeCode, PopulationServedCount:indSite.PopulationServedCount, DfrUrl:indSite.DfrUrl})
    })
    return siteData;
};

getAllStateInfo(0);