const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth.middleware');
const {
    getUsers,
    deleteUser,
    updateUserRole,
    getUserDocuments,
    renderDocumentUpload,
    checkDocumentLimit,
    upload,
    uploadDocuments,
    deleteUserById
} = require('../Controllers/premiumController.js');

router.get('/', getUsers);
router.delete('/', deleteUser);
router.post('/premium/:uid', updateUserRole);
router.get('/documents/:uid', getUserDocuments);
router.get('/documents', renderDocumentUpload);
router.post('/:uid/documents', checkDocumentLimit, upload.array('documents', 3), uploadDocuments);
router.post('/delete-user/:userId', deleteUserById);


module.exports = router;