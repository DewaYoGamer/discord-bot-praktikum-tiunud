const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { default: axios } = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('up-praktikans')
        .setDescription('Add or change the list of praktikans')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addAttachmentOption(option =>
            option.setName('praktikans')
                .setDescription('Upload the list of praktikans')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            // Get the attachment URL
            const attachment = interaction.options.getAttachment('praktikans');
            const attachmentPath = path.join(__dirname, '../../praktikan.json');
            
            // Download the file content
            const response = await axios.get(attachment.url, { responseType: 'text' });
            
            // Write the content to the file
            fs.writeFileSync(attachmentPath, response.data, 'utf8');
            
            await interaction.editReply({ content: 'Praktikans list has been updated!' });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Failed to update praktikans list: ' + error.message });
        }
    }
};