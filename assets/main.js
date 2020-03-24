// Blandon Tang
// 10126829 W2020 SENG513
// Client Side Code
/**
 * https://socket.io/docs/client-api/#socket-id -- socket io documentation
 * https://socket.io/docs/emit-cheatsheet/  -- socket io cheatsheet
 * https://stackabuse.com/git-merge-branch-into-master/ -- git branching cheatsheet
 */

const socket = io();
var $loginForm = $('#login-form');
var $loginArea = $('#login-area');
var $msgForm = $('#messageForm');
var $messageArea = $('#messagesArea');
let $username;
var usersOnline = {}; // equivalent to connectedUsers in serverside

socket.on('connect', function() {
	// check if cookie is present
	let fillerName = 'newUserName';
	let hasCookie = false;
	if (document.cookie.split(';').filter((item) => item.trim().startsWith('username=')).length) {
		// console.log('The cookie "username" exists')
		fillerName = document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
		// console.log(fillerName);
		hasCookie = true;
	}
    socket.emit('newUser', {
	    username: fillerName,
		room: 'chatroom',
		color: '#000000', // default nickname color is black
		cookie: hasCookie
	});
});

socket.on('message', function(message) {
	let momentTimestamp = moment.utc(message.timestamp);
	// console.log("on message: " + socket.id);
	// console.log(usersOnline);
	// console.log("username color is: " + message.color);
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
});

socket.on('showChatLog', function(chatHistory){
	// console.log(chatHistory);
	var $message = $('#messagesArea');
	chatHistory.forEach(function(message){
		var momentTimestamp = moment.utc(message.time);
		$message.append('<div class="msg left-msg"><div class="msgBubble">' +
		'<div class="msgInfo">' +
			'<div class="msgInfo-name">' + message.user + '</div>' +
			'<div class="msgInfo-time">' + momentTimestamp.local().format('h:mma') + '</div>' +
		'</div>' +
		'<div class="msg-text">' +
			message.msg +
		'</div>' +
	'</div></div>');
	});
	scrollToBottom('messagesArea');
})

socket.on('usersPresent', function(connectedUsers){
	usersOnline = connectedUsers;
	$username = usersOnline[socket.id].username;
	document.cookie = "username=" + $username; //set cookie in case of nickname change
	// console.log(document.cookie);
	$(".roomTitle").text('Welcome to the chatroom, ' + $username + '!'); // change name display at top

	let allUsers = "";
	Object.keys(connectedUsers).forEach(function(socketID){
		// console.log(connectedUsers[socketID].username); // get all usernames present in chatroom
		allUsers += "<div class='userDisplay'><span style='color: "+ connectedUsers[socketID].color +";'><strong>" + connectedUsers[socketID].username + "</strong></span></div>"; // change color of name in online list as well
		// console.log(allUsers);
	});
	$('#usersContainer').html(allUsers); // display all users
})

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

function scrollToBottom(id) {
	let section = document.getElementById(id);
	$('#' + id).animate({
		scrollTop: section.scrollHeight - section.clientHeight
	}, 450);
}