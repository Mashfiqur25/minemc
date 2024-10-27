const readline = require('readline');
const dns = require('dns');

class MinecraftBot {
    constructor(username, host, port, version, connectCommand) {
        this.username = username;
        this.host = host;
        this.port = port;
        this.version = version;
        this.connectCommand = connectCommand;
        this.bot = null;
        this.rl = null;
        this.reconnectInterval = 5000; // Reconnection interval in milliseconds
        this.moveDirection = true; // Toggle for left-right movement
    }

    // Init bot instance
    async initBot() {
        const mineflayer = require('mineflayer');
        this.bot = mineflayer.createBot({
            username: this.username,
            host: this.host,
            port: this.port,
            version: this.version
        });

        this.initEvents();

        this.bot.on('end', () => {
            this.log('Bot disconnected. Attempting to reconnect...');
            setTimeout(() => {
                this.initBot();
            }, this.reconnectInterval);
        });
    }

    // Logger
    log(...msg) {
        console.log(`[${this.username}]`, ...msg);
    }

    // Chat intake logger
    chatLog(username, message) {
        this.log(`<${username}> ${message}`);
    }

    // Send a chat message
    sendChatMessage(message) {
        if (this.bot) {
            this.bot.chat(message);
            this.chatLog(this.username, message);
        } else {
            this.log('Bot is not connected.');
        }
    }

    // Initialize bot events
    initEvents() {
        this.bot.on('login', () => {
            this.log('Bot connected successfully.');
            this.sendChatMessage(this.connectCommand); // Send the specified command on connection
        });

        this.bot.on('message', (message) => {
            const username = message.toAnsi();
            const content = message.toString().substr(username.length + 1);
            this.chatLog(username, content);
        });

        this.bot.on('error', (err) => {
            this.log('Bot error:', err);
        });
        
        // Auto-move left and right while jumping
        this.bot.on('physicTick', () => {
            this.bot.setControlState('jump', true); // Start jumping
            this.bot.setControlState('left', this.moveDirection); // Move left
            this.bot.setControlState('right', !this.moveDirection); // Move right
            
            setTimeout(() => {
                this.bot.setControlState('jump', false); // Stop jumping after a short delay
            }, 500);

            // Toggle the direction for left-right movement
            this.moveDirection = !this.moveDirection;
        });
    }

    // Connect to the server
    async connectToServer(domain) {
        dns.resolve4(domain, async (err, addresses) => {
            if (err) {
                this.log('Error resolving domain:', err);
                return;
            }
            
            if (addresses.length === 0) {
                this.log('No IP address found for the domain:', domain);
                return;
            }

            await this.initBot();

            this.initReadline();
        });
    }

    // Initialize readline interface
    initReadline() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.rl.on('line', (input) => {
            this.sendChatMessage(input);
        });
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter server domain: ', (domain) => {
    rl.question('Enter the server port: ', (port) => {
        rl.question('Enter your Minecraft username: ', (username) => {
            rl.question('Enter Minecraft version: ', (version) => {
                rl.question('Enter the chat/command to send upon connection: ', (connectCommand) => {
                    rl.close();
                    const bot = new MinecraftBot(username, domain, port, version, connectCommand);
                    bot.connectToServer(domain);
                });
            });
        });
    });
});
