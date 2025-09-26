// Import Statements
const express = require("express");
const mysql = require("mysql");

// Reusable Functions

// convert "NULL" or empty strings to actual nulls
function normalizeNulls(arr) {
    return arr.map(val => (val === "NULL" || val === "")? null : val);
}

// Prints result messages to console
function printResults(finalSQL) {
    db.query(finalSQL, (err, results) => {
        if (err) return console.log(err);

        console.log("Query successful");

        // fetch result message
        db.query("SELECT @result_message AS resultMessage", (err2, resultRows) => {
            if (err2) {
                console.error("Error fetching result message:", err2);
            } else {
                const message = resultRows[0]?.resultMessage;
                console.log("Result message from running procedure:", message);
            }
        });
    });
}

// Similar to dbQueryWrapper, but does not send table
// It just sends a html response with the prcedure result message
function sendProcedureResult(SQL, res) {
    db.query(SQL, (err, results) => {
        if (err) {
            res.send("Issue processing request.");
            return;
        }

        console.log("Query successful");

        // fetch result message
        db.query("SELECT @result_message AS resultMessage", (err2, resultRows) => {
            if (err2) {
                res.send("Error fetching result message");
            } else {
                const message = resultRows[0]?.resultMessage;
                res.send("Result: " + message);
            }
        });
    });
}


// INPUT: result of db.query()
// OUTPUT: a string containing the HTML of a table
// NOTE: Does not check if the result of db.query is empty
function createHTMLTable(result) {
    const columns = Object.keys(result[0]); // Result is a json array of json objects, result 0 is the first json object

    // Table Headers
    resultHTML = "<table> <tr>";
    for (let i = 0; i < columns.length; i++) {
        resultHTML += "<th>" + columns[i] + "</th>";
    }
    resultHTML += "</tr>";
    
    // Rest of the table
    for (let row = 0; row < result.length; row++) {
        resultHTML += "<tr>";
        for (let col = 0; col < columns.length; col++) {
            resultHTML += "<td>" + result[row][columns[col]] + "</td>";
        }
        resultHTML += "</tr>";
    }
    resultHTML += "</table>";
    return resultHTML;
}

// INPUT: SQL to be sent to the database
// OUTPUT: Does not return anything, but sends html response
function dbQueryWrapper(SQL, res) {
    db.query(SQL, (err, result) => {
        if (err) {
            console.log(err);
            res.send("Issue processing request.")
        } else {
            console.log("Query Successful");
            // I don't know why the result from db.query has an extra layer of nothing
            // but result[0] fixes it
            if (result[0].length === 0) {
                res.send("Your query returned no results.");
                return;
            }
            const tableHTML = createHTMLTable(result[0]);
            res.send(tableHTML);
        }
    });
}

// Express App Setup
const app = express();

// Remote DB Connection Credentials
const db = mysql.createConnection({
    host: "stc353.encs.concordia.ca",
    user: "stc353_1",
    password: "mrjaggzb",
    database: "stc353_1"
});

// Actual DB connection
db.connect((err) => {
    if (err) {
        console.log("Error connecting to DB");
    } else {
        console.log("Connected!");
    }
});

app.use(express.urlencoded({extended: false}));

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/form.html");
});


app.post("/sendSQL", (req, res) => {

    //console.log(req);
    const sql = req.body.userSQL;

    let query = db.query(sql, (err, result) => {
        if (err) {
            res.send("Error with query");
        } else {
            // Check if result is empty. If not, create table from result
            if (result.length === 0) {
                res.send("Your query returned no results")
            } else {
                resultHTML = createHTMLTable(result);
                res.send(resultHTML);
            }
            
        }
    });
    
});

