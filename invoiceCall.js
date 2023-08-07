var invoiceData = {};
var custData = {};
const fetch = require("node-fetch");
const axios = require("axios");
var tools = require("./tools/tools.js");

// Define the customerCall function
function customerCall(customerRefValue) {
  console.log("CustomerRef.value in customerCall: " + customerRefValue);

  // Replace the URL below with the actual API endpoint you want to call
  const apiUrl =
    "http://localhost:3000/connected/api_call/customer" + customerRefValue;

  // Use the 'fetch' API to make an HTTP GET request
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      // Save the data to the custData variable
      custData = data;

      // Display the data on the HTML page (optional)
      console.log(custData);
      // Assuming you have an element with the ID "result" to display the data
      document.getElementById("result").innerHTML = JSON.stringify(
        custData,
        null,
        2
      );
    })
    .catch((error) => {
      console.error("Error making API request:", error);
    });
}

async function invoiceCall() {
  console.log("\n\n\ninside invoice call function of invoiceCall\n\n\n");
  console.log("Loading...");

  // Replace the URL below with the actual API endpoint you want to call
  const apiUrl = "http://localhost:3000/connected/invoiceCall";

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    // Process the data received from the server
    console.log("Response Data:", data);
  } catch (error) {
    console.log("error making invoice call request : ", error);
  }
}

// Export the invoiceCall function to make it available for other modules (optional)
module.exports = invoiceCall;
