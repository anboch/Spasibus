const router = require('express').Router();
const User = require('../db/models/userModel');
const Thank = require('../db/models/thankModel');
const { isLogin, notLogin } = require('../middlewares/authMdw');
const {
  sameDay,
  sortByQuantityOfThanks,
  makeThanksUnic,
  filterByThankForPeriod,
} = require('../helper');

router.post('/filter', async (req, res) => {
  let filterSortUnicUsers = [];
  try {
    const { period } = req.body;
    const usersWithThank = await User.filterByHasThank();
    if (usersWithThank) {
      const filterUsers = await filterByThankForPeriod(usersWithThank, period);
      const filterAndSortUsers = await sortByQuantityOfThanks(filterUsers);
      filterSortUnicUsers = await makeThanksUnic(filterAndSortUsers);
    }
  } catch (error) {
    res.render('error', { error });
  }
  return res.render('partials/cardsOfUserHbs', {
    layout: false,
    users: filterSortUnicUsers,
  });
});

// Новая запись Спасибо
router
  .route('/newThank')
  .get(isLogin, async (req, res) => {
    const users = await User.find().sort({ lastName: 1 }).lean();
    const usersWithoutLoginUser = users.filter(
      (user) => user._id.toString() !== req.session.userId
    );
    return res.render('newThankHbs', { usersWithoutLoginUser });
  })
  .post(isLogin, async (req, res) => {
    const colorOfThank = [
      { title: 'Помог_ла', color: '#C6DCE9' },
      { title: 'Поддержал_а', color: '#C6E9D0' },
      { title: 'Рассмешил_а', color: '#E9C6DD' },
      { title: 'Замотивировал_а', color: '#D3C6E9' },
      { title: 'Дал_а полезный совет', color: '#E9EDBC' },
      { title: 'Внимательно выслушал_а', color: '#EDD9BC' },
      { title: 'Дал_а конструктивную критику', color: '#BCEAED' },
    ];
    const { title, recipientId } = req.body;
    let thankColor = '';
    for (let item of colorOfThank) {
      if (item.title === title) {
        thankColor = item.color;
        break;
      }
    }
    try {
      // проверка на наличие записей
      const thereIsThank = await Thank.findOne();
      if (thereIsThank) {
        // проверка на идентичную запись
        const theSameThanks = await Thank.find({
          recipient: recipientId,
          title,
          author: req.session.userId,
        }).sort({ dateOfCreate: -1 });
        if (theSameThanks.length > 0) {
          if (!sameDay(new Date(), theSameThanks[0].dateOfCreate)) {
            const newThank = await Thank.create({
              title,
              recipient: recipientId,
              author: req.session.userId,
              thankColor,
            });
          } else {
            return res
              .send({
                status: 200,
                warning: 'Такое "Спасибо" уже есть сегодня для этого человека',
              })
              .json();
          }
        } else {
          const newThank = await Thank.create({
            title,
            recipient: recipientId,
            author: req.session.userId,
            thankColor,
          });
        }
      } else {
        const newThank = await Thank.create({
          title,
          recipient: recipientId,
          author: req.session.userId,
          thankColor,
        });
      }
    } catch (error) {
      return res.send({ status: 500 }).json();
    }
    return res.send({ status: 200 }).json();
  });

router.get('/', async (_, res) => {
  let usersWithUnicThank = [];
  try {
    const usersWithThank = await User.filterByHasThank();
    const sortUsersWithThanks = await sortByQuantityOfThanks(usersWithThank);
    usersWithUnicThank = await makeThanksUnic(sortUsersWithThanks);
  } catch (error) {
    return res.render('error', { error });
  }
  return res.render('indexHbs', { users: usersWithUnicThank });
});

module.exports = router;
