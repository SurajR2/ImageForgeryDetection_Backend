const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();
require("dotenv").config();

const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const loginRoute = require("./routes/login");
const signupRoute = require("./routes/signup");
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000, // Set a higher value if needed
    socketTimeoutMS: 3000000, //
  })
  .then(() => {
    console.log("Connected to Database");
    app.listen(port, () => {
      console.log(`Server listening on port http://localhost:${port}`);
    });
  });

app.get("/", (req, res) => {
  res.send("This is the api for Image Forgery Detection");
});

//________Routes_________//

app.use("/api/login", loginRoute);
app.use("/api/signup", signupRoute);

///_______Routes________//
