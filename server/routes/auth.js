const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// --- REGISTRATION ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phno } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
      phno
    });

    await user.save();

    // Generate token for automatic login after signup
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'User registered successfully' ,
      user : {_id: user._id, id: user._id, name, email, phno},
      token
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate the token using .env secret
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } 
    );

    // Return full user data including phno and consistent _id
    return res.json({ 
      message: 'Login successful', 
      user: { 
        _id: user._id, // Standardize on _id
        id: user._id,  // Keep id for backward compatibility
        name: user.name, 
        email: user.email,
        phno: user.phno 
      },
      token: token 
    });

  } catch (err) {
    console.log("Login error: ", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- VERIFY USER ---
router.get('/verify/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      _id: user._id, // Consistent naming
      id: user._id,
      name: user.name,
      email: user.email,
      phno: user.phno
    });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// --- FIND USER BY PHONE ---
router.post('/find-user', async (req, res) => {
  const { phno } = req.body;
  try {
    const user = await User.findOne({ phno }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "No user found with this number." });
    }
    res.json({
      _id: user._id, // Crucial for sidebar/chat matching
      id: user._id,
      name: user.name,
      phno: user.phno
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;