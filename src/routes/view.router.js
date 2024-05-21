const express = require('express');
const router = express.Router();
const { 
    renderLoginForm,
    renderRegisterForm,
    getUserProfile,
    getUserEdit 
} = require('../Controllers/viewController');
const isAuthenticated = require('../middleware/auth.middleware');

router.get('/login', renderLoginForm);
router.get('/register', renderRegisterForm);
router.get('/userProfile', isAuthenticated, getUserProfile);
router.get('/userEdit', isAuthenticated, getUserEdit);

module.exports = router;