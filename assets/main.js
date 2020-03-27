// Blandon Tang
// 10126829 W2020 SENG513
// Client Side Code
/**
 * https://socket.io/docs/client-api/#socket-id -- socket io documentation
 * https://socket.io/docs/emit-cheatsheet/  -- socket io cheatsheet
 * https://stackabuse.com/git-merge-branch-into-master/ -- git branching cheatsheet
 */

const socket = io();
var $joinGame = $('#joinForm');
var $msgForm = $('#messageForm');
var $messageArea = $('#messagesArea');
let $username;
var usersOnline = {}; // equivalent to connectedUsers in serverside
var gameRoomsOnline = []; // equivalent to onlineRooms in serverside
var gameRandRoomsOnline = [];
var playerAssignment = '';
var gameBoard = [
	['0','0','0','0','0','0','0'],
	['0','0','0','0','0','0','0'],
	['0','0','0','0','0','0','0'],
	['0','0','0','0','0','0','0'],
	['0','0','0','0','0','0','0'],
	['0','0','0','0','0','0','0']
];
var myTurn = true;

socket.on('connect', function() {
	
	// hide the game initially
	$('.messenger').hide();
	// $('#waitModal').hide();
	
	// check if cookie is present
	let fillerName = 'newUserName';
	let hasCookie = false;
	if (document.cookie.split(';').filter((item) => item.trim().startsWith('username=')).length) {
		// console.log('The cookie "username" exists')
		fillerName = document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
		// console.log(fillerName);
		hasCookie = true;
	}

 	$('input[name=username]').val(fillerName);
	if (hasCookie == false){
		$('input[name=username]').val(randomUsername());
	}

	// Generate uniquecode for sharing with friend
	let uniquecode = "" + Math.floor(Math.random() * 101) + "" + Math.floor(Math.random() * 101) + "" + Math.floor(Math.random() * 93) + "" + Math.floor(Math.random() * 61);
	$('#uniqueCode').text(uniquecode); // change this code to be numeric value only so user can't enter 'randomroom#'
	socket.emit('createNewRoom',{roomName: uniquecode}); // create room with unique code server side

	// Onclick for join game
	$joinGame.on('submit', function(e) {
		e.preventDefault();

		$username = $.trim($joinGame.find('input[name=username]').val());
		let roomName = $.trim($joinGame.find('input[name=room]').val());

		socket.emit('newUser', {
			username: $username, // fillerName,
			room: roomName,
			color: '#000000', // default nickname color is black
			cookie: hasCookie,
			random: false
		}, function(cbData){
			if (cbData.roomExists == false){
				$('#errorMsg').text(cbData.error);
			}
			// else success
			else{
				$('.welcomeBox').hide('slow');
				$('.messenger').show();
			}
		});
	});

	$('#randomGame').on('submit', function(e){
		e.preventDefault();
		$username = $.trim($joinGame.find('input[name=username]').val());

		socket.emit('newUser', {
			username: $username, // fillerName,
			room: 'fillerValue',
			color: '#000000', // default nickname color is black
			cookie: hasCookie,
			random: true
		}, function(cbData){
			if (cbData.roomExists == false){
				$('#errorMsg').text(cbData.error);
			}
			// else success
			else{
				$('.welcomeBox').hide('slow');
				$('.messenger').show();
			}
		});
	})

	// Create random username
	function randomUsername() {
		let parts = [];
		parts.push( ["Overly", "Partly", "Barely", "Slightly", "Fairly", "Largely"] );
		parts.push( ["Zealous", "Shy", "Quiet", "Loud", "Excited", "Confused", "Uncomfortable"] );
		parts.push( ["Strokes", "RHCP", "BROCKHAMPTON", "Islands", "Daftpunk", "MGMT", "Mitski", "Morrissey", "Beatles"] );
	  
		username = "";
		for( part of parts) {
			username += part[Math.floor(Math.random()*part.length)];
		}
		username += 'Fan';
		return username;
	}
});

socket.on('usersPresent', function(connectedUsers){
	usersOnline = connectedUsers;
	// $username = usersOnline[socket.id].username;
	document.cookie = "username=" + $username; //set cookie in case of nickname change
	// console.log(document.cookie);
	$(".roomTitle").text('Welcome to the chatroom, ' + $username + '!'); // change name display at top
	
	let allUsers = "";
	Object.keys(connectedUsers).forEach(function(socketID){
		// console.log(connectedUsers[socketID].username); // get all usernames present in chatroom
		allUsers += "<div class='userDisplay'><span style='color: "+ connectedUsers[socketID].color +";'><strong>" + connectedUsers[socketID].username + "</strong></span></div>"; // change color of name in online list as well
		// console.log(allUsers);
	});
	// $('#usersContainer').html(allUsers); // display all users
});

// not used yet
socket.on('roomsOnline', function(onlineRooms){
	gameRoomsOnline = onlineRooms;
	// console.log(gameRoomsOnline);

});

// not used yet
socket.on('randomRoomsOnline', function(randomRooms){
	gameRandRoomsOnline = randomRooms;
	// console.log(gameRandRoomsOnline);

});

socket.on('assignment', function(assignmentType){
	playerAssignment = assignmentType.value;
	if (playerAssignment == 'Y'){
		myTurn = false;
	}
	console.log(playerAssignment);
});

socket.on('turnChange', function(){
	myTurn = !myTurn;
	console.log(myTurn);
})

socket.on('gameWaiting', function(status){
	console.log('gamewaiting triggered');
	if (status == true){
		// display waiting for player modal
		// hide game table
		$('#gameBoard').hide();
		$('#waitModal').show();
	}
	else{
		// hide waiting modal
		// show game table
		$('#gameBoard').show();
		$('#waitModal').hide();
	}
})

