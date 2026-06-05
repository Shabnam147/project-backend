const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// All cart routes require authentication
router.use(protect);

// @route  GET /api/cart
// @desc   Get user's cart with populated product info
// @access Private
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name imageUrl price stock');
    if (!cart) {
      return res.json({ success: true, cart: { items: [], totalAmount: 0 } });
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ success: true, cart: { ...cart.toObject(), totalAmount } });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart.' });
  }
});

// @route  POST /api/cart
// @desc   Add item to cart (or update quantity if already exists)
// @access Private
router.post('/', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units in stock.` });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({ productId, quantity: parseInt(quantity), price: product.price });
    }

    await cart.save();
    await cart.populate('items.productId', 'name imageUrl price stock');

    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ success: true, message: 'Item added to cart.', cart: { ...cart.toObject(), totalAmount } });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
  }
});

// @route  PUT /api/cart/:productId
// @desc   Update item quantity in cart
// @access Private
router.put('/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || parseInt(quantity) < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === req.params.productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    cart.items[itemIndex].quantity = parseInt(quantity);
    await cart.save();
    await cart.populate('items.productId', 'name imageUrl price stock');

    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ success: true, message: 'Cart updated.', cart: { ...cart.toObject(), totalAmount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
});

// @route  DELETE /api/cart/:productId
// @desc   Remove item from cart
// @access Private
router.delete('/:productId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== req.params.productId
    );

    await cart.save();
    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ success: true, message: 'Item removed from cart.', cart: { ...cart.toObject(), totalAmount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove item from cart.' });
  }
});

// @route  DELETE /api/cart
// @desc   Clear entire cart
// @access Private
router.delete('/', async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { items: [] } }
    );
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
});

module.exports = router;
