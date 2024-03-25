const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

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
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User' 
    },
    
}, { collection: 'Products' });

productSchema.plugin(mongoosePaginate);
const Product = mongoose.model('Product', productSchema);

module.exports = Product;