//Requirements & Dependencies-------------------------------------

const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(cookieParser())

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

//Creates a new shortURL on our /urls table.
app.post("/urls", (req, res) => {
  const ranUrl = generateRandomString();
  urlDatabase[ranUrl] = req.body.longURL
  res.redirect(`/urls/${ranUrl}`)
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.editUrl;
  res.redirect('/urls');
});

//Route that deletes a URL from the user's list of shortened URLs.
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//allows for user to login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userLogin = loginFinder(email, password, users)
  if (userLogin.error) {
    return res.send(userLogin.error);
  }
  res.cookie("user_id", userLogin.id)
  res.redirect('/urls')
});

//allows the user to log out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect('/urls')
});

//account registration, then leads to URLs page. 
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const newUser = userCreator(email, password, users)
  if (newUser.error) {
    return res.send(newUser.error);
  }
  res.cookie("user_id", newUser.id)
  res.redirect('/urls')
});

//GETs-----------------------------------------------------------

//loads the log in page
app.get("/login", (req, res) => {
  const currentUser = userFinder(req.cookies["user_id"], users)
  const templateVars = { 
    user: currentUser
  };
  res.render("urls_login", templateVars)
});

//loads the registrations page
app.get("/register", (req,res) => {
  const currentUser = userFinder(req.cookies["user_id"], users)
  const templateVars = { 
    user: currentUser
  };
  res.render("urls_registration", templateVars)
});

//loads the main URL page, displaying the user's long and short URLs
app.get("/urls", (req, res) => {
  const currentUser = userFinder(req.cookies["user_id"], users)
  const templateVars = { 
    user: currentUser,
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

//Route to create new URL
app.get("/urls/new", (req, res) => {
  const currentUser = userFinder(req.cookies["user_id"], users)
  const templateVars = { 
    user: currentUser
  };
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  const currentUser = userFinder(req.cookies["user_id"], users)
  const templateVars = { 
    user: currentUser,
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

//Leads to the main site of our longURL through our short URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

//Helper Functions-----------------------------------------------

//Generates a six character alpha-numeric string that is out shortURLs
const generateRandomString = function() {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let ranStr = '';
  for (let i = 0; i < 6; i++) {
    ranStr += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return ranStr;
};

//Function that creates a new User
const userCreator = (email, password, users) => {
  if (!email || !password) {
    return {error: "Error: One or more fields are empty."};
  }
  for (let key in users) {
    if (users[key].email === email) {
      return {error: "Error: That email is already registered."};
    }
  }
  const id = generateRandomString();
  users[id] = { id, email, password };
  console.log(users);
  return users[id];
}

//function used to find a user in the database
const userFinder = function(id, userData) {
  for (let keyId in userData) {
    if (keyId === id) {
      return userData[keyId];
    }
  }
  return undefined;
};

//function used to make sure that the login information is correct
const loginFinder = function(email, password, users) {
  if (!email || !password) {
    return {error: "Error: One or more fields are empty."};
  }
  for (let user in users) {
    console.log(users[user].password);
    if (users[user].email === email && users[user].password === password) {
      return users[user];
    }
  }
  return {error: "Error: Passwords is incorrect. If you haven't created an account, please register."};
}

