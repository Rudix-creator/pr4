import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './Authcontext'
import { CartProvider } from './Cartcontext'
import Navbar from './Navbar'
import Catalog from './Catalog'
import ServiceDetail from './ServiceDetail'
import Login from './Login'
import Register from './Register'
import Cart from './Cart'
import Dashboard from './Dashboard'
import Admin from './Admin'
import NotFound from './NotFound'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
