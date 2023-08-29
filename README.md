# QuickBooks-Integration

## OAuth 2.0 - Node.js  App

This OAuth 2.0 App has been written in Node.js to provide working functions of OAuth 2.0 concepts, and how to integrate with Intuit endpoints with Monday.com.

### Getting Started
Before beginning, it may be helpful to have a basic understanding of OAuth 2.0 concepts. There are plenty of tutorials and guides to get started with OAuth 2.0.

It is also expected that your development environment is properly set up for Node.js and NPM.

Note: This app is made with Node.js version v16.0.0.

#### Setup
Clone the repository:

```
git clone "link to repository"
```

Install NPM dependencies:

```
npm install
```

Launch your app.

```
node app.cjs
```

Your app should be running! If you direct your browser to `https://localhost:3000`, you should see the welcome screen. Please note that the app will not be fully functional until we finish configuring it.

### Configuring your app

All configuration for this app is located in `config.json`. Locate and open this file.

We will need to update 3 items:

- `clientId`
- `clientSecret`
- `redirectUri`

All of these values must match **exactly** with what is listed in your app settings on [developer.intuit.com](https://developer.intuit.com). If you haven't already created an app, you may do so there. Please read on for important notes about client credentials, scopes, and redirect URLs.

#### Client Credentials

Once you have created an app on Intuit's Developer Portal, you can find your credentials (Client ID and Client Secret) under the "Keys" section. These are the values you'll have to give as input in OAuth Settings.

#### Redirect URI
With this app, the typical value would be `http://localhost:3000/callback`, unless you host this sample app in a different way (if you were testing HTTPS, for example).

**Note:** Using `localhost` and `http` will only work when developing, using the sandbox credentials. Once you use production credentials, you'll need to host your app over `https`.

#### Scopes

While you are in `config.json`, you'll notice the scope sections.

```
  "scopes": {
    "sign_in_with_intuit": [
      "openid",
      ...
    ],
    "connect_to_quickbooks": [
      "com.intuit.quickbooks.accounting",
      "com.intuit.quickbooks.payment"
    ],
    "connect_handler": [
      "com.intuit.quickbooks.accounting",
      "com.intuit.quickbooks.payment",
      "openid",
      ...
    ]
  },
```

It is important to ensure that the scopes you are requesting match the scopes allowed on the Developer Portal. For this app to work by default, your app on Developer Portal must support both Accounting and Payment scopes. If you'd like to support Accounting only, simply remove the`com.intuit.quickbooks.payment` scope from `config.json`.

---

### Run your app!

After setting up both Developer Portal and your `config.json`, try launching your app again!

```
node app.cjs
```

All flows should work. This app supports the following flows:

**Sign In With Intuit** - this flow requests OpenID only scopes. Feel free to change the scopes being requested in `config.json`. After authorizing (or if the account you are using has already been authorized for this app), the redirect URL (`/callback`) will parse the JWT ID token, and make an API call to the user information endpoint.

**Connect To QuickBooks** - this flow requests non-OpenID scopes. You will be able to make a QuickBooks API sample call (using the OAuth2 token) on the `/connected` landing page.

---

### Project Structure

In order to find the code snippets you are interested in, here is how the code is organized.

#### Launching the OAuth2 flow

Examples of launching the OAuth2 flow, including passing the right parameters and generating CSRF ant-forgery tokens, can be found in:

```
/routes/sign_in_with_intuit.js
/routes/connect_to_quickbooks.js
/routes/connect_handler.js
```

#### Callback URL

`/routes/callback.js` contains code snippets that receive the authorization code, make the bearer token exchange, and validate the JWT ID token (if applicable). It then redirects to the post-connection landing page, `/routes/connected.js`.

#### Connected

`/routes/connected.js` will make an example OpenID user information call over OAuth2 (assuming the openid scopes were requested). Once loaded, the page allows you to make AJAX API calls over OAuth2.

#### API Calls

`/routes/api_call.js` allows three different API calls to be made over OAuth2:
- **Refresh Call** Use the refresh token to get a new access token.
- **Revoke Call**: revoke the access token, so it no longer can access APIs.

View these code snippets to see how to correctly pass the access token or client credentials (depending on the API call).

