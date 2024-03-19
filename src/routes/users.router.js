const express = require('express');
const router = express.Router();
const User = require('../mongo/models/users');
const { logger } = require('../utils/logger');


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
        user.role = newRole;
        await user.save();
        return res.status(200).json({ status: 'success', message: 'Rol de usuario actualizado correctamente', user });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

module.exports = router;