const info = require("systeminformation");
const os = require("os");
const fs = require("fs");
const moment = require("moment");

const config = JSON.parse(fs.readFileSync("./config.json"));
const Discord = require('discord.js');
const client = new Discord.Client();

let MESSAGE;

const conversionFactor = 9.3132 * 1e-10;

async function update() {
	if (!MESSAGE) return console.log('Unable to fetch channel or message.');
	let payload = '';
	let currentLoad = (await info.currentLoad().then(data => data.currentLoad)).toFixed(2);
	let batteryData = await info.battery();
	if (batteryData.hasBattery) {
		payload += `:battery: **Battery:** ${batteryData.percent}% ${batteryData.isCharging ? '(Charging)' : '(Not Charging)'}\n`;
	}

	let totalMem = (os.totalmem() * conversionFactor).toFixed(2);
	let usedMem = (totalMem - (os.freemem() * conversionFactor)).toFixed(2);

	payload += `:gear: **CPU Usage:** ${currentLoad}%\n`;
	payload += `:tools: **Memory Usage:** ${usedMem} GB / ${totalMem} GB\n`;


	payload += `\n:timer: **Last Updated:** ${moment().format("hh:mm:ss A DD-MM-YYYY")} `;
	MESSAGE.edit(payload);
	setTimeout(update, config.interval * 1000);
}


client.on('ready', async () => {
	client.user.setPresence({ activity: { name: 'Watching s.help' }, status: 'active' })
	console.log(`Logged in as ${client.user.tag} !`);

	if (config.messageID && config.channelID) {
		let channel = await client.channels.fetch(config.channelID);
		MESSAGE = await channel.messages.fetch(config.messageID);
		update();
	}
});

client.on('message', async (message) => {
	if (message.author.bot) return;
	if (message.content === 's.start') {
		if (config.messageID) return message.reply("stats has already started.");

		let msg = await message.channel.send("Starting...");
		config.messageID = msg.id;
		config.channelID = msg.channel.id;
		MESSAGE = msg;
		fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
		update();
	}
	if (message.content === 's.ping') {
		const msg = await message.channel.send('Ping?')
		msg.edit(`Pong! Latency is ${Math.round(msg.createdTimestamp - message.createdTimestamp)} ms.API Latency is ${Math.round(client.ws.ping)} ms`)
	}
	if (message.content === 's.help') {
		const help = [
			'Welcome to PC STAT BOT',
			'',
			'Here are the list of commands: ',
			'`s.ping` - shows my latency',
			'`s.start` - start updating the stats',
			'`s.help` - shows this message',
			'',
			'About me',
			'I am made by Delano Lourenco - https://delano-lourenco.web.app',
			'For suggestions or bugs join my support server - https://discord.gg/FZY9TqW'
		].join('\n');
		return message.channel.send(help);
	}
});

try {
	console.log("Starting PC STAT BOT");
	client.login(config.token);
} catch (err) {
	console.log('Error logging in.', err);
	client.login(config.token);
}
client.on("error", (err) => {
	console.log('Dicord Client Error:', err);
	client.login(config.token);
})
process.on('unhandledRejection', err => { console.log('Caught Error:', err) })