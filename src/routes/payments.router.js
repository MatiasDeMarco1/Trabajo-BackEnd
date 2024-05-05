const express = require('express');
const router = express.Router();
const Cart = require('../mongo/models/Carts');
const Product = require('../mongo/models/Product');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/checkout', async (req, res) => {
    try {
        const { cartId } = req.body; 
        if (!cartId) {
            return res.status(400).json({ error: 'El ID del carrito es requerido' });
        }

        const cart = await Cart.findById(cartId).populate('products');
        if (!cart) {
            return res.status(404).json({ error: 'El carrito no se encontró' });
        }

        const lineItems = [];
        let totalAmount = 0;
        for (const cartProduct of cart.products) {
            const product = await Product.findById(cartProduct.product);
            if (!product) {
                return res.status(404).json({ error: `El producto con ID ${cartProduct.product} no se encontró` });
            }
            const itemTotal = product.price * cartProduct.quantity;
            totalAmount += itemTotal;
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.title,
                    },
                    unit_amount: itemTotal * 100, 
                },
                quantity: cartProduct.quantity,
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: 'https://tu-sitio.com/pago-exitoso',
            cancel_url: 'https://tu-sitio.com/pago-cancelado',
        });

        res.json({ totalAmount: totalAmount, sessionId: session.id });
    } catch (error) {
        console.error('Error al procesar el pago:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;