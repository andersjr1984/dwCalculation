# dwCalculation
Drinking Water Quality Calculation Example

echoTest.js
This file returns a .csv file with every PWS in the United States, divided by State or EPA Region. 
  (more info here: https://echo.epa.gov/tools/web-services)
Required Dependencies: 
  object-to-csv (npm install --save object-to-csv) https://www.npmjs.com/package/objects-to-csv
  request (npm install --save request)
  request-promise (npm install --save request-promise) https://www.npmjs.com/package/request-promise

Steps the process takes:
-For each State/Region, call the EPA Database
  *Requires a 10 second interval between calls to not appear "Robotic"
-The EPA Database returns a QID (if there is an error, program trys again one time)
-Send the QID to the database, which returns a maximum of 5,000 active PWS facilities
  *If there are more than 5,000 facilities, checks the next page
  *If there are less than 5,000 facilities, that is the end of the list
-Evaluates each of the facilities to retrieve required data
-Returns an array of facility objects.
-joins arrays if there are multiple per state
-The array of facility objects is sent to object-to-csv to create a csv file.
-logs completion of the cretion of csv file.

wqCalc
-old calculation, will require refactoring

stateCSVFiles:
-all the CSV files created from running echoTest.js
