const express = require("express");
const router = express.Router();
const User = require("../schemas/userSchema");

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const message =
      user.password === password ? "Login successful" : "incorrect password";
    const status = user.password === password ? 200 : 400;

    res.status(status).json({ message });
  } catch (err) {
    console.log("Opps...! Somthing went Wrong.", err);
  }
});

module.exports = router;
