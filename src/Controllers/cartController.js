const Cart = require('../mongo/models/Carts');
const Product = require('../mongo/models/Product');
const Ticket = require('../mongo/models/Ticket');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mailService = require("../utils/mailService");

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

const createCart = async (req, res) => {
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
};

const getCartByUserId = async (req, res) => {
    try {
        const userId = req.params.uid;
        const cart = await Cart.findOne({ UserId: userId });
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Tu carrito está vacío.' });
        }
        return res.status(200).json({ status: 'ok', message: 'Carrito encontrado.', data: cart });
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
};

const addProductToCart = async (req, res) => {
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
};

const purchaseCart = async (req, res) => {
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
            success_url: 'https://trabajo-backend-production.up.railway.app/products', 
            cancel_url: 'https://tu-web.com/cancel',
            metadata: {
                cartId: cartId
            } 
        });
        return res.redirect(303, session.url); 
    } catch (error) {
        console.error('Error en la compra:', error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor. ' + error.message });
    }
};

const handleStripeWebhook = async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const event = req.body;
        await processStripeWebhook(event);
        res.status(200).end();
    } catch (error) {
        console.error('Error en el webhook de Stripe:', error);
        res.status(500).send('Error interno del servidor.');
    }
};

async function processStripeWebhook(event) {
    console.log('Procesando evento de Stripe:', event.type);
    if (event.type === 'checkout.session.completed') {
        console.log('Pago completado:', event.data.object);
        const session = event.data.object;
        const cartId = session.metadata.cartId;
        const cart = await Cart.findById(cartId);
        if (!cart) {
            console.error(`Carrito con ID ${cartId} no encontrado`);
            return;
        }
        const customerEmail = session.customer_details.email;
        const products = cart.products;
        let totalAmount = 0;
        for (const item of products) {
            const product = await Product.findById(item.product);
            totalAmount += product.price * item.quantity;
        }
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('es-ES');
        const formattedTime = currentDate.toLocaleTimeString('es-ES', { timeZone:'America/Argentina/Buenos_Aires'});
        const message = `
                        <html>
                        <head>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                }
                                .ticket {
                                    background-color: #f3f3f3;
                                    border: 1px solid #ccc;
                                    border-radius: 5px;
                                    padding: 20px;
                                    margin: 20px auto;
                                    max-width: 600px;
                                }
                                .ticket-header {
                                    background-color: #007bff;
                                    color: #fff;
                                    padding: 10px;
                                    border-radius: 5px 5px 0 0;
                                    text-align: center;
                                }
                                .ticket-body {
                                    padding: 20px;
                                }
                                .ticket-code {
                                    font-size: 20px;
                                    font-weight: bold;
                                    text-align: center;
                                    margin-bottom: 20px;
                                }
                                .ticket-details {
                                    margin-bottom: 20px;
                                }
                                .product {
                                    border-bottom: 1px solid #ccc;
                                    padding: 10px 0;
                                }
                                .product-name {
                                    font-weight: bold;
                                }
                                .product-price {
                                    float: right;
                                }
                                .ticket-total {
                                    font-size: 18px;
                                    font-weight: bold;
                                    margin-top: 20px;
                                    text-align: right;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="ticket">
                                <div class="ticket-header">
                                    <h2>Tu Ticket de Compra</h2>
                                </div>
                                <div class="ticket-body">
                                    <p class="ticket-code">Código de Compra: ${session.payment_intent}</p>
                                    <p class="ticket-details">Fecha de Compra: ${formattedDate} Hora: ${formattedTime}</p>
                                    <p class="ticket-details">Productos Comprados:</p>
                                    <div class="products-list">
                                        ${await Promise.all(cart.products.map(async (item) => {
                                            const product = await Product.findById(item.product);
                                            if (!product) return ''; 
                                            return `
                                                <div class="product">
                                                    <span class="product-name">${product.title}</span>
                                                    <span class="product-price">$${(product.price * item.quantity)} | Cantidad: ${item.quantity}</span>
                                                </div>
                                            `;
                                        })).then(htmlArray => htmlArray.join(''))}
                                    </div>
                                    <p class="ticket-total">Total: $${totalAmount}</p>
                                    <p class="ticket-message">¡Gracias por tu compra!</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `;
        const subject = 'Compra realizada exitosamente';
        await mailService.sendNotificationEmail(customerEmail, message, subject);
        const ticketAmount = totalAmount;
        const ticket = new Ticket({
            code: session.payment_intent,
            amount: ticketAmount,
            purchaser: customerEmail,
        });
        await ticket.save();
        for (const item of cart.products) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock -= item.quantity;
                await product.save();
            }
        }
        cart.products = [];
        await cart.save();
    } else {
        console.log('Pago fallido:', event.data.object);
        const session = event.data.object;
        const customerEmail = session.customer_details.email;
        const message = `Hubo un problema con el pago de tu compra. Por favor, intenta nuevamente.`;
        const subject = 'Pago fallido';
        await mailService.sendNotificationEmail(customerEmail, message, subject);
    }
}

const getAllCarts = async (req, res) => {
    try {
        const carts = await Cart.find();
        res.status(200).json({ status: 'success', message: 'Carritos encontrados.', data: carts });
    } catch (error) {
        console.error('Error al obtener los carritos:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
};

const getCartProducts = async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await Cart.findById(cartId);
        const userId = cart.UserId;
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
        res.render('cartEnd', { productsInfo, totalAmount, cartId, userId }); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
};

const deleteProductFromCart = async (req, res) => {
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
};

const emptyCart = async (req, res) => {
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
};

module.exports = {
    createCart,
    getCartByUserId,
    addProductToCart,
    purchaseCart,
    handleStripeWebhook,
    getAllCarts,
    getCartProducts,
    deleteProductFromCart,
    emptyCart
};