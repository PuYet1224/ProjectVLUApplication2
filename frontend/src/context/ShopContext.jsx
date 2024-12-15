import { createContext, useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = '$';
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const navigate = useNavigate();

    const addToCart = async (itemId, size) => {
        if (!size) {
            toast.error('Select Product Size');
            return;
        }

        let cartData = structuredClone(cartItems);

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
        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(`${backendUrl}/api/cart/add`, { itemId, size }, { 
                    headers: { 
                        Authorization: `Bearer ${token}` 
                    } 
                });
                toast.success("Added to cart successfully!");
            } catch (error) {
                console.log(error);
                toast.error(error.response?.data?.message || 'Failed to add to cart.');
            }
        } else {
            toast.success("Added to cart successfully!");
        }
    };

    // Get Cart Count
    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }
        return totalCount;
    };

    // Update Quantity
    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);

        cartData[itemId][size] = quantity;

        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(`${backendUrl}/api/cart/update`, { itemId, size, quantity }, { 
                    headers: { 
                        Authorization: `Bearer ${token}` 
                    } 
                });
                toast.success("Cart updated successfully!");
            } catch (error) {
                console.log(error);
                toast.error(error.response?.data?.message || 'Failed to update cart.');
            }
        }
    };

    // Get Cart Amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0 && itemInfo) {
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }
        return totalAmount;
    };

    // Fetch Products Data
    const getProductsData = useCallback(async () => { // Sử dụng useCallback
        try {
            const response = await axios.get(`${backendUrl}/api/product/list`);
            console.log("Products API Response:", response.data); // Debug
            if (response.data.success) {
                setProducts(response.data.products.reverse());
            } else {
                toast.error(response.data.message || 'Failed to fetch products.');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to fetch products.');
        }
    }, [backendUrl]);

    // Fetch User Cart
    const getUserCart = useCallback(async (token) => {
        try {
            const response = await axios.get(`${backendUrl}/api/cart/get`, { 
                headers: { 
                    Authorization: `Bearer ${token}` 
                } 
            });
            if (response.data.success) {
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to fetch cart.');
        }
    }, [backendUrl]);

    // Fetch User Addresses
    const getUserAddresses = useCallback(async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/user/addresses`, { 
                headers: { 
                    Authorization: `Bearer ${token}` 
                } 
            });
            if (response.data.success) {
                // Store addresses if needed
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to fetch addresses.');
        }
    }, [backendUrl, token]);

    // Login Function
    const loginFunc = useCallback((newToken) => { // Đổi tên để tránh nhầm lẫn
        setToken(newToken);
        localStorage.setItem('token', newToken);
        toast.success('Login successful!');
        getUserCart(newToken); // Fetch cart after login
        getUserAddresses(); // Fetch addresses after login
    }, [getUserCart, getUserAddresses]);

    // Logout Function
    const logout = useCallback(() => {
        setToken('');
        localStorage.removeItem('token');
        setCartItems({});
        navigate('/login');
        toast.success('Logout successful!');
    }, [navigate]);

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [logout]);

    useEffect(() => {
        getProductsData(); // Gọi hàm fetch sản phẩm khi component mount
    }, [getProductsData]);

    useEffect(() => {
        if (token) {
            getUserCart(token);
            getUserAddresses();
        }
    }, [token, getUserCart, getUserAddresses]);

    const value = {
        products, 
        currency, 
        delivery_fee,
        search, 
        setSearch, 
        showSearch, 
        setShowSearch,
        cartItems, 
        addToCart, 
        setCartItems,
        getCartCount, 
        updateQuantity,
        getCartAmount, 
        navigate, 
        backendUrl,
        setToken, 
        token,
        login: loginFunc, // Sử dụng hàm login từ context
        logout
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;