// Sending Messages
$msgForm.on('submit', function(e) {
	e.preventDefault(); // prevent default form reload
	let $message = $('#messageInput');
	let invalidInput = /<(.|\n)*?>/g;
	if (invalidInput.test($message.val())) {
		alert('html tags are not allowed');
    }
    else {
		// console.log(socket.id);
		// console.log(usersOnline[socket.id].username);
		socket.emit('message', {
			username: $username.trim(),
			text: $message.val(),
			color: usersOnline[socket.id].color,
			userID: socket.id
		});
	}
	$message.val('');
});

// Onclicks for cells (td and getting id)
$('body').on('click', 'td', function(){
	// console.log($(this));
	let enteredMove = this.id;
	// console.log(enteredMove); // get ID of clicked element (1-0, 2-4 etc)
	
	// should change to check if top piece of column is filled - clicking on a piece in unfilled column should just stack on top
	
	if (myTurn == true){
		if (($('#' + enteredMove).hasClass('xPiece')) || ($('#' + enteredMove).hasClass('yPiece'))) {
			alert('a game piece cannot be placed here');
		}
		else {
			// console.log(socket.id);
			// console.log(usersOnline[socket.id].username);
			let rowMove = enteredMove.split('-')[0];
			rowMove = parseInt(rowMove);
			let colMove = enteredMove.split('-')[1];
			colMove = parseInt(colMove);
			// console.log(rowMove);

			// TODO: dropping algorithm
			// check if all rows underneath are empty - keep dropping until not empty or is row 5
			if (rowMove < 5){
				// console.log(test);
				let pieceBelow = gameBoard[rowMove + 1][colMove]; //pieceBelow is one piece below proposed move
				// console.log(pieceBelow);
				let rowBelow = rowMove + 1;
				while (pieceBelow == '0'){
				// while (!$('#' + rowBelow + "-" + colMove).hasClass('xPiece') && !$('#' + rowBelow + "-" + colMove).hasClass('yPiece')){
					rowMove++; // rowmove 'drops' while piece below is empty
					if (rowMove < 5){
						pieceBelow = gameBoard[rowMove+1][colMove];
						// check if has class of of pieceBelow (to check for both X and Y pieces not just piece of own colour)
						rowBelow = rowMove + 1;
						if ($('#' + rowBelow + "-" + colMove).hasClass('xPiece') || $('#' + rowBelow + "-" + colMove).hasClass('yPiece')){
							pieceBelow = '-1';
						}
					}
					else{
						pieceBelow = '-1';
					}
					//else we have hit bottom of column
				}
			}
			// Write move into board
			console.log(rowMove);
			enteredMove = "" + rowMove + "-" + colMove;
			gameBoard[rowMove][colMove] = playerAssignment;

			socket.emit('validMove', {
				playerID: socket.id,
				moveLocation: enteredMove,
				// turnIdentifier: playerAssignment, // would this be needed?
				player: playerAssignment, // Whether player is X or Y
				boardState: gameBoard // pass the game board to client
				// server does not need to send gameboard back because we prevent client from placing on an existing tile - this could result in major bugs if client manipulates DOM
			});
		}
	}
	else{
		alert('Not your turn');
	}
});

socket.on('validMove', function(validmove) {
	// console.log('validmove');

	// let momentTimestamp = moment.utc(message.timestamp);
	// let $message = $('#messagesArea');
	let playerMove = validmove.moveLocation;
	let moveOwner = validmove.player;
	let gamepiece = '';
	
	// 
	if (moveOwner == 'X'){
		gamepiece = 'xPiece';
	}
	else{
		gamepiece = 'yPiece';
	}
	$('#' + playerMove).addClass(gamepiece);

});

socket.on('gameOver', function(winner){
	if (winner == playerAssignment){
		alert("Winner Winner Chicken Dinner\nReload page to return to welcome screen");
	}
	else if(winner == 'draw'){
		alert("It's a Draw!\nReload page to return to welcome screen")
	}
	else{
		alert("Sucks to suck...\nReload page to return to welcome screen");
	}
	// location.reload();
});

socket.on('message', function(message) {
	let momentTimestamp = moment.utc(message.timestamp);
	let $message = $('#messagesArea');

	// If Message is a system message
	if ((message.userID === undefined) &&(message.username.toLowerCase() == 'system')){
		$message.append('<div class="sysMsg"><div><span>' + message.username + ' </span><span>' + momentTimestamp.local().format('h:mma') +'</span></div>' +
						'<div>' + message.text + '</div></div>');
	}
	// Message is sent by own client 
	else if (message.userID == socket.id){
		$message.append('<div class="msg right-msg"><div class="msgBubble">' +
							'<div class="msgInfo">' +
								'<div class="msgInfo-name" style="color: '+ message.color +' !important;">' + message.username + '</div>' +
								'<div class="msgInfo-time">' + momentTimestamp.local().format('h:mma') + '</div>' +
							'</div>' +
							'<div class="msg-text">' +
								message.text +
							'</div>' +
						'</div></div>');
	}
	// If message comes from other user
	else {
		$message.append('<div class="msg left-msg"><div class="msgBubble">' +
							'<div class="msgInfo">' +
								'<div class="msgInfo-name" style="color: '+ message.color +' !important;">' + message.username + '</div>' +
								'<div class="msgInfo-time">' + momentTimestamp.local().format('h:mma') + '</div>' +
							'</div>' +
							'<div class="msg-text">' +
								message.text +
							'</div>' +
						'</div></div>');
	}
	scrollToBottom('messagesArea');

	function scrollToBottom(id) {
		let section = document.getElementById(id);
		$('#' + id).animate({
			scrollTop: section.scrollHeight - section.clientHeight
		}, 450);
	}
});
