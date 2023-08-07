var tools = require("../tools/tools.js");
var config = require("../config.json");
var request = require("request");
var express = require("express");

const mondaySdk = require("monday-sdk-js");
var router = express.Router();
router.use(express.json());

const monday = mondaySdk();
// Assuming that app.cjs is in the same directory as api_call.js
const { getBoardData } = require("../app.cjs");

/** /api_call **/
router.get("/", function (req, res) {
  var token = tools.getToken(req.session);
  console.log("token in api_call : ", token);
  console.log("\n\n\nrequest URL: ", req.headers.host + req.url); // Modified line to get the URL from the request headers

  if (!token) return res.json({ error: "Not authorized" });
  if (!req.session.realmId)
    return res.json({
      error:
        "No realm ID.  QBO calls only work if the accounting scope was passed!",
    });

  // Set up API call (with OAuth2 accessToken)
  var url =
    config.api_uri +
    req.session.realmId +
    "/companyinfo/" +
    req.session.realmId;
  console.log("Making API call to: " + url);

  var requestObj = {
    url: url,
    headers: {
      Authorization: "Bearer " + token.accessToken,
      Accept: "application/json",
    },
  };

  // Make API call
  request(requestObj, function (err, response) {
    console.log("\n\n\ngetting company info\n\n");
    // Check if 401 response was returned - refresh tokens if so!
    tools.checkForUnauthorized(req, requestObj, err, response).then(
      function ({ err, response }) {
        if (err || response.statusCode != 200) {
          return res.json({ error: err, statusCode: response.statusCode });
        }

        // API Call was a success!
        res.json(JSON.parse(response.body));
      },
      function (err) {
        console.log(err);
        return res.json(err);
      }
    );
  });
});

/** /api_call/revoke **/
router.get("/revoke", function (req, res) {
  var token = tools.getToken(req.session);
  if (!token) return res.json({ error: "Not authorized" });

  var url = tools.revoke_uri;
  request(
    {
      url: url,
      method: "POST",
      headers: {
        Authorization: "Basic " + tools.basicAuth,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token.accessToken,
      }),
    },
    function (err, response, body) {
      if (err || response.statusCode != 200) {
        return res.json({ error: err, statusCode: response.statusCode });
      }
      tools.clearToken(req.session);
      res.json({ response: "Revoke successful" });
    }
  );
});

/** /api_call/refresh **/
// Note: typical use case would be to refresh the tokens internally (not an API call)
// We recommend refreshing upon receiving a 401 Unauthorized response from Intuit.
// A working example of this can be seen above: `/api_call`
router.get("/refresh", function (req, res) {
  var token = tools.getToken(req.session);
  if (!token) return res.json({ error: "Not authorized" });

  tools.refreshTokens(req.session).then(
    function (newToken) {
      // We have new tokens!
      res.json({
        accessToken: newToken.accessToken,
        refreshToken: newToken.refreshToken,
      });
    },
    function (err) {
      // Did we try to call refresh on an old token?
      console.log(err);
      res.json(err);
    }
  );
});

// Add this route to handle the board data retrieval
// router.get("/get_board_data", async function (req, res) {
//   console.log("api call get board data");
//   try {
//     const boardId = config.foundBoardId;
//     console.log("current board id : ", boardId);
//     if (!boardId) {
//       console.log("Board ID not found in session.");
//       res.status(400).json({ error: "Board ID not found in session." });
//       return;
//     }

//     // Call the function to get board data using the Monday API
//     const boardData = await getBoardData(boardId, res);

//     // Send the board data as JSON response
//     res.json(boardData);
//   } catch (error) {
//     console.error("Error while retrieving board data:", error);
//     res.status(500).json({ error: "Error while retrieving board data." });
//   }
// });
// Add this route to handle the board data retrieval
router.get("/get_board_data", async function (req, res) {
  console.log("api call get board data");
  try {
    const boardId = config.foundBoardId;
    console.log("current board id : ", boardId);
    if (!boardId) {
      console.log("Board ID not found in session.");
      res.status(400).json({ error: "Board ID not found in session." });
      return;
    }

    // Call the function to get board data using the Monday API
    const boardData = await getBoardData(boardId);

    // Send the board data as JSON response along with the boardId
    res.json({ boardId, boardData });
  } catch (error) {
    console.error("Error while retrieving board data:", error);
    res.status(500).json({ error: "Error while retrieving board data." });
  }
});

router.get("/invoice", function (req, res) {
  console.log("inside api call's invoice call function");
  var token = tools.getToken(req.session);
  if (!token) return res.json({ error: "Not authorized" });
  if (!req.session.realmId)
    return res.json({
      error:
        "No realm ID.  QBO calls only work if the accounting scope was passed!",
    });
  var docNum = req.query.docNum;
  console.log("Received docNum: ", docNum);
  console.log("\n\n\nmaking invoice api call \n\n\n");
  // Set up API call (with OAuth2 accessToken)
  var url =
    config.api_uri +
    req.session.realmId +
    "/query?query=select * from Invoice where DocNumber = '" +
    docNum +
    "'&minorversion=40";
  console.log("Making API call to: " + url);

  var requestObj = {
    url: url,
    headers: {
      Authorization: "Bearer " + token.accessToken,
      Accept: "application/json",
    },
  };

  // Make API call
  request(requestObj, function (err, response) {
    // Check if 401 response was returned - refresh tokens if so!
    tools.checkForUnauthorized(req, requestObj, err, response).then(
      function ({ err, response }) {
        if (err || response.statusCode != 200) {
          return res.json({ error: err, statusCode: response.statusCode });
        }

        // API Call was a success!
        res.json(JSON.parse(response.body));
      },
      function (err) {
        console.log(err);
        return res.json(err);
      }
    );
  });
});

