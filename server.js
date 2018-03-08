// I deleted these lines
const http = require("http");
const fs = require("fs");
const url = require("url");
const app = http.createServer(handler);
const io = require("socket.io")(app);

const ROOT_DIR = "html";

const PORT = process.env.PORT || 3000

function handler(request, response) {
  let urlObj = url.parse(request.url, true, false)
  console.log("\n============================")
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let receivedData = ""

  //attached event handlers to collect the message data
  request.on("data", function(chunk) {
    receivedData += chunk
  })

  request.on("end", function() {
    console.log("REQUEST END: ")
    console.log("received data: ", receivedData)
    console.log("type: ", typeof receivedData)

    //if it is a POST request then echo back the data.
    /*
  A post message will be interpreted as either a request for
  the location of the moving box, or the location of the moving box
  being set by a client.
  If the .x and .y attributes are >= 0
  treat it as setting the location of the moving box.
  If the .x and .y attributes are < 0 treat it as a request (poll)
  for the location of the moving box.
  In either case echo back the location of the moving box to whatever client
  sent the post request.

  Can you think of a nicer API than using the numeric value of .x and .y
  to indicate a set vs. get of the moving box location.
  */

    if (request.method == "GET") {
      //handle GET requests as static file requests
      fs.readFile(ROOT_DIR + urlObj.pathname, function(err, data) {
        if (err) {
          //report error to console
          console.log("ERROR: " + JSON.stringify(err))
          //respond with not found 404 to client
          response.writeHead(404)
          response.end(JSON.stringify(err))
          return
        }
        response.writeHead(200, {
          "Content-Type": get_mime(urlObj.pathname)
        })
        response.end(data)
      })
    }
  })
}

app.listen(PORT);

// Model for paddles
var paddle1 = {
  taken : false,
  color : "#444444",
  x : 20,
  y : 150,
  score: 0
};

var paddle2 = {
  taken : false,
  color : "#444444",
  x : 770,
  y : 150,
  score: 0
};

var paddleWidth = 10;
var paddleHeight = 75;

var puck = {
  x : 400,
  y : 200,
  radius : 7,
  xVelocity : 0,
  yVelocity: 0
};

var puckStart = {
  x: 400,
  y: 200
};

flag = true;
// To tell clients about position constantly
setInterval(()=>{

  // Move the puck based on its velocity
  //if(flag){
	puck.x += puck.xVelocity;
	puck.y += puck.yVelocity;
	//flag=false;
  //}

  // If the puck is "inside" a paddle, it collides

  // Check for collision with paddle1
	if(puck.y >=paddle1.y && puck.y <= paddle1.y + paddleHeight  && (
      (puck.x - puck.radius <= paddle1.x + paddleWidth && puck.x - puck.radius >= paddle1.x) ||
      (puck.x + puck.radus >= paddle1.x && puck.x + puck.radius <= paddle1.x + paddleWidth)
    )){
	  puck.xVelocity = -puck.xVelocity;

    // Move the puck slightly to ensure it doesn't get hit again by the paddle
    puck.x += 1.5*puck.xVelocity;
  }

  // Check for collision with paddle2
  if(puck.y >=paddle2.y && puck.y <= paddle2.y + paddleHeight  && (
      (puck.x - puck.radius <= paddle2.x + paddleWidth && puck.x - puck.radius >= paddle2.x) ||
      (puck.x + puck.radus >= paddle2.x && puck.x + puck.radius <= paddle2.x + paddleWidth)
    )){
    puck.xVelocity = -puck.xVelocity;

    // Move the puck slightly to ensure it doesn't get "stuck" inside the paddle
    puck.x += 1.5*puck.xVelocity;
  }


  //Check for Edge Collision:
  if( puck.y - puck.radius <= 0){
	  puck.yVelocity = -puck.yVelocity;
  }
  if(puck.y + puck.radius >= 400){
	  puck.yVelocity = -puck.yVelocity;
  }
  if(puck.x - puck.radius <= 0){
	  puck.xVelocity = -puck.xVelocity;
  }
  if(puck.x + puck.radius >= 800){
	  puck.xVelocity = -puck.xVelocity;
  }

  // Tell the clients about the position of everything
  var data = {paddle1: paddle1, paddle2: paddle2, puck: puck};
  io.emit("positionData", JSON.stringify(data));
},25);


io.on('connect', (socket)=> {
  console.log("new connection");

  // For initialization
  socket.on('initialSetup', ()=>{
    var data = {
      puck : puck,
      paddle1: paddle1,
      paddle2: paddle2
    };
    // Send data to socket that requested only
    socket.emit('initialSetup', JSON.stringify(data));
  });

  socket.on("positionData", (positionData)=>{
    var data = JSON.parse(positionData);

    if (data.paddle == "paddle1") {
      paddle1.x = data.x;
      paddle1.y = data.y;
    } else {
      paddle2.x = data.x;
      paddle2.y = data.y;
    }

  });

  socket.on('playerRegister', (reply)=>{
    var respData = JSON.parse(reply);

    var data = "";

    // Check if they can get their request
    if (respData == "paddle1" && paddle1.taken == false) {

      // Give them the left paddle
      paddle1.taken = true;
      paddle1.color = "white";
      data = {claimStatus: "paddle1", paddle: paddle1};

      // If paddle1 is also taken now, start the game
      if (paddle2.taken == true) {
        puck.xVelocity = -5;
        puck.yVelocity = -5;
      }
    } else if (respData == "paddle2" && paddle2.taken == false) {

      // Give them the right paddle
      paddle2.taken = true;
      paddle2.color = "white";
      data = {claimStatus: "paddle2", paddle: paddle2};

      // If paddle1 is also taken now, start the game
      if (paddle1.taken == true) {
        puck.xVelocity = -5;
        puck.yVelocity = -5;
      }
    } else {
      data = {claimStatus: "paddlesTaken"};
    }

    // Tell the client which paddle they got, or if they got none
    socket.emit('playerRegister', JSON.stringify(data));
  });

  //Tell client the score:
  socket.on("scoreBoard", ()=>{

	if( puck.y - puck.radius <= 0){
	    paddle2.score++;
    }
	if( puck.y + puck.radius >=400){
		paddle1.score++;
	}
	data = { score1 : paddle1.score , score2 : paddle2.score};

    // Send data to socket that requested only
    io.emit("scoreBoard", JSON.stringify(data));
  });
});

const MIME_TYPES = {
  css: "text/css",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  txt: "text/plain"
};

function get_mime(filename) {
  let ext, type
  for (let ext in MIME_TYPES) {
    type = MIME_TYPES[ext]
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return type
    }
  }
  return MIME_TYPES["txt"]
}

console.log("Server Running at PORT: 3000  CNTL-C to quit");
console.log("To Test: open several browsers at: http://localhost:3000/assignment3.html")
