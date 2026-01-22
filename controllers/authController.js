const User = require('../models/User');

const authController = {
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const user = await User.create({ username, email, password });
      const token = user.generateToken();

      res.status(201).json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const isEmail = username.includes('@');
      
      const query = isEmail ? { email: username } : { username: username };
      
      const user = await User.findOne(query).select('+password');
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = user.generateToken();
      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = authController;