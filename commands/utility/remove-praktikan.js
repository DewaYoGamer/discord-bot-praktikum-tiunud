const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const praktikanPath = path.join(__dirname, "../../praktikan.json");
const asdosPath = path.join(__dirname, "../../asdos.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove-praktikan")
    .setDescription("Removes a praktikan from an asdos's list")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((option) =>
      option
        .setName("nim")
        .setDescription("Enter the NIM of the praktikan to remove")
        .setRequired(true)
        .setMaxLength(10)
        .setMinLength(10)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const nim = interaction.options.getString("nim");

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

      // Find which asdos has this praktikan
      const affectedAsdos = asdosData.find(
        (asdos) =>
          asdos.praktikan &&
          Array.isArray(asdos.praktikan) &&
          asdos.praktikan.includes(nim)
      );

      if (!affectedAsdos) {
        return interaction.editReply(
          `No asdos has a praktikan with NIM ${nim}`
        );
      }

      // Find and update praktikan in praktikanData
      let userRemoved = false;
      const praktikanIndex = praktikanData.findIndex((p) => p.NIM === nim);

      if (praktikanIndex !== -1) {
        const praktikan = praktikanData[praktikanIndex];
        const praktikanName = praktikan.name || nim;
        let hasClaimedRole = false;

        // Check if this praktikan has claimed a role
        if (praktikan.claimed && praktikan.claimedBy) {
          try {
            // Get the user who claimed the role
            const member = await interaction.guild.members.fetch(
              praktikan.claimedBy
            );

            // Get the role to remove
            if (affectedAsdos.roleID) {
              const role = await interaction.guild.roles.fetch(
                affectedAsdos.roleID
              );

              if (role && member.roles.cache.has(role.id)) {
                hasClaimedRole = true;
                await member.roles.remove(role);
                userRemoved = true;
              }
            }
          } catch (removeError) {
            console.error(
              "Error removing role from user:",
              removeError.message
            );
            // Continue with removal even if role removal fails
          } finally {
            // Always remove claimed status, even if role removal fails
            praktikanData[praktikanIndex].claimed = false;
            praktikanData[praktikanIndex].claimedBy = null;
            praktikanData[praktikanIndex].claimedAt = null;

            // Save updated praktikan data
            fs.writeFileSync(
              praktikanPath,
              JSON.stringify(praktikanData, null, 2)
            );

            console.log(`Removed claimed status from praktikan ${nim}`);
          }
        }

        // Remove praktikan from asdos's list
        const asdosIndex = asdosData.findIndex(
          (asdos) => asdos.asdosID === affectedAsdos.asdosID
        );

        if (asdosIndex !== -1) {
          // Filter out the NIM from praktikan array
          asdosData[asdosIndex].praktikan = asdosData[
            asdosIndex
          ].praktikan.filter((praktikanNIM) => praktikanNIM !== nim);

          // Save updated asdos data
          fs.writeFileSync(asdosPath, JSON.stringify(asdosData, null, 2));

          let responseMessage = `Removed praktikan ${praktikanName} (${nim}) from ${affectedAsdos.name}'s list.`;

          if (hasClaimedRole) {
            responseMessage += userRemoved
              ? " Also removed the associated role from the user."
              : " The user had claimed this role, but role removal failed (see logs).";
          }

          if (praktikan.claimed) {
            responseMessage += " Cleared claimed status from praktikan record.";
          }

          return interaction.editReply(responseMessage);
        }
      } else {
        // Remove praktikan from asdos's list even if not found in praktikanData
        const asdosIndex = asdosData.findIndex(
          (asdos) => asdos.asdosID === affectedAsdos.asdosID
        );

        if (asdosIndex !== -1) {
          asdosData[asdosIndex].praktikan = asdosData[
            asdosIndex
          ].praktikan.filter((praktikanNIM) => praktikanNIM !== nim);

          fs.writeFileSync(asdosPath, JSON.stringify(asdosData, null, 2));
          return interaction.editReply(
            `Removed praktikan with NIM ${nim} from ${affectedAsdos.name}'s list. No matching praktikan found in praktikan data.`
          );
        }
      }

      return interaction.editReply(
        "An error occurred while removing the praktikan."
      );
    } catch (error) {
      console.error("Error removing praktikan:", error);
      return interaction.editReply(`An error occurred: ${error.message}`);
    }
  },
};
