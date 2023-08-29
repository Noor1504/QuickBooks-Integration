var tools = require("../tools/tools.js");
var express = require("express");
var router = express.Router();

/** /connect_handler **/
// This would be the endpoint that is called when "Get App Now" is clicked
// from apps.com
router.get("/", function (req, res) {
  tools.setScopes("connect_handler");
  console.log("\n\ninside connect_handler");
  // Constructs the authorization URI.
  var uri = tools.intuitAuth.code.getUri({
    state: tools.generateAntiForgery(req.session),
  });

  // Redirect
  console.log("Redirecting to authorization uri: " + uri);
  res.redirect("connected");
  // res.redirect(uri);
});

module.exports = router;
