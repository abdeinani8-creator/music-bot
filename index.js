require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { Player, useMainPlayer } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const Groq = require('groq-sdk');

// --- INITIALIZATION ---

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const player = new Player(client);

// Load default extractors (YouTube, SoundCloud, etc.)
(async () => {
    await player.extractors.loadMulti(DefaultExtractors);
})();

const PREFIX = process.env.PREFIX || '!';

// --- PLAYER EVENTS ---

player.events.on('playerStart', (queue, track) => {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎶 Now Playing')
        .setDescription(`**${track.title}**`)
        .setThumbnail(track.thumbnail)
        .addFields(
            { name: 'Duration', value: track.duration, inline: true },
            { name: 'Requested by', value: `${track.requestedBy}`, inline: true }
        )
        .setTimestamp();

    queue.metadata.channel.send({ embeds: [embed] });
});

player.events.on('error', (queue, error) => {
    console.error(`[Player Error] ${error.message}`);
    queue.metadata.channel.send(`❌ | A player error occurred: ${error.message}`);
});

player.events.on('playerError', (queue, error) => {
    console.error(`[Player Connection Error] ${error.message}`);
    queue.metadata.channel.send(`❌ | A connection error occurred: ${error.message}`);
});

// --- BOT EVENTS ---

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('Music & AI | !help', { type: ActivityType.Listening });
    console.log('Bot is ready for 24/7 operation.');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- GENERAL COMMANDS ---

    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setColor('#00ff99')
            .setTitle('🤖 Bot Commands')
            .addFields(
                { name: '🎵 Music', value: '`!join`, `!play <query>`, `!skip`, `!stop`' },
                { name: '🧠 AI', value: '`!ai <prompt>`' },
                { name: '⚙️ General', value: '`!help`, `!ping`' }
            )
            .setFooter({ text: '24/7 Voice Connection Enabled' });

        return message.reply({ embeds: [embed] });
    }

    if (command === 'ping') {
        return message.reply(`🏓 | Pong! Latency is ${client.ws.ping}ms.`);
    }

    // --- MUSIC COMMANDS ---

    if (command === 'join') {
        const channel = message.member.voice.channel;
        if (!channel) return message.reply('You need to be in a voice channel first!');

        try {
            await player.nodes.create(message.guild, {
                metadata: { channel: message.channel },
                selfDeaf: true,
                leaveOnEmpty: false,
                leaveOnEnd: false,
                leaveOnStop: false,
                volume: 80,
            }).connect(channel);
            
            return message.reply(`✅ | Joined **${channel.name}**! I will stay here 24/7.`);
        } catch (e) {
            console.error(e);
            return message.reply('❌ | Could not join the voice channel.');
        }
    }

    if (command === 'play') {
        const channel = message.member.voice.channel;
        if (!channel) return message.reply('You need to be in a voice channel first!');
        
        const query = args.join(' ');
        if (!query) return message.reply('Please provide a song name or URL!');

        await message.channel.send(`🔍 | Searching for \`${query}\`...`);

        try {
            const { track } = await player.play(channel, query, {
                nodeOptions: {
                    metadata: { channel: message.channel },
                    selfDeaf: true,
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    leaveOnStop: false,
                    volume: 80,
                }
            });

            return message.channel.send(`✅ | **${track.title}** added to queue!`);
        } catch (e) {
            console.error(e);
            return message.reply(`❌ | Something went wrong: ${e.message}`);
        }
    }

    if (command === 'skip') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) return message.reply('❌ | No music is currently playing!');
        
        queue.node.skip();
        return message.reply('⏭️ | Skipped the current track!');
    }

    if (command === 'stop') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue) return message.reply('❌ | No active queue found!');
        
        queue.node.stop();
        return message.reply('⏹️ | Music stopped! I am still in the voice channel.');
    }

    // --- AI COMMAND ---

    if (command === 'ai') {
        const prompt = args.join(' ');
        if (!prompt) return message.reply('Please provide a prompt for the AI!');

        await message.channel.sendTyping();

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a helpful and friendly Discord bot assistant. Keep your responses concise and engaging.' },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
            });

            const response = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
            
            if (response.length > 2000) {
                const chunks = response.match(/[\s\S]{1,2000}/g);
                for (const chunk of chunks) {
                    await message.reply(chunk);
                }
            } else {
                return message.reply(response);
            }
        } catch (e) {
            console.error('[AI Error]', e);
            return message.reply('❌ | AI API error. Please check the logs or try again later.');
        }
    }
});

// --- ERROR HANDLING ---

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

client.login(process.env.DISCORD_TOKEN);
