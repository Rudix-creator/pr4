const API_URL = 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
    let res;
    try {
        res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (networkError) {
        throw new Error('Сервер недоступен. Убедитесь, что бэкенд запущен на порту 3001.');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
}

const post = (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) });
const put = (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
const del = (endpoint) => request(endpoint, { method: 'DELETE' });

export const loginUser = (data) => post('/auth/login', data);
export const registerUser = (data) => post('/auth/register', data);

export const getUsers = () => request('/users');
export const updateUser = (id, data) => put(`/users/${id}`, data);
export const deleteUser = (id) => del(`/users/${id}`);
export const changePassword = (id, data) => put(`/users/${id}/password`, data);
export const getUserOrders = (id) => request(`/users/${id}/orders`);

export const getCategories = () => request('/categories');
export const createCategory = (data) => post('/categories', data);
export const updateCategory = (id, data) => put(`/categories/${id}`, data);
export const deleteCategory = (id) => del(`/categories/${id}`);

export const getServices = () => request('/services');
export const getServiceById = (id) => request(`/services/${id}`);
export const createService = (data) => post('/services', data);
export const updateService = (id, data) => put(`/services/${id}`, data);
export const deleteService = (id) => del(`/services/${id}`);

export const getReviews = (serviceId) => request(`/services/${serviceId}/reviews`);
export const createReview = (data) => post('/reviews', data);
export const updateReview = (id, data) => put(`/reviews/${id}`, data);
export const deleteReview = (id) => del(`/reviews/${id}`);

export const getCart = (userId) => request(`/cart/${userId}`);
export const addToCart = (userId, serviceId) => post('/cart', { user_id: userId, service_id: serviceId });
export const setCartQuantity = (userId, serviceId, quantity) => put('/cart', { user_id: userId, service_id: serviceId, quantity });
export const removeFromCart = (userId, serviceId) => del(`/cart/${userId}/${serviceId}`);

export const createOrder = (data) => post('/orders', data);
export const getAllOrders = () => request('/orders');
export const updateOrderStatus = (id, status) => put(`/orders/${id}/status`, { status });
export const deleteOrder = (id) => del(`/orders/${id}`);