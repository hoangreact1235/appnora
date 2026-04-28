const bcrypt = require('bcryptjs');

const password = 'Hoang1235@';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);