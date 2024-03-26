const mineflayer = require('mineflayer');
const readline = require('readline');
const dns = require('dns');
const keep_alive = require('./keep_alive.js')

class MinecraftBot {
    constructor(username) {
        this.username = username;
        this.chatLogs = []; // Array to store chat logs
    }

    // Logger
    log(...msg) {
        const logMessage = `[${this.username}] ${msg.join(' ')}`;
        console.log(logMessage);
        this.chatLogs.push(logMessage);
    }

    // Function to create a readline interface for taking user input
    createInterface() {
        return readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    // Connect to the server
    connectToServer(domain, username, password) {
        // Resolve domain to IP address
        dns.resolve4(domain, (err, addresses) => {
            if (err) {
                this.log('Error resolving domain:', err);
                return;
            }

            if (addresses.length === 0) {
                this.log('No IP address found for the domain:', domain);
                return;
            }

            const serverAddress = addresses[0];

            // Connect to the Minecraft server
            const bot = mineflayer.createBot({
                host: serverAddress,
                port: 25565,
                username: username,
                password: password || undefined, // Use undefined if password is empty
            });

            // Event handler for when the bot successfully logs in
            bot.once('login', () => {
                this.log('Successfully logged in as ' + bot.username);
                // Display chat logs
                this.displayLogs();

                // Anti-AFK: Continuously move the bot in all directions
                setInterval(() => {
                    bot.setControlState('forward', true);
                    bot.setControlState('back', true);
                    bot.setControlState('left', true);
                    bot.setControlState('right', true);
                }, 1000); // Adjust the interval as needed (e.g., every 100 milliseconds)
            });

            // Event handler for receiving chat messages
            bot.on('chat', (username, message) => {
                const chatLog = `<${username}> ${message}`;
                this.log(chatLog);
            });

            // Event handler for receiving all in-game messages
            bot.on('message', (jsonMsg) => {
                try {
                    const msg = JSON.parse(jsonMsg);
                    if (msg.extra) {
                        const sender = msg.extra.find(entry => entry.bold);
                        if (sender) {
                            const senderName = sender.text;
                            const chatMessage = msg.extra.filter(entry => !entry.bold).map(entry => entry.text).join('');
                            const chatLog = `<${senderName}> ${chatMessage}`;
                            this.log(chatLog);
                        }
                    }
                } catch (error) {
                    // Handle non-JSON messages (like system messages)
                    this.log(jsonMsg);
                }
            });

            // Event handler for errors
            bot.on('error', (err) => {
                this.log('Bot error:', err);
            });

            // Allow the user to send messages/commands
            const consoleInput = this.createInterface();
            consoleInput.on('line', (input) => {
                bot.chat(input); // Send the user input as a chat message
            });

            // Event handler for when the bot is kicked from the server
            bot.on('kicked', (reason, loggedIn) => {
                this.log('Kicked from server:', reason);
                process.exit(1); // Exit the script
            });
        });
    }

    // Display chat logs
    displayLogs() {
        console.log('--- Chat Logs ---');
        this.chatLogs.forEach(log => console.log(log));
        console.log('-----------------');
    }
}

// Create a new instance of MinecraftBot
const bot = new MinecraftBot('YourBotUsername');

// Prompt user for server details
const rl = bot.createInterface();
rl.question('Enter server domain: ', (domain) => {
    rl.question('Enter your Minecraft username: ', (username) => {
        rl.question('Enter your Minecraft password (leave empty for offline/cracked accounts): ', (password) => {
            rl.close();
            // Connect to the server
            bot.connectToServer(domain, username, password);
        });
    });
});
