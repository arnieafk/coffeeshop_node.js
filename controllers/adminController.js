const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');


/* =========================
   PRODUCTS
========================= */

async function listProducts(req, res) {
  try {

    const products = await Product.getAll();

    res.render('admin/products', {
      products,
      user: req.session.user
    });

  } catch (error) {
    console.error(error);
    res.send('Error loading products');
  }
}



function showCreateProduct(req, res) {

  res.render('admin/product-form', {
    product: null,
    action: '/admin/products',
    title: 'Add Product',
    user: req.session.user
  });

}



async function createProduct(req, res) {

  try {

    await Product.create(req.body);

    res.redirect('/admin/products');

  } catch(error){
    console.error(error);
    res.send('Error creating product');
  }

}



async function showEditProduct(req, res) {

  try {

    const product = await Product.getById(req.params.id);

    if(!product){
      return res.redirect('/admin/products');
    }

    res.render('admin/product-form',{
      product,
      action: `/admin/products/${product.id}/edit`,
      title:'Edit Product',
      user: req.session.user
    });

  } catch(error){
    console.error(error);
    res.send('Error loading product');
  }

}



async function updateProduct(req, res){
  try{
    const name = String(req.body.name || '').trim();
    const price = Number(req.body.price);
    const stock = req.body.stock ? Number(req.body.stock) : 0;
    const description = String(req.body.description || '').trim();

    if (!name) {
      return res.status(400).send('Product name is required.');
    }

    if (Number.isNaN(price) || price < 0) {
      return res.status(400).send('Price must be a valid non-negative number.');
    }

    if (Number.isNaN(stock) || stock < 0) {
      return res.status(400).send('Stock must be a valid non-negative integer.');
    }

    await Product.update(req.params.id, {
      name,
      price,
      stock,
      description
    });

    res.redirect('/admin/products');
  } catch(error){
    console.error('[PRODUCT UPDATE ERROR]', error);
    res.status(500).send(`Error updating product: ${error.message}`);
  }
}



async function deleteProduct(req,res){
  try{
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id) || id < 1) {
      return res.status(400).send('Invalid product ID.');
    }

    const existingProduct = await Product.getById(id);
    if (!existingProduct) {
      return res.status(404).send('Product not found.');
    }

    await Product.remove(id);
    res.redirect('/admin/products');
  } catch(error){
    console.error('[DELETE PRODUCT ERROR]', error);
    res.status(500).send('Failed to delete product');
  }
}



/* =========================
   ORDERS
========================= */

async function listOrders(req,res){

  try{

    const orders = await Order.getAllWithUser();

    res.render('admin/orders',{
      orders,
      user: req.session.user
    });

  } catch(error){
    console.error(error);
    res.send('Error loading orders');
  }

}



/* SINGLE ORDER DETAILS */
async function showOrder(req,res){

  try{

    const order = await Order.getById(req.params.id);

    if(!order){
      return res.redirect('/admin/orders');
    }

    res.render('admin/order-details',{
      title:'Order Details',
      order,
      user: req.session.user
    });

  } catch(error){
    console.error(error);
    res.send('Error loading order details');
  }

}



/* =========================
   PAYMENTS
========================= */

async function listPayments(req,res){

  try{

    const payments = await Payment.getAll();

    res.render('admin/payments',{
      payments,
      user: req.session.user
    });

  } catch(error){
    console.error(error);
    res.send('Error loading payments');
  }

}
  async function updateOrderStatus(req,res){
   try{
      let { status } = req.body;

      // 🔥 FORCE STANDARD FORMAT
      const map = {
        pending: 'Pending',
        preparing: 'Preparing',
        completed: 'Completed',
        Pending: 'Pending',
        Preparing: 'Preparing',
        Completed: 'Completed'
      };

      status = map[status];

      if (!status) {
        return res.redirect('/admin/orders');
      }

      await Order.updateStatus(
         req.params.id,
         status
      );

      res.redirect('/admin/orders');

   } catch(error){
      console.error('[UPDATE ORDER STATUS ERROR]', error);
      res.status(500).send('Error updating order status');
   }
}

module.exports = {
  listProducts,
  showCreateProduct,
  createProduct,
  showEditProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  showOrder,
  updateOrderStatus,
  listPayments
};