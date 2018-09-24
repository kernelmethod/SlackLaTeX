# Slack LaTeX
A bot that will automatically render LaTeX as `.png` files in Slack. Forked from https://github.com/sand500/SlackLateX.

## Setup
To install, clone this repository and install the following modules within it:

```
npm install fs request websocket
```

In Slack, go to Apps -> Browse Apps -> Install Slack bots -> Add configuration, and add the bot from there. Copy the API key into `secret.txt`, and then run with `node bot.js`.

## Usage
You can add the bot to a channel by inviting it to that channel. The following will be rendered as LaTeX in a channel that the bot has joined:
 * `$\LaTeX code$`
 * `` `$\LaTeX code$` ``
 * `` ```$\LaTeX code$``` ``

In Slack, type `..stopLatex` to disable bot and `..startLatex` to re-enable bot. This only applies the user and channel that typed this.
