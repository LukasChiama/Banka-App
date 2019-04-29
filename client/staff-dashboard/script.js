/* eslint-disable require-jsdoc */
/* eslint-disable func-names */
const token = localStorage.getItem('staffToken');

const options = {
  method: 'get',
  headers: {
    'content-type': 'application/json; charset=utf-8',
    Authorization: `Bearer ${token}`
  }
};

const url = 'http://localhost:2800/api/v1/accounts';

const displayAccounts = async () => {
  const accounts = document.getElementById('accounts');
  const response = (await fetch(url, options)).json();
  const allAccounts = await response;
  allAccounts.data.map((item) => {
    const ul = document.createElement('ul');
    ul.setAttribute('class', 'list');
    accounts.appendChild(ul);
    const li = document.createElement('li');
    li.setAttribute('class', 'item');
    li.setAttribute('id', `'${item.id}'`);
    li.innerHTML = item.account_number;
    ul.appendChild(li);
    li.onclick = async function () {
      const clicked = document.getElementById(`${li.id}`);
      const id = Number(clicked.innerHTML);
      const accUrl = `http://localhost:2800/api/v1/accounts/${id}`;
      const account = await request(accUrl, options);
      localStorage.setItem('account', JSON.stringify(account.data[0]));
      window.location.href = '../account-record/index.html';
    };
  });
};

(function () {
  const staff = JSON.parse(localStorage.getItem('staff')) || [];
  const admin = document.getElementById('admin');

  if (!token) {
    window.location.href = '../index.html';
  }
  if (staff.is_admin) {
    admin.style.display = 'block';
  }

  displayAccounts();
}());

function logOut() {
  localStorage.removeItem('staffToken');
  location.reload();
}