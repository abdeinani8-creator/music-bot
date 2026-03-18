# 🎵 music-bot (v2.0)

A clean, production-ready Discord bot built with **Node.js**, **discord.js v14**, **discord-player**, and **Groq AI**.

## 🚀 Features

- **Music System**: High-quality audio playback using `discord-player` and `play-dl`.
- **24/7 Voice Connection**: The bot stays in the voice channel even after music stops.
- **AI Integration**: Natural chat responses powered by **Groq API** (Llama 3).
- **Stability**: Built-in error handling for both the player and the AI system.
- **Deployment Ready**: Optimized for hosting on platforms like Railway.

## 🛠️ Commands

| Command | Description |
| :--- | :--- |
| `!help` | Shows the list of available commands. |
| `!join` | Bot joins your voice channel and stays 24/7. |
| `!play <query>` | Plays music from YouTube search or URL. |
| `!skip` | Skips the current track. |
| `!stop` | Stops the music but stays in the voice channel. |
| `!ai <prompt>` | Chat with the AI assistant. |
| `!ping` | Check the bot's latency. |

## ⚙️ Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16.11.0 or higher)
- [Discord Bot Token](https://discord.com/developers/applications)
- [Groq API Key](https://console.groq.com/keys)

### 2. Installation
1. Clone this repository.
2. Run `npm install` to install all dependencies.
3. Rename `.env.example` to `.env` and fill in your tokens:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   GROQ_API_KEY=your_groq_api_key
   PREFIX=!
   ```

### 3. Running the Bot
```bash
npm start
```

## 🚢 Deployment (Railway)

1. Connect your GitHub repository to [Railway](https://railway.app/).
2. Add the environment variables (`DISCORD_TOKEN`, `GROQ_API_KEY`, `PREFIX`) in the Railway dashboard.
3. Railway will automatically detect the `package.json` and deploy the bot.

## 🧠 Technical Details

- **Audio Engine**: Uses `ffmpeg-static` and `mediaplex` for stable transcoding.
- **Extractor**: Uses `@discord-player/extractor` with `play-dl` for YouTube/SoundCloud support.
- **AI Model**: Configured to use `llama-3.3-70b-versatile` on Groq for fast and free inference.
