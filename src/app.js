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
const swaggerConfig = require('./Swagger/swaggerConfig');
const path = require('path');

const productosRoutes = require("./routes/product.router.js");
const mockingProductsRoute = require('./routes/mockingProductsRouter');
const cartsRouter = require("./routes/cart.router.js");
const sessionRouter = require("./routes/session.router.js");
const viewRouter = require("./routes/view.router.js");
const paymentRouter = require("./routes/payments.router.js");

const Product = require("./mongo/models/Product.js");

const app = express();
const PORT = config.PORT;
const MONGO_URL = config.MONGO_URL;
const SESSION_SECRET = config.SESSION_SECRET;

const serverHTTP = http.createServer(app);
const io = socketIO(serverHTTP);

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: MongoStore.create({ mongoUrl: MONGO_URL }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    if (req.url === '/' && !req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next();
});


app.use('/products', productosRoutes);
app.use('/api/products', productosRoutes);
app.use('/api/carts', cartsRouter);
app.use('/api/sessions', sessionRouter);
app.use('/', viewRouter);
app.use('/api/payments', paymentRouter);
app.use('/mockingproducts', mockingProductsRoute);


app.set("io", io);
io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado");

    socket.on('productoEliminado', ({ cartId, productId }) => {
        logger.info(`Producto eliminado del carrito ${cartId}: ${productId}`);
        io.emit('productoEliminado', { cartId, productId });
    });

});


app.get('/loggerTest', (req, res) => {
    logger.debug('Debug');
    logger.info('Info');
    logger.warn('Warning');
    logger.error('Error'); 
    res.send('Logs enviados al logger');
});


app.get("/home", async (req, res) => {
    try {
        const products = await Product.find();
        res.render('home', { products });
    } catch (error) {
        logger.error(error);
        res.status(500).render('error', { message: 'Error interno del servidor', error });
    }
});

serverHTTP.listen(PORT, () => {
    logger.info(`Servidor escuchando en http://localhost:${PORT}`);
});

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', logger.error.bind(logger, 'Error de conexión a MongoDB:'));
db.once('open', () => {
    logger.info('Conexión exitosa a MongoDB');
});