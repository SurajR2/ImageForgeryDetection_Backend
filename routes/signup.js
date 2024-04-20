const express = require("express");
const router = express.Router();
const User = require("../schemas/userSchema");

router.post("/", async (req, res) => {
  try {
    const { fullname, email, password, confirmPassword } = req.body;

    const existingUser = await User.findOne({ email });

    const message = existingUser
      ? "Email already exists. Please try again."
      : password !== confirmPassword
      ? "Password does not match. Please try again."
      : "User created successfully.";

    const status = existingUser || password !== confirmPassword ? 400 : 201;

    if (status === 400) {
      return res.status(status).json({ message });
    }

    const newUser = new User({
      fullname,
      email,
      password,
      confirmPassword,
    });
    await newUser.save();
    res.status(status).json({ message });
  } catch (err) {
    console.log("Opps...! Somthing went Wrong.", err);
  }
});

module.exports = router;
