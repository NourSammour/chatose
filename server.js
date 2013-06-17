 var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , port = process.env.PORT || 3000
  
server.listen( port);
var  io = require('socket.io').listen(server);

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var users  = {};
var sockets  = {};

io.sockets.on('connection', function (socket) {

	socket.on('adduser', function(username){
	
		var message=
		{
		    channel:'publicChannel',
			from:'SERVER',
			to: socket.username,
			msg: username + ' connected to public chat'
		};
	
		socket.username = username;
		socket.join(message.channel);
		
		users[username]=username;
		sockets[username]=socket;

		socket.broadcast.to(message.channel).emit('pull',message);
		socket.broadcast.to(message.channel).emit('updateusers', users );
		
		socket.emit('updateusers', users );
	});

	socket.on('push', function (data) {
		io.sockets.in(data.channel).emit('pull', data);
	});

	socket.on('openChannal', function(withUser){
		var channel = getChannelName(socket.username,withUser) ;
		var message=
		{
		    channel:channel,
			from:'SERVER',
			to: socket.username,
			msg: socket.username + ' want to chat with you'
		};
		
		var channelInfo=
		{
		  	channel:channel,
		};
		
		socket.join(channel);
		sockets[withUser].join(channel);
		
		socket.emit('channelOpened', channelInfo);
		sockets[withUser].emit('channelOpened', channelInfo);
		
		socket.broadcast.to(message.channel).emit('pull', message);
	});
	
	socket.on('openPublicChannal', function(){
		var message=
		{
		    channel:'publicChannel',
			from:'SERVER',
			to: socket.username,
			msg: 'connected to public chat'
		};
		
		var channelInfo=
		{
		  	channel:'publicChannel',
		};
		
		socket.join(channelInfo.channel);
		
		socket.emit('channelOpened', channelInfo);
		
		socket.broadcast.to(message.channel).emit('pull', message);
	});
	
	
	socket.on('disconnect', function(){
		delete users[socket.username];
		delete sockets[socket.username];
		io.sockets.emit('updateusers', users);
	});

});
function getChannelName(user1,user2)
{
		if(user1.localeCompare(user2)>0)
			return user2 +'-'+ user1;
		else
			return user1+'-'+ user2;
}





























