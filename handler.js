
'use strict';
var request = require('request');

var response = {
    statusCode: 200,
    headers: {
        "Access-Control-Allow-Origin" : "*" // Required for CORS support to work
    },
    body: "success"
};
var url = "https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info";
var tableName = "CS499Hack2BroncoExpress";

module.exports.PullData = (event, context, callback) => {
    request(url, function (error, response, body) {
        if (error) {
            console.error(error);
            res.send("getting XML Error");
        } else {
            var allObjects = JSON.parse(body);
            for (var i = 0; i < allObjects.length; i++) {
                console.log(allObjects[i]);
            }
        }
    });
};

module.exports.hello = (event, context, callback) => {


  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
