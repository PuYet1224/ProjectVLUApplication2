import userModel from "../models/userModel.js";

// Add products to user cart
const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId, size } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!itemId || !size) {
            return res.status(400).json({ success: false, message: 'Missing required fields: itemId or size.' });
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let cartData = userData.cartData;
        if (!cartData || typeof cartData !== 'object') {
            cartData = {};
        }

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }

        await userModel.findByIdAndUpdate(userId, { cartData });

        res.json({ success: true, message: "Added to cart successfully." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
}

// Update user cart
const updateCart = async (req, res) => {
    try {
        // Lấy userId từ middleware xác thực, không lấy từ req.body
        const userId = req.user.id;
        const { itemId, size, quantity } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!itemId || !size || quantity == null) {
            return res.status(400).json({ success: false, message: 'Missing required fields: itemId, size, or quantity.' });
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let cartData = userData.cartData;
        if (!cartData || typeof cartData !== 'object') {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }

        if (cartData[itemId] && cartData[itemId][size] !== undefined) {
            if (quantity > 0) {
                cartData[itemId][size] = quantity;
            } else {
                // Nếu quantity <= 0, xóa sản phẩm khỏi giỏ hàng
                delete cartData[itemId][size];
                // Nếu không còn size nào cho itemId, xóa itemId khỏi cart
                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }
            }
        } else {
            return res.status(400).json({ success: false, message: 'Item or size not found in cart.' });
        }

        await userModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Cart updated successfully." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
}

// Get user cart data
const getUserCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let cartData = userData.cartData;
        if (!cartData || typeof cartData !== 'object') {
            cartData = {};
        }

        res.json({ success: true, cartData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
}

export { addToCart, updateCart, getUserCart }
