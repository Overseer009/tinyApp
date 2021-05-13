const bcrypt = require('bcrypt');

//Generates a six character alpha-numeric string that is out shortURLs
const generateRandomString = function(num) {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let ranStr = '';
  for (let i = 0; i < num; i++) {
    ranStr += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return ranStr;
};

//Function that creates a new User
const createUser = (email, password) => {
  if (!email || !password) {
    return { error: "Error: One or more fields are empty.", data: null }
  }
  if (findUserByEmail(email)) {
    return { error: "<html><body><h2>Error: This email is already registered.</h2></body></html>", data: null }
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString(6);
  users[id] = { id, email, hashedPassword };

  return { error: null, data: id };
}

//That finds users by email
const findUserByEmail = function(email) {
  for (let Id in users) {
    if (users[Id].email === email) {
      return users[Id];
    }
  }
  return undefined;
};

//function used to make sure that the login information is correct
const findLogin = function(email, password) {
  if (!email || !password) {
    return { error: {
      messege: "Error: One or more fields are empty.",
      statusCode: 400
    }, data: null }
  }
  const user = findUserByEmail(email);
  if (user &&  bcrypt.compareSync(password, user.hashedPassword)) {
    return { error: null, data: user };
  }
  return { error: {
    messege: "Error: Passwords is incorrect. If you haven't created an account, please register.",
    statusCode: 403
  }, data: null }
};

//checks to see if the urls ids match the user id
const urlsForUser = function(id) {
  let valid = {}
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userID) {
      valid[shortURL] = urlDatabase[shortURL]
    }
  }
  return valid
}

module.exports = { urlsForUser, findLogin, findUserByEmail, findLogin, createUser, generateRandomString };