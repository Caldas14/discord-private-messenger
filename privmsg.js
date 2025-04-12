/**
 * Discord Private Messenger Bot
 * Author: Felipe Caldas (@felipecaldass)
 * GitHub: https://github.com/Caldas14
 * 
 * This bot allows sending private messages to members of specific roles in a Discord server.
 * It provides an interactive interface for selecting roles, previewing messages,
 * and tracking message delivery status.
 */

// Import required Discord.js components
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
} = require('discord.js');

// Import Node.js built-in modules
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

/**
 * InteractionManager Class
 * 
 * Manages the state of ongoing interactions between users and the bot.
 * Uses a Map to store user-specific interaction states, allowing multiple
 * users to have concurrent interactions without conflicts.
 */
class InteractionManager {
  constructor() {
    // Initialize a Map to store user interaction states
    this.interactionState = new Map();
  }

  /**
   * Set the state for a specific user
   * @param {string} userId - Discord user ID
   * @param {Object} state - The state object to store
   */
  setState(userId, state) {
    this.interactionState.set(userId, state);
  }

  /**
   * Get the current state for a specific user
   * @param {string} userId - Discord user ID
   * @returns {Object|undefined} The user's state or undefined if not found
   */
  getState(userId) {
    return this.interactionState.get(userId);
  }

  /**
   * Delete the state for a specific user
   * @param {string} userId - Discord user ID
   */
  deleteState(userId) {
    this.interactionState.delete(userId);
  }

  /**
   * Check if a state exists for a specific user
   * @param {string} userId - Discord user ID
   * @returns {boolean} True if the user has a state, false otherwise
   */
  hasState(userId) {
    return this.interactionState.has(userId);
  }
}

// Create an instance of the InteractionManager
const interactionManager = new InteractionManager();

/**
 * Initialize Discord client with required intents
 * 
 * Intents explanation:
 * - Guilds: Required to receive guild events
 * - GuildMembers: Required to access guild member information
 * - GuildMessages: Required to receive message events
 * - MessageContent: Required to access message content
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Load configuration from environment variables
const TOKEN2 = process.env.TOKEN2;               // Discord bot token
const GUILD_ID = process.env.GUILD_ID;           // Discord server ID
const CARGO_SUPORTE_ID = process.env.CARGO_SUPORTE_ID; // Support role ID required to send private messages



/**
 * Event handler for when the bot is ready and connected to Discord
 * Initializes slash commands and verifies the bot can access the specified guild
 */
client.once('ready', async () => {
  console.log(`✅ Bot connected as ${client.user.tag}!`);

  // Verify the bot can access the specified guild
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.error('❌ Server not found. Check the GUILD_ID.');
    return;
  }

  // Define slash commands for the bot
  const commands = [
    // /message command - Initiates the process of sending a message to a role
    new SlashCommandBuilder()
      .setName('message')
      .setDescription('📜 Prepares a message to send to a specific role.')
      .addStringOption((option) =>
        option
          .setName('content')
          .setDescription('✉️ The message you want to send.')
          .setRequired(true)
      ),
    
    // /cancel command - Cancels an active interaction
    new SlashCommandBuilder()
      .setName('cancel')
      .setDescription('❌ Cancels the active interaction if you have lost control of it.'),
    
    // /help command - Shows available commands
    new SlashCommandBuilder()
      .setName('help')
      .setDescription('❓ Shows the list of available commands and their functionalities.'),
  ];

  // Register the commands with Discord
  await guild.commands.set(commands);
  console.log('✅ Commands registered successfully!');
});

/**
 * Main interaction handler for all Discord interactions
 * This event fires whenever a user interacts with the bot through commands or buttons
 */
