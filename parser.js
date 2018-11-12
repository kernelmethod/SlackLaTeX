/**********
 * Defines various functions to parse LaTeX.
 **********/

/**********
 * Global variables
 **********/
let latex = {};
let replies = {};

let connect  = require("./connect.js");
let bot	  = require("./SlackLaTeX_bot.js");

let replace_mappings = {
	'&lt;': '<',
	'&gt;': '>',
	'&amp;': '&'
}

/**********
 * Function definitions
 **********/

/*
 * Extracts a timestamp to prepend to a message
 */
function timestamp() {
	return "[" + (new Date()).toString() + "] "
}

/*
 * Used to perform logging. Currently disabled (running this function will have
 * no effect).
 */
function log(message) {
	let log_msg = timestamp() + message + "\n"

	if ( "log" in bot.config ) {
		connect.fs.appendFile(bot.config["log"], log_msg, (err) => {
			if ( err ) {
				console.error( "Unable to append to log file (" +
					bot.config["log"] + ")" )
			}
		})
	}
}

function postLatex(user, channel, text) {
	let urlBase = 'http://latex.codecogs.com/png.latex?%5Cdpi%7B300%7D%20' + encodeURIComponent(text);

	let dURL = "https://slack.com/api/chat.postMessage?as_user=true&token=" + global.token + "&channel=" + channel + "&text=%20&attachments=%5B%7B%22fallback%22%3A%22.%22%2C%22color%22%3A%20%22%2336a64f%22%2C%22image_url%22%3A%22" + encodeURIComponent(urlBase) + "%22%7D%5D&pretty=1";

	connect.request(dURL, function(error, response, body) {
		log(response.url);
		if (!error && response.statusCode === 200) {
			log(JSON.parse(body).ts);
			connect.replies[user + channel].reply_ts = JSON.parse(body).ts;
			log(body);
		}
	});
}

function updateLatex(channel, text, ts) {
	let urlBase = 'http://latex.codecogs.com/png.latex?%5Cdpi%7B300%7D%20' + encodeURIComponent(text);

	let dURL = "https://slack.com/api/chat.update?as_user=true&ts=" + ts + "&token=" + global.token + "&channel=" + channel + "&text=%20&attachments=%5B%7B%22fallback%22%3A%22.%22%2C%22color%22%3A%20%22%2336a64f%22%2C%22image_url%22%3A%22" + encodeURIComponent(urlBase) + "%22%7D%5D&pretty=1";

	connect.request(dURL, function(error, response, body) {
		log(response.url);
		if (!error && response.statusCode === 200) {
			log(body);
		}
	});
}

function handleMessage(mObj, message) {

	// log("Received: '" + message.utf8Data + "'");
	// log(mObj.type+"\n");

	let channel = mObj.channel;

	if (mObj.type === 'message' && mObj.subtype === undefined) {

		// log("\t"+mObj.channel+"\n");
		// log("\t"+mObj.user+"\n");
		// log("\t"+mObj.text+"\n");
		// log("\t"+escape(mObj.text)+"\n");

		let laText = getLatex(mObj.text);

		if (mObj.text === '..ping') {
			pong(mObj.channel, "pong");
		}
		if (latex[mObj.user + mObj.channel] != false && laText != null) {
			connect.replies[mObj.user + mObj.channel] = {
				orignal_ts: mObj.ts
			};	
			postLatex(mObj.user, mObj.channel, replaceAll(laText, replace_mappings));

			log('Converting to latex: ' + mObj.text);
		}

		if (mObj.text === '..startLatex') {
			latex[mObj.user + mObj.channel] = true;
			log('Enable latex for ' + mObj.user+mObj.channel);
		}

		if (mObj.text === '..stopLatex') {
			latex[mObj.user + mObj.channel] = false;
			log('disable latex for ' + mObj.user+mObj.channel);
		}

	} else if (mObj.subtype === "message_changed") {
		let laText = getLatex(mObj.message.text);
		if (connect.replies[mObj.message.user + mObj.channel] !== undefined &&
		connect.replies[mObj.message.user + mObj.channel].orignal_ts === mObj.message.ts) {
			if (laText != null) { // is latex
				updateLatex(mObj.channel, replaceAll(laText, replace_mappings),
					connect.replies[mObj.message.user + mObj.channel].reply_ts);
			} else { // not latex
				deleteMessage(connect.replies[mObj.message.user + mObj.channel].reply_ts, mObj.channel);
				delete connect.replies[mObj.message.user + mObj.channel];
			}
		} else {
			if (latex[mObj.message.user + mObj.channel] != false && laText != null) {
				// deleteMessage(mObj.ts,mObj.channel);
				connect.replies[mObj.message.user + mObj.channel] = {
					orignal_ts: mObj.message.ts
				};
				postLatex(mObj.message.user, mObj.channel, replaceAll(laText, replace_mappings));

				log('Converting to latex: ' + mObj.message.text);
			}
		}
	} else if (mObj.subtype === "message_deleted") {
		if (connect.replies[mObj.previous_message.user + mObj.channel] !== undefined &&
		connect.replies[mObj.previous_message.user + mObj.channel].orignal_ts === mObj.previous_message.ts) {
			deleteMessage(connect.replies[mObj.previous_message.user + mObj.channel].reply_ts, mObj.channel);
			delete connect.replies[mObj.previous_message.user + mObj.channel];
		}
	}

}

const latexWrapRegex = /^\$([\s\S]*)\$$|^`\s*\$([\s\S]*)\$\s*`$|^```\s*\$([\s\S]*)\$\s*```$/g;

function getLatex(text) {
	let m;

	let laText = null;

	while ((m = latexWrapRegex.exec(text)) !== null) {
		// This is necessary to avoid infinite loops with zero-width matches
		if (m.index === latexWrapRegex.lastIndex) {
			latexWrapRegex.lastIndex++;
		}

		// The result can be accessed through the `m`-variable.
		m.forEach((match, groupIndex) => {
			if (groupIndex !== 0 && match !== undefined) {
				laText = match.replace(/\n/g, " ");
				return;
			}
		});
	}
	return laText;
}

function pong(channel, text) {
	if (connect.connection.connected) {
		let message2send = {};
		message2send.text = text;
		message2send.channel = channel;
		message2send.id = i;
		message2send.type = "message";
		connect.connection.sendUTF(JSON.stringify(message2send));
		i += 1;
		return i;
	}
}

const escapeRegEx = /([.*+?^=!:${}()|[]\/\])/g;

function escapeRegExp(str) {
	return str.replace(escapeRegEx, "\$1");
}

function replaceAll(str, replace_dict) {
	for ( find in replace_dict ) {
		str = str.replace(new RegExp(escapeRegExp(find), 'g'),
			replace_dict[find])
	}
	return str
}

/**********
 * Module exports
 **********/
module.exports.timestamp     = timestamp
module.exports.log           = log
module.exports.postLatex     = postLatex
module.exports.updateLatex   = updateLatex
module.exports.handleMessage = handleMessage
module.exports.getLatex	     = getLatex
module.exports.pong          = pong
module.exports.escapeRegExp  = escapeRegExp
module.exports.replaceAll    = replaceAll


