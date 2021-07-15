const signUpForm = document.getElementById('signUpForm');

signUpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { email, firstName, lastName, password, password2 } = signUpForm;

  if (password.value !== password2.value) {
    alert('Пароли не совпадают');
  } else {
    const req = await fetch('/user/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({
        email: email.value,
        firstName: firstName.value,
        lastName: lastName.value,
        password: password.value,
      }),
    });
    // const res = await req.json();
    if (req.status === 200) {
      alert(
        'Вы успешно зарегистрировались и сейчас будете перенаправлены на главную'
      );
      window.location = '/';
    } else {
      alert(
        'Ошибка регистрации, на указанный email уже зарегистрирован аккаунт.'
      );
    }
  }
});
