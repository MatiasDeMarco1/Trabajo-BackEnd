const { Router } = require("express")
const Prouter = Router()
/* const ProductManager = require("../Managers/ProductManager") */
/* const productManager = new ProductManager() */
const Product = require('../mongo/models/Product.js');
const ProductManagerDb = require("../mongo/productManagerDb.js");
const productManagerDb = new ProductManagerDb();

/* Prouter.get("/", async (req, res) => {
    try {
        const { limit } = req.query;
        const products = await productManager.getProducts(limit);
        return res.status(200).json({ status: "ok", data: products });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error" });
    }
})
Prouter.get('/:pid', async (req, res) => {
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
Prouter.post('/', async (req, res) => {
    try {
        const { title, description, code, price, stock, category, thumbnails } = req.body;
        
        if (!title || !description || !code || !price || !stock || !category */ /* || !thumbnails || !Array.isArray(thumbnails) *//* ) { */
/*             return res.status(400).json({ status: "error", message: "Todos los campos son obligatorios." });
        }
        const productData = {
            title,
            description,
            code,
            price,
            stock,
            status: true,
            category,
            thumbnails
        };
        await productManager.addProduct(productData);
        const io = req.app.get("io");
        io.emit("updateProducts");
        return res.status(201).json({ status: "ok", message: "Producto agregado con éxito." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});
Prouter.put('/:pid', async (req, res) => {
    try {
        const productId = parseInt(req.params.pid);
        const updatedProductData = req.body;
        if (!Object.keys(updatedProductData).length) {
            return res.status(400).json({ status: "error", message: "Debe proporcionar al menos un campo para actualizar." });
        }
        await productManager.updateProducts(productId, updatedProductData);
        const io = req.app.get("io");
        io.emit("updateProducts")
        return res.status(200).json({ status: "ok", message: "Producto actualizado con éxito." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
})
Prouter.delete('/:pid', async (req, res) => {
    try {
        const productId = parseInt(req.params.pid);
        const result = await productManager.deleteProducts(productId);
        const io = req.app.get("io");
        io.emit("updateProducts");
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
}) */
Prouter.get("/", async (req, res) => {
    try {
        const { limit } = req.query;
        const products = await Product.find().limit(parseInt(limit) || 0);
        return res.status(200).json({ status: "ok", data: products });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error" });
    }
});

Prouter.get('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid; 
        const product = await Product.findById(productId);
        if (product) {
            res.status(200).json({ status: "ok", data: product });
        } else {
            res.status(404).json({ status: "error", message: "Producto no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error" });
    }
});

Prouter.post('/', async (req, res) => {
    try {
        const { title, description, code, price, stock, category, thumbnails } = req.body;

        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: "error", message: "Todos los campos son obligatorios." });
        }

        const productData = {
            title,
            description,
            code,
            price,
            stock,
            status: true,
            category,
            thumbnails,
        };

        const newProduct = await Product.create(productData);
        const io = req.app.get("io");
        io.emit("updateProducts");
        return res.status(201).json({ status: "ok", message: "Producto agregado con éxito.", data: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

Prouter.put('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const updatedProductData = req.body;
        if (!Object.keys(updatedProductData).length) {
            return res.status(400).json({ status: "error", message: "Debe proporcionar al menos un campo para actualizar." });
        }
        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedProductData, { new: true });
        const io = req.app.get("io");
        io.emit("updateProducts");
        return res.status(200).json({ status: "ok", message: "Producto actualizado con éxito.", data: updatedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

Prouter.delete('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const result = await Product.findByIdAndDelete(productId);
        const io = req.app.get("io");
        io.emit("updateProducts");
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

module.exports = Prouter