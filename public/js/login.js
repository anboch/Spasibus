const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;

  const req = await fetch('/user/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: JSON.stringify({ email, password }),
  });

  if (req.status === 200) {
    // alert(
    //   'Вы успешно авторизовались на сайте и сейчас будете перенаправлены на главную'
    // );
    window.location = '/';
  } else {
    alert('Вы ввели не правильный логин или пароль. Попробуйте еще раз.');
  }
});
