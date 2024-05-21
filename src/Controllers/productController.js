const Product = require('../mongo/models/Product');
const User = require('../mongo/models/users');
const logger = require("../utils/logger");
const { customizeError } = require("../middleware/errorHandler");

const getAllProducts = async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 10 } = req.query;
        const pageValue = parseInt(page);
        const limitValue = parseInt(limit);
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limitValue);
        const products = await Product.find()
            .limit(limitValue)
            .skip((pageValue - 1) * limitValue)
            .sort({ price: 1 });
        const hasPrevPage = pageValue > 1;
        const hasNextPage = pageValue < totalPages;
        const prevLink = hasPrevPage ? `/products?page=${pageValue - 1}&limit=${limitValue}` : null;
        const nextLink = hasNextPage ? `/products?page=${pageValue + 1}&limit=${limitValue}` : null;
        const result = {
            status: "success",
            payload: products,
            totalPage: totalPages,
            prevpage: hasPrevPage ? pageValue - 1 : null,
            nextPage: hasNextPage ? pageValue + 1 : null,
            page: pageValue,
            hasprevpage: hasPrevPage,
            hasnextpage: hasNextPage,
            prevLink: prevLink,
            nextLink: nextLink
        };
        console.log(result);
        const userFromDB = await User.findById(user._id);
        const isAdmin = userFromDB.role === 'admin';
        const isAdminFalse = !isAdmin;
        res.render('product', { products, user: userFromDB, isAdmin, isAdminFalse });
    } catch (error) {
        logger.error(error);
        console.log(error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};

const getProductById = async (req, res) => {
    try {
        const productId = req.params.pid;
        const product = await Product.findById(productId);
        if (product) {
            res.status(200).json({ status: "ok", data: product });
        } else {
            res.status(404).json({ status: "error", message: customizeError('PRODUCT_NOT_FOUND') });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('ERROR') });
    }
};

const createProduct = async (req, res) => {
    try {
        const { title, description, code, price, stock, category, thumbnails } = req.body;
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: "error", message: customizeError('MISSING_FIELDS') });
        }
        const user = req.user;
        const userFromDB = await User.findById(user._id);
        if (userFromDB.role === 'premium' || userFromDB.role === 'admin') {
            const productData = {
                title,
                description,  
                code,
                price,
                stock,
                status: true,
                category,
                thumbnails,
                owner: user.email 
            };
            const newProduct = await Product.create(productData);
            const io = req.app.get("io");
            io.emit("productAdded", newProduct);
            return res.redirect('/products');
        } else {
            return res.status(403).json({ status: "error", message: "No está autorizado para crear productos" });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.pid;
        const updatedProductData = req.body;
        if (Object.keys(updatedProductData).length === 0) {
            return res.status(400).json({ status: "error", message: customizeError('EMPTY_UPDATE_FIELDS') });
        }
        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedProductData, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ status: "error", message: customizeError('PRODUCT_NOT_FOUND') });
        }

        const io = req.app.get("io");
        io.emit("updateProducts", await Product.find());

        return res.status(200).json({ status: "ok", message: customizeError('PRODUCT_UPDATED'), data: updatedProduct });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};

const deleteProduct = async (req, res) => {
    const { user } = req;
    const { pid } = req.params;
    try {
        const product = await Product.findById(pid);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        if (user.role === 'admin' || product.owner.equals(user._id)) {
            await product.remove();
            return res.status(200).json({ message: 'Producto eliminado correctamente' });
        } else {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este producto' });
        }
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};