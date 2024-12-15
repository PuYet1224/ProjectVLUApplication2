// frontend-admin/src/App.jsx
import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Routes, Route, Navigate } from 'react-router-dom';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/Orders';
import Login from './components/Login';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = '$';

const AdminApp = () => {
    const [orders, setOrders] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('adminToken') || '');

    useEffect(() => {
        if (!token) {
            toast.error('Bạn chưa đăng nhập hoặc không có quyền truy cập.');
            return;
        }

        const socket = io(backendUrl, {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('newOrder', (data) => {
          console.log('Received newOrder:', data); 
          try {
              const newOrder = { 
                  _id: data.orderId,
                  userName: data.userName,
                  amount: data.amount,
                  paymentMethod: data.paymentMethod,
                  status: data.status,
                  payment: data.payment,
                  date: data.date,
                  items: data.items,
                  address: data.address,
                  isNewest: true
              };
              setOrders(prev => [newOrder, ...prev]);
      
              const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
              const productText = totalItems === 1 ? 'product' : 'products';
      
              toast.info(`${totalItems} ${productText} have just been ordered.`);
      
              setTimeout(() => {
                  setOrders(prevOrders => prevOrders.map(order => 
                      order._id === data.orderId ? { ...order, isNewest: false } : order
                  ));
              }, 5000);
          } catch (error) {
              console.error('Error handling newOrder:', error);
              toast.error('Error processing new order.');
          }
      });      

        socket.on('orderUpdated', (data) => {
            console.log('Received orderUpdated:', data);
            try {
                const { orderId, status, payment } = data;
                setOrders(prevOrders => prevOrders.map(order => {
                    if (order._id === orderId) {
                        console.log(`Updating order ${orderId} status to ${status}`);
                        return { ...order, status, payment };
                    }
                    return order;
                }));
                toast.info(`Đơn hàng ${orderId} đã được cập nhật trạng thái thành ${status}.`);
            } catch (error) {
                console.error('Error handling orderUpdated:', error);
                toast.error('Lỗi khi xử lý cập nhật đơn hàng.');
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        socket.on('connect_error', (err) => {
            console.log('Connection error:', err.message);
            toast.error(`Lỗi kết nối WebSocket: ${err.message}`);
        });

        return () => {
            socket.disconnect();
        };
    }, [token]); // Loại bỏ backendUrl khỏi dependency array

    const fetchOrders = async () => {
        if (!token) {
            toast.error('Bạn chưa đăng nhập hoặc không có quyền truy cập.');
            return;
        }

        try {
            const response = await axios.get(`${backendUrl}/api/order/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                const fetchedOrders = response.data.orders.map(order => ({ ...order, isNewest: false }));
                setOrders(fetchedOrders.reverse());
            } else {
                toast.error(response.data.message || 'Không thể lấy đơn hàng.');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Lỗi khi lấy đơn hàng.');
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [token]);

    useEffect(() => {
        localStorage.setItem('adminToken', token);
    }, [token]);

    if (!token) {
        return (
            <div className='bg-gray-50 min-h-screen'>
                <ToastContainer />
                <Login setToken={setToken} />
            </div>
        );
    }

    return (
        <div className='bg-gray-50 min-h-screen'>
            <ToastContainer />
            <Navbar setToken={setToken} />
            <hr />
            <div className='flex w-full'>
                <Sidebar />
                <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
                    <Routes>
                        <Route path='/add' element={<Add token={token} />} />
                        <Route path='/list' element={<List token={token} />} />
                        <Route path='/orders' element={
                            <ErrorBoundary>
                                <Orders orders={orders} adminToken={token} />
                            </ErrorBoundary>
                        } />
                        <Route path='*' element={<Navigate to="/orders" />} />
                    </Routes>
                </div> {/* Đóng thẻ div đúng cách */}
            </div>
        </div>
    );
};

export default AdminApp;
