const passport = require('passport');
const User = require('../mongo/models/users');
const { sendPasswordResetEmail } = require('../utils/mailService');
const { generateResetToken } = require('../utils/tokens');
const logger = require("../utils/logger");

const registerUser = (req, res, next) => {
    passport.authenticate('local.register', {
        successRedirect: '/products',
        failureRedirect: '/register',
    })(req, res, next);
};

const loginUser = (req, res, next) => {
    passport.authenticate('local.login', {
        successRedirect: '/products',
        failureRedirect: '/login',
    })(req, res, next);
};

const getCurrentUser = async (req, res) => {
    try {
        const currentUser = req.user;
        const userFromDB = await User.findById(currentUser._id);
        if (userFromDB.role === 'admin') {
            const allUsers = await User.find();
            res.render('current', { user: userFromDB, isAdmin: true, users: allUsers });
        } else {
            res.render('current', { user: userFromDB, isAdmin: false, message: 'Usted no tiene rango admin para acceder a este sitio' });
        }
    } catch (error) {
        logger.error('Error al obtener el usuario actual:', error);
        res.status(500).render('error', { message: 'Error interno del servidor' });
    }
};

const githubAuth = passport.authenticate('github', { scope: ['user:email'] });

const githubCallback = (req, res, next) => {
    passport.authenticate('github', { failureRedirect: '/' }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/products');
        });
    })(req, res, next);
};

const logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            logger.error('Error al cerrar sesión:', err);
            return res.redirect('/');  
        }
        res.redirect('/login');  
    });
};

const resetPassword = async (req, res) => {
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
        logger.error('Error al enviar el correo electrónico de restablecimiento de contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const resetPasswordToken = async (req, res) => {
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
        logger.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    githubAuth,
    githubCallback,
    logoutUser,
    resetPassword,
    resetPasswordToken
};