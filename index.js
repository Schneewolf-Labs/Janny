require('dotenv').config();
const fs = require('fs');
const YAML = require('yaml');

const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'));

let filter;
if (config.profanity.enabled) {
	const badWords = require('bad-words');
	filter = new badWords();
	filter.addWords(...config.profanity.words);
}

const Discord = require('./discord');
const discordClient = new Discord(config, process.env.DISCORD_TOKEN);

const report = config.reporting.enabled;
let reportChannel;
if (report) {
	discordClient.on('ready', () => {
		reportChannel = discordClient.getChannel(config.reporting.channel);
	});
}

discordClient.on('message', message => {
	// ignore messages from bots
	if (config['ignore-bots'] && message.author.bot) {
		return;
	}

	const channel = message.channel;
	const channelNSFW = channel.nsfw;

	// check for profanity if enabled
	if (filter && (!config.profanity['exclude-nsfw'] || !channelNSFW) && filter.isProfane(message.content)) {
		// report profanity
		if (reportChannel) {
			reportChannel.send(`Profanity detected in ${message.channel} by ${message.author}: \`${message.content}\``);
		}
		// warn the offender if enabled
		if (config.profanity.warn.enabled) {
			message.reply(config.profanity.warn.message);
		}
		// delete the message if enabled
		if (config.profanity.delete) {
			message.delete();
		}
	}
});