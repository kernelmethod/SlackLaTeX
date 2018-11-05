#!/usr/bin/env node

// Import functions for parsing LaTeX
let parser           = require('./parser.js');
let connect          = require('./connect.js');

/*
 * Read configuration file for specific Slack workspace
 */
var config;
try {
	config = require(process.env['SLACK_CONFIG'])

	// Export configurations
	module.exports.config = config
}
catch ( e ) {
	console.log( 'Error while trying to parse SLACK_CONFIG JSON file:' )
	throw e
}

// Config file must contain certain fields
let fields = ['secret']
for ( let ii = 0; ii < fields.length; ii++ ) {
	if ( !(fields[ii] in config) ) {
		console.error(
			'\'' + fields[ii] + '\' not found in config file');
		process.exit(1);
	}
}

// Delete old log file
if ( 'log' in config &&
	'overwrite-log' in config &&
	config['overwrite-log'] )
{
	connect.fs.writeFile( config['log'], '', { flag: 'w' }, (err) => {
		if ( err )
			console.error(
				'Unable to write to log file ('+config['log']+')')
	})
}

// Notify user that logging will be disabled for this bot
else if ( !('log' in config) ) {
	console.log( "Field \'log\' not found in config file " +
		process.env.TEXBOT_CONFIG + ". Logging will be disabled for " +
		"this bot." );
}


// Notify log that we're starting bot
let date = new Date();
parser.log( '[' + date.getDate() + '-' + (1 + date.getMonth()) +
	'-' + date.getFullYear() + ' ' + date.getHours() + ':' +
	date.getMinutes() + ':' + date.getSeconds() + '] Bot started' )

/* Start the bot */
global.token = config['secret'].replace(/[\n\r]/g, '');
connect.getWebSocket()
