const express = require('express');
const router = express.Router();
const User = require('../mongo/models/users');
const multer = require('multer'); 
const { logger } = require('../utils/logger');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let destinationFolder = '';
        if (file.fieldname === 'profileImage') {
            destinationFolder = 'profiles';
        } else if (file.fieldname === 'productImage') {
            destinationFolder = 'products';
        } else {
            destinationFolder = 'documents';
        }
        cb(null, `./uploads/${destinationFolder}`);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

router.put('/premium/:uid', async (req, res) => {
    try {
        const userId = req.params.uid;
        const { newRole } = req.body;
        if (newRole !== 'user' && newRole !== 'premium') {
            return res.status(400).json({ status: 'error', message: 'Rol inválido' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }
        if (newRole === 'premium' && (!user.documents || !user.documents.identification || !user.documents.addressProof || !user.documents.bankStatement)) {
            return res.status(400).json({ status: 'error', message: 'El usuario no ha terminado de cargar la documentación' });
        }
        user.role = newRole;
        await user.save();
        return res.status(200).json({ status: 'success', message: 'Rol de usuario actualizado correctamente', user });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});


router.post('/:uid/documents', upload.array('documents'), async (req, res) => {
    try {
        const userId = req.params.uid;
        const user = await User.findById(userId);   
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }
        const uploadedDocuments = req.files.map(file => ({
            name: file.originalname,
            reference: `/uploads/documents/${file.filename}`
        }));
        user.documents = uploadedDocuments;
        await user.save();
        return res.status(200).json({ status: 'success', message: 'Documentos subidos correctamente', user });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

module.exports = router;