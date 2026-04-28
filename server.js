const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Đường dẫn tới users.json
const USERS_PATH = path.join(__dirname, 'users.json');

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password' });
  }
  fs.readFile(USERS_PATH, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    let users;
    try {
      users = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ message: 'Invalid users file' });
    }
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (!result) return res.status(401).json({ message: 'Invalid credentials' });
      res.json({ message: 'Login successful' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Auth API server running on http://localhost:${PORT}`);
});
