# Slack LaTeX
A bot that will automatically render LaTeX as `.png` files in Slack. Forked from https://github.com/sand500/SlackLateX.

## Setup
To install, clone this repository and install the following modules within it:

```
npm install fs request websocket
```

In Slack, go to Apps -> Browse Apps -> Install Slack bots -> Add configuration, and add the bot from there.

You can run bots for multiple workspaces at the same time using the `texbot.sh` script. Each workspace requires two files:

1. A bash script to exports the variables needed to configure the bot. For instance, such a script might look like as follows:

```bash
env/myworkspace.env:

export SLACK_CONFIG=secrets/myworkspace.json
export RESTART=true
export RESTART_SLEEP_TIME="1m"
```
  `SLACK_CONFIG` gives the path (relative to `texbot.sh`) where it's possible to get the second configuration file (see below), and is the only variable required to be set. For more information, see the Configuration section below.
2. A `.json` file with some configurations tailored to the specific workspace. Here's an sample configuration:

```
secrets/myworkspace.json:

{
	'secret': 'xxxx-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx',
	'owner': 'U4EYQVC6R',
	'log': 'logs/myworkspace.log',
	'overwrite-log': true
	'log': 'logs/myworkspace.log',
	'overwrite-log': true
}
```

  The only field that is required to be set is `secret`, which should be the API key you got when you added your bot to the workspace. Potential configurations are explained in the Configuration section.

To run the bot, use `./texbot.sh <env file>`.

## Usage
You can add the bot to a channel by inviting it to that channel. The following will be rendered as LaTeX in a channel that the bot has joined:
 * `$\LaTeX code$`
 * `` `$\LaTeX code$` ``
 * `` ```$\LaTeX code$``` ``

In Slack, type `..stopLatex` to disable bot and `..startLatex` to re-enable bot. This only applies the user and channel that typed this.

## Configuration
The two configuration files, a `.env` file and a `.json` files, provide various ways of tailoring your bot to your specific needs.

### `.env` config file
This file sets options for the `texbot.sh` script.
* `SLACK_CONFIG`: the `.json` file required to run `SlackLaTeX_bot.js`. It is the only variable required to be set.
  - The path of this file must be relative to the location of the `texbot.sh` script.
  - See the section below, "`.json` config file", for more details.
* `TEXBOT_LOG`: a log file for the `texbot.sh` script.
  - This log records things such as when the bot starts running, and when it terminates.
* `RESTART`: allows the bot to restart if `node` ever exits.
  - If you don't want the bot to restart, either don't include this variable (the default is not to make the bot restart) or make it equal to nothing, i.e. `export REPLACE=`.
* `RESTART_SLEEP_TIME`: the amount of time to wait before restarting the bot.

### `.json` config file
This file contains options that are used when `SlackLaTeX_bot.js`, which is called from `texbot.sh`, starts running. It is controlled by the `SLACK_CONFIG` variable in the `.env` file.

* `secret`: the only required field in the file. This field should contain the API key for the workspace you're adding the bot to.
* `owner`: the user ID of the owner of the bot.
  - This is needed in conjunction with the `notify-owner` option
* `notify-owner`: will tell the owner of the bot (controlled by the `owner` field) when the bot starts, and the output of `ifconfig`.
  - I currently use this option on the Pi I'm using so that whenever I boot up, I can find the address of my Pi on the LAN. This helps me `ssh` in to perform maintenance.
  - By default, this option is turned off.
* `run`: a boolean that tells us whether or not to run the bot after notifying the owner (if `notify-owner` is set to `true`).
  - This can allow you to spin up a bot that will DM you with useful information, and then exit.
  - If you set this to be `false`, you'll want to keep the bot from restarting (or use a very long `RESTART_SLEEP_TIME`), as otherwise the bot will spam you with DMs.
  - By default this is set to be `true`.
* `log`: the path (relative to `SlackLaTeX_bot.js`) of a log file for the bot.
  - When this isn't set, logging is suppressed.
* `overwrite-log`: tells `SlackLaTeX_bot.js` whether or not to overwrite the log file (controlled by `log`) whenever it is run.
  - By default, `overwrite-log = false`.

