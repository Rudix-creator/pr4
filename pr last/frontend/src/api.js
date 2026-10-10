// адрес сервера
const API_URL = 'http://localhost:3001/api';

// базовый запрос
async function request(endpoint, options = {}) {
    const saved = localStorage.getItem('user');
    const userId = saved ? JSON.parse(saved).user_id : null;
    const headers = { 'Content-Type': 'application/json' };
    if (userId) headers['X-User-Id'] = userId;

    let res;
    try {
        res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    } catch (networkError) {
        // сообщаем приложению, что сервер недоступен (покажется страница «Технические работы»)
        window.dispatchEvent(new Event('server-down'));
        throw new Error('Сервер недоступен. Убедитесь, что бэкенд запущен на порту 3001.');
    }

    let data;
    try {
        data = await res.json();
    } catch (parseError) {
        throw new Error('Сервер вернул некорректный ответ');
    }
    if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
}

// обёртки запросов
const post = (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) });
const put = (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
const del = (endpoint) => request(endpoint, { method: 'DELETE' });

// проверка сервера
export const checkServer = () => request('/health');

// авторизация
export const loginUser = (data) => post('/auth/login', data);
export const registerUser = (data) => post('/auth/register', data);
export const forgotPassword = (email) => post('/auth/forgot', { email });
export const resetPassword = (data) => post('/auth/reset', data);

// пользователи
export const getUsers = () => request('/users');
export const updateUser = (id, data) => put(`/users/${id}`, data);
export const changePassword = (id, data) => put(`/users/${id}/password`, data);
export const getUserOrders = (id) => request(`/users/${id}/orders`);

// категории
export const getCategories = () => request('/categories');
export const createCategory = (data) => post('/categories', data);
export const updateCategory = (id, data) => put(`/categories/${id}`, data);
export const deleteCategory = (id) => del(`/categories/${id}`);

// услуги
export const getServices = () => request('/services');
export const getServiceById = (id) => request(`/services/${id}`);
export const createService = (data) => post('/services', data);
export const updateService = (id, data) => put(`/services/${id}`, data);
export const deleteService = (id) => del(`/services/${id}`);

// отзывы
export const getReviews = (serviceId) => request(`/services/${serviceId}/reviews`);
export const createReview = (data) => post('/reviews', data);
export const updateReview = (id, data) => put(`/reviews/${id}`, data);
export const deleteReview = (id) => del(`/reviews/${id}`);

// корзина
export const getCart = (userId) => request(`/cart/${userId}`);
export const addToCart = (userId, serviceId) => post('/cart', { user_id: userId, service_id: serviceId });
export const setCartQuantity = (userId, serviceId, quantity) => put('/cart', { user_id: userId, service_id: serviceId, quantity });
export const removeFromCart = (userId, serviceId) => del(`/cart/${userId}/${serviceId}`);

// заказы
export const createOrder = (data) => post('/orders', data);
export const getAvailability = (date) => request(`/orders/availability?date=${date}`);
export const payOrder = (id) => put(`/orders/${id}/pay`, {});
export const getAllOrders = () => request('/orders');
export const updateOrderStatus = (id, status) => put(`/orders/${id}/status`, { status });
