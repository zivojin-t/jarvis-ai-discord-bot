require('dotenv/config');
const { Client, GatewayIntentBits } = require('discord.js');
const { OpenAI } = require('openai');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
const MODEL_NAME = process.env.MODEL_NAME || 'gpt-4o';
const IGNORE_PREFIX = '!';

if (!DISCORD_TOKEN || !OPENAI_KEY) {
    console.error('CRITICAL: Missing credentials in environment variables.');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const openai = new OpenAI({ apiKey: OPENAI_KEY });

client.on('ready', () => {
    console.log(`[Jarvis Status] Online and serving as ${client.user.tag}`);
});

async function sendChunkedReply(message, text) {
    const MAX_LENGTH = 1990;
    if (text.length <= MAX_LENGTH) {
        return message.reply(text);
    }

    const chunks = [];
    for (let i = 0; i < text.length; i += MAX_LENGTH) {
        chunks.push(text.substring(i, i + MAX_LENGTH));
    }

    for (const chunk of chunks) {
        await message.channel.send(chunk);
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.content.startsWith(IGNORE_PREFIX)) return;

    if (!message.mentions.users.has(client.user.id)) return;

    let sendTypingInterval;

    try {
        await message.channel.sendTyping();
        sendTypingInterval = setInterval(() => {
            message.channel.sendTyping().catch(() => clearInterval(sendTypingInterval));
        }, 5000);

        const conversation = [{
            role: 'system',
            content: 'Jarvis is an intelligent, highly sarcastic, and dry-witted AI assistant created by Tony.'
        }];

        const rawMessages = await message.channel.messages.fetch({ limit: 40 });
        const history = Array.from(rawMessages.values()).reverse();

        for (const msg of history) {
            if (msg.author.bot && msg.author.id !== client.user.id) continue;
            if (msg.content.startsWith(IGNORE_PREFIX)) continue;

            const sanitizedUsername = msg.author.username
                .replace(/\s+/g, '_')
                .replace(/[^\w\s]/gi, '');

            const role = msg.author.id === client.user.id ? 'assistant' : 'user';

            conversation.push({
                role: role,
                name: sanitizedUsername || 'User',
                content: msg.content || '...',
            });
        }

        const completion = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: conversation,
        });

        const replyContent = completion.choices[0]?.message?.content;

        if (replyContent) {
            await sendChunkedReply(message, replyContent);
        } else {
            await message.reply("My circuits are functioning, but I have nothing to say.");
        }

    } catch (error) {
        console.error('[OpenAI Pipeline Error]:', error);
        await message.reply("Apologies, I encountered an internal glitch while connecting to my neural network.");
    } finally {
        if (sendTypingInterval) {
            clearInterval(sendTypingInterval);
        }
    }
});

client.login(DISCORD_TOKEN);