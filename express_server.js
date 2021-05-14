//Requirements & Dependencies-------------------------------------

const { urlsForUser, findLogin, createUser, generateRandomString } = require("./helpers");
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
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
};

//Server is listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//POSTs----------------------------------------------------------

//Creates a new shortURL on our urls table.
app.post("/urls", (req, res) => {
  const ranUrl = generateRandomString(6);
  urlDatabase[ranUrl] = {longURL: req.body.longURL, userID: req.session.user_id};
  console.log("url: ", urlDatabase[ranUrl]);
  res.redirect(`/urls/${ranUrl}`);
});

//edits the URLs
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.send("This is not your account, please log in.");
  }
  urlDatabase[req.params.shortURL].longURL = req.body.editUrl;
  res.redirect('/urls');
});

//Route that deletes a URL from the user's list of shortened URLs.
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.send("This is not your account, please log in.");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//allows for user to login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userLogin = findLogin(email, password, users);
  console.log("userLogin", userLogin);
  if (userLogin.error) {
    return res.status(userLogin.error.statusCode).send(userLogin.error.messege);
  }
  req.session.user_id = userLogin.data.id;
  res.redirect('/urls');
});

//allows the user to log out
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
});

//account registration, then leads to URLs page.
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const newUser = createUser(email, password, users);
  if (newUser.error) {
    return res.status(400).send(newUser.error);
  }
  req.session.user_id = newUser.data;
  res.redirect('/urls');
});

//GETs-----------------------------------------------------------

//loads the log in page
app.get("/login", (req, res) => {
  const currentUser = users[req.session.user_id];
  const templateVars = {
    user: currentUser
  };
  res.render("urls_login", templateVars);
});

//loads the registrations page
app.get("/register", (req,res) => {
  const currentUser = users[req.session.user_id];
  const templateVars = {
    user: currentUser
  };
  res.render("urls_registration", templateVars);
});

//loads the main URL page, displaying the user's long and short URLs
app.get("/urls", (req, res) => {
  const currentUser = users[req.session.user_id];
  console.log("cookie", req.session.user_id);
  console.log("currentUser", currentUser);
  console.log("users", users);
  const templateVars = {
    user: currentUser,
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  if (!currentUser) {
    return res.send("This is not your account, please log in.");
  }
  res.render("urls_index", templateVars);
});

//Route to create new URL
app.get("/urls/new", (req, res) => {
  const currentUser = users[req.session.user_id];
  const templateVars = {
    user: currentUser
  };
  if (!currentUser) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);

});

app.get("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const currentUser = users[req.session.user_id];
  const templateVars = {
    user: currentUser,
    shortURL: req.params.shortURL,
    longURL
  };
  res.render("urls_show", templateVars);
});

//Leads to the main site of our longURL through our short URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});