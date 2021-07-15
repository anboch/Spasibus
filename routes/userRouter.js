/* eslint-disable prefer-arrow-callback */
const router = require('express').Router();
const sha256 = require('sha256');
const path = require('path');
const User = require('../db/models/userModel');
const { isLogin, notLogin } = require('../middlewares/authMdw');

// Личный кабинет Юзера
// router.route('/').get(noSessionChecker, async (req, res) => {
//   const { userId } = req.session;
//   console.log('userId:', userId);
//   const allUserOrders = await Order.find({ user: userId });
//   const user = await User.findOne({ _id: userId });
//   console.log('user:', user);

//   let newProducts = [];
//   const populateAllUserOrders = await allUserOrders.map((el) => {
//     if (el.products) {
//       el.products.forEach((product) => {
//         newProducts.push(product.title);
//       });
//     }

//     el.products = newProducts.join(',').replace(/,/g, ', \n');
//     newProducts = [];
//     return el;
//   });

//   res.render('accountHBS', { populateAllUserOrders, user });
// });

// Регистрация
router
  .route('/signup')
  .get(notLogin, (_, res) => {
    res.render('signUpHbs', { title: 'РЕГИСТРАЦИЯ' });
  })
  .post(async (req, res) => {
    const { email, firstName, lastName, password, foo } = req.body;
    // Проверка есть ли такой юзер в БД
    const userFound = await User.findOne({ email });
    // Если юзер не найден, создаем его в БД и присваиваем сессию
    if (!userFound) {
      const newUser = await new User({
        email,
        firstName,
        lastName,
        password: sha256(password),
        // avatarHref: '/img/defaultAvatar.png',
      });
      await newUser.save();
      req.session.userId = newUser._id;
      const hasAvatar = newUser.avatarHref !== '/img/defaultAvatar.png';
      req.session.hasAvatar = hasAvatar;
      // res.locals.userId = newUser._id;
      res.sendStatus(200).json();
    } else {
      res.sendStatus(500).json();
    }
  });

// Авторизация
router
  .route('/login')
  .get(notLogin, (req, res) => {
    res.render('loginHbs', { title: 'АВТОРИЗАЦИЯ' });
  })
  .post(notLogin, async (req, res) => {
    const { email, password } = req.body;
    const userFound = await User.findOne({ email });
    if (userFound) {
      if (userFound.password === sha256(password)) {
        req.session.userId = userFound._id;
        const hasAvatar = userFound.avatarHref !== '/img/defaultAvatar.png';
        req.session.hasAvatar = hasAvatar;
        // res.locals.userId = userFound._id;
        return res.sendStatus(200).json();
      }
    }
    return res.sendStatus(500).json();
  });

// Выход из учетной записи
router.route('/logout').get(isLogin, (req, res) => {
  req.session.destroy(); // удаляем сессию
  if (req.cookies.spasibusCookie) {
    res.clearCookie('spasibusCookie'); // удаляем куки
  }
  res.redirect('/');
});

router.post('/addAvatar', isLogin, function (req, res) {
  let imgFile;
  let uploadPath;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.redirect('back');
    // return res.status(400).send('No files were uploaded.');
  }
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  imgFile = req.files.sampleFile;
  uploadPath = path.join(__dirname, '../public/img/', imgFile.name);
  // Use the mv() method to place the file somewhere on your server
  imgFile.mv(uploadPath, async (err) => {
    if (err) return res.status(500).send(err);

    const user = await User.findOne({ _id: req.session.userId });
    user.avatarHref = '/img/' + imgFile.name;
    await user.save();
    req.session.hasAvatar = true;
    res.redirect('/');
  });
});

module.exports = router;
