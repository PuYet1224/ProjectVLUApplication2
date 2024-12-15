import express from 'express';
import { loginUser, registerUser, adminLogin } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js'; 
import userModel from '../models/userModel.js'; 
import { NotFoundError } from '../core/error.response.js';

const router = express.Router();

// Public routes
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/admin/login', adminLogin);

// Protected routes
router.use(authUser);

// User Profile Route
router.get('/profile', async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.id).select('-password');
        if (!user) {
            throw new NotFoundError('User not found.');
        }
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
});

export default router;
