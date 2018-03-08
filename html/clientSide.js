var paddle1 = {
  taken : false,
  color : "#444444",
  x : 20,
  y : 150,
  xMin: 0,
  yMin: 0,
  xMax: 400,
  yMax: 400,
  score: 0
};

var paddle2 = {
  taken : false,
  color : "#444444",
  x : 770,
  y : 150,
  xMin: 400,
  yMin: 0,
  xMax: 800,
  yMax: 400,
  score: 0
};

var puck = {
  x : 400,
  y : 200,
  radius : 7
};

var puckStart = {
  x: 400,
  y: 200
};

var userPaddle = '';

var paddleWidth = 10;
var paddleHeight = 75;

var fontPointSize = 30;
var editorFont = "Arial";
var canvas = document.getElementById("canvas1");

// Make a function to draw the canvas
var drawCanvas = ()=>{
  var context = canvas.getContext("2d");


  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height); //Draw background

  context.font = "" + fontPointSize + "pt " + editorFont;


  // Draw paddle1
  context.fillStyle = paddle1.color;
  context.fillRect(paddle1.x, paddle1.y, paddleWidth, paddleHeight);

  // Draw paddle2
    context.fillStyle = paddle2.color;
  context.fillRect(paddle2.x, paddle2.y, paddleWidth, paddleHeight);

  context.fillStyle = "white";
  context.strokeStyle = "white";

  // Draw puck
  context.beginPath();
  context.arc(puck.x, puck.y, puck.radius, 0, 2*Math.PI);
  context.stroke();
  context.fill();

  //Draw Scoreboard:
  context.fillStyle = "white";
  context.fillText("scores", 340, 25);
  context.fillText( paddle1.score, 340, 65);
  context.fillText(paddle2.score, 435, 65);
}

var keysDown = {
  right : false,
  left : false,
  up : false,
  down : false
};

// Handle keypress
document.addEventListener("keydown", (key)=>{
  console.log(key);
  switch (key.key) {
    case "ArrowRight":
      keysDown.right = true;
      break;
    case "ArrowUp":
      keysDown.up = true;
      break;
    case "ArrowLeft":
      keysDown.left = true;
      break;
    case "ArrowDown":
      keysDown.down = true;
      break;
  }

  drawCanvas();
  // document.addEventListener("keyup", (key)=>{
  //   switch (key.key) {
  //     case "ArrowRight"
  //   }
  // });
  //  console.log(key);
});

document.addEventListener("keyup", (key)=> {
  console.log(key);
  switch (key.key) {
    case "ArrowRight":
      keysDown.right = false;
      break;
    case "ArrowUp":
      keysDown.up = false;
      break;
    case "ArrowLeft":
      keysDown.left = false;
      break;
    case "ArrowDown":
      keysDown.down = false;
      break;
  }
});

function handleTimer() {

  var paddle;

  // If user has control of a paddle
  if (userPaddle == "paddle1") {
    paddle = paddle1;
  } else if (userPaddle == "paddle2") {
    paddle = paddle2;
  } else {
    return;
  }



  // Check for keys which are currently pressed, and move the paddle accordingly
  if (keysDown.right == true) {
    paddle.x += 4;
  }
  if (keysDown.left == true) {
    paddle.x -= 4;
  }
  if (keysDown.up == true) {
    paddle.y -= 4;
  }
  if (keysDown.down == true) {
    paddle.y += 4;
  }

  // Check if paddle went past x boundaries
  if (paddle.x + paddleWidth > paddle.xMax) {
    paddle.x = paddle.xMax - paddleWidth;
  } else if (paddle.x < paddle.xMin) {
    paddle.x = paddle.xMin;
  }

  //Check if paddle went past y boundaries
  if (paddle.y + paddleHeight > paddle.yMax) {
    paddle.y = paddle.yMax - paddleHeight;
  } else if (paddle.y < paddle.yMin) {
    paddle.y = paddle.yMin;
  }

  var data = {paddle: userPaddle, x: paddle.x, y: paddle.y};


  // Tell the server about the new position of the paddle
  socket.emit("positionData", JSON.stringify(data));



  drawCanvas();
}

function handleClaimLeftButton() {
  var data = "paddle1"
  // Request to get the left paddle
  socket.emit('playerRegister', JSON.stringify(data));
}

function handleClaimRightButton() {
  var data = "paddle2"
  // Request to get the left paddle
  socket.emit('playerRegister', JSON.stringify(data));
}

// On first load
document.addEventListener("DOMContentLoaded", ()=>{
  // Request the current information from the server
  socket.emit('initialSetup');

});

var socket = io('http://' + window.document.location.host);

socket.on('playerRegister', (reply)=>{
  var data = JSON.parse(reply);
  console.log(data);
  switch (data.claimStatus) {
    case "paddle1":
      paddle1.color = data.paddle.color;
      userPaddle = "paddle1";
      var rightButton = document.getElementById("playButtonRight");
      var leftButton = document.getElementById("playButtonLeft");

      // Make right button greyed out
      rightButton.style.backgroundColor = "grey";
      rightButton.onclick = ()=>{}; // Make right button do nothing


      leftButton.value = "Release"
      leftButton.onclick = ()=>{
        // Request to release paddle1
      };
      break;
    case "paddle2":
      paddle2.color = data.paddle.color;
      userPaddle = "paddle2";
      break;
  }
});

// Constant update of puck and paddles
socket.on("positionData", (respData)=>{
  var data = JSON.parse(respData);
  
  paddle1.x = data.paddle1.x;
  paddle1.y = data.paddle1.y;
  paddle2.x = data.paddle2.x;
  paddle2.y = data.paddle2.y;
  puck.x = data.puck.x;
  puck.y = data.puck.y;
  drawCanvas();
});

//Scoreboard socket:
socket.on("scoreBoard", (respData)=>{
  var data = JSON.parse(respData);
  console.log("ANDDDDD");
  paddle1.score = data.score1;
  paddle2.score = data.score2;
  drawCanvas();

});

// For initial setup of puck and paddles
socket.on('initialSetup', (reply)=>{
  var data = JSON.parse(reply);
  console.log(data);

  // Update paddle1
  paddle1.x = data.paddle1.x;
  paddle1.y = data.paddle1.y;
  paddle1.color = data.paddle1.color;
  paddle1.taken = data.paddle1.taken;
  if (paddle1.taken == true) {
    document.getElementById("playButtonLeft").style.backgroundColor = "grey";
  }

  // Update paddle2
  paddle2.x = data.paddle2.x;
  paddle2.y = data.paddle2.y;
  paddle2.color = data.paddle2.color;
  paddle2.taken = data.paddle2.taken;
  if (paddle2.taken == true) {
    document.getElementById("playButtonLeft").style.backgroundColor = "grey";
  }

  // Update puck
  puck.x = data.puck.x;
  puck.y = data.puck.y;

  // Create interval event which draws the canvas and will handle paddle movement
  // Wait until response so it doesn't draw before it has the proper data
  timer = setInterval(handleTimer, 25);
});