client.on('interactionCreate', async (interaction) => {
  try {
    const guild = interaction.guild;
    const authorId = interaction.user.id;

    /**
     * Handler for the /help command
     * Displays an embed with information about all available commands
     */
    if (interaction.isCommand() && interaction.commandName === 'help') {
      const helpEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('📚 **Command List**')
        .setDescription('Here are all the commands available in the bot:')
        .addFields(

          {
            name: '📝 **/message**',
            value: 'Sends a message to a specific role (staff only)',
            inline: false
          },
          {
            name: '❌ **/cancel**',
            value: 'Cancels an active mass message interaction (staff only)',
            inline: false
          }
        )
        .setFooter({ text: '🔧 Developed by @felipecaldass | Use commands wisely!' })
        .setTimestamp();

      await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
      return;
    }

    /**
     * Handler for the /message command
     * Initiates the process of sending a message to a role
     * Only users with the support role can use this command
     */
    if (interaction.isCommand() && interaction.commandName === 'message') {
      if (interactionManager.hasState(authorId)) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('⚠️ Active Interaction')
          .setDescription('You already have an active interaction. Please finish the current interaction before starting another. You can end the interaction manually with the **/cancel** command')
          .setFooter({ text: 'This message will be deleted in 15 seconds.' });

        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        return;
      }

      if (!interaction.member.roles.cache.has(CARGO_SUPORTE_ID)) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Permission Denied')
          .setDescription('You do not have permission to use this command. Only support staff can use it.')
          .setFooter({ text: 'This message will be deleted in 15 seconds.' });

        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        return;
      }

      const content = interaction.options.getString('content');

      interactionManager.setState(authorId, {
        currentMessage: content,
        previewMessage: null,
        selectedRole: null,
        failedUsers: [],
        successfulUsers: [],
      });

      await guild.members.fetch();
      // Filter roles to only include those with at least 2 members
      const roles = guild.roles.cache.filter((role) => role.members.size >= 2);

      if (roles.size === 0) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('⚠️ No Roles Found')
          .setDescription('There are no roles with at least 2 members on the server.')
          .setFooter({ text: 'This message will be deleted in 15 seconds.' });

        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        interactionManager.deleteState(authorId);
        return;
      }

      const buttons = new ActionRowBuilder();
      roles.forEach((role) => {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId(`select_role_${role.id}_${authorId}`)
            .setLabel(role.name)
            .setStyle(ButtonStyle.Primary)
        );
      });

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('📜 Select a Role')
        .setDescription('Choose the role you want to send the message to. Only roles with at least 2 members are listed.')
        .setFooter({ text: '🔧 Developed by @felipecaldass' });

      await interaction.deferReply();
      const preview = await interaction.editReply({
        embeds: [embed],
        components: [buttons],
      });

      interactionManager.getState(authorId).previewMessage = preview;
      console.log('📩 Initial preview sent.');
    }

    /**
     * Handler for the /cancel command
     * Cancels an active interaction and cleans up resources
     * Only users with the support role can use this command
     */
    if (interaction.isCommand() && interaction.commandName === 'cancel') {
      if (!interaction.member.roles.cache.has(CARGO_SUPORTE_ID)) {
        const noPermissionEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ No Permission')
          .setDescription('You do not have permission to use this command. Only support team members can use it.')
          .setFooter({ text: 'This message will be deleted in 10 seconds' });

        const reply = await interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        setTimeout(() => {
          interaction.deleteReply().catch(console.error);
        }, 10000);
        return;
      }

      if (!interactionManager.hasState(authorId)) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('⚠️ No Active Interaction')
          .setDescription('You do not have any active interactions to cancel.')
          .setFooter({ text: 'This message will be deleted in 15 seconds.' });

        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        return;
      }

      const state = interactionManager.getState(authorId);

      if (state.previewMessage) {
        await state.previewMessage.edit({
          content: '❌ Interaction manually cancelled with success.',
          embeds: [],
          components: [],
        });

        setTimeout(() => {
          state.previewMessage.delete().catch((error) => console.error('Error deleting message:', error));
        }, 15000);
      }

      interactionManager.deleteState(authorId);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('✅ Interaction Cancelled')
        .setDescription('The interaction was cancelled with success. This message will be deleted in 15 seconds.')
        .setFooter({ text: 'This message will be removed soon.' });

      await interaction.deferReply();
      const confirmationMessage = await interaction.editReply({
        embeds: [embed],
        fetchReply: true,
      });

      setTimeout(() => {
        confirmationMessage.delete().catch((error) => console.error('Error deleting message:', error));
      }, 15000);
    }



    /**
     * Handler for button interactions
     * Processes various button clicks based on their custom IDs
     */
    if (interaction.isButton()) {
      const authorIdFromCustomId = interaction.customId.split('_').pop();

      // Ignore interactions that are not related to the current user
      if (authorId !== authorIdFromCustomId) {
        return;
      }

      const state = interactionManager.getState(authorId);
      if (!state) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('⚠️ Interaction Not Found')
          .setDescription('Unable to process your interaction. Please try again.')
          .setFooter({ text: 'This message will be deleted in 15 seconds.' });

        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        return;
      }

      /**
       * Handler for role selection buttons
       * Triggered when a user selects a role to send a message to
       */
      if (interaction.customId.startsWith('select_role_')) {
        const roleId = interaction.customId.split('_')[2];
        const role = await guild.roles.fetch(roleId);

        if (!role) {
          await state.previewMessage.edit({
            content: '⚠️ The selected role was not found. Please try again.',
            embeds: [],
            components: [],
          });
          interactionManager.deleteState(authorId);
          return;
        }

        state.selectedRole = role;

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🛠 Message Preview')
          .setDescription(`You selected the role: **${role.name}**

📜 **Message**: ${state.currentMessage}`)
          .setFooter({ text: '🔧 Developed by @felipecaldass' });

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm_send_${authorId}`)
            .setLabel(`✅ Confirm Send (${role.members.size} members)`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`edit_message_${authorId}`)
            .setLabel('✏️ Edit Message')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`cancel_send_${authorId}`)
            .setLabel('❌ Cancel')
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.deferUpdate();
        await state.previewMessage.edit({
          embeds: [embed],
          components: [buttons],
        });
        console.log('📌 Role selected and preview updated.');
      }

      /**
       * Handler for message confirmation button
       * Sends the message to all members of the selected role
       * and provides a detailed delivery report
       */
      if (interaction.customId.startsWith('confirm_send_')) {
        const { currentMessage, selectedRole } = state;

        if (!selectedRole) {
          await interaction.deferUpdate();
          await state.previewMessage.edit({
            content: '⚠️ No role was selected to send the message.',
            embeds: [],
            components: [],
          });
          interactionManager.deleteState(authorId);
          return;
        }

        await interaction.deferUpdate();

        const sendMessages = await Promise.all(
          selectedRole.members.map(async (member) => {
            if (member.user.bot) return { member, success: false };
            try {
              const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('📢 Important Message')
                .setDescription(`Hello, <@${member.user.id}>!

${currentMessage}`)
                .setFooter({ text: `Sent by: ${interaction.member.displayName}` });

              await member.send({ embeds: [embed] });
              return { member, success: true };
            } catch (error) {
              console.error(`Error sending message to ${member.user.tag}: ${error.message}`);
              return { member, success: false };
            }
          })
        );

        let successCount = 0;
        let failedUsers = [];
        let successfulUsers = [];

        sendMessages.forEach((result) => {
          if (result.success) {
            successCount++;
            successfulUsers.push(result.member.user.tag);
          } else {
            failedUsers.push(result.member.user.tag);
          }
        });

        state.failedUsers = failedUsers;
        state.successfulUsers = successfulUsers;

        /**
         * Helper function to split an array into chunks of a specific size
         * Used to divide the list of users who didn't receive messages into manageable chunks
         * that fit within Discord's embed field character limits
         * 
         * @param {Array} arr - The array to split
         * @param {number} size - Maximum size of each chunk
         * @returns {Array} Array of arrays, each containing at most 'size' elements
         */
        const chunkArray = (arr, size) => {
          return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
          );
        };

        const resultEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🚁 Message Sent')
          .setDescription(
            failedUsers.length > 0
              ? `✅ The message was sent to **${successCount}** members of the **${selectedRole.name}** role.
🚨 Unable to send to **${failedUsers.length}** members, as they have disabled private messages!`
              : `✅ All messages were delivered successfully!`
          )
          .addFields({ name: '📜 Sent Message', value: currentMessage })
          .setFooter({ text: '🔧 Developed by @felipecaldass' });

        /**
         * Add list of users who didn't receive the message to the embed
         * Handles Discord's character limits by splitting users into multiple fields if needed
         * 
         * Discord embed limits:
         * - 1024 characters per field
         * - 25 fields per embed
         * - 6000 characters total per embed
         */
        if (failedUsers.length > 0) {
          // Discord limit: 1024 characters per embed field
          // Assuming average username length of 30 characters (including formatting)
          const usersPerField = 25; // About 750 characters per field
          const failedUserChunks = chunkArray(failedUsers, usersPerField);

          failedUserChunks.forEach((chunk, index) => {
            const fieldName = failedUserChunks.length > 1
              ? `🚨 Users who didn't receive the message (${index + 1}/${failedUserChunks.length})`
              : '🚨 Users who didn\'t receive the message';
            
            resultEmbed.addFields({
              name: fieldName,
              value: chunk.map(user => `• ${user}`).join('\n'),
              inline: false
            });
          });
        }

        await state.previewMessage.edit({
          content: '',
          embeds: [resultEmbed],
          components: [],
        });

        console.log('✅ Users who received the message:', successfulUsers);
        console.log('🚨 Users who did not receive the message:', failedUsers);

        interactionManager.deleteState(authorId);
      }

      /**
       * Handler for message editing button
       * Allows the user to edit their message before sending
       */
      if (interaction.customId.startsWith('edit_message_')) {
        await interaction.deferUpdate();
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle('✏️ Editing Message')
          .setDescription('Please enter the new message below.')
          .setFooter({ text: '🔧 Developed by @felipecaldass' });

        await state.previewMessage.edit({
          embeds: [embed],
          components: [],
        });

        const filter = (msg) => msg.author.id === authorId;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1 });

        collector.on('collect', async (msg) => {
          state.currentMessage = msg.content;

          const updatedEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('📚 Updated Preview')
            .setDescription(
              `📜 **Message**: ${msg.content}

Please select one of the options below.

This role has **${state.selectedRole.members.size} members**.`
            )
            .setFooter({ text: '🔧 Developed by @felipecaldass' });

          const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`confirm_send_${authorId}`)
              .setLabel(`✅ Confirm Send (${state.selectedRole.members.size} members)`)
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`edit_message_${authorId}`)
              .setLabel('✏️ Edit Message')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`cancel_send_${authorId}`)
              .setLabel('❌ Cancel')
              .setStyle(ButtonStyle.Danger)
          );

          await msg.delete();

          await state.previewMessage.edit({
            embeds: [updatedEmbed],
            components: [buttons],
          });

          collector.stop();
        });
      }

      /**
       * Handler for cancellation button
       * Cancels the message sending process
       */
      if (interaction.customId.startsWith('cancel_send_')) {
        await interaction.deferUpdate();
        interactionManager.deleteState(authorId);
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('✅ Interaction Cancelled')
          .setDescription('The interaction was cancelled with success. This message will be deleted in 15 seconds.')
          .setFooter({ text: 'This message will be removed soon.' });

        const confirmationMessage = await state.previewMessage.edit({
          content: '',
          embeds: [embed],
          components: [],
          fetchReply: true,
        });

        setTimeout(() => {
          confirmationMessage.delete().catch((error) => console.error('Error deleting message:', error));
        }, 15000);
      }
    }
  } catch (error) {
    console.error('❌ Error during interaction:', error);
    try {
      if (!interaction.deferred && !interaction.replied) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('⚠️ Error Processing')
          .setDescription('An error occurred while processing your request. Please try again later.')
          .setFooter({ text: 'This message will be deleted in 15 seconds.' });

        const message = await interaction.reply({
          embeds: [embed],
          ephemeral: true,
          fetchReply: true,
        });

        setTimeout(() => {
          message.delete().catch((error) => console.error('Error deleting message:', error));
        }, 15000);
      }
    } catch (replyError) {
      console.error('❌ Error responding to interaction:', replyError);
    }
  }
});

// Connect the bot to Discord using the token from environment variables
client.login(TOKEN2);

/**
 * Centralized command registration function
 * 
 * This function provides an alternative way to register commands using the REST API
 * It's not currently used in the main flow but kept for reference or future use
 */
async function registerCommands() {
  // Initialize the REST API client with the bot token
  const rest = new REST({ version: '10' }).setToken(TOKEN2);
  
  // Define the commands to register
  const commands = [
    new SlashCommandBuilder()
      .setName('help')
      .setDescription('📚 Shows all available commands.'),
  ].map(command => command.toJSON());

  try {
    console.log('🔄 Registering commands...');
    
    // Register the commands with Discord's API
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands }
    );
    
    console.log('✅ Commands registered in the guild successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}
