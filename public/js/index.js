import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';

// DOM elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
//Values

//DELEGATIONS
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    //console.log(form);
    
    updateSettings(form,'data');
  });
}
  if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async e => {
      e.preventDefault();
      document.querySelector('.btn--save-password').textContent='Upadting....';
      const currentPassword = document.getElementById('password-current').value;
      const passwordNew = document.getElementById('password').value;
      const passwordConfirmNew = document.getElementById('password-confirm').value;
      await updateSettings({currentPassword, passwordNew, passwordConfirmNew},'password');

      document.querySelector('.btn--save-password').textContent='Save password';      
      document.getElementById('password-current').value='';
      document.getElementById('password').value='';
      document.getElementById('password-confirm').value='';
      
    });
}
