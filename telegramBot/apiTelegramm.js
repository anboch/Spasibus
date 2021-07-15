/* eslint-disable no-underscore-dangle */
/* eslint-disable arrow-body-style */
/* eslint-disable no-restricted-syntax */
require('dotenv').config();
const {
  Telegraf,
  session,
  Scenes: { WizardScene, BaseScene, Stage },
  Markup,
} = require('telegraf');
const sha256 = require('sha256');
const User = require('../db/models/userModel');
const Thank = require('../db/models/thankModel');
const {
  sameDay,
  sortByQuantityOfThanks,
  makeThanksUnic,
  filterByThankForPeriod,
  filterByTelegramId,
} = require('../helper');

const startTelegramBot = () => {
  // ---------------------menus--------------------------
  const exitKeyboard = Markup.keyboard([['В главное меню']]).oneTime();
  const guestMenuKeyboard = Markup.keyboard([
    ['Вход', 'Регистрация'],
    ['О проекте', 'Посмотреть героев'],
  ]).oneTime();
  const mainMenuKeyboard = Markup.keyboard([
    ['Сказать спасибо', 'Благодарности Вам'],
    ['О проекте', 'Посмотреть героев'],
  ]).oneTime();

  const filterKeybord = () =>
    Markup.inlineKeyboard([
      Markup.button.callback('За неделю', 'filter:7'),
      Markup.button.callback('За месяц', 'filter:30'),
      Markup.button.callback('За год', 'filter:365'),
    ]);

  const addThankKeyboard = () =>
    Markup.inlineKeyboard([
      [
        Markup.button.callback('Помог_ла', 'addThank:1'),
        Markup.button.callback('Поддержал_а', 'addThank:2'),
      ],
      [
        Markup.button.callback('Рассмешил_а', 'addThank:3'),
        Markup.button.callback('Замотивировал_а', 'addThank:4'),
      ],
      [Markup.button.callback('Дал_а полезный совет', 'addThank:5')],
      [Markup.button.callback('Внимательно выслушал_а', 'addThank:6')],
      [Markup.button.callback('Дал_а конструктивную критику', 'addThank:7')],
    ]);

  const chooseUserKeyboard = (usersArr) => {
    const usersBtns = [];
    for (let user of usersArr) {
      let userBtn = [
        Markup.button.callback(
          `${user.firstName} ${user.lastName}`,
          `chooseUser:${user._id}`
        ),
      ];
      usersBtns.push(userBtn);
    }
    return Markup.inlineKeyboard(usersBtns);
  };

  // ----------------loginScene--------------------------

  // получение email для входа
  const checkEmail = Telegraf.on('text', async (ctx) => {
    const user = await User.findOne({ email: ctx.message.text });
    if (user) {
      // есть такой пользователь, идем просить пароль
      ctx.scene.state.user = user;
      await ctx.reply('Введите пароль', exitKeyboard);
      return ctx.wizard.next();
    }
    await ctx.reply(
      'Пользователя с таким адресом нет, попробуйте еще раз',
      Markup.keyboard([['Регистрация', 'В главное меню']]).oneTime()
    );
  });

  // получение password для входа
  const checkPassword = Telegraf.on('text', async (ctx) => {
    const userPassword = ctx.scene.state.user.password;
    if (userPassword === sha256(ctx.message.text)) {
      const user = await User.findOne({ _id: ctx.scene.state.user._id });
      user.telegramId = ctx.message.from.id;
      await user.save();
      await ctx.reply('Вход выполнен', mainMenuKeyboard);
      ctx.scene.leave();
    } else {
      await ctx.reply(
        'Не верный пароль, попробуйте еще раз',
        Markup.keyboard([['Регистрация', 'В главное меню']]).oneTime()
      );
    }
  });

  // create Scene login
  const loginScene = new WizardScene('loginScene', checkEmail, checkPassword);
  loginScene.enter((ctx) => ctx.reply('Введите Email', exitKeyboard));

  // --------------------singUpScene--------------------

  // получение email для регистрации
  const getEmail = Telegraf.on('text', async (ctx) => {
    if (ctx.message.text.match(/^.+@.+\..+$/gim)) {
      const userFound = await User.findOne({ email: ctx.message.text });
      if (userFound) {
        await ctx.reply(
          'Пользователь с таким адресом уже существует, используйте другой и выполните вход',
          Markup.keyboard([['Вход', 'В главное меню']]).oneTime()
        );
      } else {
        ctx.scene.state.telUserId = ctx.message.from.id;
        ctx.scene.state.email = ctx.message.text;
        await ctx.reply('Введите имя');
        ctx.wizard.next();
      }
    } else {
      // адрес не похож на email
      await ctx.reply(
        'Это не похоже на почтовый адрес, может быть ошиблись, попробуйте еще раз',
        exitKeyboard
      );
    }
  });

  const getFirstName = Telegraf.on('text', async (ctx) => {
    const inputFirstName = ctx.message.text;
    if (inputFirstName.length > 0) {
      ctx.scene.state.firstName = inputFirstName;
      await ctx.reply('Введите фамилию');
      ctx.wizard.next();
    }
  });

  const getLastName = Telegraf.on('text', async (ctx) => {
    const inputLastName = ctx.message.text;
    if (inputLastName.length > 0) {
      ctx.scene.state.lastName = inputLastName;
      await ctx.reply('Введите пароль');
      ctx.wizard.next();
    }
  });

  const getPassword = Telegraf.on('text', async (ctx) => {
    ctx.scene.state.password = sha256(ctx.message.text);
    await ctx.reply('Повторите пароль');
    ctx.wizard.next();
  });

  const checkGettingPassword = Telegraf.on('text', async (ctx) => {
    if (ctx.scene.state.password === sha256(ctx.message.text)) {
      await ctx.replyWithHTML(
        `<b>Ваш email: </b>${ctx.scene.state.firstName}
<b>Ваше имя: </b>${ctx.scene.state.firstName}
<b>Ваша фамилия: </b>${ctx.scene.state.lastName}`,
        Markup.keyboard([
          ['Всё верно', 'Начать сначала'],
          ['В главное меню'],
        ]).oneTime()
      );
      ctx.wizard.next();
    } else {
      await ctx.reply('Пароли не совпадают, попробуйте еще раз');
      await ctx.reply('Введите пароль', exitKeyboard);
      ctx.wizard.back(); // как работает ctx.wizard.cursor?
    }
  });

  const confirmSingUp = Telegraf.on('text', async (ctx) => {
    if (ctx.message.text === 'Всё верно') {
      await User.create({
        email: ctx.scene.state.email,
        firstName: ctx.scene.state.firstName,
        lastName: ctx.scene.state.lastName,
        password: ctx.scene.state.password,
        telegramId: ctx.scene.state.telUserId,
      });
      // const userFound = await User.findOne({
      //   telegramId: ctx.scene.state.telUserId,
      // });
      // if (userFound) {
      //   userFound.telegramId = 0;
      //   await userFound.save();
      // }
      await ctx.reply('Вы успешно зарегистрированы', mainMenuKeyboard);
      ctx.scene.leave();
    }
    if (ctx.message.text === 'Начать сначала') {
      ctx.scene.enter('singUpScene');
    }
  });

  // create Scene signUp
  const singUpScene = new WizardScene(
    'singUpScene',
    getEmail,
    getFirstName,
    getLastName,
    getPassword,
    checkGettingPassword,
    confirmSingUp
  );
  singUpScene.enter((ctx) => ctx.reply('Введите Email'));

  // -------------------viewHeroesScene---------------------

  const viewHeroesScene = new BaseScene('viewHeroesScene');
  viewHeroesScene.enter(async (ctx) => {
    let usersWithUnicThank = [];
    let replyMessageArr = ['<b>За всё время:</b>'];
    try {
      const usersWithThank = await User.filterByHasThank();
      const sortUsersWithThanks = await sortByQuantityOfThanks(usersWithThank);
      usersWithUnicThank = await makeThanksUnic(sortUsersWithThanks);
    } catch (error) {
      return ctx.reply('Извините, произошла ошибка, мы уже работаем над ней');
    }
    // по хорошему вынести в функцию чтобы не дублировать ниже
    usersWithUnicThank.forEach((user) => {
      let infoAboutUser = `<b>${user.firstName} ${user.lastName}</b>\n`;
      for (let thank of user.thanks) {
        infoAboutUser += `${thank.title}  <b>${thank.quantity}</b>\n`;
      }
      replyMessageArr.push(infoAboutUser);
    });
    const replyMessage = replyMessageArr.join('\n\n');
    await ctx.replyWithHTML(replyMessage, filterKeybord());
  });
  viewHeroesScene.action(/^filter:[0-9]+$/, async (ctx) => {
    const period = ctx.callbackQuery.data.split(':')[1];
    let replyMessageArr = [`<b>За последние: ${period} дней</b>`];
    let filterSortUnicUsers = [];
    try {
      const usersWithThank = await User.filterByHasThank();
      if (usersWithThank) {
        const filterUsers = await filterByThankForPeriod(
          usersWithThank,
          period
        );
        const filterAndSortUsers = await sortByQuantityOfThanks(filterUsers);
        filterSortUnicUsers = await makeThanksUnic(filterAndSortUsers);
      }
    } catch (error) {
      return ctx.reply('Извините, произошла ошибка, мы уже работаем над ней');
    }
    filterSortUnicUsers.forEach((user) => {
      let infoAboutUser = `<b>${user.firstName} ${user.lastName}</b>\n`;
      for (let thank of user.thanks) {
        infoAboutUser += `${thank.title}  <b>${thank.quantity}</b>\n`;
      }
      replyMessageArr.push(infoAboutUser);
    });
    const replyMessage = replyMessageArr.join('\n\n');
    return ctx.replyWithHTML(replyMessage, filterKeybord());
  });

  // --------------------userThanksScene-------------------

  const userThanksScene = new BaseScene('userThanksScene');
  userThanksScene.enter(async (ctx) => {
    let currentUserWithUnicThank = [];
    let replyMessageArr = ['<b>За всё время:</b>'];
    try {
      const usersWithThank = await User.filterByHasThank();
      const usersWithUnicThank = await makeThanksUnic(usersWithThank);
      currentUserWithUnicThank = filterByTelegramId(
        usersWithUnicThank,
        ctx.scene.state.telUserId
      );
    } catch (error) {
      return ctx.reply('Извините, произошла ошибка, мы уже работаем над ней');
    }
    // по хорошему вынести в функцию чтобы не дублировать ниже
    currentUserWithUnicThank.forEach((user) => {
      let infoAboutUser = `<b>${user.firstName} ${user.lastName}</b>\n`;
      for (let thank of user.thanks) {
        infoAboutUser += `${thank.title}  <b>${thank.quantity}</b>\n`;
      }
      replyMessageArr.push(infoAboutUser);
    });
    if (replyMessageArr.length === 1) {
      ctx.reply(
        'К сожалению никто пока что не оставил Вам "Спасибо"',
        exitKeyboard
      );
    } else {
      const replyMessage = replyMessageArr.join('\n\n');
      await ctx.replyWithHTML(replyMessage, filterKeybord());
    }
  });
  userThanksScene.action(/^filter:[0-9]+$/, async (ctx) => {
    const period = ctx.callbackQuery.data.split(':')[1];
    let replyMessageArr = [`<b>За последние: ${period} дней</b>`];
    let currentUserWithUnicThank = [];
    try {
      const usersWithThank = await User.filterByHasThank();
      if (usersWithThank) {
        const filterUsers = await filterByThankForPeriod(
          usersWithThank,
          period
        );

        const filterSortUnicUsers = await makeThanksUnic(filterUsers);
        currentUserWithUnicThank = filterByTelegramId(
          filterSortUnicUsers,
          ctx.scene.state.telUserId
        );
      }
    } catch (error) {
      return ctx.reply(
        'Извините, произошла ошибка, мы уже работаем над ней',
        exitKeyboard
      );
    }
    currentUserWithUnicThank.forEach((user) => {
      let infoAboutUser = `<b>${user.firstName} ${user.lastName}</b>\n`;
      for (let thank of user.thanks) {
        infoAboutUser += `${thank.title}  <b>${thank.quantity}</b>\n`;
      }
      replyMessageArr.push(infoAboutUser);
    });
    const replyMessage = replyMessageArr.join('\n\n');
    return ctx.replyWithHTML(replyMessage, filterKeybord());
  });

  // ------------------addThankScene---------------------

  const addThankScene = new BaseScene('addThankScene');
  addThankScene.enter(async (ctx) => {
    ctx.reply('Давайте найдем героя,\nвведите имя и/или фамилию', exitKeyboard);
  });
  addThankScene.on('text', async (ctx) => {
    const users = await User.find().sort({ lastName: 1 }).lean();
    const usersWithoutLoginUser = users.filter((user) => {
      return user.telegramId !== ctx.message.from.id || !!!user.telegramId;
    });
    const requests = ctx.message.text.split(' ');
    const filterByRequestsUsers = [];
    for (let request of requests) {
      let usersFilterByRequest = usersWithoutLoginUser.filter((user) => {
        return (
          user.firstName.toLowerCase() === request.toLowerCase() ||
          user.lastName.toLowerCase() === request.toLowerCase()
        );
      });
      for (let user of usersFilterByRequest) {
        filterByRequestsUsers.push(user);
      }
      usersFilterByRequest = [];
    }
    if (filterByRequestsUsers.length === 0) {
      await ctx.reply('К сожалению таких пользователей нет');
      ctx.scene.enter('addThankScene', { telUserId: ctx.message.from.id });
    } else {
      if (filterByRequestsUsers.length >= 1) {
        ctx.reply(
          'Уточните кого вы искали',
          chooseUserKeyboard(filterByRequestsUsers)
        );
      }
    }
  });
  addThankScene.action(/^chooseUser:.+/, async (ctx) => {
    const findUserId = ctx.callbackQuery.data.split(':')[1];
    ctx.scene.state.findUserId = findUserId;
    const user = await User.findOne({ _id: findUserId });
    if (user) {
      await ctx.replyWithHTML(
        `<b>${user.firstName} ${user.lastName}</b>\n`,
        addThankKeyboard()
      );
    }
  });
  addThankScene.action(/^addThank:.+/, async (ctx) => {
    const thankIndex = ctx.callbackQuery.data.split(':')[1];
    let thankTitle = '';
    let thankColor = '';
    const recipientId = ctx.scene.state.findUserId;

    const author = await User.findOne({
      telegramId: ctx.scene.state.telUserId,
    });
    const authorId = author._id;

    const thankProporties = [
      { index: 1, title: 'Помог_ла', color: '#C6DCE9' },
      { index: 2, title: 'Поддержал_а', color: '#C6E9D0' },
      { index: 3, title: 'Рассмешил_а', color: '#E9C6DD' },
      { index: 4, title: 'Замотивировал_а', color: '#D3C6E9' },
      { index: 5, title: 'Дал_а полезный совет', color: '#E9EDBC' },
      { index: 6, title: 'Внимательно выслушал_а', color: '#EDD9BC' },
      { index: 7, title: 'Дал_а конструктивную критику', color: '#BCEAED' },
    ];
    for (let thank of thankProporties) {
      if (thank.index === Number(thankIndex)) {
        thankTitle = thank.title;
        thankColor = thank.color;
      }
    }
    try {
      // проверка на наличие записей
      const thereIsThank = await Thank.findOne();
      if (thereIsThank) {
        // проверка на идентичную запись
        const theSameThanks = await Thank.find({
          recipient: recipientId,
          title: thankTitle,
          author: authorId,
        }).sort({ dateOfCreate: -1 });
        if (theSameThanks.length > 0) {
          if (!sameDay(new Date(), theSameThanks[0].dateOfCreate)) {
            const newThank = await Thank.create({
              title: thankTitle,
              recipient: recipientId,
              author: authorId,
              thankColor,
            });
          } else {
            return ctx.reply(
              'Такое "Спасибо" уже есть сегодня для этого человека'
            );
          }
        } else {
          const newThank = await Thank.create({
            title: thankTitle,
            recipient: recipientId,
            author: authorId,
            thankColor,
          });
        }
      } else {
        const newThank = await Thank.create({
          title: thankTitle,
          recipient: recipientId,
          author: authorId,
          thankColor,
        });
      }
    } catch (error) {
      return ctx.reply(
        'Извините, произошла ошибка, мы уже работаем над ней',
        exitKeyboard
      );
    }
    return ctx.reply('Спасибо отправлено, можно еще)', exitKeyboard);
  });

  // ---------------------------------------------------

  // создаем этап
  const stage = new Stage([
    loginScene,
    singUpScene,
    viewHeroesScene,
    userThanksScene,
    addThankScene,
  ]);
  stage.hears('В главное меню', async (ctx) => {
    const user = await User.find({ telegramId: ctx.message.from.id });
    if (user.length > 0) {
      // юзер уже авторизирован, дальнейшая логика
      await ctx.reply('Главное меню', mainMenuKeyboard);
    } else {
      // предлагаем регистрацию или вход
      await ctx.reply(
        'Главное меню, как будет время зарегистрируйтесь или выполните вход пожалуйста',
        guestMenuKeyboard
      );
    }
    ctx.scene.leave();
  }); // как вывести только клавиатуру?

  const bot = new Telegraf(process.env.BOT_TOKEN);
  bot.use(session(), stage.middleware());
  bot.command('/start', async (ctx) => {
    console.log('ctx.message.from.id:', ctx.message.from.id);
    const user = await User.find({ telegramId: ctx.message.from.id });
    if (user.length > 0) {
      // юзер уже авторизирован, дальнейшая логика
      return ctx.reply('Здравствуйте', mainMenuKeyboard);
    }
    // предлагаем регистрацию или вход
    ctx.reply('Приветствуем, это бот проекта "Спасибус"', guestMenuKeyboard);
  });
  bot.hears('Вход', (ctx) => ctx.scene.enter('loginScene'));
  bot.hears('Регистрация', (ctx) => ctx.scene.enter('singUpScene'));
  bot.hears('Посмотреть героев', (ctx) => ctx.scene.enter('viewHeroesScene'));
  bot.hears('Благодарности Вам', (ctx) =>
    ctx.scene.enter('userThanksScene', { telUserId: ctx.message.from.id })
  );
  bot.hears('Сказать спасибо', (ctx) =>
    ctx.scene.enter('addThankScene', { telUserId: ctx.message.from.id })
  );
  bot.hears('О проекте', (ctx) =>
    ctx.reply(
      'Проект "Спасибус" создан для того чтобы можно было поблагодарить друг друга. Замечательные люди среди нас, напомните им об этом!',
      exitKeyboard
    )
  );
  //   bot.setMyCommands([
  //     {command: '/start', description: 'Начальное приветствие'},
  //     {command: '/info', description: 'Получить информацию о пользователе'},
  //     {command: '/game', description: 'Игра угадай цифру'},
  // ])
  bot.launch();
};

module.exports = { startTelegramBot };
