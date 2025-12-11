// app.js
const express = require("express");
const path = require("path");
const checkout = require("./routes/checkout");
const { json, urlencoded } = require("body-parser");

const app = express();
app.use(json());
app.use(express.json());
app.use(urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", checkout); // use all endpoints in the checkout.js file - The / acts as a prefix



app.get("/", (req, res) => {
  res.send(index.html);
});

app.listen(3000, () => {
  console.log("App listening on port 3000");
});

module.exports = app