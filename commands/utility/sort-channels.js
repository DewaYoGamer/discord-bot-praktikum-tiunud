const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sort-channels")
    .setDescription("Sort voice channels by group number in asdos.json")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.deferReply();
      // Read the asdos.json file
      const dataPath = path.join(__dirname, "../../asdos.json");
      let asdosData = [];

      try {
        if (fs.existsSync(dataPath)) {
          const fileContent = fs.readFileSync(dataPath, "utf8");
          if (fileContent && fileContent.trim() !== "") {
            asdosData = JSON.parse(fileContent);
          }
        }
      } catch (error) {
        console.error("Error reading asdos.json:", error);
        return await interaction.reply("Failed to read asdos data file.");
      }

      // Filter for valid entries with voiceChannelID
      const validEntries = asdosData.filter((asdos) => asdos.voiceChannelID);

      if (validEntries.length === 0) {
        return await interaction.reply(
          "No voice channels found in asdos.json."
        );
      }

      // Create a map of voiceChannelIDs to group numbers for sorting
      const channelGroups = new Map();
      for (const asdos of validEntries) {
        // Use the primary group number for sorting
        channelGroups.set(asdos.voiceChannelID, asdos.group);
      }

      // Create array for sorting
      const channelsToSort = Array.from(channelGroups.entries()).map(
        ([channelId, group]) => {
          const channel = interaction.guild.channels.cache.get(channelId);
          return { channel, group };
        }
      );

      // Sort channels by group
      channelsToSort.sort((a, b) => a.group - b.group);

      for (let i = 0; i < channelsToSort.length; i++) {
        const { channel } = channelsToSort[i];
        await channel.setPosition(i);
      }

      await interaction.editReply(
        `Successfully sorted voice channels by group number.`
      );
    } catch (error) {
      console.error("Error in sort-channels command:", error);
      await interaction.editReply(`Error sorting channels: ${error.message}`);
    }
  },
};
