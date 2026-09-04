const fs = require('node:fs');
const path = require('node:path');

const dataDirectory = path.join(__dirname, '..', 'data');
const dataPath = path.join(dataDirectory, 'users.json');

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readUsers() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(dataPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (error) {
    console.error('Data user rusak, memakai data kosong:', error.message);
    return {};
  }
}

function writeUsers(users) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(dataPath, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
}

function getUser(userId) {
  const users = readUsers();
  const user = users[userId];
  if (!user) return null;

  const currentDate = today();
  if (user.lastReset !== currentDate) {
    user.limit = 50;
    user.lastReset = currentDate;
    users[userId] = user;
    writeUsers(users);
  }
  return user;
}

function registerUser(user) {
  const users = readUsers();
  const currentDate = today();
  if (users[user.id]) return { user: getUser(user.id), created: false };

  users[user.id] = {
    id: user.id,
    username: user.tag || user.username,
    limit: 50,
    lastReset: currentDate,
    registeredAt: new Date().toISOString()
  };
  writeUsers(users);
  return { user: users[user.id], created: true };
}

function addLimit(userId, amount) {
  const users = readUsers();
  const user = users[userId];
  if (!user) return null;
  user.limit += amount;
  users[userId] = user;
  writeUsers(users);
  return user;
}

function useLimit(userId) {
  const user = getUser(userId);
  if (!user || user.limit < 1) return false;

  const users = readUsers();
  users[userId].limit -= 1;
  writeUsers(users);
  return true;
}

module.exports = { addLimit, getUser, registerUser, useLimit };
