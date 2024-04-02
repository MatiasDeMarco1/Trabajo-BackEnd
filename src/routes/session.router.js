const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail } = require('../utils/mailService.js');
const { generateResetToken } = require('../utils/tokens.js');
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


router.post('/reset-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const resetToken = generateResetToken();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({ message: 'Correo electrónico de restablecimiento de contraseña enviado' });
    } catch (error) {
        console.error('Error al enviar el correo electrónico de restablecimiento de contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirm_password } = req.body;

    try {
        const user = await User.findOne({ resetPasswordToken: token });

        if (!user) {
            return res.status(404).json({ message: 'Token de restablecimiento de contraseña inválido o expirado' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Contraseña restablecida correctamente' });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;