// Q1 ADD/DELETE/EDIT/DISPLAY LOCATION
app.post("/sendForm/0/:formNumber", (req, res) => {
    const formNumber = Number(req.params.formNumber);
    const args = Object.values(req.body);

    switch (formNumber) {
            // CREATE LOCATION (depends on ADDRESS and PHONENUMBER)
            case 0: {
                // normalize args for null values
                const locationArguments = normalizeNulls(args);

                const insertLocationSQL = "CALL InsertLocation(" +
                "?," + // <{IN p_street_address VARCHAR(255)}>
                "?," + // <{IN p_city VARCHAR(100)}>
                "?," + // <{IN p_province VARCHAR(50)}>
                "?," + // <{IN p_postal_code CHAR(6)}>
                "?," + // <{IN p_location_name VARCHAR(100)}>
                "?," + // <{IN p_location_type ENUM('Head', 'Branch')}>
                "?," + // <{IN p_size INT}>
                "?," + // <{IN p_capacity INT}>
                "?," + // <{IN p_web_address VARCHAR(255)}>
                "?," + // <{IN p_phone_number VARCHAR(20)}>
                "?," + // <{IN p_phone_extension VARCHAR(10)}>
                "?," + // <{IN p_phone_type VARCHAR(20)}>
                "@location_ID," + // <{OUT p_location_id INT}>
                "@result_message)" // <{OUT p_result_message VARCHAR(255)}>

                // print to console results from DB query
                const finalSQL = mysql.format(insertLocationSQL, locationArguments);
                console.log("insertLocationSQL:");
                console.log(finalSQL);
                sendProcedureResult(finalSQL, res);
                break;
            }

			// EDIT LOCATION
            case 1: {
                // normalize args for null values
                const locationArguments = normalizeNulls(args);

                const editLocationSQL = "CALL UpdateLocationComplete(" +
                "?," + // <{IN p_location_id INT}>
                "?," + // <{IN p_street_address VARCHAR(255)}>
                "?," + // <{IN p_city VARCHAR(100)}>
                "?," + // <{IN p_province VARCHAR(50)}>
                "?," + // <{IN p_postal_code CHAR(6)}>
                "?," + // <{IN p_location_name VARCHAR(100)}>
                "?," + // <{IN p_location_type ENUM('Head', 'Branch')}>
                "?," + // <{IN p_size INT}>
                "?," + // <{IN p_capacity INT}>
                "?," + // <{IN p_web_address VARCHAR(255)}>
                "?," + // <{IN p_is_active BOOLEAN}>
                "?," + // <{IN p_phone_number VARCHAR(20)}>
                "?," + // <{IN p_phone_extension VARCHAR(10)}>
                "?," + // <{IN p_phone_type VARCHAR(20)}>
                "@result_message)";  // <{OUT p_result_message VARCHAR(255)}>

                // print to console results from DB query
                const finalSQL = mysql.format(editLocationSQL, locationArguments);
                console.log("editLocationSQL:");
                console.log(finalSQL);
                sendProcedureResult(finalSQL, res);
                break;
            }

            // DELETE LOCATION
            case 2: {
                const locationArguments = args;

                const deleteLocationSQL = "CALL DeleteLocation(" +
                "?," +              // <{IN p_location_id INT}>
                "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>)

                // print to console results from DB query
                const finalSQL = mysql.format(deleteLocationSQL, locationArguments);
                console.log("deleteLocationSQL:");
                console.log(finalSQL);
                sendProcedureResult(finalSQL, res);
                break;
            }

            // DISPLAY ALL LOCATIONS
            case 3: {
                const SQL = "CALL GetAllLocationDetails()";
                dbQueryWrapper(SQL, res);
                break;
            }
    }
});

