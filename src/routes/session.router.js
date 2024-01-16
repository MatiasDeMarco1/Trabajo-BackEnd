const express = require('express');
const router = express.Router();
const session = require('express-session');
const passport = require('passport');



router.post('/register', async (req, res, next) => {
    passport.authenticate('local.register', {
        successRedirect: '/products',
        failureRedirect: '/register',
    })(req, res, next);
});

router.post('/login', async (req, res, next) => {
    passport.authenticate('local.login', {
        successRedirect: '/products',
        failureRedirect: '/login',
    })(req, res, next);
});




router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/githubcallback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/products');
    }
);


router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/');  
        }
        res.redirect('/login');  
    });
});


module.exports = router;