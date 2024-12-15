import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe';
import { NotFoundError, BadRequestError } from '../core/error.response.js';
import { io } from '../server.js'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const currency = 'vnd';
const deliveryCharge = 10000; 

const placeOrder = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { items, amount, address } = req.body;

        let orderAddress;

        if (address.addressId) {
            const user = await userModel.findById(userId).select('addresses');
            if (!user) {
                throw new NotFoundError('User not found.');
            }
            const selectedAddress = user.addresses.id(address.addressId);
            if (!selectedAddress) {
                throw new NotFoundError('Address not found.');
            }
            orderAddress = selectedAddress;
        } else {
            const { firstName, lastName, email, street, city, state, zipcode, country, phone } = address;

            if (!firstName || !lastName || !email || !street || !city || !zipcode || !country || !phone) {
                throw new BadRequestError('All address fields are required.');
            }

            const newAddress = { firstName, lastName, email, street, city, state, zipcode, country, phone };
            const user = await userModel.findById(userId);
            if (!user) {
                throw new NotFoundError('User not found.');
            }
            user.addresses.push(newAddress);
            await user.save();

            orderAddress = newAddress;
        }

        const orderData = {
            userId,
            items,
            address: orderAddress,
            amount,
            paymentMethod: "COD",
            payment: false,
            date: Date.now()
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        const user = await userModel.findById(userId).select('firstName lastName');

        io.to('admin').emit('newOrder', {
            orderId: newOrder._id,
            userName: `${user.firstName} ${user.lastName}`,
            amount: newOrder.amount,
            paymentMethod: newOrder.paymentMethod,
            status: newOrder.status,
            date: newOrder.date,
            items: newOrder.items,
            address: newOrder.address
        });

        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        res.json({ success: true, message: "Order placed successfully." });

    } catch (error) {
        console.error(error);
        next(error);
    }
};

const placeOrderStripe = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { items, amount, address } = req.body;
        const { origin } = req.headers;

        let orderAddress;

        if (address.addressId) {
            const user = await userModel.findById(userId).select('addresses');
            if (!user) {
                throw new NotFoundError('User not found.');
            }
            const selectedAddress = user.addresses.id(address.addressId);
            if (!selectedAddress) {
                throw new NotFoundError('Address not found.');
            }
            orderAddress = selectedAddress;
        } else {
            const { firstName, lastName, email, street, city, state, zipcode, country, phone } = address;

            if (!firstName || !lastName || !email || !street || !city || !zipcode || !country || !phone) {
                throw new BadRequestError('All address fields are required.');
            }

            const newAddress = { firstName, lastName, email, street, city, state, zipcode, country, phone };
            const user = await userModel.findById(userId);
            if (!user) {
                throw new NotFoundError('User not found.');
            }
            user.addresses.push(newAddress);
            await user.save();

            orderAddress = newAddress;
        }

        const orderData = {
            userId,
            items,
            address: orderAddress,
            amount,
            paymentMethod: "Stripe",
            payment: false,
            date: Date.now()
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        const user = await userModel.findById(userId).select('firstName lastName');

        io.to('admin').emit('newOrder', {
            orderId: newOrder._id,
            userName: `${user.firstName} ${user.lastName}`,
            amount: newOrder.amount,
            paymentMethod: newOrder.paymentMethod,
            status: newOrder.status,
            date: newOrder.date,
            items: newOrder.items,
            address: newOrder.address
        });

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }));

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        });

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        });

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.error(error);
        next(error);
    }
};

const verifyStripe = async (req, res, next) => {
    const { orderId, success } = req.query;

    try {
        if (!orderId || !success) {
            return res.status(400).json({ success: false, message: 'Missing required query parameters.' });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (success === "true") {
            order.payment = true;
            await order.save();

            io.to('admin').emit('orderUpdated', {
                orderId: order._id,
                status: order.status,
                payment: order.payment
            });

            await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

            res.json({ success: true, message: 'Payment verified and order placed successfully.' });
        } else {
            await orderModel.findByIdAndDelete(orderId);

            res.json({ success: false, message: 'Payment failed or was cancelled.' });
        }

    } catch (error) {
        console.error(error);
        next(error);
    }
};

const allOrders = async (req, res, next) => {
    try {
        const orders = await orderModel.find({}).populate('userId', 'firstName lastName email');
        res.json({ success: true, orders });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

const userOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const orders = await orderModel.find({ userId }).populate('userId', 'firstName lastName email');
        res.json({ success: true, orders });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: 'Missing required fields: orderId or status.' });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        order.status = status;
        await order.save();

        io.to('admin').emit('orderUpdated', {
            orderId: order._id,
            status: order.status,
            payment: order.payment
        });

        res.json({ success: true, message: 'Order status updated successfully.' });

    } catch (error) {
        console.error(error);
        next(error);
    }
};

export { verifyStripe, placeOrder, placeOrderStripe, allOrders, userOrders, updateStatus };
