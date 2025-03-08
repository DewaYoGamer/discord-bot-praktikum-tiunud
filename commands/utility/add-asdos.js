const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const env = require("dotenv").config().parsed;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-asdos")
    .setDescription("Add a new asdos")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((option) =>
      option
        .setName("full-name")
        .setDescription("Enter the full name of the asdos")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("short-name")
        .setDescription("Enter the short name of the asdos")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("group-number")
        .setDescription("Enter the group number of the asdos")
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption((option) =>
      option
        .setName("group-number-second")
        .setDescription("Enter the second group number of the asdos")
        .setMinValue(1)
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();
      // Process input parameters directly without deferring
      const dataPath = path.join(__dirname, "../../asdos.json");
      const asdosData = readAsdosData(dataPath);
      const userID = interaction.user.id;
      const existingAsdos = asdosData.find((asdos) => asdos.userID === userID);

      let fullname = interaction.options.getString("full-name");
      fullname = fullname.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      let shortname = interaction.options.getString("short-name");
      if (shortname[0].toLowerCase() === shortname[0]) {
        shortname = shortname[0].toUpperCase() + shortname.slice(1);
      }
      const [group1, group2] = normalizeGroups(
        interaction.options.getInteger("group-number"),
        interaction.options.getInteger("group-number-second")
      );

      // Process the request (create or update)
      const result = await (existingAsdos
        ? updateAsdos(
            interaction.guild,
            asdosData,
            existingAsdos,
            fullname,
            shortname,
            group1,
            group2
          )
        : createAsdos(
            interaction.guild,
            asdosData,
            userID,
            fullname,
            shortname,
            group1,
            group2
          ));

      // Save data
      writeAsdosData(dataPath, asdosData);

      // Send direct reply instead of editing
      await interaction.editReply({ content: result.message });
    } catch (error) {
      console.error("Error in add-asdos command:", error);

      // Direct error reply without checking deferred state
      try {
        await interaction.editReply({
          content: `Failed to add/update asdos: ${error.message}`,
        });
      } catch (responseError) {
        console.error("Failed to send error response:", responseError);
      }
    }
  },
};

/**
 * Create a new asdos entry
 */
async function createAsdos(
  guild,
  asdosData,
  userID,
  fullname,
  shortname,
  group1,
  group2
) {
  // Create role and voice channel
  const role = await ensureRole(
    guild,
    `Praktikan ${shortname}`,
    "#64ab00",
    `Role created for asdos ${fullname}`
  );

  const voiceChannelID = await createVoiceChannel(
    guild,
    group1,
    group2,
    shortname,
    role.id
  );

  // Create and add the new asdos entry
  const newAsdos = {
    asdosID:
      asdosData.length > 0
        ? Math.max(...asdosData.map((a) => a.asdosID)) + 1
        : 1,
    userID,
    group: group1,
    groupSecond: group2,
    name: fullname,
    roleID: role.id,
    voiceChannelID,
    praktikan: [],
  };

  asdosData.push(newAsdos);
  return {
    success: true,
    message: `Successfully added asdos ${fullname}. Role and voice channel created.`,
  };
}

/**
 * Update an existing asdos entry
 */
async function updateAsdos(
  guild,
  asdosData,
  existingAsdos,
  fullname,
  shortname,
  group1,
  group2
) {
  const nameChanged = shortname !== existingAsdos.name.split(" ").pop();
  const groupChanged =
    group1 !== existingAsdos.group || group2 !== existingAsdos.groupSecond;

  if (!nameChanged && !groupChanged) {
    return {
      success: true,
      message: `No changes needed for asdos ${fullname}.`,
    };
  }

  // Update role and voice channel as needed
  const roleID = await updateAsdosRole(
    guild,
    existingAsdos,
    shortname,
    fullname
  );
  const voiceChannelID = await updateAsdosVoiceChannel(
    guild,
    existingAsdos,
    group1,
    group2,
    shortname,
    roleID
  );

  // Update data in the array
  const index = asdosData.findIndex((a) => a.userID === existingAsdos.userID);
  asdosData[index] = {
    ...existingAsdos,
    group: group1,
    groupSecond: group2,
    name: fullname,
    roleID: roleID || existingAsdos.roleID,
    voiceChannelID: voiceChannelID || existingAsdos.voiceChannelID,
  };

  return {
    success: true,
    message: `Updated asdos information for ${fullname}.`,
  };
}

/**
 * Read and parse asdos data, with error handling
 */
function readAsdosData(dataPath) {
  const ensureValidData = () => {
    fs.writeFileSync(dataPath, "[]");
    return [];
  };

  try {
    if (!fs.existsSync(dataPath)) return ensureValidData();

    const fileContent = fs.readFileSync(dataPath, "utf8");
    if (!fileContent || fileContent.trim() === "") return ensureValidData();

    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : ensureValidData();
  } catch (error) {
    console.error("Error reading asdos data:", error);
    return ensureValidData();
  }
}

