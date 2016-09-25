console.log('Loading event');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context) {

    var totalRed = 0;
    var totalGreen = 0;
    var totalBlue = 0;
        //west coastin
    var offset = -8.0
    var clientDate = new Date();
    var utc = clientDate.getTime() + (clientDate.getTimezoneOffset() * 60000);
    var d = new Date(utc + (3600000*offset));
    var dayHash = d.getMonth() + "_" + d.getDate() + "_" + d.getFullYear();

    event.Records.forEach(function(record) {

        if(record.dynamodb['NewImage']){
                var votedForHash = record.dynamodb['NewImage']['VotedFor']['S'];
            var numVotes = record.dynamodb['NewImage']['Votes']['N'];

            // Determine the color on which to add the vote
            if (votedForHash.indexOf(dayHash+"_RED") > -1) {
                votedFor = "RED";
                totalRed += parseInt(numVotes);
            } else if (votedForHash.indexOf(dayHash+"_GREEN") > -1) {
                votedFor = "GREEN";
                totalGreen +=  parseInt(numVotes);
            } else if (votedForHash.indexOf(dayHash+"_BLUE") > -1) {
                votedFor = "BLUE";
                totalBlue += parseInt(numVotes);
            } else {
                console.log("Invalid vote: ", votedForHash);
            }
        }
        
    });

    // Update the aggregation table with the total of RED, GREEN, and BLUE
    // votes received from this series of updates

    var aggregatesTable = 'VoteAppAggregates';
    if (totalRed > 0) updateAggregateForColor("RED", totalRed, dayHash);
    if (totalBlue > 0) updateAggregateForColor("BLUE", totalBlue, dayHash);
    if (totalGreen > 0) updateAggregateForColor("GREEN", totalGreen, dayHash);

    console.log('Updating Aggregates Table', totalRed);

    function updateAggregateForColor(votedFor, numVotes, dayHash) {
        votedFor = dayHash + "_" + votedFor;

        console.log("Updating Aggregate Color ", votedFor);
        console.log("For NumVotes: ", numVotes);

        dynamodb.updateItem({
            'TableName': aggregatesTable,
            'Key': { 'VotedFor' : { 'S': votedFor }},
            'UpdateExpression': 'add #vote :x',
            'ExpressionAttributeNames': {'#vote' : 'Vote'},
            'ExpressionAttributeValues': { ':x' : { "N" : numVotes.toString() } }
        }, function(err, data) {
            if (err) {
                console.log(err);
                context.fail("Error updating Aggregates table: ", err)
            } else {
                console.log("Vote received for %s", votedFor);
                context.succeed("Successfully processed " + event.Records.length + " records.");
            }
        });
    }
};