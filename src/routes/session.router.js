const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
    registerUser,
    loginUser,
    getCurrentUser,
    githubAuth,
    githubCallback,
    logoutUser,
    resetPassword,
    resetPasswordToken
} = require('../Controllers/usersController');
const isAuthenticated = require('../middleware/auth.middleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/current', isAuthenticated, getCurrentUser);
router.get('/github', githubAuth);
router.get('/githubcallback', githubCallback);
router.get('/logout', logoutUser);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:token', resetPasswordToken);

module.exports = router;