const express = require('express');
const router = express.Router();
const session = require('express-session');


router.get('/login', (req, res) => {
    res.render('loginForm');
});

router.get('/register', (req, res) => {
    res.render('registerForm');
});

router.get('/userProfile', (req, res) => {
    if (req.session.user) {
        res.render('userProfile', { user: req.session.user });
    } else {
        res.redirect('/login');
    }
});

module.exports = router;