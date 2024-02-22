const Cart = require('../mongo/models/Carts');

exports.getCartByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const cart = await Cart.findOne({ userId }).populate('products.product', 'name price');
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }
        res.status(200).json({ cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};