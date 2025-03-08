const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const praktikanPath = path.join(__dirname, "../../praktikan.json");
const asdosPath = path.join(__dirname, "../../asdos.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list-praktikan")
    .setDescription("Lists all praktikan assigned to you")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addIntegerOption((option) =>
      option.setName("group").setDescription("Group number").setMinValue(1)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const userId = interaction.user.id;
      const groupNumber = interaction.options.getInteger("group");

      // Read files
      let asdosData = [];
      let praktikanData = [];

      try {
        if (fs.existsSync(asdosPath)) {
          asdosData = JSON.parse(fs.readFileSync(asdosPath, "utf8"));
        }
        if (fs.existsSync(praktikanPath)) {
          praktikanData = JSON.parse(fs.readFileSync(praktikanPath, "utf8"));
        }
      } catch (error) {
        console.error("Error reading data files:", error);
        return interaction.editReply(
          "Error reading data files. Please check server logs."
        );
      }

      // Find asdos based on criteria
      let targetAsdos;

      if (groupNumber) {
        // If group number is provided, find asdos by group number
        targetAsdos = asdosData.find(
          (a) => a.group === groupNumber || a.groupSecond === groupNumber
        );

        if (!targetAsdos) {
          return interaction.editReply(
            `No asdos found for group ${groupNumber}.`
          );
        }
      } else {
        // Otherwise find by userID
        targetAsdos = asdosData.find((a) => a.userID === userId);

        if (!targetAsdos) {
          return interaction.editReply(
            "You are not registered as an asdos. Please use /add-asdos first."
          );
        }
      }

      if (
        !targetAsdos.praktikan ||
        !Array.isArray(targetAsdos.praktikan) ||
        targetAsdos.praktikan.length === 0
      ) {
        return interaction.editReply(
          `No praktikan assigned to ${
            groupNumber ? `group ${groupNumber}` : "you"
          } yet.`
        );
      }

      // Get details of each praktikan from praktikanData
      const praktikanDetails = [];
      let claimedCount = 0;

      for (const nim of targetAsdos.praktikan) {
        const praktikan = praktikanData.find((p) => p.NIM === nim);

        if (praktikan) {
          praktikanDetails.push({
            nim: praktikan.NIM,
            name: praktikan.name || "No name",
            claimed: praktikan.claimed || false,
            claimedBy: praktikan.claimedBy || null,
          });

          if (praktikan.claimed) {
            claimedCount++;
          }
        } else {
          praktikanDetails.push({
            nim: nim,
            name: "Unknown",
            claimed: false,
            claimedBy: null,
          });
        }
      }

      // Sort praktikans: claimed first, then alphabetically by name
      praktikanDetails.sort((a, b) => {
        if (a.claimed !== b.claimed) {
          return a.claimed ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      // Create embed for response
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`Praktikan List for ${targetAsdos.name}`)
        .setDescription(
          `Group${targetAsdos.groupSecond ? "s" : ""}: ${targetAsdos.group}${
            targetAsdos.groupSecond ? " & " + targetAsdos.groupSecond : ""
          }`
        )
        .addFields(
          {
            name: "Total Praktikan",
            value: targetAsdos.praktikan.length.toString(),
            inline: true,
          },
          { name: "Claimed", value: claimedCount.toString(), inline: true },
          {
            name: "Unclaimed",
            value: (targetAsdos.praktikan.length - claimedCount).toString(),
            inline: true,
          }
        );

      // Add praktikans to embed (maximum 25 fields total in an embed)
      const praktikanList = praktikanDetails.map((p, index) => {
        const claimStatus = p.claimed ? "✅" : "❌";
        return `${index + 1}. ${claimStatus} ${p.name} (${p.nim})`;
      });

      // Split praktikan list into chunks of 15 entries
      const chunkSize = 15;
      for (let i = 0; i < praktikanList.length; i += chunkSize) {
        const chunk = praktikanList.slice(i, i + chunkSize);
        embed.addFields({
          name: i === 0 ? "Praktikan List" : "\u200B", // Invisible character for subsequent field names
          value: chunk.join("\n") || "No praktikan found",
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error listing praktikan:", error);
      await interaction.editReply(`An error occurred: ${error.message}`);
    }
  },
};
