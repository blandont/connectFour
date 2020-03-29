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
let $opponent = "SecretMan";
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
var turnCount = 0;

socket.on('connect', function() {
	
	// hide the game initially
	$('.messenger').hide();
	// $('#waitModal').hide();
	
	// check if cookie is present
	let fillerName = 'newUserName';
	let themeType = 'theme1';
	let hasCookie = false;
	if (document.cookie.split(';').filter((item) => item.trim().startsWith('username=')).length) {
		// console.log('The cookie "username" exists')
		fillerName = document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
		// console.log(fillerName);
		themeType = document.cookie.replace(/(?:(?:^|.*;\s*)themechoice\s*\=\s*([^;]*).*$)|^.*$/, "$1");
		hasCookie = true;
	}

	$('#' + themeType).prop("checked", true);
	// setTheme();
	switchTheme(themeType);
	console.log('cookie set');

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
	// $(".roomTitle").text("Welcome to the game, " + $username + "!"); // change name display at top
	// console.log(usersOnline);
	// let allUsers = "";
	// Object.keys(connectedUsers).forEach(function(socketID){
	// 	// console.log(connectedUsers[socketID].username); // get all usernames present in chatroom
	// 	allUsers += "<div class='userDisplay'><span style='color: "+ connectedUsers[socketID].color +";'><strong>" + connectedUsers[socketID].username + "</strong></span></div>"; // change color of name in online list as well
	// 	// console.log(allUsers);
	// });
	// $('#usersContainer').html(allUsers); // display all users
});

// On receiving names of users in room find opponents and set in title
socket.on('opponentName', function(foeName){
	if (foeName != $username){
		$opponent = foeName;
		// console.log("testing");
		$(".roomTitle").text("Welcome to the game, " + $username + "! Your opponent is " + $opponent);
	}
	
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

// Set player as X or Y to determine play order
socket.on('assignment', function(assignmentType){
	playerAssignment = assignmentType.value;
	$(".turnMessage").text("Your move first!");
	if (playerAssignment == 'Y'){
		myTurn = false;
		$(".turnMessage").text("Awaiting opponents move...");
	}
	// console.log(playerAssignment);
});

// Change turn priority
socket.on('turnChange', function(){
	myTurn = !myTurn;
	if (myTurn){
		$(".turnMessage").text("It's your turn " + $username + "!"); 
	}
	else{
		$(".turnMessage").text($opponent + " is thinking...");
	}
	// console.log(myTurn);
})

// Wait until two players are present
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

// Onclicks for cells (td and getting id) for game move decisions
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

			// Dropping Algorithm for 'gravity' - check if all rows underneath are empty - keep dropping until not empty or is row 5
			if (rowMove < 5){
				// console.log(test);
				let pieceBelow = gameBoard[rowMove + 1][colMove]; //pieceBelow is one piece below proposed move
				// console.log(pieceBelow);
				let rowBelow = rowMove + 1;
				while ((pieceBelow == '0') && !$('#' + rowBelow + "-" + colMove).hasClass('xPiece') && !$('#' + rowBelow + "-" + colMove).hasClass('yPiece')){
				// while (!$('#' + rowBelow + "-" + colMove).hasClass('xPiece') && !$('#' + rowBelow + "-" + colMove).hasClass('yPiece')){
					rowMove++; // rowmove 'drops' while piece below is empty
					if (rowMove < 5){
						pieceBelow = gameBoard[rowMove+1][colMove];
						// check if has class of of pieceBelow (to check for both X and Y pieces not just piece of own colour)
						rowBelow = rowMove + 1;
						if ($('#' + rowBelow + "-" + colMove).hasClass('xPiece')){
							pieceBelow = '-1';
							// console.log('x below');
						}
						if ($('#' + rowBelow + "-" + colMove).hasClass('yPiece')){
							pieceBelow = '-1';
							// console.log('y below');
						}
					}
					else{
						pieceBelow = '-1';
					}
				}
			}

			// Write move into board
			// console.log(rowMove);
			enteredMove = "" + rowMove + "-" + colMove;
			gameBoard[rowMove][colMove] = playerAssignment;

			socket.emit('validMove', {
				playerID: socket.id,
				moveLocation: enteredMove,
				// turnIdentifier: playerAssignment, // would this be needed?
				player: playerAssignment, // Whether player is X or Y
				boardState: gameBoard, // pass the game board to client
				turnsTaken: ++turnCount
				// server does not need to send gameboard back because we prevent client from placing on an existing tile - this could result in major bugs if client manipulates DOM
			});
		}
	}
	else{
		alert('Not your turn');
	}

});

// On valid move, change class of gamepiece
socket.on('validMove', function(validmove) {
	// console.log('validmove');

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

// Determining state of game ending
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

// Theme Changing
// theme 1
$('#theme1Label').on('click', function(){
	switchTheme('theme1');
});

// theme 2
$('#theme2Label').on('click', function(){
	switchTheme('theme2');
});

// theme 3
$('#theme3Label').on('click', function(){
	switchTheme('theme3');
});

// Set appropriate styles and cookie
function switchTheme(themechosen){
	if(themechosen == 'theme1'){
		$('#gameBoard td').addClass('theme1');
		$('#gameBoard td').removeClass('theme2');
		$('#gameBoard td').removeClass('theme3');
	}
	else if(themechosen == 'theme2'){
		$('#gameBoard td').addClass('theme2');
		$('#gameBoard td').removeClass('theme1');
		$('#gameBoard td').removeClass('theme3');
	}
	else if(themechosen == 'theme3'){
		$('#gameBoard td').addClass('theme3');
		$('#gameBoard td').removeClass('theme1');
		$('#gameBoard td').removeClass('theme2');
	}
	document.cookie = "themechoice=" + themechosen; //set cookie in case of nickname change
	console.log(document.cookie);
}
