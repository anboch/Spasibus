// require('dotenv').config();
// const TelegramApi = require('node-telegram-bot-api');
// const { TOKEN } = process.env;
// const bot = new TelegramApi(TOKEN, { polling: true });

// const startTelegramBot = () => {
//   bot.setMyCommands([
//     { command: '/start', description: 'Приветствие' },
//     { command: '/signup', description: 'Регистрация в сервисе' },
//     { command: '/login', description: 'Вход в сервис' },
//   ]);

//   bot.on('message', async (msg) => {
//     const text = msg.text;
//     const chatId = msg.chat.id;
//     if (text === '/start') {
//       return bot.sendMessage(
//         chatId,
//         'Приветствуем, это бот проекта "Спасибус". Пожалуйста ознакомьтесь с доступными командами на нижней панели.'
//       );
//     }
//     if (text === '/signup') {
//       return bot.sendMessage(chatId, 'Отлично, давайте познакомимся!');
//     }
//     return bot.sendMessage(
//       chatId,
//       'Я пока что не настолько умен что бы понять это.. Загляните пожалуйста в команды на нижней панели'
//     );
//   });
// };

// // module.exports = { startTelegramBot };
