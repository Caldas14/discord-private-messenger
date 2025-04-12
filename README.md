# Discord Private Messenger Bot

<div align="center">

![Discord Bot](https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

</div>

## 📜 Overview

This Discord bot is a powerful tool for mass messaging and server communication. It enables server administrators and support team members to:

- Send mass DMs to all server members
- Target specific roles for bulk messaging
- Send private announcements to selected groups
- Automate member communication efficiently
- Track message delivery status

Whether you need to send server-wide announcements, role-specific communications, or bulk DMs to selected members, this bot provides a simple and interactive way to manage mass messaging without the hassle of sending messages individually.

### Alternative Names
- Discord Mass DM Bot
- Server-wide Messaging System
- Role-based DM Manager
- Bulk Message Sender
- Member Communication Bot
- Discord Announcement System
- Mass Private Messaging Tool
- Role Message Dispatcher
- Server Member DM Bot

## ✨ Features

### Mass Messaging Capabilities
- **Server-wide DMs**: Send messages to all members in your server
- **Role-Based Messaging**: Target specific roles for focused communication
- **Bulk Message Delivery**: Efficiently handle mass message distribution
- **Smart Member Filtering**: Automatically handles users with closed DMs

### User Experience
- **Interactive Interface**: Select roles and preview messages before sending
- **Message Editing**: Edit your announcements before sending
- **Real-time Preview**: See exactly how your message will look
- **Command Simplicity**: Easy-to-use slash commands

### Administration & Control
- **Permission Management**: Restrict mass messaging to authorized roles
- **Detailed Reports**: Track successful and failed message deliveries
- **User Lists**: See which members received or missed messages
- **Safe Cancellation**: Cancel message sending at any time

### Technical Features
- **Rate Limit Handling**: Smart message queuing system
- **Error Recovery**: Continues sending even if some messages fail
- **Environment Configuration**: Secure token and ID management
- **Scalable Design**: Handles servers of any size

## 🔧 Installation

> Perfect for server owners, community managers, and anyone needing to send mass private messages on Discord!

### Prerequisites

- [Node.js](https://nodejs.org/) 16.9.0 or higher
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A Discord bot token (create one at [Discord Developer Portal](https://discord.com/developers/applications))

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Caldas14/discord-private-messenger.git
   cd discord-private-messenger
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```env
     # Discord Bot Token
     TOKEN2=your_discord_bot_token_here
     
     # Server (Guild) ID where the bot will operate
     GUILD_ID=your_discord_server_id_here
     
     # Support role ID that has permission to send messages
     CARGO_SUPORTE_ID=your_support_role_id_here
     ```

4. **Invite the bot to your server**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application
   - Go to OAuth2 > URL Generator
   - Select the following scopes: `bot`, `applications.commands`
   - Select the following bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
   - Copy and open the generated URL to invite the bot to your server

5. **Start the bot**
   ```bash
   npm start
   ```

## 🚀 Usage

> Send mass DMs, make server-wide announcements, or communicate with specific roles - all with simple commands!

### Commands

- **`/message`**: Starts the process of sending a message to a role
  - Required parameter: `content` - The message you want to send
  - Only members with the support role can use this command

- **`/cancel`**: Cancels an active message interaction
  - Useful if you need to abort the current operation
  - Only members with the support role can use this command

- **`/help`**: Displays all available commands and their descriptions

### Workflow

1. Use `/message` with your message content
2. Select the role you want to send the message to
3. Preview your message and confirm or edit it
4. After sending, view the delivery report showing successful and failed deliveries

### Message Delivery Report

After sending a message, the bot provides a detailed report showing:
- Number of members who received the message
- Number of members who didn't receive the message
- List of users who didn't receive the message (usually because they have DMs disabled)
- The content of the sent message

## ⚙️ Configuration Options

### Basic Settings
- **Minimum Role Size**: The bot will only show roles with at least 2 members
- **Support Role**: Only members with this role can send messages (configured in `.env`)

### Use Cases
- **Server Announcements**: Send important updates to all members
- **Role Communications**: Target specific groups like VIP members, supporters, or staff
- **Event Notifications**: Inform participants about upcoming events
- **Team Coordination**: Send private instructions to staff members
- **Member Updates**: Notify users about role changes or permissions
- **Community Engagement**: Send personalized messages to active members

## 🔒 Security Considerations

- Keep your `.env` file secure and never commit it to version control
- The bot only sends messages to users who allow DMs from server members
- All message sending actions require explicit confirmation

## 🛠️ Troubleshooting

### Common Issues

- **Bot doesn't respond to commands**: Make sure the bot has the necessary permissions and is online
- **Commands not showing up**: It may take up to an hour for slash commands to register globally
- **Users not receiving messages**: They likely have DMs from server members disabled

### Logs

The bot logs all important events to the console, including:
- Bot startup
- Command registrations
- Message deliveries (successful and failed)

## 📋 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Felipe Caldas** ([@felipecaldass](https://github.com/Caldas14))

---

<div align="center">

**Made with ❤️ by Felipe Caldas**

</div>
