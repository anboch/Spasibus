// const moment = require('moment');

const sameDay = function (d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const sortByQuantityOfThanks = async function (arrUsers) {
  arrUsers.sort((a, b) => b.thanks.length - a.thanks.length);
  return arrUsers;
};

const makeThanksUnic = async function (arrUsers) {
  arrUsers.forEach((user) => {
    const sortThanks = user.thanks.sort((a, b) => (a.title > b.title ? 1 : -1));
    let unicThank = {};
    let counter = 1;
    const unicThanks = [];
    for (let i = 0; i < sortThanks.length; i++) {
      if (sortThanks[i].title === sortThanks[i + 1]?.title) {
        counter += 1;
      } else {
        unicThank.title = sortThanks[i].title;
        unicThank.quantity = counter;
        unicThank.thankColor = sortThanks[i].thankColor;
        unicThanks.push(unicThank);
        unicThank = {};
        counter = 1;
      }
    }
    unicThanks.sort((a, b) => b.quantity - a.quantity);
    user.thanks = unicThanks;
  });
  return arrUsers;
};

const filterByThankForPeriod = async function (arrUsers, quantityOfDays) {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - quantityOfDays);
  arrUsers.forEach((user) => {
    const filterTanks = user.thanks.filter(
      (thank) => thank.dateOfCreate > startDate
    );
    user.thanks = filterTanks;
  });
  // костылёк
  const arrUsersWithThanks = arrUsers.filter((user) => user.thanks.length > 0);
  return arrUsersWithThanks;
};

const filterByTelegramId = function (arrUsers, telegramId) {
  const userFound = arrUsers.filter((user) => user.telegramId === telegramId);
  return userFound;
};

module.exports = {
  sameDay,
  sortByQuantityOfThanks,
  makeThanksUnic,
  filterByThankForPeriod,
  filterByTelegramId,
};
