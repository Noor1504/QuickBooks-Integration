var tools = require("../tools/tools.js");
var config = require("../config.json");
var request = require("request");
var express = require("express");
const cors = require("cors");

const mondaySdk = require("monday-sdk-js");
var router = express.Router();
router.use(express.json());
router.use(cors());

const monday = mondaySdk();
const {
  getBoardData,
  createColumn,
  createWorkspace,
  createCustomersColumn,
} = require("../app.cjs");

const clickNewCust = async (newTab) => {
  console.log("\n\n\n looking for required button");
  var button = newTab.document.getElementsByClassName(
    "Button-label-48e828d"
  )[0]; // Access the first element in the collection
  console.log("\\nbutton");
  // Simulate a click event on the button
  if (button) {
    console.log("\n\n\n button gets clicked : ", button);
    button.click();
  }
};
router.get("/createCustomer", function (req, res) {
  console.log("inside api call's create new customer");
  clickNewCust(req.body.newTab);
});
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
    await createWorkspace();
    console.log("\n\n\n workspace created successfully");
    await createColumn(boardId);
    // Call the function to get board data using the Monday API
    const boardData = await getBoardData(boardId);

    // Send the board data as JSON response along with the boardId
    res.json({ boardId, boardData });
  } catch (error) {
    console.error("Error while retrieving board data:", error);
    res.status(500).json({ error: "Error while retrieving board data." });
  }
});
router.get("/get_cust_board_data", async function (req, res) {
  console.log("api call get customer board data");
  try {
    const boardId = config.foundBoardId;
    console.log("current board id : ", boardId);
    if (!boardId) {
      console.log("Board ID not found in session.");
      res.status(400).json({ error: "Board ID not found in session." });
      return;
    }
    // await createWorkspace();

    await createCustomersColumn(boardId);
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
router.get("/customerInfo", function (req, res) {
  console.log("inside api call's customerInfo function");
  var token = tools.getToken(req.session);
  if (!token) return res.json({ error: "Not authorized" });
  if (!req.session.realmId)
    return res.json({
      error:
        "No realm ID.  QBO calls only work if the accounting scope was passed!",
    });
  var docNum = req.query.custName;
  console.log("Received docNum: ", docNum);
  console.log("\n\n\nmaking custoemr api call \n\n\n");
  // Set up API call (with OAuth2 accessToken)
  var url =
    config.api_uri +
    req.session.realmId +
    "/query?query=select * from Customer where DisplayName = '" +
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
  console.log("\n\n token in tools : ", token);
  // token = config.accessToken;
  // console.log("\n\ntoken in config : ", token);
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
      // const accessToken = config.accessToken;

      try {
        console.log("\n\naccessToken in update col apimcall ", token);
        const tokenResponse = await monday.setToken(token);
        console.log("token set : ", tokenResponse);
      } catch (err) {
        console.log("\n\nProblem in monday.set token  : ", err);
      }
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
    console.log("Data inserted successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error while inserting data:", error);
    res.json({ error: "Error while inserting data" });
  }
});
module.exports = router;
