'use strict';

var url = "https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info";
var tableName = "CS499Hack2BroncoExpress";
var updatedTimeTableName = "CS499Hack2Updated";

var AWS = require("aws-sdk");
AWS.config.update({
    region: "us-west-2"
});
var allBusesID = [];
var docClient = new AWS.DynamoDB.DocumentClient();

module.exports.PullBusData = (event, context, callback) => {
  var request = require('request');
  var response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };
  request(url, function (error, res, body) {
      if (error) {
          console.error(error);
          response.statusCode = 500;
          response.body = JSON.stringify(error, null, 2);
      } else {
          var allObjects = JSON.parse(body);
          if (allObjects.length > 0) {
              updateUpdatedTime(allObjects, response, callback);
          } else {
              response.statusCode = 500;
              response.body = "empty Source.";
              callback(null, response);
          }
      }
  });
};

module.exports.hello = (event, context, callback) => {
    var response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Go Serverless v1.0! Your function executed successfully!',
            input: event,
        }),
    };
    callback(null, response);

};

module.exports.GetLatestBusData = (event, context, callback) => {
    var response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*"
        },
        body: "success"
    };
    getUpdatedTime(response, callback);
};

function getUpdatedTime(response, callback) {
    var params = {
        TableName: updatedTimeTableName,
        KeyConditionExpression: "#pk = :pkValue",
        ExpressionAttributeNames:{
            "#pk": "LastUpdated"
        },
        ExpressionAttributeValues: {
            ":pkValue": "OnlyOneValue"
        }
    };
    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            response.statusCode = 500;
            response.body = JSON.stringify(err, null, 2);
            callback(null, response);

        } else {
            console.log("Query succeeded.");
            if (data.Items.length < 1) {
                response.statusCode = 500;
                response.body = "Corrupted updated time table."
                callback(null, response);
            } else {
                getAllBusesTime(data.Items[data.Items.length - 1].JustNumber, response, callback);
            }
        }
    });
}

function getAllBusesTime(lastUpdatedTime, response, callback) {
    var params = {
        TableName: tableName,
        ProjectionExpression: "#pk, #sk, Latitude, Longitude, Route, Logo",
        FilterExpression: "#sk >= :sk_time",
        ExpressionAttributeNames: {
            "#pk": "ID",
            "#sk": "Timestamp"
        },
        ExpressionAttributeValues: {
            ":sk_time": lastUpdatedTime
        }
    };
    docClient.scan(params, function (err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            response.statusCode = 500;
            response.body = JSON.stringify(err, null, 2);
            callback(null, response);

        } else {
            console.log("Query succeeded.");
            var outputInArray = [];
            for (var i = 0; i < data.Items.length; i++) {
                outputInArray.push({
                    "id": data.Items[i].ID,
                    "logo": data.Items[i].Logo,
                    "lat": data.Items[i].Latitude,
                    "lng": data.Items[i].Longitude,
                    "route": data.Items[i].Route
                });
            }
            response.body = JSON.stringify(outputInArray);
            callback(null, response);
        }
    });
}

function updateUpdatedTime(allObjects, response, callback) {
    var params = {
        TableName: updatedTimeTableName,
        Key: {
            "LastUpdated": "OnlyOneValue",
        },
        UpdateExpression: "set JustNumber = :time_now",
        ExpressionAttributeValues:{
            ":time_now": Date.now()
        },
        ReturnValues: "UPDATED_NEW"
    };
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            response.statusCode = 500;
            response.body = JSON.stringify(err, null, 2);
            callback(null, response);
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            insertingElements(allObjects, response, callback);
        }
    });
}

function insertingElements(allObjects, response, callback) {
    for (var i = 0; i < allObjects.length; i++) {
        var params = {
            TableName: tableName,
            Item: {
                "ID": allObjects[i].id,
                "Timestamp": Date.now(),
                "Route":  allObjects[i].route,
                "Latitude":  allObjects[i].lat,
                "Longitude":  allObjects[i].lng,
                "Logo":  allObjects[i].logo,
            }
        };
        docClient.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Added item:", JSON.stringify(data, null, 2));
            }
        });
    }
    response.body = "Adding all objects";
    callback(null, response);
}
