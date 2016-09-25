console.log('Loading event');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context) {
  if(!context.identity || !context.identity.cognitoIdentityId) {
    console.log("No id");
    context.fail("No id");
    return;
  } 
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
    var votePersonEntry = dayHash + "_" + context.identity.cognitoIdentityId

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
      } 
      else {
        console.log("updating vote id", votePersonEntry);

        dynamodb.putItem({
          'TableName': "VotePerson",
          'Item': { 'IdDateHash' : { 'S': votePersonEntry }}
        }, function(err, data) {
          if (err) {
            console.log(err);
            context.fail(err);
          } 
          else {
            context.done(null, "{'status': 'success'}");
            console.log("Vote received for %s by %s", votedFor, votePersonEntry);
          }
        });

      }
    });

    


  } else {
    console.log("Invalid vote received (%s)", votedFor);
    context.fail("Invalid vote received");
  }
}