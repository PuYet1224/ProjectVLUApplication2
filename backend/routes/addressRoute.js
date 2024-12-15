import express from 'express';
import { getAddresses, addAddress, updateAddress, deleteAddress } from '../controllers/addressController.js';
import authUser from '../middlewares/authUser.js';

const router = express.Router();

router.use(authUser);

router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

export default router;
