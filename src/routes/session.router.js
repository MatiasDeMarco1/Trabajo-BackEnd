const express = require('express');
const router = express.Router();
const session = require('express-session');
const passport = require('passport');
const User = require('../mongo/models/users');


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

router.get('/current', async (req, res) => {
    try {
        if (req.isAuthenticated()) {
            const currentUser = req.user;
            const userFromDB = await User.findById(currentUser._id);
            if (userFromDB.role === 'admin') {
                const allUsers = await User.find();
                res.render('current', { user: userFromDB, isAdmin: true, users: allUsers });
            } else {
                res.render('current', { user: userFromDB, isAdmin: false, message: 'Usted no tiene rango admin para acceder a este sitio' });
            }
        } else {
            res.render('current', { user: null });
        }
    } catch (error) {
        console.error('Error al obtener el usuario actual:', error);
        res.status(500).render('error', { message: 'Error interno del servidor' });
    }
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