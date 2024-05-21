const { Router } = require("express");
const Prouter = Router();
const { 
    getAllProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} = require('../Controllers/productController');
const isAuthenticated = require('../middleware/auth.middleware');

Prouter.get("/", getAllProducts);
Prouter.get('/:pid', getProductById);
Prouter.post('/', isAuthenticated, createProduct);
Prouter.put('/:pid', isAuthenticated, updateProduct);
Prouter.delete('/:pid', isAuthenticated, deleteProduct);

module.exports = Prouter;