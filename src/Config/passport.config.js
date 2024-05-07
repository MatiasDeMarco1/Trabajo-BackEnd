const passport = require('passport');
const GitHubStrategy = require('passport-github2');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../mongo/models/users');

exports.initializePassportGitHub = () => {
    passport.use(new GitHubStrategy({
        clientID: 'Iv1.bae1b407c6a21b7a',
        clientSecret: '9efac3cfd1014b4e04b82be282ea631bc97ba8b2',
        callbackURL: 'http://localhost:8080/api/sessions/githubcallback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const githubEmail = profile.emails ? profile.emails[0].value : null;
            const existingUser = await User.findOne({ email: githubEmail });
            if (existingUser) {
                return done(null, existingUser);
            } else {
                const password = "1234";
                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = new User({
                    first_name: profile.displayName,
                    email: githubEmail,
                    password: hashedPassword,
                    role: "user"
                });
                await newUser.save();
                return done(null, newUser);
            }
        } catch (error) {
            return done(error, null);
        }
    }));
};
exports.initializePassportLocal = () => {
    passport.use('local.register', new LocalStrategy(
        { usernameField: 'email', passReqToCallback: true },
        async (req, email, password, done) => {
            try {
                const { first_name, last_name, age } = req.body;
                if (!first_name || !last_name || !email || !password) {
                    return done(null, false, 'Faltan completar campos obligatorios');
                }
                const userFound = User.findOne({ email });
                if (userFound) {
                    return done(null, false, 'Ya existe el usuario');
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                let role = 'user';
                if (email === 'adminCoder@coder.com') {
                    role = 'admin';
                }
                const newUser = {
                    first_name,
                    last_name,
                    email,
                    age,
                    password: hashedPassword,
                    role
                };
                const result = await User.create(newUser);
                return done(null, result);
            } catch (error) {
                return done(error);
            }
        }
    ));
    passport.use('local.login', new LocalStrategy(
        { usernameField: 'email', passReqToCallback: true },
        async (req, email, password, done) => {
            try {
                const user =  User.findOne({ email });
                if (!user) {
                    logger.error('Usuario no encontrado');
                    return done(null, false, 'Email o contraseña equivocado');
                }
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (!passwordMatch) {
                    logger.error('Contraseña incorrecta');
                    return done(null, false, 'Email o contraseña equivocado');
                }
                try {
                    await User.findOneAndUpdate(
                        { email: user.email },
                        { last_connection: new Date() }
                    );
                } catch (error) {
                    console.error('Error al actualizar last_connection:', error);
                }
                console.log('Inicio de sesión exitoso');
                return done(null, user);
            } catch (error) {
                console.error('Error durante el inicio de sesión:', error);
                return done(error);
            }
        }
    ));
};