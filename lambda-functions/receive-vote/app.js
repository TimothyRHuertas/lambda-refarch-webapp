console.log('Loading event');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

function castVote(context, dynamodb, votedFor, votePersonEntry){
  /* Add randomness to our value to help spread across partitions */
  votedForHash = votedFor + "." + Math.floor((Math.random() * 10) + 1).toString();

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
}

exports.handler = function(event, context) {
  if(!context.identity || !context.identity.cognitoIdentityId) {
    console.log("No id");
    context.fail("No id");
    return;
  } 

  var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10', region: 'us-east-1'});
  var votedFor = event['vote'].toUpperCase().trim();

  if (['RED', 'GREEN', 'BLUE'].indexOf(votedFor) >= 0) {
    votedFor = votedFor;
    var votePersonEntry = context.identity.cognitoIdentityId;

    dynamodb.getItem({
        'TableName': "VotePerson",
        'Key': { 'IdDateHash' : { 'S': votePersonEntry }}
      }, function(err, data) {
        if (err) {
          console.log(err);
          context.fail(err);
        } 
        else {
          console.log("got back", data);

          if(data && data.Item){
            context.fail("duplicate vote attempt", votePersonEntry);
          }
          else {
            castVote(context, dynamodb, votedFor, votePersonEntry);  
          }
          
        }
      });

    

  } else {
    console.log("Invalid vote received (%s)", votedFor);
    context.fail("Invalid vote received");
  }
}