/**
 * Write asdos data to file
 */
function writeAsdosData(dataPath, data) {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

/**
 * Normalize group numbers to ensure first is lowest
 */
function normalizeGroups(primary, secondary) {
  if (!secondary || primary === secondary) return [primary, null];
  return primary < secondary ? [primary, secondary] : [secondary, primary];
}

/**
 * Create or update a role
 */
async function updateAsdosRole(guild, existingAsdos, shortname, fullname) {
  try {
    const oldRole = await guild.roles.fetch(existingAsdos.roleID);
    if (oldRole) {
      await oldRole.setName(`Praktikan ${shortname}`);
      return existingAsdos.roleID;
    }
  } catch (error) {
    console.error("Role not found, creating new one:", error.message);
  }

  const newRole = await guild.roles.create({
    name: `Praktikan ${shortname}`,
    color: "#64ab00",
    reason: `Role created for asdos ${fullname}`,
  });
  return newRole.id;
}

/**
 * Create a new role
 */
async function ensureRole(guild, name, color, reason) {
  return await guild.roles.create({ name, color, reason });
}

/**
 * Update or create a voice channel
 */
async function updateAsdosVoiceChannel(
  guild,
  existingAsdos,
  group1,
  group2,
  shortname,
  roleID
) {
  try {
    // First create a new voice channel
    const newVoiceChannelID = await createVoiceChannel(
      guild,
      group1,
      group2,
      shortname,
      roleID
    );

    // Then delete the old one if it exists
    if (existingAsdos.voiceChannelID) {
      try {
        const oldVoiceChannel = await guild.channels.fetch(
          existingAsdos.voiceChannelID
        );

        if (oldVoiceChannel) {
          // Delete the old channel
          await oldVoiceChannel.delete(
            `Replaced with a new channel for Praktikan ${shortname}`
          );
        }
      } catch (deleteError) {
        console.error("Error deleting old voice channel:", deleteError);
        // We continue even if deleting fails - the new channel is still created
      }
    }

    return newVoiceChannelID;
  } catch (error) {
    console.error("Error in voice channel replacement:", error);
    throw error;
  }
}

/**
 * Generate channel name
 */
function generateVoiceChannelName(groupNumber, groupNumberSecond, shortname) {
  let groupText = groupNumberSecond
    ? `[${Math.min(groupNumber, groupNumberSecond)} & ${Math.max(
        groupNumber,
        groupNumberSecond
      )}]`
    : `[${groupNumber}]`;
  return `${groupText} Praktikan ${shortname}`;
}

/**
 * Finds or creates a category channel named "EXAM CHANNEL"
 * @param {Guild} guild - Discord guild object
 * @returns {Promise<string>} - ID of the category channel
 */
async function findOrCreateExamCategory(guild) {
  try {
    // Try to find existing category with name "EXAM CHANNEL"
    const existingCategory = guild.channels.cache.find(
      (channel) =>
        channel.type === ChannelType.GuildCategory &&
        channel.name === "EXAM CHANNEL"
    );

    if (existingCategory) {
      return existingCategory.id;
    }

    // Create new category if it doesn't exist
    const newCategory = await guild.channels.create({
      name: "EXAM CHANNEL",
      type: ChannelType.GuildCategory,
      reason: "Category for exam voice channels",
    });

    return newCategory.id;
  } catch (error) {
    console.error("Error finding/creating category:", error);
    throw error;
  }
}

/**
 * Create a voice channel with permissions
 */
async function createVoiceChannel(
  guild,
  groupNumber,
  groupNumberSecond,
  shortname,
  roleID
) {
  try {
    const categoryId = await findOrCreateExamCategory(guild);
    const asdosRoleID = env.ASDOS_ROLE_ID;

    const permissionOverwrites = [
      {
        id: guild.id,
        deny: [
          PermissionsBitField.Flags.Connect,
        ],
      },
      {
        id: roleID,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
        ],
      },
    ];

    if (asdosRoleID) {
      permissionOverwrites.push({
        id: asdosRoleID,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.MuteMembers,
          PermissionsBitField.Flags.DeafenMembers,
          PermissionsBitField.Flags.MoveMembers,
        ],
      });
    }

    const channelName = generateVoiceChannelName(
      groupNumber,
      groupNumberSecond,
      shortname
    );
    const voiceChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      permissionOverwrites,
      parent: categoryId,
      reason: `Voice channel for Praktikan ${shortname}`,
    });

    return voiceChannel.id;
  } catch (error) {
    console.error("Error creating voice channel:", error);
    throw error;
  }
}
