const express = require('express');
const router = express.Router();
const session = require('express-session');
const User = require('../mongo/models/users.js'); 

router.post('/register', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    if (first_name === '' || password === "" || email === '') {
        return res.send('Faltan completar campos obligatorios');
    }

    const userFound = await User.findOne({ email });
    if (userFound) {
        return res.send({ status: 'error', error: 'Ya existe el usuario' });
    }

    if (email === "adminCoder@coder.com" && password === "adminCod3r123") {
        const newUser = {
            first_name,
            last_name,
            email,
            password,
            role: "admin"  
        };

        const result = await User.create(newUser);

        return res.send({
            status: 'success',
            payload: {
                first_name: result.first_name,
                last_name: result.last_name,
                email: result.email,
                _id: result._id,
                role: result.role 
            }
        });
    } else {
        const newUser = {
            first_name,
            last_name,
            email,
            password,
            role: "user"  
        };

        const result = await User.create(newUser);

        return res.send({
            status: 'success',
            payload: {
                first_name: result.first_name,
                last_name: result.last_name,
                email: result.email,
                _id: result._id,
                role: result.role  
            }
        });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (email === '' || password === '') {
        return res.send('todos los campos son obligatorios');
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.send('email o contraseña equivocado');
    }

    if (password !== user.password) {
        return res.send('email o contraseña equivocado');
    }

    req.session.user = {
        user: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        admin: true, 
        role: user.role
    };

    res.redirect('/products');
});

router.get('/logout', (req, res)=>{
    req.session.destroy(err=>{
        if (err) return res.send({status: 'error', error: err})
    })
    res.send('Cierre de sesion completado')
})




module.exports = router;