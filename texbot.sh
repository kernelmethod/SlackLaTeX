#!/bin/bash
# Based off tutorial in http://srmart.in/latex-in-slack/

# Default variables
RESTART=""
RESTART_SLEEP_TIME="1m"

# A config file must defining some bash variables must 
# be passed to texbot.sh in order to run.
#
# Example file:
#
# myconfig.env:
# TEXBOT_CONFIG="./secret.json"
# RESTART="1"
# RESTART_SLEEP_TIME="30s"
#
if [[ !($# -eq 1) && (-z ${TEXBOT_CONFIG+x}) ]]; then
	echo "Usage:" >&2
	printf "(1) ./texbot.sh <environment config file>\n" >&2
	printf "(2) export TEXBOT_CONFIG=<environment config file>; ./texbot.sh\n" >&2
	exit 1
else
	if [ $# -eq 1 ]; then
		TEXBOT_CONFIG=$1
	fi

	if ! [ -f $TEXBOT_CONFIG ]; then
		echo "Error: TEXBOT_CONFIG file $TEXBOT_CONFIG not found" >&2
		exit 1
	fi

	echo "TEXBOT_CONFIG=$TEXBOT_CONFIG"
	source $TEXBOT_CONFIG
fi

# Check that necessary variables are now defined
if [[ -z ${SLACK_CONFIG+x} ]]; then
	echo "SLACK_CONFIG not defined by $TEXBOT_CONFIG" >&2
	exit 1
else
	if ! [ -f $SLACK_CONFIG ]; then
		echo "File SLACK_CONFIG=$SLACK_CONFIG not found" >& 2
		exit 1
	fi
	SLACK_CONFIG=$(realpath $SLACK_CONFIG)
fi

# If TEXBOT_LOG_FILE is not set, then we disable logging by
# redirecting all I/O to /dev/null
if [ -z ${TEXBOT_LOG_FILE+x} ]; then
	echo "TEXBOT_LOG_FILE is not set, so logging will be disabled"
	TEXBOT_LOG_FILE="/dev/null"
else
	echo "TEXBOT_LOG_FILE=$TEXBOT_LOG_FILE"
	if ! [ -f $TEXBOT_LOG_FILE ]; then
		sudo -u bot touch $TEXBOT_LOG_FILE
	fi
	sudo -u bot chmod 660 $TEXBOT_LOG_FILE
fi

# Run in an infinite loop, so that bot restarts every time node exits
while :; do
	echo "[$(date) ($TEXBOT_CONFIG)] Starting SlackLaTeX bot" >> $TEXBOT_LOG_FILE
	cd /usr/local/bin/bot/texbot/SlackLaTeX
	node ./bot.js

	# Sleep for one minute to prevent issues such as infinite spam
	echo "[$(date) ($TEXBOT_CONFIG)] SlackLaTeX bot exited" >> $TEXBOT_LOG_FILE

	if ! [ $RESTART ]; then
		break
	fi

	echo "[$(date) ($TEXBOT_CONFIG)] Restarting in $RESTART_SLEEP_TIME..." >> $TEXBOT_LOG_FILE
	sleep $RESTART_SLEEP_TIME
done

echo "[$(date) ($TEXBOT_CONFIG)] SlackLaTeX bot loop finished. texbot is now terminating." >> $TEXBOT_LOG_FILE

