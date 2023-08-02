var tools = require("../tools/tools.js");
var https = require("https");
var url = require("url");
var express = require("express");
var router = express.Router();

router.get("/", async function (req, res) {
  var token = tools.getToken(req.session);
  if (!token) return res.redirect("/");

  // Don't call OpenID if we didn't request OpenID scopes
  if (!tools.containsOpenId()) return res.render("connected");

  // Call OpenID endpoint
  // (this example uses the raw `https` npm module)
  // (see api_call.js for example using helper `request` npm module)
  var options = token.sign(url.parse(tools.openid_uri));
  var request = https.request(options, (response) => {
    response.setEncoding("utf8");
    let rawData = "";
    response.on("data", (chunk) => (rawData += chunk));
    response.on("end", () => {
      console.log("OpenID response: " + rawData);
      try {
        var parsedData = JSON.parse(rawData);
        console.log("\n\n\nbefore rendering connected : ", config.foundBoardId);
        res.render("connected", parsedData, config);
      } catch (e) {
        console.log(e.message);
        res.render("connected");
      }
    });
  });
  request.end();

  request.on("error", (e) => {
    console.error(e);
    res.send(e);
  });
});
function invoiceCall() {
  console.log("\n\n\ninside invoice call function \n\n\n");
  $("#result").html("Loading...");
  $.get("/api_call/invoice", function (data) {
    // Save the data to the invoiceData variable
    invoiceData = data.QueryResponse.Invoice[0];

    // Display the data on the HTML page (optional)
    $("#result").html(JSON.stringify(invoiceData, null, 2));

    // You can now use the invoiceData variable elsewhere in your code
    // For example, you can access specific properties like invoiceData.DocNumber, invoiceData.CustomerRef, etc.

    console.log(
      "result received for invoice : " + JSON.stringify(invoiceData, null, 2)
    );

    // Call the customerCall function here to use the invoiceData
    customerCall(invoiceData.CustomerRef.value);
  });
}

module.exports = { router, invoiceCall };
