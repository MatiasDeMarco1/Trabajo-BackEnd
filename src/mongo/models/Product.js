const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0, 
    },
    description: String,
    code: {
        type: String,
        required: true,
        unique: true, 
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: Boolean,
        default: true, 
    },
    category: {
        type: String,
        required: true,
    },
}, { collection: 'Products' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;