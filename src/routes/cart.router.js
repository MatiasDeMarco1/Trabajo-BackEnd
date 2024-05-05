const { Router } = require("express")
const Crouter = Router()
const path = require('path');
const fs = require('fs').promises;
const Cart = require('../mongo/models/Carts');
const Product = require('../mongo/models/Product');
const Ticket = require('../mongo/models/Ticket');
const cartController = require('../Controllers/cartcController');
const isAuthenticated = require('../middleware/auth.middleware')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function generateUniqueCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code;
    let exists = true;
    while (exists) {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        const existingTicket = await Ticket.findOne({ code });
        exists = !!existingTicket;
    }
    return code;
}

/**
 * @swagger
 * /api/carts/{cid}/purchase:
 *   post:
 *     summary: Realiza una compra del carrito.
 *     description: Realiza una compra del carrito con el ID especificado.
 *     parameters:
 *       - in: path
 *         name: cid
 *         description: ID del carrito a comprar.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compra realizada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Error de solicitud.
 *       404:
 *         description: Carrito no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
Crouter.post('/:cid/purchase', async (req, res) => {``
    try {
        const cartId = req.params.cid;
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }
        if (cart.products.length === 0) {
            return res.status(400).json({ status: 'error', message: 'El carrito está vacío. No se puede finalizar la compra.' });
        }
        const products = cart.products;
        let totalAmount = 0;
        const ticketProducts = [];
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ status: 'error', message: `Producto con ID ${item.product} no encontrado en Products.` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ status: 'error', message: `Stock insuficiente para el producto ${product._id}.` });
            }
            totalAmount += product.price * item.quantity;
            ticketProducts.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price
            });
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Compra de productos', 
                        },
                        unit_amount: totalAmount * 100, 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'https://preentrega-backend-production.up.railway.app/products', 
            cancel_url: 'https://tu-web.com/cancel',
            metadata: {
                cartId: cartId
            } 
        });
        return res.redirect(303, session.url); 
    } catch (error) {
        console.error('Error en la compra:', error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor. ' + error.message });
    }
});



Crouter.post('/:cid/purchase', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }
        const products = cart.products;
        let totalAmount = 0;
        const ticketProducts = [];
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ status: 'error', message: `Producto con ID ${item.product} no encontrado en Products.` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ status: 'error', message: `Stock insuficiente para el producto ${product._id}.` });
            }
            totalAmount += product.price * item.quantity;
            product.stock -= item.quantity;
            await product.save();
            ticketProducts.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price
            });
        }
        
        const code = await generateUniqueCode(); 
        const ticket = new Ticket({
            code: code, 
            purchase_datetime: new Date(),
            amount: totalAmount,
            purchaser: req.user.email,
        });
        await ticket.save();;
        cart.products = [];
        await cart.save();
        return res.status(200).json({ status: 'success', message: 'Compra finalizada con éxito.', data: ticket });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

module.exports = Crouter;


Crouter.get('/', async (req, res) => {
    try {
        const carts = await Cart.find();
        res.status(200).json({ status: 'success', message: 'Carritos encontrados.', data: carts });
    } catch (error) {
        console.error('Error al obtener los carritos:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

Crouter.post('/:uid', isAuthenticated, async (req, res) => {
    const userId = req.params.uid; 
    try {
        const existingCart = await Cart.findOne({ UserId: userId });
        if (!existingCart) {
            const newCart = await Cart.create({ products: [], UserId: userId }); 
            return res.status(201).json({ status: 'ok', message: 'Carrito creado con éxito', data: newCart });
        }
        return res.status(200).json({ status: 'ok', message: 'Ya existe un carrito asociado a este usuario', data: existingCart });
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
        if (product.owner && product.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'No puedes agregar tu propio producto al carrito' });
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

Crouter.get('/:cid/purchase', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await Cart.findById(cartId);
        const userId = cart.UserId
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }
        const productsInfo = await Promise.all(cart.products.map(async (item) => {
            const product = await Product.findById(item.product);
            return {
                id: product._id,
                title: product.title,
                price: product.price,
                quantity: item.quantity,
                subtotal: product.price * item.quantity,
                cartId: cartId,
                userId: userId
            };
        }));
        const totalAmount = productsInfo.reduce((acc, curr) => acc + curr.subtotal, 0);
        res.render('cartEnd', { productsInfo, totalAmount, cartId, userId}); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});
Crouter.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }
        const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);
        if (productIndex !== -1) {
            if (cart.products[productIndex].quantity > 1) {
                cart.products[productIndex].quantity -= 1;
            } else {
                cart.products.splice(productIndex, 1);
            }
            await cart.save();
            return res.status(200).json({ status: 'ok', message: 'Producto eliminado del carrito con éxito.', data: cart });
        } else {
            return res.status(404).json({ status: 'error', message: `Producto con ID ${productId} no encontrado en el carrito.` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});
Crouter.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }
        const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);
        if (productIndex !== -1) {
            if (cart.products[productIndex].quantity > 1) {
                cart.products[productIndex].quantity -= 1;
            } else {
                cart.products.splice(productIndex, 1);
            }
            await cart.save();
            return res.status(200).json({ status: 'ok', message: 'Producto eliminado del carrito con éxito.', data: cart });
        } else {
            return res.status(404).json({ status: 'error', message: `Producto con ID ${productId} no encontrado en el carrito.` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});
Crouter.delete('/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }
        cart.products = [];
        await cart.save();
        return res.status(200).json({ status: 'ok', message: 'Carrito vaciado con éxito.', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

Crouter.get('/:uid', async (req, res) => {
    try {
        const userId = req.params.uid;
        const cart = await Cart.findOne({  UserId: userId });
        console.log(cart);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Tu carrito está vacío.' });
        }
        return res.status(200).json({ status: 'ok', message: 'Carrito encontrado.', data: cart });
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});



module.exports = Crouter