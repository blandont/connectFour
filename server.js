// Blandon Tang
// 10126829 W2020 SENG513
// Server side code
/**
 * 
 * TODO: the gameboard should be a unique gameboard per room - right now it is a global space gameboard across all rooms
 * 
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
var chance = require('chance').Chance();

var connectedUsers = {}; // object of all connected user objects
var chatHistory = [];
var onlineRooms = [];
var randomRooms = [];

app.use(express.static('assets'));

// Whenever user makes get request to server
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	console.log('A user has connected with ID: ' + socket.id);
	// console.log(connectedUsers);
	
	socket.on('disconnect', function() {
		var userData = connectedUsers[socket.id];
		if (typeof userData !== 'undefined') { // if element does not exist
			socket.leave(connectedUsers[socket.id]);
			io.to(userData.room).emit('message', {
				username: 'System',
				text: userData.username + ' has left the chat',
				timestamp: moment().valueOf(),
				color: '#808080'
			});
			delete connectedUsers[socket.id];
			io.emit('usersPresent', connectedUsers); // write clientside userlist
			io.emit('roomsOnline', onlineRooms); // write clientside room list
			io.emit('randomRoomsOnline', randomRooms); // write clientside randomroom list
			// console.log(connectedUsers);
		}
	});

	// socket.emit('displayChatLog', {chatHistory});
	socket.on('createNewRoom', function(req){
		onlineRooms.push(req.roomName);
		// console.log(req.roomName);
		// console.log(onlineRooms);
	});

	socket.on('newUser', function(req, callback) {
		// let nameTaken = false;
		// req.username = chance.animal();
		// if (req.cookie == false){
		// 	req.username = chance.animal(); // generate new name if no cookie
		// }
        // connectedUsers.push(socket.id);
        // connectedUsers[socket.id]['username'] = newUserName;
        // console.log(connectedUsers);
		
		// generate another name if taken - for connect 4 duplicate name is okay
		// Object.keys(connectedUsers).forEach(function(socketID) {
		// 	while (connectedUsers[socketID].username.toLowerCase() === req.username.toLowerCase()) {
		// 		req.username = chance.animal();
		// 		console.log("name taken, trying new name: " + req.username);
        //     }
		// });
		
		// If random was selected
		if (req.random == true){
			// console.log("random was selected!");
			// for this to work - a room with a completed game MUST be deleted on game completion (to prevent joining a finished game)

			if (randomRooms.length === 0){
				// console.log("No random rooms currently exist");
				randomRooms.push("randomroom" + Math.floor(Math.random() * 101) + "" + Math.floor(Math.random() * 101) + "" + Math.floor(Math.random() * 101)); // add a random room
				// console.log(randomRooms);
			}

			// check list of random rooms to see if any room has an empty spot (contains one person)
			let joinedRandRoom = false;
			// for (i=0; i<randomRooms.length; i++){
			while (joinedRandRoom == false){
				for (i=0; i<randomRooms.length; i++){
					req.room = randomRooms[i]; // set room of user to random room
					
					socket.join(randomRooms[i]);
					// console.log(randomRooms);
					if (io.nsps['/'].adapter.rooms[randomRooms[i]].length > 2){
						socket.leave(randomRooms[i]); // if room is full then leave room
					}
					else{
						joinedRandRoom = true;
						if (io.nsps['/'].adapter.rooms[randomRooms[i]].length > 1){ // if 1 person already in room
							socket.emit('assignment', {
								value: 'Y'
							});
						}
						else{
							socket.emit('assignment', {
								value: 'X'
							});
						}
					}
				}
				if (joinedRandRoom == false){ // create a new room when all existing rooms are full
					randomRooms.push("randomroom" + Math.floor(Math.random() * 101) + "" + Math.floor(Math.random() * 101) + "" + Math.floor(Math.random() * 101));
				}
				connectedUsers[socket.id] = req;
				connectedUsers[socket.id].userID = socket.id;
			}
			io.emit('usersPresent', connectedUsers); // send a data struct of all current users to client
			io.emit('roomsOnline', onlineRooms); // write clientside room list
			io.emit('randomRoomsOnline', randomRooms); // write clientside randomroom list
			// io.to(`${socket.id}`).emit('showChatLog', chatHistory); // emit only to new joinee

			socket.broadcast.to(req.room).emit('message', {
				username: 'System',
				text: req.username + ' has joined!',
				timestamp: moment().valueOf(),
				color: '#808080'
			});
			callback({
				roomExists: true
			});
		}

		// Random not selected (join game selected)
		else if (req.random == false){
			console.log("join game selected");
			// Throw error if room does not exist in onlinerooms list
			if(onlineRooms.indexOf(req.room) == -1){
				console.log(req.room + " room does not exist");
				callback({
					roomExists: false,
					error: 'Invalid game code!'
				});
			}
			else{ // otherwise join game
				// console.log(req.username + " has joined the chatroom");
				connectedUsers[socket.id] = req;
				connectedUsers[socket.id].userID = socket.id;
				console.log(onlineRooms);

				socket.join(req.room);
				var connectedClients = io.nsps['/'].adapter.rooms[req.room];

				// Get number of clients in chatroom
				if (connectedClients.length > 2){ // max 2 ppl a room
					callback({
						roomExists: false,
						error: 'The gameroom is already full'
					});
				}
				else{
					io.emit('usersPresent', connectedUsers); // send a data struct of all current users to client
					io.emit('roomsOnline', onlineRooms); // write clientside room list
					io.emit('randomRoomsOnline', randomRooms); // write clientside randomroom list
					// io.to(`${socket.id}`).emit('showChatLog', chatHistory); // emit only to new joinee

					// if (connectedUsers.length == 1){
					// 	io.in(connectedUsers[socket.id].room).emit('gameOver', 'draw');
					// }
					
					if (connectedClients.length > 1){ // if 1 person already in room
						socket.emit('assignment', {
							value: 'Y'
						});
					}
					else{
						socket.emit('assignment', {
							value: 'X'
						});
					}

					socket.broadcast.to(req.room).emit('message', {
						username: 'System',
						text: req.username + ' has joined!',
						timestamp: moment().valueOf(),
						color: '#808080'
					});

					callback({
						roomExists: true
					});
				}
				
			}
		}
	
	});

	
	socket.emit('message', {
		username: 'System',
		text: 'Stay awhile and listen <br><i>/nick</i> - change your nickname<br><i>/nickcolor</i> - change nickname color',
		timestamp: moment().valueOf(),
		color: '#808080'
	});

	socket.on('message', function(message) {
		message.timestamp = moment().valueOf();
		io.to(connectedUsers[socket.id].room).emit('message', message);
		chatHistory.push({user:message.username, msg:message.text, time:message.timestamp});
		// console.log(chatHistory);

		// User has indicated a nickname change
		if ((message.text.charAt(0) ==='/') && (message.text.indexOf("nick ") == 1)){
			// console.log("change the nickname");
			let userInput = message.text.split(' ');
			if ((userInput.length != 2) || (userInput[1].length < 1) || (userInput[1].charAt(0) == ' ')) {
				socket.emit('message', {
					username: 'System',
					text: 'Invalid format, please use: /nick new_nickname',
					timestamp: moment().valueOf(),
					color: '#808080'
				});
			}
			else if (userInput[1].toLowerCase() === 'system'){
				socket.emit('message', {
					username: 'System',
					text: 'Sorry, that name cannot be selected',
					timestamp: moment().valueOf(),
					color: '#808080'
				});
			}
			else{
				let newName = userInput[1];
				let nameInUse = false;
				Object.keys(connectedUsers).forEach(function(socketID) {
					if (connectedUsers[socketID].username.toLowerCase() === newName.toLowerCase()) {
						nameInUse = true;
					}
				});
				if (nameInUse == false){
					connectedUsers[socket.id].username = newName;
					console.log("Name changed to: " + newName);
					io.emit('usersPresent', connectedUsers);
					io.emit('roomsOnline', onlineRooms); // write clientside room list
					io.emit('randomRoomsOnline', randomRooms); // write clientside randomroom list
					// console.log(connectedUsers);
				}
				else{
					socket.emit('message', {
						username: 'System',
						text: 'Sorry, the selected nickname is taken',
						timestamp: moment().valueOf(),
						color: '#808080'
					});
				}
			}
		}

		// User has indicated a nickname color change
		else if ((message.text.charAt(0) ==='/') && (message.text.indexOf("nickcolor ") == 1)){
			let userInput = message.text.split(' ');
			if ((userInput.length != 2) || (userInput[1].length != 6)){
				socket.emit('message', {
					username: 'System',
					text: 'Invalid format, please use: /nickcolor RRGGBB',
					timestamp: moment().valueOf(),
					color: '#808080'
				});
			}
			else{
				let rgbValue = userInput[1];
				rgbValue  = "#" + rgbValue;
				// True if valid hex code
				if (/^#[0-9A-F]{6}$/i.test(rgbValue)){
					// console.log('valid RGB value: ' + rgbValue);
					connectedUsers[socket.id].color = rgbValue;
					io.emit('usersPresent', connectedUsers);
					io.emit('roomsOnline', onlineRooms); // write clientside room list
					io.emit('randomRoomsOnline', randomRooms); // write clientside randomroom list
					// console.log(connectedUsers);
				}
				else{
					socket.emit('message', {
						username: 'System',
						text: 'Please enter a valid hex color code',
						timestamp: moment().valueOf(),
						color: '#808080'
					});
				}
				
			}
		}

		// Invalid slash command
		else if (message.text.charAt(0) ==='/'){
			// console.log("Invalid / command");
			socket.emit('message', {
				username: 'System',
				text: 'Invalid slash command or invalid format',
				timestamp: moment().valueOf(),
				color: '#808080'
			});
		}
	});

	socket.on('validMove', function(validmove) {
		// console.log('valid move was made');
		// console.log(connectedUsers[socket.id].room);
		// console.log(test[1]);
		// if (io.nsps['/'].adapter.rooms[connectedUsers[socket.id].room].length == 1){ // if 1 person in room don't allow play
			
		// }

		// Trigger socket.on(validMove) on clientside
		// console.log(connectedUsers[socket.id].room);
		io.to(connectedUsers[socket.id].room).emit('validMove', validmove); // emit data of validmove
		// console.log(connectedUsers);
		let gameState;

		gameBoard = validmove.boardState; // game board is passed by the client
		// console.log(gameBoard);

		gameState = checkGameState(gameBoard);
		if ((gameState == 'X') || (gameState == 'Y')){
			// socket.emit('gameOver', gameState);
			// io.to(connectedUsers[socket.id].room).emit('gameOver', gameState);
			io.in(connectedUsers[socket.id].room).emit('gameOver', gameState);
			// console.log('winner winner chicken dinner');
		} 
		// Draw if all of top row is filled out
		else if(gameBoard[0][0] && gameBoard[0][1] && gameBoard[0][2] && gameBoard[0][3] && gameBoard[0][4] && gameBoard[0][5] && gameBoard[0][6] != '0'){
			// console.log("its a bonafide tie!");
			io.in(connectedUsers[socket.id].room).emit('gameOver', 'draw');
		}
		// Change turn priority for both players
		io.in(connectedUsers[socket.id].room).emit('turnChange');
		
		function checkLine(a,b,c,d) {
			// Check first cell non-zero and all cells match
			return ((a != '0') && (a == b) && (a == c) && (a == d));
		}
		function checkGameState(gameBoard){
			// Check down
			for (r = 0; r < 3; r++)
				for (c = 0; c < 7; c++)
					if (checkLine(gameBoard[r][c], gameBoard[r+1][c], gameBoard[r+2][c], gameBoard[r+3][c]))
						return gameBoard[r][c];

			// Check right
			for (r = 0; r < 6; r++)
				for (c = 0; c < 4; c++)
					if (checkLine(gameBoard[r][c], gameBoard[r][c+1], gameBoard[r][c+2], gameBoard[r][c+3]))
						return gameBoard[r][c];

			// Check down-right
			for (r = 0; r < 3; r++)
				for (c = 0; c < 4; c++)
					if (checkLine(gameBoard[r][c], gameBoard[r+1][c+1], gameBoard[r+2][c+2], gameBoard[r+3][c+3]))
						return gameBoard[r][c];

			// Check down-left
			for (r = 3; r < 6; r++)
				for (c = 0; c < 4; c++)
					if (checkLine(gameBoard[r][c], gameBoard[r-1][c+1], gameBoard[r-2][c+2], gameBoard[r-3][c+3]))
						return gameBoard[r][c];

			return 'No Winner';
		}

		// Check game state
		// if (fourConnected){
		// 	// console.log("Invalid / command");
		// 	socket.emit('gameOver', {
		// 		username: 'System',
		// 		text: 'Invalid slash command or invalid format',
		// 		timestamp: moment().valueOf(),
		// 		color: '#808080'
		// 	});
		// }
		// else{
		// 	socket.emit('changeTurn'{
		// 		player: 'someplayer',
		// 		turn: true // or false
		// 	})
		// }

	});
});

http.listen(3030, function(){
	console.log("listening on 3030");
});
// http.listen(process.env.PORT || 3000);