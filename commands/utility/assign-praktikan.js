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
      const nim = interaction.options.getString("nim");
      const userId = interaction.user.id;
      
      // Path to the asdos.json file
      const asdosFilePath = path.join(__dirname, "../../asdos.json");
      // Path to the praktikan.json file
      const praktikanFilePath = path.join(__dirname, "../../praktikan.json");

      // Initialize asdosData
      let asdosData = [];

      // Check if the asdos file exists
      if (!fs.existsSync(asdosFilePath)) {
        return interaction.reply({
          content: "No asdos found. Please add an asdos first."
        });
      } else {
        // Read existing data
        const fileContent = fs.readFileSync(asdosFilePath, "utf8");
        asdosData = JSON.parse(fileContent);
      }
      
      // NOW we can find the asdos with the given user ID
      const asdosIndex = asdosData.findIndex(
        (asdos) => asdos.userID === userId
      );

      if (asdosIndex === -1) {
        return interaction.reply({
          content: `You are not registered as an asdos! Your user ID: ${userId}`
        });
      }

      // Check if the praktikan file exists
      if (!fs.existsSync(praktikanFilePath)) {
        return interaction.reply({
          content: "Praktikan database not found!",
        });
      }
      
      // Read praktikan data
      const praktikanData = JSON.parse(fs.readFileSync(praktikanFilePath, "utf8"));
      
      // Check if the NIM exists in praktikan.json
      const nimExists = praktikanData.some(praktikan => praktikan.NIM === nim);
      
      if (!nimExists) {
        return interaction.reply({
          content: `Praktikan with NIM ${nim} doesn't exist in the master database!`
        });
      }

      // Check if this NIM is already in any praktikan array
      const alreadyExists = asdosData.some((asdos) =>
        asdos.praktikan && Array.isArray(asdos.praktikan) && asdos.praktikan.includes(nim)
      );

      if (alreadyExists) {
        return interaction.reply({
          content: `Praktikan with NIM ${nim} is already registered!`
        });
      }

      // Initialize praktikan array if it doesn't exist
      if (!asdosData[asdosIndex].praktikan) {
        asdosData[asdosIndex].praktikan = [];
      }

      // Add the NIM to the praktikan array of the specific asdos
      asdosData[asdosIndex].praktikan.push(nim);

      // Write the updated data back to the file
      fs.writeFileSync(asdosFilePath, JSON.stringify(asdosData, null, 2));

      return interaction.reply({
        content: `Successfully added praktikan with NIM ${nim} to your praktikan list!`
      });

    } catch (error) {
      console.error("Error adding praktikan:", error);
      return interaction.reply({
        content: "An error occurred while adding praktikan. Please try again."
      });
    }
  },
};