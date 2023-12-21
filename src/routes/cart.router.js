const { Router } = require("express")
const Crouter = Router()
const path = require('path');
const fs = require('fs').promises;
const Cart = require('../mongo/models/Carts');
const Product = require('../mongo/models/Product');


/* Crouter.post('/', async (req, res) => {
    try {
        let cartsContent = [];
        const cartsFilePath = path.join(__dirname, "../",'Cart.json');
        try {
            const cartsFileContent = await fs.readFile(cartsFilePath, 'utf-8');
            cartsContent = JSON.parse(cartsFileContent);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: 'error', message: 'Error interno del servidor al leer el archivo Cart.json.' });
        }
        try {
            const lastCart = cartsContent[cartsContent.length - 1];
            const cartId = lastCart ? lastCart.id + 1 : 1;
            const newCart = {
                id: cartId,
                products: []
            };
            cartsContent.push(newCart);
            const cartsString = JSON.stringify(cartsContent, null, 2);
            await fs.writeFile(cartsFilePath, cartsString);
            return res.status(201).json({ status: 'ok', message: 'Carrito creado con éxito', data: newCart });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: 'error', message: 'Error interno del servidor al escribir el archivo Cart.json.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});


Crouter.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = parseInt(req.params.cid);
        const productId = parseInt(req.params.pid);
        const cartsFilePath = path.join(__dirname, '../', 'Cart.json');
        const productsFilePath = path.join(__dirname, '../', 'Products.json');
        try {
            await fs.access(cartsFilePath);
            await fs.access(productsFilePath);
            const cartsFileContent = await fs.readFile(cartsFilePath, 'utf-8');
            const productsFileContent = await fs.readFile(productsFilePath, 'utf-8');
            let cartsContent = JSON.parse(cartsFileContent);
            let products = JSON.parse(productsFileContent);
            const cartIndex = cartsContent.findIndex((cart) => cart.id === cartId);
            if (cartIndex !== -1) {
                const cart = cartsContent[cartIndex];
                const productExists = products.some((product) => product.id === productId);
                if (productExists) {
                    const productIndex = cart.products.findIndex((product) => product.id === productId);
                    if (productIndex !== -1) {
                        cart.products[productIndex].quantity += 1;
                    } else {
                        cart.products.push({
                            id: productId,
                            quantity: 1
                        });
                    }
                    const cartsString = JSON.stringify(cartsContent, null, 2);
                    await fs.writeFile(cartsFilePath, cartsString);
                    return res.status(200).json({ status: 'ok', message: 'Producto agregado al carrito con éxito.', data: cart });
                } else {
                    return res.status(404).json({ status: 'error', message: `Producto con ID ${productId} no encontrado en Products.json.` });
                }
            } else {
                return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: 'error', message: 'Error interno del servidor al leer o acceder a los archivos JSON.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});


Crouter.get('/:cid', async (req, res) => {
    try {
        const cartId = parseInt(req.params.cid);
        const cartsFilePath = path.join(__dirname, '../', 'Cart.json');
        let cartsContent = [];
        try {
            const cartsFileContent = await fs.readFile(cartsFilePath, 'utf-8');
            cartsContent = JSON.parse(cartsFileContent);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: 'error', message: 'Error interno del servidor al leer el archivo Cart.json.' });
        }
        const cartIndex = cartsContent.findIndex((cart) => cart.id === cartId);
        if (cartIndex !== -1) {
            const cart = cartsContent[cartIndex];
            return res.status(200).json({ status: 'ok', data: cart.products });
        } else {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
}); */



Crouter.post('/', async (req, res) => {
    try {
        const newCart = await Cart.create({ products: [] });
        return res.status(201).json({ status: 'ok', message: 'Carrito creado con éxito', data: newCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

Crouter.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;

        const cart = await Cart.findById(cartId);

        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ status: 'error', message: `Producto con ID ${productId} no encontrado en Products.` });
        }

        const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);

        if (productIndex !== -1) {
            cart.products[productIndex].quantity += 1;
        } else {
            cart.products.push({
                product: productId,
                quantity: 1
            });
        }

        await cart.save();
        return res.status(200).json({ status: 'ok', message: 'Producto agregado al carrito con éxito.', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

Crouter.get('/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await Cart.findById(cartId);

        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }

        return res.status(200).json({ status: 'ok', data: cart.products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

module.exports = Crouter