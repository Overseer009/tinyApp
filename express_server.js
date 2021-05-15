//Requirements & Dependencies-------------------------------------

const { urlsForUser, findLogin, createUser, generateRandomString, checkUrl } = require("./helpers");
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");
app.set('views', './views');

//Databases------------------------------------------------------

const urlDatabase = {};
const users = {};

//POSTs----------------------------------------------------------


//Creates a new shortURL on our urls table.
app.post("/urls", (req, res) => {
  const currentUser = users[req.session.user_id];
  const ranUrl = generateRandomString(6);
  if (!currentUser) {
    return res.send("<html><body><h2>Please login to have access to this feature</h2></body></html>");
  }
  urlDatabase[ranUrl] = {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${ranUrl}`);
});

//edits the URLs
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.send("<html><body><h2>This is not your account, please log in.</h2></body></html>");
  }
  //checks to see if the URLs match what the user has
  const urlChecker = checkUrl(currentUser.id, urlDatabase);
  if (!urlChecker.includes(req.params.shortURL)) {
    return res.send("<html><body><h2>this is not a valid URL</h2></body></html>");
  }
  urlDatabase[req.params.shortURL].longURL = req.body.editUrl;
  res.redirect('/urls');
});

//Route that deletes a URL from the user's list of shortened URLs.
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.send("<html><body><h2>This is not your account, please log in.</h2></body></html>");
  }
  //checks to see if the URLs match what the user has
  const urlChecker = checkUrl(currentUser.id, urlDatabase);
  if (!urlChecker.includes(req.params.shortURL)) {
    return res.send("<html><body><h2>this is not a valid URL</h2></body></html>");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//allows for user to login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userLogin = findLogin(email, password, users);
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

//the staring page, will lead to the login screen if not logged in
app.get('/', (req, res) => {
  const currentUser = users[req.session.user_id];
  const templateVars = {
    urls: urlDatabase,
    user: currentUser
  };
  if (!currentUser) {
    res.render('urls_login', templateVars);
  } else {
    res.render('urls_index', templateVars);
  }
});

//loads the main URL page, displaying the user's long and short URLs
app.get("/urls", (req, res) => {
  const currentUser = users[req.session.user_id];
  const templateVars = {
    user: currentUser,
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  if (!currentUser) {
    return res.send("<html><body><h2>Please register or login before trying to access URLS</h2></body></html>");
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

//used to verify URLs and load the editing page (urls_show)
app.get("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.send("<html><body><h2>Please login to have access to this feature</h2></body></html>");
  }
  //checks to see if the URLs match what the user has
  const urlChecker = checkUrl(currentUser.id, urlDatabase);
  if (!urlChecker.includes(req.params.shortURL)) {
    return res.send("<html><body><h2>this is not a valid URL</h2></body></html>");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const templateVars = {
    user: currentUser,
    shortURL: req.params.shortURL,
    longURL
  };
  res.render("urls_show", templateVars);
});

//Leads to the main site of our longURL through our short URL
app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]) {
    return res.send("<html><body><h2>That shortURL does not exist.</h2></body></html>");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

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

//Server is listening--------------------------------------------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});