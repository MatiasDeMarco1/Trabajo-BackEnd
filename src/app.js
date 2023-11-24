const express = require("express")
const app = express()
const port = 8080
const { promises } = require("dns")
const fs = require("fs")
app.use(express.json())
const productRouter = require("./routes/product.router.js")
const cartsRouter = require("./routes/cart.router.js")
app.use("/api/products", productRouter)
app.use("/api/carts", cartsRouter)
app.listen(port, () => {
    //console.log(`ejemplo app en el puerto ${port}`);
})