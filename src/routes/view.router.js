const express = require('express');
const router = express.Router();
const session = require('express-session');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); 
};

router.get('/login', (req, res) => {
    res.render('loginform');
});

router.get('/register', (req, res) => {
    res.render('registerform');
});

router.get('/userProfile', isAuthenticated, (req, res) => {
    if (req.user) {
        res.render('userProfile', { user: req.user });
        console.log(req.user);
    } else {
        res.redirect('/login');
        console.log(req.user);
    }
});
module.exports = router;