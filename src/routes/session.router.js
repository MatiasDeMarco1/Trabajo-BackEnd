const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail } = require('../utils/mailService.js');
const { generateResetToken } = require('../utils/tokens.js');
const User = require('../mongo/models/users');

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