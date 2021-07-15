const likeBtns = document.getElementsByClassName('cards');

likeBtns[0].addEventListener('click', async (e) => {
  e.preventDefault();
  if (e.target.classList.contains('newThankBtn')) {
    const req = await fetch('/newThank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: e.target.parentElement.category.value,
        recipientId: e.target.dataset.userid,
      }),
    });
    const res = await req.json();
    if (res.status === 200) {
      if (res.warning) {
        alert(res.warning);
      } else {
        alert('Мы передали Ваше "Спасибо"');
      }
    } else {
      alert('error');
    }
    // e.target.parentElement.previousElementSibling.innerText =
    //   res.quantityOfLikes;
  }
});
