// Подключаем необходимые библиотеки и миддлвэры
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const MongoStore = require('connect-mongo');
const path = require('path');
const hbs = require('hbs');
const fileUpload = require('express-fileupload');
const connectDB = require('./db/connect');
const useErrorHandlers = require('./middlewares/errorMdw');
const userRouter = require('./routes/userRouter');
const indexRouter = require('./routes/indexRouter');
const { startTelegramBot } = require('./telegramBot/apiTelegramm');

const { DBURL, PORT } = process.env;

// Запускаем экспресс
const app = express();

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload());

// создаем сессии и записываем в БД
app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: false,
    name: 'spasibusCookie', // указываем название наших куки
    cookie: { secure: false, maxAge: 60000000 },
    store: MongoStore.create({ mongoUrl: DBURL }),
  })
);

// Передаем сессии на все hbs
app.use((req, res, next) => {
  res.locals.userId = req.session?.userId;
  res.locals.hasAvatar = req.session?.hasAvatar;
  next();
});

// Подключаем статику для фронтенда
app.use(express.static(path.join(__dirname, 'public')));

// Подключаем views(hbs) и partials
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Подключаемся к БД
connectDB();

// Используем роуты
app.use('/user', userRouter);
app.use('/', indexRouter);

// Если ни один из роутов не сработал, показываем ошибки
useErrorHandlers(app);

// Запускаем сервер
app.listen(PORT ?? 3000, () => {
  console.log(`Server started`);
});

// Запускаем телеграм бота
startTelegramBot();
