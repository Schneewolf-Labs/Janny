require('dotenv').config();
const fs = require('fs');
const YAML = require('yaml');
const badWords = require('bad-words');

const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'));

const Discord = require('./discord');
const discordClient = new Discord(config, process.env.DISCORD_TOKEN);

discordClient.on('message', message => {
	//console.log('Got message', message.content);
});