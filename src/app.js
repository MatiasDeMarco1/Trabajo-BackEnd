const express = require("express")
const http = require("http")
const socketIO = require("socket.io")
const exphbs = require("express-handlebars")
const mongoose = require('mongoose')
const productosRoutes = require("./routes/product.router.js")
const Product = require("./mongo/models/Product.js")
const session = require('express-session')
const MongoStore = require("connect-mongo")
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const passport = require('passport');
const { initializePassportGitHub, initializePassportLocal } = require('./Config/passport.config')
const User = require('./mongo/models/users');


const app = express();
const port = 8080;

const serverHTTP = http.createServer(app);
const io = socketIO(serverHTTP);

const productRouter = require("./routes/product.router.js");
const cartsRouter = require("./routes/cart.router.js");
const sessionRouter = require("./routes/session.router.js");
const viewRouter = require("./routes/view.router.js");



// local github
initializePassportLocal()
initializePassportGitHub()


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

const hbs = exphbs.create({
    extname: '.handlebars',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars')
app.use(express.static('public'));


app.use(passport.initialize());


app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://Matias25:19742013Nob@cluster0.yfm42kk.mongodb.net/Ecomerce', 
        mongoOptions: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
        ttl: 15000000000,
    }),
    secret: 'secretKey',
    resave: false, 
    saveUninitialized: false
}))


app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/products', productRouter);
app.use("/api/products", productRouter);
app.use("/api/carts", cartsRouter);
app.use('/api/sessions', sessionRouter);
app.use('/', viewRouter);
app.use(bodyParser.urlencoded({ extended: true }));

/* passport.use(new GitHubStrategy({
    clientID: 'Iv1.2f2c33e249900bb5',
    clientSecret: 'd7aa6df68d08388081590ecea8ebeded62f51af9',
    callbackURL: 'http://localhost:8080/api/sessions/githubcallback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
        const githubEmail = profile.emails ? profile.emails[0].value : null;

        const existingUser = await User.findOne({ email: githubEmail });

        if (existingUser) {
            return done(null, existingUser);
        } else {
            const password = "1234"
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
})); */



app.set("io", io);

app.get("/home", async (req, res) => {
    try {
        const products = await Product.find();
        res.render('home', { products });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error interno del servidor', error });
    }
});

app.get('/realtimeproducts', (req, res) => {
    res.render('realtimeproducts');
});

io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado");
    const sendProductsUpdate = async () => {
        try {
            const products = await Product.find();
            io.emit("updateProducts", products);
        } catch (error) {
            console.error(error);
        }
    };

    sendProductsUpdate();

    socket.on("updateProducts", () => {
        sendProductsUpdate();
    });
});

serverHTTP.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

mongoose.connect('mongodb+srv://Matias25:19742013Nob@cluster0.yfm42kk.mongodb.net/Ecomerce', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
    console.log('Conexión exitosa a MongoDB');
});

app.use('/api', productosRoutes);