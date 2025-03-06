const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-asdos")
    .setDescription("Add a new asdos")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((option) =>
      option
        .setName("nim")
        .setDescription("Enter the NIM of the asdos")
        .setRequired(true)
        .setMaxLength(10)
        .setMinLength(10)
    )
    .addStringOption((option) =>
      option
        .setName("fullname")
        .setDescription("Enter the full name of the asdos")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("shortname")
        .setDescription("Enter the short name of the asdos")
        .setRequired(true)
    ),
  async execute(interaction) {
    // Get the options from the command
    const nim = interaction.options.getString("nim");
    const fullname = interaction.options.getString("fullname");
    const shortname = interaction.options.getString("shortname");

    // Get the user ID of the person executing the command
    const userID = interaction.user.id;

    try {
      // Read the asdos data from the file
      const dataPath = path.join(__dirname, "../../asdos.json");
      let asdosData = [];

      // Check if the file exists
      if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, "utf8");
        asdosData = JSON.parse(fileContent);
      }

      // Check if the asdos already exists
      const existingAsdosIndex = asdosData.findIndex(
        (asdos) => asdos.userID === userID
      );
      const existingAsdos =
        existingAsdosIndex !== -1 ? asdosData[existingAsdosIndex] : null;

      let response = "";
      let roleID;

      if (existingAsdos) {
        // Asdos already exists, update their information
        const oldShortname = existingAsdos.name.split(" ").pop(); // Simplified way to get old shortname

        // Check if shortname changed
        if (shortname !== oldShortname) {
          // Update the role name if it exists
          try {
            const oldRole = await interaction.guild.roles.fetch(
              existingAsdos.roleID
            );
            if (oldRole) {
              await oldRole.setName(`Praktikan ${shortname}`);
              response = `Updated asdos information and renamed role to Praktikan ${shortname}`;
            } else {
              // Create a new role if the old one doesn't exist anymore
              const newRole = await interaction.guild.roles.create({
                name: `Praktikan ${shortname}`,
                color: "#64ab00",
                reason: `Role created for updated asdos ${fullname}`,
              });
              roleID = newRole.id;
              response = `Updated asdos information and created new role Praktikan ${shortname}`;
            }
          } catch (error) {
            console.error("Error updating role:", error);
            // Create a new role if there was an error updating the old one
            const newRole = await interaction.guild.roles.create({
              name: `Praktikan ${shortname}`,
              color: "#64ab00",
              reason: `Role created for updated asdos ${fullname}`,
            });
            roleID = newRole.id;
            response = `Updated asdos information and created new role Praktikan ${shortname}`;
          }
        } else {
          roleID = existingAsdos.roleID;
          response = `Updated information for asdos ${fullname}`;
        }

        // Update the existing asdos data
        asdosData[existingAsdosIndex] = {
          ...existingAsdos,
          NIM: nim,
          name: fullname,
          roleID: roleID || existingAsdos.roleID,
        };
      } else {
        // Calculate the next asdosID for new asdos
        const nextAsdosID =
          asdosData.length > 0
            ? Math.max(...asdosData.map((asdos) => asdos.asdosID)) + 1
            : 1;

        // Create the new role with the specified color
        const roleName = `Praktikan ${shortname}`;
        const role = await interaction.guild.roles.create({
          name: roleName,
          color: "#64ab00",
          reason: `Role created for asdos ${fullname}`,
        });

        // Create the new asdos entry
        const newAsdos = {
          asdosID: nextAsdosID,
          userID: userID,
          NIM: nim,
          name: fullname,
          roleID: role.id,
          praktikan: [],
        };

        // Add the new asdos to the data
        asdosData.push(newAsdos);
        response = `Successfully added asdos ${fullname} with ID ${nextAsdosID}. Role created: Praktikan ${shortname}`;
      }

      // Ensure the directory exists
      const dir = path.dirname(dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the updated data back to the file
      fs.writeFileSync(dataPath, JSON.stringify(asdosData, null, 2));

      await interaction.reply({
        content: response,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: `Failed to add/update asdos: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
