require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

// Use environment variable for the token
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let userSessions = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userSessions[chatId] = {};
  bot.sendMessage(chatId, '👋 Hey! Let\'s help you find BD leads.\n\nWhat\'s your name?');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore /start command in the generic message handler
  if (text === '/start') return;

  if (!userSessions[chatId]) return;

  const session = userSessions[chatId];

  if (!session.name) {
    session.name = text;
    return bot.sendMessage(chatId, 'Awesome! What\'s your role?');
  }

  if (!session.role) {
    session.role = text;
    return bot.sendMessage(chatId, 'Cool. What company are you working at?');
  }

  if (!session.company) {
    session.company = text;
    return bot.sendMessage(chatId, 'Last one — what kind of projects are you looking for? (e.g. wallets, infra, DEXs)');
  }

  if (!session.need) {
    session.need = text;

    // Fetch relevant leads (AI can come later)
    const leads = getMatchingLeads(session.need);
    const reply = leads.map(p =>
      `👉 *${p.name}*\n${p.description}\n🌐 [Website](${p.website}) | 🐦 [Twitter](${p.twitter})`
    ).join('\n\n');

    bot.sendMessage(chatId, `Thanks, ${session.name}! Here are some leads:\n\n${reply}`, { parse_mode: 'Markdown' });

    delete userSessions[chatId];
  }
});

// Simple keyword matcher for now
function getMatchingLeads(keyword) {
  const data = JSON.parse(fs.readFileSync('projects.json', 'utf8'));
  return data.filter(p =>
    p.description.toLowerCase().includes(keyword.toLowerCase()) ||
    (p.tags && p.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase())))
  ).slice(0, 5);
}
