const express = require('express');
const router = express.Router();
const session = require('express-session');
const isAuthenticated = require('../middleware/auth.middleware')
const { customizeError } = require("../middleware/errorHandler");
const User = require('../mongo/models/users');


router.get('/login', (req, res) => {
    res.render('loginform');
});


router.get('/register', (req, res) => {
    res.render('registerform');
});



router.get('/userProfile', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        if (user) {
            const isAdmin = user.role === 'admin';
            const isPremium = user.role === 'premium';
            const isUser = user.role === 'user';
            if (req.user) {
                res.render('userProfile', { user: req.user, isAdmin, isPremium, isUser});
            } else {
                res.redirect('/login');
            }
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.get('/userEdit', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user.role === 'admin';
        const isPremium = user.role === 'premium';
        const isUser = user.role === 'user';
        const allUsers = await User.find({ role: 'user' });
        const allUsersPremiums = await User.find({ role: { $in: ['user', 'premium'] } })
        res.render('userEdit', { user: req.user, isAdmin, isPremium, allUsers, isUser, allUsersPremiums });
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

module.exports = router;