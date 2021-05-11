//Requirements & Dependencies-------------------------------------

const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

//GETs-----------------------------------------------------------

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//Route to create new URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
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