const filterBtns = document.getElementsByClassName('filterBtns');
const classCards = document.getElementsByClassName('cards');

filterBtns[0].addEventListener('click', async (e) => {
  if (e.target.classList.contains('filterBtn')) {
    e.preventDefault();
    const req = await fetch('/filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        period: e.target.dataset.period,
      }),
    });
    const res = await req.text();
    console.log('res:', res);
    if (req.status === 200) {
      classCards[0].innerHTML = res;
    } else {
      alert('error');
    }
  }
});