// Q2 ADD/DELETE/EDIT/DISPLAY PERSONNEL
app.post("/sendForm/1/:formNumber", (req, res) => {
    const formNumber = Number(req.params.formNumber);
    const args = Object.values(req.body);

    switch (formNumber) {
        // CREATE PERSONNEL (depends on PERSON, ADDRESS and PHONENUMBER)
        case 0: {
            // normalize args for null values
            const personnelArguments = normalizeNulls(args);

            const insertPersonnelSQL = "CALL InsertPersonnel(" +
            "?," + // <{IN p_first_name VARCHAR(100)}>
            "?," + // <{IN p_last_name VARCHAR(100)}>
            "?," + // <{IN p_middle_initial VARCHAR(10)}>
            "?," + // <{IN p_date_of_birth DATE}>
            "?," + // <{IN p_ssn CHAR(9)}>
            "?," + // <{IN p_medicare_number VARCHAR(15)}>
            "?," + // <{IN p_email VARCHAR(100)}>
            "?," + // <{IN p_street_address VARCHAR(255)}>
            "?," + // <{IN p_city VARCHAR(100)}>
            "?," + // <{IN p_province VARCHAR(50)}>
            "?," + // <{IN p_postal_code CHAR(6)}>
            "?," + // <{IN p_phone_number VARCHAR(20)}>
            "?," + // <{IN p_phone_extension VARCHAR(10)}>
            "?," + // <{IN p_phone_type VARCHAR(20)}>
            "?," + // <{IN p_location_id INT}>
            "?," + // <{IN p_role ENUM('General Manager','Deputy Manager','Treasurer','Secretary','Administrator','Captain','Coach','Assistant Coach','Other')}>
            "?," + // <{IN p_mandate_type ENUM('Volunteer','Salaried')}>
            "?," + // <{IN p_start_date DATE}>
            "?," + // <{IN p_end_date DATE}>
            "@person_id," +
            "@personnel_assignment_id," +
            "@result_message)";

            // print to console results from DB query
            const finalSQL = mysql.format(insertPersonnelSQL, personnelArguments);
            console.log("insertPersonnelSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }

        case 1: {
            // normalize args for null values
            const personnelArguments = normalizeNulls(args);

            const editPersonnelSQL = "CALL UpdatePersonnelComplete(" +
            "?," + // <{IN p_assignment_id INT}>
            "?," + // <IN p_first_name VARCHAR(50)}>
            "?," + // <{IN p_last_name VARCHAR(50)}>
            "?," + // <{IN p_middle_initial CHAR(1)}>
            "?," + // <{IN p_date_of_birth DATE}>
            "?," + // <{IN p_ssn CHAR(9)}>
            "?," + // <{IN p_medicare VARCHAR(20)}>
            "?," + // <{IN p_email VARCHAR(100)}>
            "?," + // <{IN p_street_address VARCHAR(255)}>
            "?," + // <{IN p_city VARCHAR(100)}>
            "?," + // <{IN p_province VARCHAR(50)}>
            "?," + // <{IN p_postal_code CHAR(6)}>
            "?," + // <{IN p_phone_number VARCHAR(20)}>
            "?," + // <{IN p_phone_extension VARCHAR(10)}>
            "?," + // <{IN p_phone_type VARCHAR(20)}>
            "?," + // <{IN p_location_id INT}>
            "?," + // <{IN p_role ENUM('General Manager','Deputy Manager','Treasurer','Secretary','Administrator','Captain','Coach','Assistant Coach','Other')}>
            "?," + // <{IN p_mandate_type ENUM('Volunteer','Salaried')}>
            "?," + // <{IN p_start_date DATE}>
            "?," + // <{IN p_end_date DATE}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(editPersonnelSQL, personnelArguments);
            console.log("editPersonnelSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }

        case 2: {
            const personnelArguments = normalizeNulls(args);

            const deletePersonnelSQL = "CALL DeletePersonnelCompletely(" +
               "?," +               // <{IN p_person_id INT}>
               "@result_message)";  // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(deletePersonnelSQL, personnelArguments);
            console.log("deletePersonnelSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }
        // SHOW ALL PERSONNEL
        case 3: {
            const SQL = "CALL ShowAllPersonnelAssignments()"
            dbQueryWrapper(SQL, res);
            break;
        }
    }
});

// Q3 ADD/DELETE/EDIT/DISPLAY FAMILY MEMBER
app.post("/sendForm/2/:formNumber", (req, res) => {
    const formNumber = Number(req.params.formNumber);
    const args = Object.values(req.body);

    switch (formNumber) {
        case 0: {
            // normalize args for null values
            const familyMemberArguments = normalizeNulls(args);

            const insertFamilyMemberSQL = "CALL InsertFamily(" +
            "?," + // <{IN p_minor_id INT}>
            "?," + // <{IN p_major_id INT}>
            "?," + // <{IN p_location_id INT}>
            "?," + // <{IN p_relationship VARCHAR(50)}>
            "?," + // <{IN p_contact_role ENUM('Primary','Emergency')}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(insertFamilyMemberSQL, familyMemberArguments);
            console.log("insertFamilyMemberSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }

        case 1: {
            // normalize args for null values
            const familyMemberArguments = normalizeNulls(args);

            const updateFamilyMemberSQL = "CALL UpdateFamilyMemberComplete("+
            "?," + // "?," + // <{IN p_family_member_id INT}>
            "?," + // <{IN p_first_name VARCHAR(50)}>
            "?," + // <{IN p_last_name VARCHAR(50)}>
            "?," + // <{IN p_middle_initial CHAR(1)}>
            "?," + // <{IN p_date_of_birth DATE}>
            "?," + // <{IN p_ssn CHAR(9)}>
            "?," + // <{IN p_medicare VARCHAR(20)}>
            "?," + // <{IN p_email VARCHAR(100)}>
            "?," + // <{IN p_street_address VARCHAR(255)}>
            "?," + // <{IN p_city VARCHAR(100)}>
            "?," + // <{IN p_province VARCHAR(50)}>
            "?," + // <{IN p_postal_code CHAR(6)}>
            "?," + // <{IN p_phone_number VARCHAR(20)}>
            "?," + // <{IN p_phone_extension VARCHAR(10)}>
            "?," + // <{IN p_phone_type VARCHAR(20)}>
            "?," + // <{IN p_location_id INT}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(updateFamilyMemberSQL, familyMemberArguments);
            console.log("updateFamilyMemberSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }

        case 2: {
            const familyMemberArguments = args;

            const deleteFamilyMemberSQL = "CALL DeleteFamilyMember(" +
            "?," + // <{IN p_family_member_id INT}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(deleteFamilyMemberSQL, familyMemberArguments);
            console.log("deleteFamilyMemberSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }
        // SHOW ALL FAMILY MEMBERS
        case 3: {
            const SQL = "CALL ShowAllFamilyMembers()"
            dbQueryWrapper(SQL, res);
            break;
        }
    }
});

// Q4 ADD/DELETE/EDIT/DISPLAY CLUB MEMBER
app.post("/sendForm/3/:formNumber", (req, res) => {
    const formNumber = Number(req.params.formNumber);
    const args = Object.values(req.body);

    switch (formNumber) {
        case 0: {
            // normalize args for null values
            const clubMemberArguments = normalizeNulls(args);

            // print to console
            console.log("clubMemberArguments BEFORE INSERT:", clubMemberArguments);

            const insertClubMemberSQL = "CALL InsertClubMemberWithPerson(" +
            "?," + // <{IN p_first_name VARCHAR(100)}>
            "?," + // <{IN p_last_name VARCHAR(100)}>
            "?," + // <{IN p_middle_initial VARCHAR(10)}>
            "?," + // <{IN p_date_of_birth DATE}>
            "?," + // <{IN p_ssn CHAR(9)}>
            "?," + // <{IN p_medicare_number VARCHAR(15)}>
            "?," + // <{IN p_email VARCHAR(100)}>
            "?," + // <{IN p_street_address VARCHAR(255)}>
            "?," + // <{IN p_city VARCHAR(100)}>
            "?," + // <{IN p_province VARCHAR(50)}>
            "?," + // <{IN p_postal_code CHAR(6)}>
            "?," + // <{IN p_phone_number VARCHAR(20)}>
            "?," + // <{IN p_phone_extension VARCHAR(10)}>
            "?," + // <{IN p_phone_type VARCHAR(20)}>
            "?," + // <{IN p_height DECIMAL(5,2)}>
            "?," + // <{IN p_weight DECIMAL(5,2)}>
            "?," + // <{IN p_gender ENUM('Male','Female')}>
            "?," + // <{IN p_member_type ENUM('Major','Minor')}>
            "?," + // <{IN p_location_id INT}>
            "?," + // <{IN p_family_member_id INT}>
            "?," + // <{IN p_relationship_type ENUM('Father','Mother','Grandfather','Grandmother','Sibling','Tutor','Partner','Friend','Other')}>
            "?," + // <{IN p_contact_role ENUM('Primary','Emergency')}>
            "@person_id," + // <{OUT p_person_id INT}>
            "@member_id," + // <{OUT p_member_id INT}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>)

            // print to console results from DB query
            const finalSQL = mysql.format(insertClubMemberSQL, clubMemberArguments);
            console.log("insertClubMemberSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }

        case 1: {
            // normalize args for null values
            const clubMemberArguments = normalizeNulls(args);

            const editClubMemberSQL = "CALL UpdateClubMemberComplete("+
            "?," + // <{IN p_club_member_id INT}>
            "?," + // <{IN p_first_name VARCHAR(50)}>
            "?," + // <{IN p_last_name VARCHAR(50)}>
            "?," + // <{IN p_middle_initial CHAR(1)}>
            "?," + // <{IN p_date_of_birth DATE}>
            "?," + // <{IN p_ssn CHAR(9)}>
            "?," + // <{IN p_medicare VARCHAR(20)}>
            "?," + // <{IN p_email VARCHAR(100)}>
            "?," + // <{IN p_street_address VARCHAR(255)}>
            "?," + // <{IN p_city VARCHAR(100)}>
            "?," + // <{IN p_province VARCHAR(50)}>
            "?," + // <{IN p_postal_code CHAR(6)}>
            "?," + // <{IN p_phone_number VARCHAR(20)}>
            "?," + // <{IN p_phone_extension VARCHAR(10)}>
            "?," + // <{IN p_phone_type VARCHAR(20)}>
            "?," + // <{IN p_height DECIMAL(5,2)}>
            "?," + // <{IN p_weight DECIMAL(5,2)}>
            "?," + // <{IN p_gender ENUM('Male','Female')}>
            "?," + // <{IN p_is_active BOOLEAN}>
            "?," + // <{IN p_location_id INT}>
            "?," + // <{IN p_family_id INT}>
            "?," + // <{IN p_relationship VARCHAR(50)}>
            "?," + // <{IN p_contact_role ENUM('Primary','Secondary','Emergency')}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(editClubMemberSQL, clubMemberArguments);
            console.log("editClubMemberSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }

        case 2: {
            const clubMemberArguments = args;

            // print to console
            console.log("MemberID TO DELETE:", clubMemberArguments);

            const deleteClubMemberSQL = "CALL DeleteClubMember(" +
                "?," + 				// <{IN p_member_id INT}>
                "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(deleteClubMemberSQL, clubMemberArguments);
            console.log("deleteClubMemberSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }
        // SHOW ALL CLUB MEMBERS
        case 3: {
            const SQL = "CALL ShowAllClubMembers()";
            dbQueryWrapper(SQL, res);
            break;
        }
    }
});

// For questions 5 and 6, team formations
app.post("/sendForm/4/:formNumber", (req, res) => {
    const formNumber = Number(req.params.formNumber);
    const args = Object.values(req.body);

    switch (formNumber) {
        // CREATE TEAM
        case 0: {
            // normalize args for null values
            const teamArguments = normalizeNulls(args);

            const insertTeamSQL =  "CALL InsertTeam(" +
            "?," + // <{IN p_location_id INT}>
            "?," + // <{IN p_gender ENUM('Male','Female')}>
            "?," + // <{IN p_team_name VARCHAR(100)}>
            "?," + // <{IN p_coach_id INT}>
            "?," + // <{IN p_league_level VARCHAR(20)}>
            "@team_id" + // <{OUT p_team_id INT}>
            "@result_message"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(insertTeamSQL, teamArguments);
            console.log("insertTeamSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }
        // CREATE SESSION
        case 1: {
            // normalize args for null values
            const sessionArguments = normalizeNulls(args);

            const insertSessionSQL = "CALL InsertSession(" +
            "?," + // <{IN p_home_team_id INT}>
            "?," + // <{IN p_away_team_id INT}>
            "?," + // <{IN p_location_id INT}>
            "?," + // <{IN p_start_time DATETIME}>
            "?," + // <{IN p_end_time DATETIME}>
            "?," + // <{IN p_session_type ENUM('Training','Game')}>
            "?," + // <{IN p_home_score INT}>
            "?," + // <{IN p_away_score INT}>
            "@session_id" + // <{OUT p_session_id INT}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(insertSessionSQL, sessionArguments);
            console.log("insertSessionSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }
        // ASSIGN MEMBER TO TEAM
        case 2: {
            // normalize args for null values
            const memberStatsArguments = normalizeNulls(args);

            const insertMemberStatsSQL = "CALL InsertMemberStats(" +
            "?," + // <{IN p_member_id INT}>
            "?," + // <{IN p_team_id INT}>
            "?," + // <{IN p_season_year YEAR}>
            "?," + // <{IN p_start_date DATE}>
            "?," + // <{IN p_end_date DATE}>
            "?," + // <{IN p_position ENUM('Setter','Outside Hitter','Opposite Hitter','Middle Blocker','Libero','Defensive Specialist','Serving Specialist')}>
            "@stat_id," + // <{OUT p_stat_id INT}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(insertMemberStatsSQL, memberStatsArguments);
            console.log("insertMemberStatsSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }
        // ADD PLAYER TO FORMATION
        case 3: {
            // normalize args for null values
            const playerFormationArguments = normalizeNulls(args);

            const insertPlayerFormationSQL = "CALL InsertPlayerFormation(" +
            "?," + // <{IN p_session_id INT}>
            "?," + // <{IN p_member_id INT}>
            "?," + // <{IN p_alternate_position ENUM('Setter','Outside Hitter','Opposite Hitter','Middle Blocker','Libero','Defensive Specialist','Serving Specialist')}>
            "?," + // <{IN p_start_time DATETIME}>
            "?," + // <{IN p_end_time DATETIME}>
            "@formation_id," + // <{OUT p_formation_id INT}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(insertPlayerFormationSQL, playerFormationArguments);
            console.log("insertPlayerFormationSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }
        // UPDATE STATS -
        case 4: {
            // normalize args for null values
            const memberStatsArguments = normalizeNulls(args);

            const editMemberStatsSQL = "CALL UpdateMemberStats(" +
            "?," + // <{IN p_stat_id INT}>
            "?," + // <{IN p_goals INT}>
            "?," + // <{IN p_assists INT}>
            "?," + // <{IN p_playtime INT}>
            "?," + // <{IN p_position ENUM('Setter','Outside Hitter','Opposite Hitter','Middle Blocker','Libero','Defensive Specialist','Serving Specialist')}>
            "?," + // <{IN p_rating DECIMAL(3,1)}>
            "?," + // <{IN p_notes TEXT}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(editMemberStatsSQL, memberStatsArguments);
            console.log("editMemberStatsSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }
        // SHOW ALL TEAM FORMATIONS
        case 5: {
            const SQL = "CALL ShowAllFormations()"
            dbQueryWrapper(SQL, res);
            break;
        }
    }
});

// For question 7, Make Payment
app.post("/sendForm/5/:formNumber", (req, res) => {
    const formNumber = Number(req.params.formNumber);
    const args = Object.values(req.body);

    switch (formNumber) {
        // insertPayment
        case 0: {
            // normalize args for null values
            const paymentArguments = normalizeNulls(args);

            const insertPaymentSQL = "CALL InsertPayment(" +
            "?," + // <{IN p_member_id INT}>
            "?," + // <{IN p_membership_year YEAR}>
            "?," + // <{IN p_payment_date DATE}>
            "?," + // <{IN p_amount DECIMAL(7,2)}>
            "?," + // <{IN p_payment_method ENUM('Cash','Debit','Credit','Cheque','Other')}>
            "@payment_number," + // <{OUT p_payment_number INT}>
            "@result_message)"; // <{OUT p_result_message VARCHAR(255)}>

            // print to console results from DB query
            const finalSQL = mysql.format(insertPaymentSQL, paymentArguments);
            console.log("insertPaymentSQL:");
            console.log(finalSQL);
            sendProcedureResult(finalSQL, res);
            break;
        }
        // show all payments
        case 1: {
           // normalize args for null values
            const paymentArguments = normalizeNulls(args);

            const showPaymentSQL = "CALL SearchClubMemberPayments("+
            "?)"; // <{IN p_member_id INT}>

            // print to console results from DB query
            const finalSQL = mysql.format(showPaymentSQL, paymentArguments);
            console.log("showPaymentSQL:");
            console.log(finalSQL);
            dbQueryWrapper(finalSQL, res);
            break;
        }
    }
});


// For question 8, get all location data
app.post("/sendForm/6/0", (req, res) => {
    const SQL = "CALL GetAllLocationDetails()";
    dbQueryWrapper(SQL, res);
});

// For question 9 GetFamilyMemberDetails
app.post("/sendForm/7/0", (req, res) => {
    const SQL = "CALL GetFamilyMemberDetails(?)";
    const familyMemberID = req.body.familyMemberID;
    const finalSQL = mysql.format(SQL, familyMemberID);
    dbQueryWrapper(finalSQL, res);
});

// For question 10 GetLocationTeamFormations
app.post("/sendForm/8/0", (req, res) => {
    const SQL = "CALL GetLocationTeamFormations(?, ?, ?)";
    const args = Object.values(req.body);
    const finalSQL = mysql.format(SQL, args);
    dbQueryWrapper(finalSQL, res);
});

// For question 11 GetInactiveMultiLocationMembers
app.post("/sendForm/9/0", (req, res) => {
    const SQL = "CALL GetInactiveMultiLocationMembers()";
    dbQueryWrapper(SQL, res);
});

// For question 12 GetTeamFormationReport
app.post("/sendForm/10/0", (req, res) => {
    const SQL = "CALL GetTeamFormationReport(?, ?)";
    const args = Object.values(req.body);
    const finalSQL = mysql.format(SQL, args);
    dbQueryWrapper(finalSQL, res);
});

// For question 13 GetMembersNeverAssigned
app.post("/sendForm/11/0", (req, res) => {
    const SQL = "CALL GetMembersNeverAssigned()";
    dbQueryWrapper(SQL, res);
});

// For question 14 GetMajorMembersJoinedAsMinors
app.post("/sendForm/12/0", (req, res) => {
    const SQL = "CALL GetMajorMembersJoinedAsMinors()";
    dbQueryWrapper(SQL, res);
});

// For question 15 GetSetterOnlyMembers
app.post("/sendForm/13/0", (req, res) => {
    const SQL = "CALL GetSetterOnlyMembers()";
    dbQueryWrapper(SQL, res);
});

// For question 16 GetAllPositionMembers
app.post("/sendForm/14/0", (req, res) => {
    const SQL = "CALL GetAllPositionMembers()";
    dbQueryWrapper(SQL, res);
});

// For question 17 GetFamilyMemberCoaches
app.post("/sendForm/15/0", (req, res) => {
    const SQL = "CALL GetFamilyMemberCoaches(?)";
    const locationName = req.body.locationName.trim();
    const finalSQL = mysql.format(SQL, locationName);
    dbQueryWrapper(finalSQL, res);
});

// For question 18 GetUndefeatedMembers
app.post("/sendForm/16/0", (req, res) => {
    const SQL = "CALL GetUndefeatedMembers()";
    dbQueryWrapper(SQL, res);
});

// For question 19 GetVolunteerFamilyPersonnel
app.post("/sendForm/17/0", (req, res) => {
    const SQL = "CALL GetVolunteerFamilyPersonnel()";
    dbQueryWrapper(SQL, res);
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});


// Queries 8-19 calls:
// Query 8: 'CALL `GetAllLocationDetails`()'
// Query 9: 'CALL `GetFamilyMemberDetails`(?)', [parseInt(familyMemberID)]
// Query 10: 'CALL `GetLocationTeamFormations`(?, ?, ?)', [parseInt(locationID), startDate, endDate]
// Query 11: 'CALL `GetInactiveMultiLocationMembers`()'
// Query 12: 'CALL `GetTeamFormationReport`(?, ?)', [startDate, endDate]
// Query 13: 'CALL `GetMembersNeverAssigned`()'
// Query 14: 'CALL `GetMajorMembersJoinedAsMinors`()'
// Query 15: 'CALL `GetSetterOnlyMembers`()'
// Query 16: 'CALL `GetAllPositionMembers`()'
// Query 17: 'CALL `GetFamilyMemberCoaches`(?)', [locationName.trim()]
// Query 18: 'CALL `GetUndefeatedMembers`()'
// Query 19: 'CALL `GetVolunteerFamilyPersonnel`()'