const path = require("path");
const express = require("express");
const session = require("express-session");
const mondaySdk = require("monday-sdk-js");
const fs = require("fs/promises");
const invoiceCall = require("./invoiceCall.js");
var tools = require("./tools/tools.js");

const { useState } = require("react");
const app = express(); // Create the Express app instance
const sessionMiddleware = session({
  secret: "secret",
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);
const monday = mondaySdk();

// Read and import config.json using fs module
const loadConfig = async () => {
  try {
    const configPath = path.join(__dirname, "config.json");
    const data = await fs.readFile(configPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading config.json:", error);
    return null;
  }
};

// Function to create a column using the Monday API
const createColumn = async (config, boardId) => {
  try {
    // Store the foundBoardId in the config object
    config.foundBoardId = boardId;
    const configPath = path.join(__dirname, "config.json");
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
    console.log("Config updated and saved successfully.");
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Customer Name\", description: \"This is my customer names column\", column_type:text) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Invoice Status\", description: \"This is my invoice status column\", column_type:status) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Due Date\", description: \"This is my due date column\", column_type:date) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Balance Due\", description: \"This is my balance due column\", column_type:numbers) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Sales Terms\", description: \"This is my sales terms column\", column_type:text) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Email\", description: \"This is my emails column\", column_type:text) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Address\", description: \"This is my address column\", column_type:text) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"SubTotal\", description: \"This is my subtotal column\", column_type:numbers) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Sales Tax\", description: \"This is my sales tax column\", column_type:numbers) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Creation Date\", description: \"This is my creation date column\", column_type:date) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
    // await monday
    //   .api(
    //     `mutation{ create_column(board_id: ${boardId}, title:\"Updated Date\", description: \"This is my updated date column\", column_type:date) {id title description}}`
    //   )
    //   .then((res) => {
    //     console.log(JSON.stringify(res));
    //   });
  } catch (error) {
    console.error("Error creating column:", error);
  }
};

const getBoardData = async (boardId) => {
  console.log("inside getBoardData of app.cjs");
  await monday.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjI3MDc4Nzk2MiwiYWFpIjoxMSwidWlkIjo0NDUwNTExNCwiaWFkIjoiMjAyMy0wNy0yNVQwMToxMToyMS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTczOTg4NTcsInJnbiI6ImFwc2UyIn0.PxfcBQSPkTagLSX2aVwCEi-I8MZLH7923R8ypdQfusM"
  );

  try {
    const groupsResponse = await monday.api(
      `query {boards (ids: ${boardId}) {groups {title id}}}`
    );
    console.log(
      "Groups are: " + JSON.stringify(groupsResponse.data.boards[0].groups)
    );

    const itemsResponse = await monday.api(
      `query { boards(ids: ${boardId}) { items { id, name, column_values { id, text } } } }`
    );
    const board_data = itemsResponse.data.boards[0].items;

    // Process the data here if needed
    const extractedData = board_data.map((item) => {
      const itemId = item.id;
      const name = item.name;
      const columns = item.column_values.map((column) => ({
        id: column.id,
        value: column.text,
      }));
      return { itemId, name, columns };
    });
    return extractedData;
  } catch (error) {
    console.error("Error while retrieving board data:", error);
    throw error; // Rethrow the error to handle it in the calling function
  }
};

// console.log("Extracted Data : ", extractedData);

// let i = 0;
// while (no_of_items > 0) {
//   const docNum = extractedData[i].name;
//   console.log("DocNum : ", docNum);
//   console.log("calling invoice call from app.cjs");
//   //call invoiceCall here which is located in connected.ejs
//   await invoiceCall();
//   console.log("done caling func");
//   // await monday
//   // .api(
//   //   `mutation {change_multiple_column_values(item_id:${extractedData[i].itemId}, board_id:${boardId}, column_values: \"{\\\"${extractedData[i].columns[2].id}\\\": \\\"${myStatus}\\\", \\\"${extractedData[i].columns[3].id}\\\" : \\\"${dateTime}\\\"} \") {id}}`
//   // )
//   // .then((res) => {
//   //   console.log("Data inserted: " + JSON.stringify(res.data));
//   // });
//   no_of_items--;
//   i++;
// }

(async () => {
  const config = await loadConfig();
  if (!config) {
    console.error("Could not load config.json. Exiting...");
    process.exit(1);
  }

  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");
  app.use(express.static(path.join(__dirname, "public")));
  app.use(
    session({ secret: "secret", resave: "false", saveUninitialized: "false" })
  );

  // Initial view - loads Connect To QuickBooks Button
  app.get("/", async function (req, res) {
    // monday.listen("context", () => {
    //   console.log("monday is listening");
    // });
    // const storedBoardId = req.session.boardId || "null";
    // console.log("stored board id : ", storedBoardId);
    // config.boardId = storedBoardId;
    // console.log("config.boardid : ", config.boardId);
    if (req.session.boardId) {
      console.log("Found board ID:", req.session.boardId);
    }
    monday.setToken(
      "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjI3MDc4Nzk2MiwiYWFpIjoxMSwidWlkIjo0NDUwNTExNCwiaWFkIjoiMjAyMy0wNy0yNVQwMToxMToyMS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTczOTg4NTcsInJnbiI6ImFwc2UyIn0.PxfcBQSPkTagLSX2aVwCEi-I8MZLH7923R8ypdQfusM"
    );
    const inputName = "QuickBooks"; // Replace with your desired board name

    monday.api(`query{boards (limit:10) {id name} }`).then((res) => {
      const boards = res.data.boards;
      console.log("all boards : ", boards);

      for (let i = 0; i < boards.length; i++) {
        const board = boards[i];
        if (board.name === inputName) {
          req.session.boardId = board.id; // Store the boardId in the session
          break;
        }
      }

      if (req.session.boardId) {
        console.log("Found board ID:", req.session.boardId);

        createColumn(config, req.session.boardId);
        console.log("board id  after creatinmg columns: ", config.foundBoardId);
      } else {
        console.log("Board not found");
      }
    });
    console.log("config board id :", config.foundBoardId);
    res.render("home", config);
  });
  // Sign In With Intuit, Connect To QuickBooks, or Get App Now
  // These calls will redirect to Intuit's authorization flow
  const signInWithIntuitRouter = require("./routes/sign_in_with_intuit.js");
  app.use("/sign_in_with_intuit", signInWithIntuitRouter);

  // app.use("/sign_in_with_intuit", require("./routes/sign_in_with_intuit.js"));
  const connect_to_quickbooks = require("./routes/connect_to_quickbooks.js");
  app.use("/connect_to_quickbooks", connect_to_quickbooks);
  app.use("/connect_handler", require("./routes/connect_handler.js"));

  // Callback - called via redirect_uri after authorization
  app.use("/callback", require("./routes/callback.js"));

  // Connected - call OpenID and render connected view
  app.use("/connected", require("./routes/connected.js"));
  app.use("/api_call", require("./routes/api_call.js"));

  // app.get("/connected/invoiceCall", function (req, res) {
  //   console.log("inside app.cjs' call's invoice call function");
  //   // Assuming you have some authentication/authorization logic here to validate the request
  //   var token = tools.getToken(req.session);
  //   console.log("\n\n\ntoken : ", token);
  //   if (!token) return res.json({ error: "Not authorized" });
  //   if (!req.session.realmId)
  //     return res.json({
  //       error:
  //         "No realm ID.  QBO calls only work if the accounting scope was passed!",
  //     });
  //   console.log("\n\n\nmaking invoice api call \n\n\n");
  //   // Set up API call (with OAuth2 accessToken)
  //   var url =
  //     config.api_uri +
  //     req.session.realmId +
  //     "/query?query=select * from Invoice where DocNumber = '1046'&minorversion=40" +
  //     console.log("Making API call to: " + url);

  //   var requestObj = {
  //     url: url,
  //     headers: {
  //       Authorization: "Bearer " + token.accessToken,
  //       Accept: "application/json",
  //     },
  //   };
  //   // Make API call
  //   request(requestObj, function (err, response) {
  //     // Check if 401 response was returned - refresh tokens if so!
  //     tools.checkForUnauthorized(req, requestObj, err, response).then(
  //       function ({ err, response }) {
  //         if (err || response.statusCode != 200) {
  //           return res.json({ error: err, statusCode: response.statusCode });
  //         }

  //         // API Call was a success!
  //         res.json(JSON.parse(response.body));
  //       },
  //       function (err) {
  //         console.log(err);
  //         return res.json(err);
  //       }
  //     );
  //   });
  // });
  app.listen(3000, function () {
    console.log("Example app listening on port 3000!");
  });
})();

module.exports = {
  getBoardData,
};
