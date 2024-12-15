import userModel from '../models/userModel.js';
import { BadRequestError, NotFoundError } from '../core/error.response.js';

// Lấy tất cả địa chỉ của người dùng
const getAddresses = async (req, res, next) => {
    try {
        const userId = req.user.id; // Lấy userId từ middleware xác thực

        const user = await userModel.findById(userId).select('addresses');
        if (!user) {
            throw new NotFoundError('Người dùng không tồn tại.');
        }

        res.json({ success: true, addresses: user.addresses });
    } catch (error) {
        next(error);
    }
};

// Thêm địa chỉ mới
const addAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, email, street, city, state, zipcode, country, phone } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!firstName || !lastName || !email || !street || !city || !zipcode || !country || !phone) {
            throw new BadRequestError('Tất cả các trường địa chỉ đều bắt buộc.');
        }

        const user = await userModel.findById(userId);
        if (!user) {
            throw new NotFoundError('Người dùng không tồn tại.');
        }

        const newAddress = { firstName, lastName, email, street, city, state, zipcode, country, phone };
        user.addresses.push(newAddress);
        await user.save();

        res.json({ success: true, message: 'Thêm địa chỉ thành công.', address: newAddress });
    } catch (error) {
        next(error);
    }
};

// Cập nhật địa chỉ
const updateAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.addressId;
        const { firstName, lastName, email, street, city, state, zipcode, country, phone } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            throw new NotFoundError('Người dùng không tồn tại.');
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            throw new NotFoundError('Địa chỉ không tồn tại.');
        }

        // Cập nhật các trường của địa chỉ
        address.firstName = firstName || address.firstName;
        address.lastName = lastName || address.lastName;
        address.email = email || address.email;
        address.street = street || address.street;
        address.city = city || address.city;
        address.state = state || address.state;
        address.zipcode = zipcode || address.zipcode;
        address.country = country || address.country;
        address.phone = phone || address.phone;

        await user.save();

        res.json({ success: true, message: 'Cập nhật địa chỉ thành công.', address });
    } catch (error) {
        next(error);
    }
};

// Xóa địa chỉ
const deleteAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.addressId;

        const user = await userModel.findById(userId);
        if (!user) {
            throw new NotFoundError('Người dùng không tồn tại.');
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            throw new NotFoundError('Địa chỉ không tồn tại.');
        }

        address.remove();
        await user.save();

        res.json({ success: true, message: 'Xóa địa chỉ thành công.' });
    } catch (error) {
        next(error);
    }
};

export { getAddresses, addAddress, updateAddress, deleteAddress };
