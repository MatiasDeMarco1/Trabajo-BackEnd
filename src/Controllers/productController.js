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
        if (user) {
            const userFromDB = await User.findById(user._id);
            const isAdmin = userFromDB.role === 'admin';
            const isPremium = userFromDB.role === 'premium';
            const isUser = userFromDB.role === 'user';
            let isAdminFalse = false;
            let isPremiumFalse = false;
            let isUserFalse = false;
            if (!isAdmin) {
                isAdminFalse = true;
            }
            if (!isPremium) {
                isPremiumFalse = true;
            }
            if (!isUser) {
                isUserFalse = true;
            }
            res.render('product', { products, user: userFromDB, isAdmin, isAdminFalse, isPremium, isPremiumFalse, isUser, isUserFalse });
        } else {
            res.render('product', { products });
        }
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

const getItemDetail = async (req, res) => {
    try {
        const productId = req.params.pid;
        const product = await Product.findById(productId);
        
        if (product) {
            res.render('itemDetail', { product });
        } else {
            res.status(404).json({ status: "error", message: customizeError('PRODUCT_NOT_FOUND') });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};

const createProduct = async (req, res) => {
    try {
        const ownerId = req.user._id;
        const { title, description, code, price, stock, category, thumbnails } = req.body;
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: "error", message: customizeError('MISSING_FIELDS') });
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
            owner: ownerId,
        };

        const newProduct = await Product.create(productData);
        const io = req.app.get("io");
        io.emit("productAdded", newProduct);
        setTimeout(() => {
            res.redirect('/products');
        }, 1000);
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
    try {
        const productId = req.params.pid;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ status: "error", message: customizeError('PRODUCT_NOT_FOUND') });
        }
        const ownerId = product.owner;
        const user = await User.findById(ownerId);
        if (!user) {
            return res.status(404).json({ status: "error", message: customizeError('USER_NOT_FOUND') });
        }
        const io = req.app.get("io");
        io.emit("productDeleted", productId);
        const ownerEmail = user.email;
        await Product.findByIdAndDelete(productId);
        res.status(200).json({ status: "success", message: "Producto eliminado correctamente" });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getItemDetail
};