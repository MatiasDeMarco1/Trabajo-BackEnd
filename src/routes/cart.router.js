const { Router } = require("express");
const Crouter = Router();
const isAuthenticated = require('../middleware/auth.middleware');
const {
    createCart,
    getCartByUserId,
    addProductToCart,
    purchaseCart,
    handleStripeWebhook,
    getAllCarts,
    getCartProducts,
    deleteProductFromCart,
    emptyCart,
} = require('../Controllers/cartController');

Crouter.post('/:uid', isAuthenticated, createCart);
Crouter.get('/:uid', getCartByUserId);
Crouter.post('/:cid/product/:pid', addProductToCart);
Crouter.post('/:cid/purchase', purchaseCart);
Crouter.post('/webhook/respuesta', handleStripeWebhook);
Crouter.get('/', getAllCarts);
Crouter.get('/:cid/purchase', getCartProducts);
Crouter.delete('/:cid/products/:pid', deleteProductFromCart);
Crouter.delete('/:cid', emptyCart);

module.exports = Crouter;