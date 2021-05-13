//Requirements & Dependencies-------------------------------------

const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");
app.set('views', './views');

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

//Server is listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//POSTs----------------------------------------------------------

//Creates a new shortURL on our urls table.
app.post("/urls", (req, res) => {
  const ranUrl = generateRandomString(6);
  urlDatabase[ranUrl] = {longURL: req.body.longURL, userID: req.session.user_id}
  res.redirect(`/urls/${ranUrl}`)
});

//edits the URLs
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session.user_id]
  if (!currentUser) {
    return res.send("This is not your account, please log in.")
  }
    urlDatabase[req.params.shortURL].longURL = req.body.editUrl;
    res.redirect('/urls');
});

//Route that deletes a URL from the user's list of shortened URLs.
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = users[req.session.user_id]
  if (!currentUser) {
    return res.send("This is not your account, please log in.")
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls'); 
});

//allows for user to login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userLogin = findLogin(email, password)
  if (userLogin.error) {
    return res.status(userLogin.error.statusCode).send(userLogin.error.messege)
  }
  req.session.user_id = userLogin.data;
  res.redirect('/urls')
});

//allows the user to log out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls')
});

//account registration, then leads to URLs page. 
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const newUser = createUser(email, password)
  if (newUser.error) {
    return res.status(400).send(newUser.error);
  }
  req.session.user_id = newUser.data;
  res.redirect('/urls')
});

//GETs-----------------------------------------------------------

//loads the log in page
app.get("/login", (req, res) => {
  const currentUser = users[req.session.user_id]
  const templateVars = { 
    user: currentUser
  };
  res.render("urls_login", templateVars)
});

//loads the registrations page
app.get("/register", (req,res) => {
  const currentUser = users[req.session.user_id]
  const templateVars = { 
    user: currentUser
  };
  res.render("urls_registration", templateVars)
});

//loads the main URL page, displaying the user's long and short URLs
app.get("/urls", (req, res) => {
  const currentUser = users[req.session.user_id]
  const templateVars = { 
    user: currentUser,
    urls: urlsForUser(req.session.user_id)
  };
  if (!req.session.user_id) {
    return res.send("This is not your account, please log in.")
  }
  res.render("urls_index", templateVars); 
});

//Route to create new URL
app.get("/urls/new", (req, res) => {
  const currentUser = users[req.session.user_id];
  const templateVars = { 
    user: currentUser
  };
  if(!currentUser) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);

});

app.get("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const currentUser = users[req.session.user_id]
  const templateVars = { 
    user: currentUser,
    shortURL: req.params.shortURL, 
    longURL
  }; 
    res.render("urls_show", templateVars); 
});

//Leads to the main site of our longURL through our short URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL
  res.redirect(longURL);
});

//Helper Functions-----------------------------------------------

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