import express from 'express';
import { verifyStripe, placeOrder, placeOrderStripe, allOrders, userOrders, updateStatus } from '../controllers/orderController.js';
import authUser from '../middlewares/authUser.js'; // Middleware xác thực người dùng
import authAdmin from '../middlewares/authAdmin.js'; // Middleware xác thực admin

const router = express.Router();

// 1. Protected routes cho người dùng
router.use(authUser);

// Route để đặt đơn hàng bằng COD
router.post('/place', placeOrder);

// Route để đặt đơn hàng bằng Stripe
router.post('/stripe', placeOrderStripe);

// Route để xác minh thanh toán Stripe
router.get('/verify', verifyStripe);

// Route để lấy đơn hàng của người dùng
router.post('/userorders', userOrders);

// 2. Protected routes cho admin
router.use(authAdmin);

// Route để lấy tất cả đơn hàng (Admin)
router.get('/all', allOrders);

// Route để cập nhật trạng thái đơn hàng (Admin)
router.put('/update', updateStatus);

export default router;
