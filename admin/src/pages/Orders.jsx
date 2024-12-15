import React from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { assets } from '../assets/assets';

const Orders = ({ orders, adminToken, setOrders }) => { 

    const statusHandler = async (event, orderId) => {
        try {
            const newStatus = event.target.value;
            const response = await axios.put(
                `${backendUrl}/api/order/update`,
                { orderId, status: newStatus },
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );

            if (response.data.success) {
                setOrders(prevOrders => prevOrders.map(order => 
                    order._id === orderId ? { ...order, status: newStatus } : order
                ));
            } else {
                toast.error(response.data.message || 'Update failed.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h3 className="text-2xl font-semibold mb-4">Order Management</h3>
            <div>
                {orders.length === 0 ? (
                    <p className="text-gray-500">No orders found.</p>
                ) : (
                    orders.map((order) => (
                        <div
                            className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700 relative"
                            key={order._id}
                        >
                            <img className="w-12" src={assets.parcel_icon} alt="Parcel Icon" />
                            <div>
                                <div>
                                    {order.items && order.items.length > 0 ? (
                                        order.items.map((item, idx) => (
                                            <p className="py-0.5" key={idx}>
                                                {item.name} x {item.quantity} <span> {item.size} </span>
                                                {idx !== order.items.length - 1 && ','}
                                            </p>
                                        ))
                                    ) : (
                                        <p>No products in this order.</p>
                                    )}
                                </div>
                                {/* Removed userName display */}
                                <div>
                                    {order.address ? (
                                        <>
                                            <p>{`${order.address.street},`}</p>
                                            <p>{`${order.address.city}, ${order.address.state}, ${order.address.country}, ${order.address.zipcode}`}</p>
                                            <p>{order.address.phone}</p>
                                        </>
                                    ) : (
                                        <p>No address provided.</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm sm:text-[15px]">Items: {order.items.length}</p>
                                <p className="mt-3">Method: {order.paymentMethod}</p>
                                <p>Payment: {order.payment ? 'Done' : 'Pending'}</p>
                                <p>Date: {order.date ? new Date(order.date).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                            <p className="text-sm sm:text-[15px]">
                                {currency}
                                {order.amount}
                            </p>
                            <select
                                onChange={(event) => statusHandler(event, order._id)}
                                value={order.status || 'Order Placed'}
                                className="p-2 font-semibold border rounded-md"
                            >
                                <option value="Order Placed">Order Placed</option>
                                <option value="Packing">Packing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for delivery">Out for delivery</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                            {order.isNewest && (
                                <span className="absolute top-5 right-5 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                                    Newest
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Orders;
