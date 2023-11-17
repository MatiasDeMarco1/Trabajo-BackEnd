const express = require("express")
const app = express()
const port = 8080
app.use(express.json())

const ProductManager = require("./ProductManager")
const productManager = new ProductManager()
app.get('/api/products', async (req, res) => {
    try {
        const { limit } = req.query;
        const products = await productManager.getProducts(limit);
        return res.status(200).json({ status: "ok", data: products });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error" });
    }
})
app.get('/api/products/:pid', async (req, res) => {
    try {
        const productId = parseInt(req.params.pid);
        const product = await productManager.getProductById(productId);
        if (product) {
            res.status(200).json({ status: "ok", data: product });
        } else {
            res.status(404).json({ status: "error", message: "Producto no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error" });
    }
})

app.listen(port, () => {
    //console.log(`ejemplo app en el puerto ${port}`);
})