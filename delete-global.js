const { REST, Routes } = require('discord.js');
const env = require('dotenv').config().parsed;

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(env.DISCORD_TOKEN);

rest.put(Routes.applicationCommands(env.CLIENT_ID), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);