console.log('Loading event');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context) {
    console.log(JSON.stringify(context));
  //console.log("clientID = " + context.identity.cognitoIdentityId);
  // var twilio = require('twilio');
  var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10', region: 'us-east-1'});

  /* Make sure we have a valid vote (one of [RED, GREEN, BLUE]) */
  console.log(event);
  var votedFor = event['vote'].toUpperCase().trim();

  if (['RED', 'GREEN', 'BLUE'].indexOf(votedFor) >= 0) {
    var offset = -8.0
    var clientDate = new Date();
    var utc = clientDate.getTime() + (clientDate.getTimezoneOffset() * 60000);
    var d = new Date(utc + (3600000*offset));
    var dayHash = d.getMonth() + "_" + d.getDay() + "_" + d.getFullYear();
    votedFor = dayHash + "_" + votedFor;
    /* Add randomness to our value to help spread across partitions */
    votedForHash = votedFor + "." + Math.floor((Math.random() * 10) + 1).toString();
    /* ...updateItem into our DynamoDB database */
    var tableName = 'VoteApp';
    dynamodb.updateItem({
      'TableName': tableName,
      'Key': { 'VotedFor' : { 'S': votedForHash }},
      'UpdateExpression': 'add #vote :x',
      'ExpressionAttributeNames': {'#vote' : 'Votes'},
      'ExpressionAttributeValues': { ':x' : { "N" : "1" } }
    }, function(err, data) {
      if (err) {
        console.log(err);
        context.fail(err);
      } else {
        // var resp = new twilio.TwimlResponse();
        // resp.message("Thank you for casting a vote for " + votedFor);
        context.done(null, "success");
        console.log("Vote received for %s", votedFor);
      }
    });
  } else {
    console.log("Invalid vote received (%s)", votedFor);
    context.fail("Invalid vote received");
  }
}