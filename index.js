require('dotenv').config();
const fs = require('fs');
const YAML = require('yaml');
const { createSpamTracker } = require('./spam');

const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'));

let filter;
if (config.profanity.enabled) {
	const badWords = require('bad-words');
	filter = new badWords();
	if (config.profanity.words.length) {
		filter.addWords(...config.profanity.words);
	}
}

let spam;
if (config.spam.enabled) {
	spam = createSpamTracker(config.spam);
	setInterval(() => spam.prune(Date.now()), 60 * 1000).unref();
}

const Discord = require('./discord');
const discordClient = new Discord(config, process.env.DISCORD_TOKEN);

const report = config.reporting.enabled;
let reportChannel;
if (report) {
	discordClient.on('ready', () => {
		reportChannel = discordClient.getChannel(config.reporting.channel);
		if (!reportChannel) {
			console.error(`Report channel ${config.reporting.channel} not found`);
		}
	});
}

// Discord calls reject on missing permissions or already-deleted messages; an unhandled
// rejection kills the process, so every one goes through here.
function attempt(action, promise) {
	return promise.catch(err => console.error(`Failed to ${action}: ${err.message}`));
}

function logReport(entry) {
	if (!config.reporting.log) return;
	fs.appendFile(config.reporting.log, JSON.stringify(entry) + '\n', err => {
		if (err) console.error(`Failed to write report log: ${err.message}`);
	});
}

function sendReport(kind, message, detail) {
	logReport({
		time: new Date().toISOString(),
		kind,
		detail,
		guild: message.guild?.id,
		channel: message.channel.id,
		author: message.author.id,
		authorTag: message.author.tag,
		message: message.id,
		content: message.content,
	});
	if (!reportChannel) return;
	const content = message.content.replaceAll('`', 'ˋ').slice(0, 1500);
	attempt('send report', reportChannel.send({
		content: `${kind} detected in ${message.channel} by ${message.author} (${detail}): \`${content}\``,
		allowedMentions: { parse: [] },
	}));
}

discordClient.on('message', message => {
	// ignore messages from bots
	if (config['ignore-bots'] && message.author.bot) {
		return;
	}

	const channel = message.channel;
	const channelNSFW = channel.nsfw;
	let deleted = false;

	// check for profanity if enabled
	if (filter && (!config.profanity['exclude-nsfw'] || !channelNSFW) && filter.isProfane(message.content)) {
		sendReport('Profanity', message, 'word filter');
		// warn the offender if enabled
		if (config.profanity.warn.enabled) {
			attempt('warn', message.reply(config.profanity.warn.message));
		}
		// delete the message if enabled
		if (config.profanity.delete) {
			deleted = true;
			attempt('delete message', message.delete());
		}
	}

	// check for spam if enabled
	if (spam) {
		const result = spam.check({
			authorId: message.author.id,
			messageId: message.id,
			content: message.content,
			timestamp: message.createdTimestamp,
		});
		if (!result.spam) return;

		sendReport('Spam', message, result.reason);
		if (config.spam.delete) {
			const ids = result.messageIds.filter(id => !(deleted && id === message.id));
			if (ids.length) {
				attempt('delete spam', channel.bulkDelete(ids, true));
			}
		}
		if (config.spam.ban && message.guild) {
			attempt('ban', message.guild.members.ban(message.author.id, {
				reason: `Janny: spam (${result.reason})`,
				deleteMessageSeconds: config.spam.time,
			}));
		}
	}
});