router.get("/customer", function (req, res) {
  var token = tools.getToken(req.session);
  if (!token) return res.json({ error: "Not authorized" });
  if (!req.session.realmId)
    return res.json({
      error:
        "No realm ID.  QBO calls only work if the accounting scope was passed!",
    });
  console.log("\n\n\nmaking customer api call \n\n\n");
  // Set up API call (with OAuth2 accessToken)

  var customerRefValue = req.query.customerRefValue;
  console.log("Received customer id: ", customerRefValue);
  console.log(
    "\n\n\nmaking customer api call for CustomerRef.value: " +
      customerRefValue +
      "\n\n\n"
  );

  // Set up API call (with OAuth2 accessToken)
  var url =
    config.api_uri +
    req.session.realmId +
    "/customer/" +
    customerRefValue +
    "?minorversion=65";

  var requestObj = {
    url: url,
    headers: {
      Authorization: "Bearer " + token.accessToken,
      Accept: "application/json",
    },
  };

  // Make API call
  request(requestObj, function (err, response) {
    console.log("\n\n\ngetting customer info\n\n");
    // Check if 401 response was returned - refresh tokens if so!
    tools.checkForUnauthorized(req, requestObj, err, response).then(
      function ({ err, response }) {
        if (err || response.statusCode != 200) {
          return res.json({ error: err, statusCode: response.statusCode });
        }

        // API Call was a success!
        res.json(JSON.parse(response.body));
      },
      function (err) {
        console.log(err);
        return res.json(err);
      }
    );
  });
});

router.post("/updateCol", async function (req, res) {
  console.log("inside api call's update cols call function");
  var token = tools.getToken(req.session);
  if (!token) return res.json({ error: "Not authorized" });
  if (!req.session.realmId)
    return res.json({
      error:
        "No realm ID.  QBO calls only work if the accounting scope was passed!",
    });
  const { boardId, itemId, columns } = req.body;
  let columnValues = "";
  columns.forEach((col) => {
    columnValues += `\\\"${col.id}\\\": \\\"${col.value}\\\", `;
  });
  columnValues = columnValues.slice(0, -2);
  console.log("\n\n\n column values : ", columnValues);
  try {
    try {
      const tokenResponse = await monday.setToken(
        "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjI3MjU4Njk1MCwiYWFpIjoxMSwidWlkIjo0NDUwNTExNCwiaWFkIjoiMjAyMy0wOC0wMlQxMjoyNjo0Ni4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTczOTg4NTcsInJnbiI6ImFwc2UyIn0.MR-bgaSU21ZrzXf3DzD6I8qieHcd-czG9iO0atQrSVw"
      );
      console.log("token set : ", tokenResponse);
    } catch (err) {
      console.log("token err : ", err);
    }
    try {
      const response = await monday.api(
        `mutation {change_multiple_column_values(item_id:${itemId}, board_id:${boardId}, column_values: "{${columnValues}}") {id}}`
      );

      console.log("Data inserted: ", response);
    } catch (error) {
      console.error("Error while inserting data:", error);
    }

    // await monday.api(
    //   `mutation {change_multiple_column_values(item_id:1808846278, board_id:1808846275, column_values: \"{
    //   \\\"customer_name35\\\" : \\\"Maida\\\"}\") {id}}`
    //   // `mutation{change_simple_column_value (item_id: ${itemId}, board_id: ${boardId}, column_id:\"customer_name35\", value: \"Maida Shahid\"){id}}`
    //   // `mutation {change_multiple_column_values(item_id:${itemId}, board_id:${boardId}, column_values: \"{${columnValues}}\") {id}}`
    //   // `mutation {change_multiple_column_values(item_id:${itemId}, board_id:${boardId}, column_values: \"{\\\"invoice_status\\\" : \\\"Done\\\",
    //   //  \\\"customer_name35\\\" : \\\"Maida\\\",
    //   //  \\\"due_date\\\" : \\\"2023-08-03\\\",\\\"balance_due\\\" : \\\"35\\\",
    //   //  \\\"sales_terms\\\" : \\\"Net 30\\\", \\\"email\\\" : \\\"noor.fatima@techloyce.com\\\",
    //   //   \\\"address\\\" : \\\"123 Main Street, City : Lahore, Country : Pakistan, CountrySubDivisionCode : CA, PostalCode : 52000\\\",
    //   //    \\\"subtotal\\\" : \\\"35\\\" , \\\"sales_tax\\\" : \\\"0\\\", \\\"creation_date\\\" : \\\"2023-07-30\\\" ,
    //   //     \\\"updated_date\\\" : \\\"2023-07-30\\\"}\") {id}}`
    // );

    // var query = "mutation {change_multiple_column_values (item_id: 1234567890, board_id: 9876543210, column_values: \"{\\\"status\\\": {\\\"index\\\": 1},\\\"date4\\\": {\\\"date\\\":\\\"2021-01-01\\\"}, \\\"person\\\" : {\\\"personsAndTeams\\\":[{\\\"id\\\":9603417,\\\"kind\\\":\\\"person\\\"}]}}\") {id}}";

    console.log("Data inserted successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error while inserting data:", error);
    res.json({ error: "Error while inserting data" });
  }
});
module.exports = router;
