// Blandon Tang
// 10126829 W2020 SENG513
// Server side code
/**
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

app.use(express.static('assets'));

// Whenever user makes get request to server
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	console.log('A user has connected with ID: ' + socket.id);
	// console.log(connectedUsers);
	// io.emit('usersPresent', connectedUsers);
	
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
			// console.log(connectedUsers);
		}
	});

	// socket.emit('displayChatLog', {chatHistory});

	socket.on('newUser', function(req, callback) {
		let nameTaken = false;
		// req.username = chance.animal();
		if (req.cookie == false){
			req.username = chance.animal(); // generate new name if no cookie
		}
        // connectedUsers.push(socket.id);
        // connectedUsers[socket.id]['username'] = newUserName;
        // console.log(connectedUsers);
		
		// generate another name if taken
		Object.keys(connectedUsers).forEach(function(socketID) {
			while (connectedUsers[socketID].username.toLowerCase() === req.username.toLowerCase()) {
				req.username = chance.animal();
				console.log("name taken, trying new name: " + req.username);
            }
		});
		
		console.log(req.username + " has joined the chatroom");
		connectedUsers[socket.id] = req;
		connectedUsers[socket.id].userID = socket.id;
		socket.join(req.room);
		// console.log(connectedUsers);
		// console.log(chatHistory);

		io.emit('usersPresent', connectedUsers); // send a data struct of all current users to client
		io.to(`${socket.id}`).emit('showChatLog', chatHistory); // emit only to new joinee

		socket.broadcast.to(req.room).emit('message', {
			username: 'System',
			text: req.username + ' has joined!',
			timestamp: moment().valueOf(),
			color: '#808080'
		});
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
});

http.listen(3030);
// http.listen(process.env.PORT || 3000);