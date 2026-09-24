const EventEmitter = require('events');
const { Client, GatewayIntentBits, Events } = require('discord.js');

class Discord extends EventEmitter {
	constructor(config, token) {
		super();
		this.token = token;
		this.intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent];
		this.client = new Client({ intents: this.intents });

		this.client.once(Events.ClientReady, c => {
			console.log(`Discord Ready! Logged in as ${c.user.tag}`);
			this.emit('ready');
		});

		// an 'error' event with no listener throws and takes the bot down
		this.client.on(Events.Error, err => {
			console.error(`Discord client error: ${err.message}`);
		});

		this.client.on(Events.MessageCreate, message => {
			this.emit('message', message);
		});

		this.connect();
	}

	connect() {
		this.client.login(this.token).catch(err => {
			console.error(`Discord login failed: ${err.message}`);
			process.exit(1);
		});
	}

	send(message) {
		//const channel = this.client.channels.cache.get(this.channel);
		//channel.send(message);
	}

	getChannel(id) {
		return this.client.channels.cache.get(id);
	}
}

module.exports = Discord;