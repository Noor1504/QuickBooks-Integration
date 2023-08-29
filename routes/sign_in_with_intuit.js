var tools = require("../tools/tools.js");
var express = require("express");
var router = express.Router();
const sessionStorage = require("sessionstorage");

router.get("/", function (req, res) {
  console.log("\n\ninside singIn INtuit .js");
  console.log("\n\n ", sessionStorage.getItem("config"));
  tools.setScopes("sign_in_with_intuit");
  console.log("\n\n\n req.session : ", req.session);
  // Constructs the authorization URI.
  var uri = tools.intuitAuth.code.getUri({
    // Add CSRF protection
    state: tools.generateAntiForgery(req.session),
  });

  // Redirect
  console.log("Redirecting to authorization uri: " + uri);
  res.redirect(uri);
});

module.exports = router;
