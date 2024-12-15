import express from 'express';
import { addToCart, getUserCart, updateCart } from '../controllers/cartController.js';
import authUser from '../middlewares/authUser.js';

const cartRouter = express.Router();

cartRouter.get('/get', authUser, getUserCart);
cartRouter.post('/add', authUser, addToCart);
cartRouter.post('/update', authUser, updateCart);

export default cartRouter;
