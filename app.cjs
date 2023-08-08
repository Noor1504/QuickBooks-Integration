const path = require("path");
const express = require("express");
const session = require("express-session");
const mondaySdk = require("monday-sdk-js");
const fs = require("fs/promises");
const myFs = require("fs");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
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

const saveBoardId = async (config, boardId) => {
  // Store the foundBoardId in the config object
  config.foundBoardId = boardId;
  const configPath = path.join(__dirname, "config.json");
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  console.log("Config updated and saved successfully.");
};
// Function to check if a column with the given title exists in the board's columns
const doesColumnExist = (columns, columnTitle) => {
  return columns.some((column) => column.title === columnTitle);
};
// Function to create a column using the Monday API
const createColumn = async (config, boardId) => {
  try {
    const existingColumnsResponse = await monday.api(
      `query {
        boards(ids: ${boardId}) {
          columns {
            id
            title
          }
        }
      }`
    );

    const existingColumns = existingColumnsResponse.data.boards[0].columns;

    const columnsToCreate = [
      // Define your columns to create here
      {
        title: "Customer Name",
        description: "This is my customer names column",
        column_type: "text",
      },
      {
        title: "Due Date",
        description: "This is my due date column",
        column_type: "date",
      },
      {
        title: "Balance Due",
        description: "This is my balance due column",
        column_type: "numbers",
      },
      {
        title: "Sales Terms",
        description: "This is my sales terms column",
        column_type: "text",
      },
      {
        title: "Email Address",
        description: "This is my emails column",
        column_type: "text",
      },
      {
        title: "Address",
        description: "This is my address column",
        column_type: "text",
      },
      {
        title: "SubTotal",
        description: "This is my subtotal column",
        column_type: "numbers",
      },
      {
        title: "Sales Tax",
        description: "This is my sales tax column",
        column_type: "numbers",
      },
      {
        title: "Creation Date",
        description: "This is my creation date column",
        column_type: "date",
      },
      {
        title: "Updated Date",
        description: "This is my updated date column",
        column_type: "date",
      },
    ];

    for (const columnData of columnsToCreate) {
      const columnTitle = columnData.title;

      // Check if the column with the same title already exists
      if (doesColumnExist(existingColumns, columnTitle)) {
        console.log(
          `Column '${columnTitle}' already exists. Skipping creation.`
        );
        continue;
      }

      const createColumnResponse = await monday.api(
        `mutation {
          create_column(
            board_id: ${boardId},
            title: "${columnTitle}",
            description: "${columnData.description}",
            column_type: ${columnData.column_type}
          ) {
            id
            title
            description
          }
        }`
      );

      console.log(JSON.stringify(createColumnResponse));
    }
    saveBoardId(config, boardId);
  } catch (error) {
    console.error("Error creating column:", error);
  }
};

const getBoardData = async (boardId, res) => {
  console.log("inside getBoardData of app.cjs");
  await monday.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjI3MjU4Njk1MCwiYWFpIjoxMSwidWlkIjo0NDUwNTExNCwiaWFkIjoiMjAyMy0wOC0wMlQxMjoyNjo0Ni4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTczOTg4NTcsInJnbiI6ImFwc2UyIn0.MR-bgaSU21ZrzXf3DzD6I8qieHcd-czG9iO0atQrSVw"
  );
  const groupsResponse = await monday.api(
    `query {boards (ids: ${boardId}) {groups {title id}}}`
  );
  console.log("\n\n\n groupsResponse : ", JSON.stringify(groupsResponse));
  const boardResponse = await monday.api(
    `query { boards(ids: ${boardId}) { items { id, name, column_values { id, text } } } }`
  );
  console.log("\n\nboardResponse : ", JSON.stringify(boardResponse));
  const boardData = boardResponse.data.boards[0].items;
  console.log("\n\nboard Id : ", boardId);
  console.log("\n\nboardData : ", boardData);
  // Return an object containing boardId and boardData
  return { boardId, boardData };
};

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
  app.post("/submit", async function (req, res) {
    console.log("\n\n\ninside /submit");
    const accessToken = req.body.accessToken;
    monday.setToken(accessToken);
    monday
      .api(`query{boards (limit:10) {id name} }`)
      .then((apiResponse) => {
        console.log("API Response:", apiResponse);
        const boards = apiResponse.data.boards;
        console.log("all boards : ", boards);

        // Render the selectBoard.ejs template with the fetched boards data
        res.render("selectBoard.ejs", { boards: boards });
      })
      .catch((error) => {
        console.error("API Error:", error);
        // Handle the error and send an appropriate response
        res.status(500).send("Error fetching boards");
      });
    // res.render("signIn", config);

    // res.redirect("/"); // Redirect back to the main page
  });
  app.post("/boardSelected", async function (req, res) {
    console.log("\n\n\ninside /boardSelected");
    const inputName = req.body.selectedBoard;
    const allBoardsJSON = req.body.allBoards;
    const boards = JSON.parse(allBoardsJSON);
    console.log("\n\n\n\ninput board : ", inputName);
    console.log("\n\n\nboards : ", boards);
    for (let i = 0; i < boards.length; i++) {
      const board = boards[i];
      if (board.id === inputName) {
        req.session.boardId = board.id; // Store the boardId in the session
        console.log("Found board ID:", req.session.boardId);
        createColumn(config, req.session.boardId);
        break;
      }
    }

    if (!req.session.boardId) {
      console.log("Board not found");
    }
    res.render("quickBooksInputs", config);
  });
  app.get("/loggedIn", async function (req, res) {
    console.log("\n\n inside loggedIn function ");
    res.render("connect", config);
  });
  app.get("/connected", async function (req, res) {
    console.log("\n\n inside connected function ");

    res.render("connected", config);
  });
  // Initial view - loads Connect To QuickBooks Button
  app.get("/", async function (req, res) {
    if (req.session.boardId) {
      console.log("Found board ID:", req.session.boardId);
    }

    res.render("inputToken");
  });

  app.post("/submitOAuthSettings", (req, res) => {
    const clientId = req.body.clientId;
    const clientSecret = req.body.clientSecret;
    const redirectUri = req.body.redirectUri;

    // Read the existing content of config.json
    const configPath = path.join(__dirname, "config.json");
    const configData = require(configPath);

    // Update the values
    configData.clientId = clientId;
    configData.clientSecret = clientSecret;
    configData.redirectUri = redirectUri;

    // Write the updated data back to the config.json file
    myFs.writeFileSync(configPath, JSON.stringify(configData, null, 2), "utf8");
    res.render("signIn", config);
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

  app.listen(3000, function () {
    console.log("Example app listening on port 3000!");
  });
})();

module.exports = {
  getBoardData,
};
