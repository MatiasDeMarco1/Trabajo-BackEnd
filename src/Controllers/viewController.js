const User = require('../mongo/models/users');
const { customizeError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

const renderLoginForm = (req, res) => {
    res.render('loginform');
};

const renderRegisterForm = (req, res) => {
    res.render('registerform');
};

const getUserProfile = async (req, res) => {
    try {
        const user = req.user;
        if (user) {
            const isAdmin = user.role === 'admin';
            const isPremium = user.role === 'premium';
            const isUser = user.role === 'user';
            if (req.user) {
                res.render('userProfile', { user: req.user, isAdmin, isPremium, isUser });
            } else {
                res.redirect('/login');
            }
        }
    } catch (error) {
        logger.error('Error al obtener el perfil del usuario:', error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};

const getUserEdit = async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user.role === 'admin';
        const isPremium = user.role === 'premium';
        const isUser = user.role === 'user';
        const allUsers = await User.find({ role: 'user' });
        const allUsersPremiums = await User.find({ role: { $in: ['user', 'premium'] } });
        res.render('userEdit', { user: req.user, isAdmin, isPremium, allUsers, isUser, allUsersPremiums });
    } catch (error) {
        logger.error('Error al obtener la edición del usuario:', error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};

module.exports = {
    renderLoginForm,
    renderRegisterForm,
    getUserProfile,
    getUserEdit
};