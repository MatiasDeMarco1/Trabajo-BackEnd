const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    products: {
        type: Array,
        default: []
    },
}, { collection: 'Carts' });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;