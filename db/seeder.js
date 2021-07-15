const Thank = require('./models/thankModel');

const addCards = async () => {
  const deckNames = fs.readdirSync(dirName);
  for (let i = 0; i < deckNames.length; i++) {
    const newDeck = new Deck({ title: deckNames[i] });
    let cardsList = '';
    cardsList = fs.readFileSync(`${dirName}/${deckNames[i]}`, 'utf-8');
    let cardsArr = cardsList.split('\n\n\n');
    const deckImgHref = cardsArr[0];
    // eslint-disable-next-line no-restricted-syntax
    for (let j = 1; j < cardsArr.length; j++) {
      const cardDataArr = cardsArr[j].split('\n\n');
      // eslint-disable-next-line no-await-in-loop
      const newCard = await Card.create({
        question: cardDataArr[0],
        answer: cardDataArr[1],
        comment: cardDataArr[2],
      });
      // eslint-disable-next-line no-underscore-dangle
      newDeck.cardId.push(newCard._id);
    }
    newDeck.img = deckImgHref;
    await newDeck.save();
  }
  console.log('Засеяно');
};

module.exports = { addCards };
