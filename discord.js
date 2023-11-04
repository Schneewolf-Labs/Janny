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
		});

		this.client.on(Events.MessageCreate, message => {
			this.emit('message', message);
		});

		this.connect();
	}

	connect() {
		this.client.login(this.token);
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