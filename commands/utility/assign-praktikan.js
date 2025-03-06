const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("assign-praktikan")
    .setDescription("Assign a praktikan")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((option) =>
      option
        .setName("nim")
        .setDescription("Enter the NIM of the praktikan")
        .setRequired(true)
        .setMaxLength(10)
        .setMinLength(10)
    ),
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      // Find the asdos with the given user ID
      const asdosIndex = asdosData.findIndex(
        (asdos) => asdos.userID === userId
      );

      if (asdosIndex === -1) {
        await interaction.reply({
          content: `You are not registered as an asdos! Your user ID: ${userId}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      
      const nim = interaction.options.getString("nim");
      
      // Path to the asdos.json file
      const asdosFilePath = path.join(__dirname, "../../asdos.json");
      // Path to the praktikan.json file
      const praktikanFilePath = path.join(__dirname, "../../praktikan.json");

      // Initialize asdosData
      let asdosData = [];

      // Check if the asdos file exists
      if (!fs.existsSync(asdosFilePath)) {
        return interaction.reply({
          content: "No asdos found. Please add an asdos first.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        // Read existing data
        const fileContent = fs.readFileSync(asdosFilePath, "utf8");
        asdosData = JSON.parse(fileContent);
      }

      // Check if the praktikan file exists
      if (!fs.existsSync(praktikanFilePath)) {
        return interaction.reply({
          content: "Praktikan database not found!",
          flags: MessageFlags.Ephemeral,
        });
      }
      
      // Read praktikan data
      const praktikanData = JSON.parse(fs.readFileSync(praktikanFilePath, "utf8"));
      
      // Check if the NIM exists in praktikan.json
      const nimExists = praktikanData.some(praktikan => praktikan.NIM === nim);
      
      if (!nimExists) {
        return interaction.reply({
          content: `Praktikan with NIM ${nim} doesn't exist in the master database!`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Check if this NIM is already in any praktikan array
      const alreadyExists = asdosData.some((asdos) =>
        asdos.praktikan.includes(nim)
      );

      if (alreadyExists) {
        await interaction.reply({
          content: `Praktikan with NIM ${nim} is already registered!`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Add the NIM to the praktikan array of the specific asdos
      asdosData[asdosIndex].praktikan.push(nim);

      // Write the updated data back to the file
      fs.writeFileSync(asdosFilePath, JSON.stringify(asdosData, null, 2));

      await interaction.reply({
        content: `Successfully added praktikan with NIM ${nim} to your praktikan list!`,
        flags: MessageFlags.Ephemeral,
      });

      // 
    } catch (error) {
      console.error("Error adding praktikan:", error);
      await interaction.reply({
        content: "An error occurred while adding praktikan. Please try again.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};