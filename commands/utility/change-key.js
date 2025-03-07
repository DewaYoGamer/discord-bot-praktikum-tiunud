const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("change-key")
    .setDescription("Change the key to Praktikan joining to your Asdos")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((option) =>
      option
        .setName("key")
        .setDescription("Enter the new key")
        .setMinLength(6)
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
        const key = interaction.options.getString("key");
        const userId = interaction.user.id;

        // Define path to the JSON file
        const dataPath = path.join(__dirname, '../../asdos.json');

        // Read the JSON file
        let asdosData;
        try {
            asdosData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } catch (error) {
            return interaction.reply({ 
                content: "Failed to read the asdos data file.",  
                flags: MessageFlags.Ephemeral 
            });
        }

        // Find the asdos with the given user ID
        if (!Array.isArray(asdosData)) {
            return interaction.reply({ 
                content: "Invalid asdos data format.",  
                flags: MessageFlags.Ephemeral 
            });
        }

        const asdosIndex = asdosData.findIndex(asdos => asdos.userID === userId);

        if (asdosIndex === -1) {
            return interaction.reply({
                content: `You are not registered as an asdos! Your user ID: ${userId}`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Update the key for the found asdos
        asdosData[asdosIndex].key = key;

        // Save the updated data
        fs.writeFileSync(dataPath, JSON.stringify(asdosData, null, 2), 'utf8');
        
        return interaction.reply({ 
            content: `Key updated successfully! Your new key is: **${key}**`, 
            flags: MessageFlags.Ephemeral 
        });
    } catch (error) {
        console.error("Error changing key:", error);
        return interaction.reply({ 
            content: "An error occurred while changing the key.", 
            flags: MessageFlags.Ephemeral 
        });
    }
  },
};