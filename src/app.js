const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const exphbs = require("express-handlebars");
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require("connect-mongo");
const bodyParser = require('body-parser');
const passport = require('passport');
const User = require('./mongo/models/users');
const sessionController = require('./Controllers/sessionController.js');
const config = require('./Config/config.js');
const logger = require('./utils/logger.js');
const nodemailer = require('nodemailer');
const swaggerConfig = require('./Swagger/swaggerConfig');

const Product = require("./mongo/models/Product.js");
const mockingProductsRoute = require('./routes/mockingProductsRouter');
const productRouter = require("./routes/product.router.js");
const cartsRouter = require("./routes/cart.router.js");
const sessionRouter = require("./routes/session.router.js");
const viewRouter = require("./routes/view.router.js");
const paymentRouter = require("./routes/payments.router.js");
const path = require('path');

const app = express();
const PORT = 8080
const MONGO_URL = config.MONGO_URL;
const SESSION_SECRET = config.SESSION_SECRET;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const serverHTTP = http.createServer(app);
const io = socketIO(serverHTTP);
app.use(passport.initialize());

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const hbs = exphbs.create({
    extname: '.handlebars',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
});

app.use((req, res, next) => {
    if (req.url === '/') {
        return res.redirect('/login');
    }
    next();
});


swaggerConfig(app);

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(express.static('public'));

app.use(session({
    store: MongoStore.create({
        mongoUrl: MONGO_URL,
        ttl: 15000000000,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/loggerTest', (req, res) => {
    logger.debug('Debug');
    logger.info('Info');
    logger.warn('Warning');
    logger.error('Error'); 
    res.send('Logs enviados al logger');
});
app.use(passport.initialize());
app.use(passport.session());
sessionController;

app.use('/products', productRouter);
app.use("/api/products", productRouter);
app.use("/api/carts", cartsRouter);
app.use('/api/sessions', sessionRouter);
app.use('/', viewRouter);
app.use('/api/payments', paymentRouter)
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/mockingproducts', mockingProductsRoute);

app.set("io", io);

app.get("/home", async (req, res) => {
    try {
        const products = await Product.find();
        res.render('home', { products });
    } catch (error) {
        logger.error(error);
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
            logger.error(error);
        }
    };
    socket.on('productoEliminado', ({ cartId, productId }) => {
        logger.info(`Producto eliminado del carrito ${cartId}: ${productId}`);
        io.emit('productoEliminado', { cartId, productId });
    });

    sendProductsUpdate();

    socket.on("productDeleted", async function (productId) {
        try {
            await Product.findByIdAndDelete(productId);
            sendProductsUpdate();
        } catch (error) {
            logger.error(error);
        }
    });

    socket.on("productAdded", async function (newProduct) {
        try {
            await Product.create(newProduct);
            sendProductsUpdate();
        } catch (error) {
            logger.error(error);
        }
    });
});

serverHTTP.listen(PORT, () => {
    logger.info(`Servidor escuchando en http://localhost:${PORT}`);
});

mongoose.connect(MONGO_URL);

const db = mongoose.connection;

db.on('error', logger.error.bind(logger, 'Error de conexión a MongoDB:'));
db.once('open', () => {
    logger.info('Conexión exitosa a MongoDB');
});