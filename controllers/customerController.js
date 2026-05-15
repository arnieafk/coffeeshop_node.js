const Product = require('../models/Product');
const Order = require('../models/Order');

/* =========================
   CART HELPER
========================= */
function getCart(req) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
}

/* =========================
   MENU
========================= */
async function viewMenu(req, res) {
  try {
    const products = await Product.getAll();

    res.render('customer/menu', {
      products,
      cart: getCart(req),
      user: req.session.user
    });

  } catch (error) {
    console.error('Error fetching products:', error);

    res.status(500).render('partials/error', {
      message: 'Failed to load menu'
    });
  }
}

/* =========================
   ADD TO CART
========================= */
async function addToCart(req, res) {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      return res.redirect('/customer/menu');
    }

    const cart = getCart(req);

    const existing = cart.find(
      (item) => Number(item.id) === Number(product.id)
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1
      });
    }

    req.session.cart = cart;

    res.redirect('/customer/menu');

  } catch (error) {
    console.error('Error adding to cart:', error);

    res.status(500).render('partials/error', {
      message: 'Failed to add item to cart'
    });
  }
}

/* =========================
   VIEW CART
========================= */
function viewCart(req, res) {
  const cart = getCart(req);

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity),
    0
  );

  res.render('customer/cart', {
    cart,
    total,
    user: req.session.user
  });
}

/* =========================
   INCREASE QTY
========================= */
function increaseQuantity(req, res) {
  const cart = getCart(req);

  const item = cart.find(
    (item) => Number(item.id) === Number(req.params.id)
  );

  if (item) {
    item.quantity += 1;
  }

  req.session.cart = cart;
  res.redirect('/customer/cart');
}

/* =========================
   DECREASE QTY
========================= */
function decreaseQuantity(req, res) {
  let cart = getCart(req);

  const item = cart.find(
    (item) => Number(item.id) === Number(req.params.id)
  );

  if (item) {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      cart = cart.filter(
        (cartItem) =>
          Number(cartItem.id) !== Number(req.params.id)
      );
    }
  }

  req.session.cart = cart;
  res.redirect('/customer/cart');
}

/* =========================
   REMOVE ITEM
========================= */
function removeFromCart(req, res) {
  const cart = getCart(req).filter(
    (item) => Number(item.id) !== Number(req.params.id)
  );

  req.session.cart = cart;

  res.redirect('/customer/cart');
}

/* =========================
   PLACE ORDER
========================= */
async function placeOrder(req, res) {
  const cart = getCart(req);

  if (!cart.length) {
    return res.redirect('/customer/cart');
  }

  await Order.createOrder(req.session.user.id, cart);

  req.session.cart = [];

  res.redirect('/customer/orders');
}

/* =========================
   MY ORDERS
========================= */
async function myOrders(req, res) {
  const orders = await Order.getByUserId(req.session.user.id);

  for (const order of orders) {
    order.items = await Order.getOrderItems(order.id);
  }

  res.render('customer/orders', {
    orders,
    user: req.session.user
  });
}

module.exports = {
  viewMenu,
  addToCart,
  viewCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  placeOrder,
  myOrders,
};