const nodemailer = require('nodemailer');

async function sendPasswordResetEmail(email, token) {
    const transporter = nodemailer.createTransport({

        service: 'gmail',
        auth: {
            user: 'demarcomatias25@gmail.com', 
            pass: '19742013noB' 
        }
    });

    const mailOptions = {
        from: 'demarcomatias25@gmail.com',
        to: email,
        subject: 'Restablecer contraseña',
        html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                <a href="http://tuaplicacion.com/reset-password?token=${token}">Restablecer contraseña</a>`
    };

    await transporter.sendMail(mailOptions);
}

module.exports = {
    sendPasswordResetEmail
};