/* Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use 
this file except in compliance with the License. A copy of the License is 
located at

http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an 
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or 
implied. See the License for the specific language governing permissions and 
limitations under the License. */

// Region and IdentityPoolId should be set to your own values
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:f94ae51f-cd0f-41d6-826c-82924e32d12b',
});

var dynamodb = new AWS.DynamoDB();
var params = { TableName: 'VoteAppAggregates' };

function buildChart(){
    /* Create the context for applying the chart to the HTML canvas */
  var g = $("#graph").get(0);
  var ctx = g.getContext("2d");

  /* Set the options for our chart */
  var options = { segmentShowStroke : false,
                  animateScale: true,
                  percentageInnerCutout : 50,
                  showToolTips: true,
                  tooltipEvents: ["mousemove", "touchstart", "touchmove"],
                  tooltipFontColor: "#fff",
                  animationEasing : 'easeOutCirc',
                  responsive: true,
                  maintainAspectRatio: true,
                  legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li style=\"color:<%=segments[i].fillColor%>\"><%=segments[i].label%></li><%}%></ul>"
               
                }

  /* Set the initial data */
  var init = [
    {
        value: 1,
        color: "#3498db",
        highlight: "#2980b9",
        label: "Clinton"
    },
    {
        value: 1,
        color: "#e74c3c",
        highlight: "#c0392b",
        label: "Trump"
    },
    {
        value: 1,
        color: "#2ecc71",
        highlight: "#27ae60",
        label: "Neither"
    }
  ];

  graph = new Chart(ctx).Doughnut(init, options);

  document.getElementById("legend").innerHTML = graph.generateLegend();
}

$(function() {
  // new ShareButton();
  buildChart();
  getData();
  $.ajaxSetup({ cache: false });
  /* Get the data every 3 seconds */
  setInterval(getData, 3000);   
});

function getVotedStatus(callback){
  var votePersonEntry = AWS.config.credentials.identityId;

  
  dynamodb.getItem({
    'TableName': "VotePerson",
    'Key': { 'IdDateHash' : { 'S': votePersonEntry }}
  }, function(err, data) {
    if (err) {
      console.log(err);
    } 
    else {
      console.log("got back", data);

      if(data && data.Item){
        callback(true);
        // console.log("you voted");
      }
      else {
        callback(false);
        // console.log("you not voted"); 
      }
      
    }
  });
}

/* Makes a scan of the DynamoDB table to set a data object for the chart */
function getData() {
  var red = "RED";
  var green = "GREEN";
  var blue = "BLUE";

  dynamodb.scan(params, function(err, data) {
    if (err) {
      console.log(err);
      return null;
    } else {
      var redCount = 0;
      var greenCount = 0;
      var blueCount = 0;

      for (var i in data['Items']) {
        if (data['Items'][i]['VotedFor']['S'] == red) {
          redCount = parseInt(data['Items'][i]['Vote']['N']);
        }
        if (data['Items'][i]['VotedFor']['S'] == green) {
          greenCount = parseInt(data['Items'][i]['Vote']['N']);
        }
        if (data['Items'][i]['VotedFor']['S'] == blue) {
          blueCount = parseInt(data['Items'][i]['Vote']['N']);
        }
      }

      var data = [
        {
            value: blueCount
        },
        {
            value: redCount
        },
        {
            value: greenCount
        }
      ];

      /* Only update if we have new values (preserves tooltips) */
      if (  graph.segments[0].value != data[0].value ||
            graph.segments[1].value != data[1].value ||
            graph.segments[2].value != data[2].value
         )
      {
        graph.segments[0].value = data[0].value;
        graph.segments[1].value = data[1].value;
        graph.segments[2].value = data[2].value;
        graph.update();
        document.getElementById("legend").innerHTML = graph.generateLegend();
      }

    }
  });
}





///non chart stuff
// This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
  // console.log('statusChangeCallback');
  // console.log(response);
  // The response object is returned with a status field that lets the
  // app know the current login status of the person.
  // Full docs on the response object can be found in the documentation
  // for FB.getLoginStatus().
  if (response.status === 'connected') {

    if (response.authResponse) {
      // console.log('You are now logged in.');
     
      // Add the Facebook access token to the Cognito credentials login map.
      AWS.config.region = 'us-east-1'; // Region
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:fd3607b1-9477-4850-ad62-8506aa3c3744',
        Logins: {
          'graph.facebook.com': response.authResponse.accessToken
        }
      });

      // Obtain AWS credentials
      AWS.config.credentials.get(function(){
          getVotedStatus(function(hasVoted){
            loggedIn(hasVoted);
            // console.log("hasVoted", hasVoted);
          });
      });

      testAPI();

    } else {
      console.log('There was a problem logging you in.');
      loggedOut();
    }
    // Logged into your app and Facebook.
    
  } else if (response.status === 'not_authorized') {
    // The person is logged into Facebook, but not your app.
    // document.getElementById('status').innerHTML = 'Please log ' +
      // 'into this app.';
    loggedOut();
  } else {
    loggedOut();
  }
}

function loggedOut(){
  $("#loggedOut").addClass("showing");
  $("#loggedInHasNotVoted").removeClass("showing");
  $("#loggedInHasVoted").removeClass("showing");

}

function loggedIn(hasVoted){
  $("#loggedOut").removeClass("showing");

  if(hasVoted){
      $("#loggedInHasVoted").addClass("showing");
      $("#loggedInHasNotVoted").removeClass("showing");
  }
  else {
      $("#loggedInHasVoted").removeClass("showing");
      $("#loggedInHasNotVoted").addClass("showing");
  }
}

function castVote(color){
  var apigClient = apigClientFactory.newClient({
      accessKey: AWS.config.credentials.accessKeyId,
      secretKey: AWS.config.credentials.secretAccessKey,
      sessionToken: AWS.config.credentials.sessionToken, //OPTIONAL: If you are using temporary credentials you must include the session token
      region: 'us-east-1' // OPTIONAL: The region where the API is deployed, by default this parameter is set to us-east-1
  });

  loggedIn(true);
  var params = {};
  var body = {vote: color};
  var additionalParams = {};

  apigClient.votePost(params, body, additionalParams)
      .then(function(result){
          // console.log(result.data, arguments)
      }).catch( function(result){
          console.log("no", arguments)

      });
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });
}



window.fbAsyncInit = function() {
  FB.init({
    appId      : '164334634014767',
    cookie     : true,  // enable cookies to allow the server to access 
                        // the session
    xfbml      : true,  // parse social plugins on this page
    version    : 'v2.5' // use graph api version 2.5
  });

  // Now that we've initialized the JavaScript SDK, we call 
  // FB.getLoginStatus().  This function gets the state of the
  // person visiting this page and can return one of three states to
  // the callback you provide.  They can be:
  //
  // 1. Logged into your app ('connected')
  // 2. Logged into Facebook, but not your app ('not_authorized')
  // 3. Not logged into Facebook and can't tell if they are logged into
  //    your app or not.
  //
  // These three cases are handled in the callback function.

  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });

};

setTimeout(function(){
  // Load the SDK asynchronously
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
}, 1800);//delay for animation



// Here we run a very simple test of the Graph API after login is
// successful.  See statusChangeCallback() for when this call is made.
function testAPI() {
  // console.log('Welcome!  Fetching your information.... ');
  FB.api('/me', function(response) {
    // console.log('Successful login for: ' + response.name);
    document.getElementById('status').innerHTML =
      'Hi ' + response.name + '. Click to cast your vote.';
  });
}
