var tools = require("../tools/tools.js");
var express = require("express");
var router = express.Router();

/** /connect_to_quickbooks **/
router.get("/", function (req, res) {
  // Set the Accounting + Payment scopes
  tools.setScopes("create_invoice");
  console.log("\n\ninside create invoice of router");
  // Constructs the authorization URI.
  var uri = tools.intuitAuth.code.getUri({
    // Add CSRF protection
    state: tools.generateAntiForgery(req.session),
  });
  // Redirect
  console.log("Redirecting to authorization uri: " + uri);
  //   res.redirect(uri);
  res.redirect("https://app.sandbox.qbo.intuit.com/app/invoice");
});

module.exports = router;
