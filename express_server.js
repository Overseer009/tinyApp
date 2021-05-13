//Requirements & Dependencies-------------------------------------

const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

app.use(cookieParser())

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

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
  urlDatabase[ranUrl] = {longURL: req.body.longURL, userID: req.cookies["user_id"]}
  console.log(urlDatabase[ranUrl]);
  res.redirect(`/urls/${ranUrl}`)
});

//edits the URLs
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = findUserById(req.cookies["user_id"])
  if (!currentUser) {
    return res.send("This is not your account, please log in.")
  }
    urlDatabase[req.params.shortURL].longURL = req.body.editUrl;
    res.redirect('/urls');
});

//Route that deletes a URL from the user's list of shortened URLs.
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = findUserById(req.cookies["user_id"])
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
  if (userLogin === "error1") {
    return res.status(400).send("Error: One or more fields are empty.");
  }
  if (userLogin === "error2") {
    return res.status(403).send("Error: Passwords is incorrect. If you haven't created an account, please register.")
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
  const newUser = createUser(email, password)
  if (newUser.error) {
    return res.status(400).send(newUser.error);
  }
  res.cookie("user_id", newUser.data)
  res.redirect('/urls')
});

//GETs-----------------------------------------------------------

//loads the log in page
app.get("/login", (req, res) => {
  const currentUser = findUserById(req.cookies["user_id"])
  const templateVars = { 
    user: currentUser
  };
  res.render("urls_login", templateVars)
});

//loads the registrations page
app.get("/register", (req,res) => {
  const currentUser = findUserById(req.cookies["user_id"])
  const templateVars = { 
    user: currentUser
  };
  res.render("urls_registration", templateVars)
});

//loads the main URL page, displaying the user's long and short URLs
app.get("/urls", (req, res) => {
  const currentUser = findUserById(req.cookies["user_id"])
  const templateVars = { 
    user: currentUser,
    urls: urlsForUser(req.cookies["user_id"])
  };
  if (!currentUser) {
    return res.send("This is not your account, please log in.")
  }
  res.render("urls_index", templateVars); 
});

//Route to create new URL
app.get("/urls/new", (req, res) => {
  const currentUser = findUserById(req.cookies["user_id"])
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
  const currentUser = findUserById(req.cookies["user_id"])
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
    return { error: "Error: Passwords is incorrect. If you haven't created an account, please register.", data: null }
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString(6);
  users[id] = { id, email, hashedPassword };
  console.log(users[id]);
  return { error: null, data: id };
}

//function used to find a user in the database
const findUserById = function(id) {
  for (let keyId in users) {
    if (keyId === id) {
      return users[keyId];
    }
  }
  return undefined;
};

//That finds users by email
const findUserByEmail = function(email) {
  for (let keyId in users) {
    if (users[keyId].email === email) {
      return users[keyId];
    }
  }
  return undefined;
};

//function used to make sure that the login information is correct
const findLogin = function(email, password) {
  if (!email || !password) {
    return "error1"
  }
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    return user;
  }
  return "error2"
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