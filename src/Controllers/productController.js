const Product = require('../mongo/models/products');

const obtenerProductos = async (req, res) => {
    try {
    const productos = await Product.find();
    res.json(productos);
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};


module.exports = {
    obtenerProductos,
};