const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const exphbs = require("express-handlebars");
const fs = require("fs");

const app = express();
const port = 8080;

const serverHTTP = http.createServer(app);
const io = socketIO(serverHTTP);

const productRouter = require("./routes/product.router.js");
const cartsRouter = require("./routes/cart.router.js");

app.use(express.json());
app.use("/api/products", productRouter);
app.use("/api/carts", cartsRouter);

app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main",
    })
);

app.set("view engine", "handlebars");
app.use(express.static('public'));

app.set("io", io);

app.get("/", (req, res) => {
    try {
        const productsData = fs.readFileSync("Products.json", "utf-8");
        const products = JSON.parse(productsData);
        res.render('home', { products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

app.get('/realtimeproducts', (req, res) => {
    res.render('realtimeproducts');
});

io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado");
    const sendProductsUpdate = () => {
        const productsData = fs.readFileSync("Products.json", "utf-8");
        const products = JSON.parse(productsData);
        io.emit("updateProducts", products);
    };
    sendProductsUpdate(); 
    socket.on("updateProducts", () => {
        sendProductsUpdate();
    });
});

serverHTTP.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

module.exports = { serverHTTP, io };