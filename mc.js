const http = require("http");

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end(`
    <html>
      <head>
        <title>Your Web View</title>
      </head>
      <body style="margin: 0; padding: 0;">
        <iframe width="100%" height="100%" src="https://axocoder.vercel.app/" frameborder="0" allowfullscreen></iframe>
      </body>
    </html>`);
});

server.listen(3000, () => {
  console.log("Server Online because of Axo Coder ✅!!");
});

const readline = require('readline');
const dns = require('dns');

class MinecraftBot {
    constructor(username, host, port, version) {
        this.username = username;
        this.host = host;
        this.port = port;
        this.version = version;
        this.bot = null;
        this.rl = null;
        this.reconnectInterval = 5000; // Reconnection interval in milliseconds
    }

    // Init bot instance
    async initBot() {
        // Initialize bot
        const mineflayer = require('mineflayer');
        this.bot = mineflayer.createBot({
            username: this.username,
            host: this.host,
            port: this.port,
            version: this.version
        });

        // Initialize bot events
        this.initEvents();

        // Handle bot disconnections
        this.bot.on('end', () => {
            this.log('Bot disconnected. Attempting to reconnect...');
            setTimeout(() => {
                this.initBot(); // Attempt to reconnect after a delay
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
        // Event handler for receiving all in-game messages
        this.bot.on('message', (message) => {
            const username = message.toAnsi();
            const content = message.toString().substr(username.length + 1);
            this.chatLog(username, content);
        });

        // Event handler for errors
        this.bot.on('error', (err) => {
            this.log('Bot error:', err);
        });
        
        // Anti-AFK system
        this.bot.on('physicTick', () => {
            this.bot.setControlState('jump', true);
            setTimeout(() => {
                this.bot.setControlState('jump', false);
            }, 500);
        });
    }

    // Connect to the server
    async connectToServer(domain, password) {
        // Resolve domain to IP address
        dns.resolve4(domain, async (err, addresses) => {
            if (err) {
                this.log('Error resolving domain:', err);
                return;
            }
            
            if (addresses.length === 0) {
                this.log('No IP address found for the domain:', domain);
                return;
            }

            const serverAddress = addresses[0];
            
            // Set up bot and events
            await this.initBot();

            // Initialize readline interface after bot initialization
            this.initReadline();
        });
    }

    // Initialize readline interface
    initReadline() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Listen for console input
        this.rl.on('line', (input) => {
            // Send the input as a chat message
            this.sendChatMessage(input);
        });
    }
}

// Create a new instance of MinecraftBot
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Prompt for server details
rl.question('Enter server domain: ', (domain) => {
    rl.question('Enter your Minecraft username: ', (username) => {
        rl.question('Enter the server port: ', (port) => {
            rl.question('Enter Minecraft version: ', (version) => {
                rl.question('Enter your Minecraft password (leave empty for offline/cracked accounts): ', (password) => {
                    rl.close();
                    // Connect to the server
                    const bot = new MinecraftBot(username, domain, port, version);
                    bot.connectToServer(domain, password);
                });
            });
        });
    });
});
