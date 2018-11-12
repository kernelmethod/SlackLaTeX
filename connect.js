/**********
 * Connects us to the Slack channel.
 **********/

/**********
 * Global variables
 **********/
let request       = require("request");
let parser        = require("./parser.js");
let bot           = require("./SlackLaTeX_bot.js")
let child_process = require("child_process");

let WebSocketClient = require('websocket').client;
let ws;
let message = "";
let i = 0;
let fs = require('fs');

let connection = null;
let replies = {}

/**********
 * Function definitions
 **********/

/* Sends a message to the bot owner */
function notifyOwner(message) {
	/* Open DM channel with bot owner */
	let request_addr='https://slack.com/api/im.open?token=' + global.token
		+ '&user=' + bot.config["owner"];
	request(request_addr,
		function (err, response, body) {
			parser.log( "request sent" );
			if ( err ) {
				parser.log( "Error opening DM with bot owner: " + response );
			}

			let channel_id = JSON.parse(body).channel.id;
			/* Send message to owner */
			request('https://slack.com/api/chat.postMessage?token=' +
				global.token + '&channel=' + channel_id +
				'&text=' + message, (e,r,b) => {
					if ( e )
						parser.log( "chat.postMessage unable to notify bot owner: " + r );
				});

			/* Close channel with owner */
			request('https://slack.com/api/im.close?token=' +
				global.token + '&channel=' + channel_id, (e,r,b) => { 
					if ( e )
						parser.log( "error closing channel with bot owner: " + r );
			})
		});
}

/* Retrieve the WebSocket URL */
function getWebSocket() {
	
	request('https://slack.com/api/rtm.start?token=' + global.token + '&pretty=1', function(error, response, body) {
		parser.log(response.url);
		if (!error && response.statusCode === 200) {
		    url = JSON.parse(body).url;
		    parser.log( "Creating url:"+url);
		    createWS(url);
		}
	});
}

//initiates websocket connection
function createWS(url) {
	let client = new WebSocketClient();

	client.on('connectFailed', function(error) {
		parser.log('Connect Error: ' + error.toString());
	});

	client.on('connect', function(conn) {
		let connection = conn;
		parser.log('WebSocket Client Connected');

		/* List users in the workspace. Can be used to find the UID of a
		 * specific user. */
		let users = {};
		request("https://slack.com/api/users.list?token=" + global.token,
			(err, response, body) => {
				if ( err )
					parser.log( "Unable to list users in workspace" )
				else
					users = body;
			})
		parser.log( "Users: " + users )

		/* When starting up, give some information about the bot to its
		 * owner */
		if ( "notify-owner" in bot.config &&
			bot.config["notify-owner"] )
		{
			let msg = parser.timestamp() + "Bot started"
			notifyOwner(msg);
			child_process.exec("ifconfig",
				(err, stdout, stderr) => 
			{
			if ( !err ) {
				parser.log( 
					"Notifying bot owner of bot's " +
					"IP address..." );
				notifyOwner(stdout);
			}
			else {
				parser.log(
					"Error running ifconfig prior to " +
					"notifyOwner: " + stderr );
			}})
		}

		connection.on('error', function(error) {
		    parser.log("Connection Error: " + error.toString());
		});

		connection.on('close', function() {
		    parser.log('echo-protocol Connection Closed');
		});

		connection.on('message', function(message) {
		    if (message.type === 'utf8') {
			parser.handleMessage(JSON.parse(message.utf8Data), message);
		    }
		});

		/* If the "run" option is set to false, then we immediately exit
		 * here.
		 * In combination with other options, this can be used to perform a
		 * one-time action, e.g. with "notify-owner" to send a message when
		 * the bot starts up.
		 *
		 * If "run" is not set, the bot will perform its full functions by
		 * default. */
		if ( "run" in bot.config &&
			!bot.config["run"] )
		{
			parser.log( "\'run\' set to false in config, so " +
				"now exiting..." );
			connection.close()
		}

	});
	client.connect(url);
}

function deleteMessage(timestamp, channel) {
    let dURL = "https://slack.com/api/chat.delete?token=" + global.token + "&ts=" + timestamp + "&channel=" + channel + "&pretty=1";
    parser.log("Message to be deleted: "+timestamp + "\n");
    request(dURL, function(error, response, body) {
        parser.log(response.url);
        if (!error && response.statusCode === 200) {
            parser.log(body);
        }
    });
}

/**********
 * Module exports
 **********/
module.exports.connection    = connection;
module.exports.replies       = replies
module.exports.getWebSocket  = getWebSocket
module.exports.createWS      = createWS
module.exports.deleteMessage = deleteMessage
module.exports.fs            = fs
module.exports.request       = request


