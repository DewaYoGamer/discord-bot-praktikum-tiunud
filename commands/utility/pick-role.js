const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const praktikanPath = path.join(__dirname, '../../praktikan.json');
const asdosPath = path.join(__dirname, '../../asdos.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pick-role')
        .setDescription('Takes an asdos role')
        .addStringOption(option =>
            option.setName('nim')
                .setDescription('Enter your NIM')
                .setMaxLength(10)
                .setMinLength(10)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('key')
                .setDescription('Enter asdos key to join their group')
                .setMinLength(6)
                .setRequired(true)),
    async execute(interaction) {
        const nim = interaction.options.getString('nim');
        const key = interaction.options.getString('key');
        const member = interaction.member;

        try {
            const praktikanData = JSON.parse(fs.readFileSync(praktikanPath, 'utf8'));
            const asdosData = JSON.parse(fs.readFileSync(asdosPath, 'utf8'));
            
            if (!nim && !key) {
                return interaction.reply({
                    content: 'Please provide either your NIM or an asdos key.',
                    ephemeral: true
                });
            }

            if (nim) {
                const matchingPraktikan = praktikanData.find(praktikan => praktikan.NIM === nim);
                if (!matchingPraktikan) {
                    console.log('NIM not found in the database!');
                    return interaction.reply({
                        content: 'NIM not found in the database!',
                        ephemeral: true
                    });
                }

                // Find which asdos has this NIM in their praktikan array
                const matchingAsdos = asdosData.find(asdos => 
                    asdos.praktikan && 
                    Array.isArray(asdos.praktikan) && 
                    asdos.praktikan.includes(nim)
                );
                
                if (matchingAsdos) {
                    if (key !== matchingAsdos.key) {
                        return interaction.reply({
                            content: 'The key you provided is incorrect.',
                            ephemeral: true
                        });
                    }

                    // Get the corresponding roleID
                    const roleId = matchingAsdos.roleID.toString();
                    
                    // Check if role exists
                    const role = interaction.guild.roles.cache.get(roleId);
                    if (!role) {
                        return interaction.reply({
                            content: 'Role not found in this server! Please contact an administrator.',
                            ephemeral: true
                        });
                    }
                    
                    // Check if the member already has this role
                    if (member.roles.cache.has(roleId)) {
                        return interaction.reply({
                            content: `You already have the **${role.name}** role.`,
                            ephemeral: true
                        });
                    }
                    
                    // Add role to the member
                    await member.roles.add(role);
                    
                    return interaction.reply({
                        content: `You have been assigned to ${matchingAsdos.name}'s group based on your NIM!`,
                        ephemeral: true
                    });
                }
                else {
                    return interaction.reply({
                        content: 'You are not registered as a praktikan!',
                        ephemeral: true
                    });
                }
            }
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error assigning the role!',
                ephemeral: true
            });
        }
    },
};