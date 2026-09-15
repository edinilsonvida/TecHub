import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/SignUpPage';
import NewProjectPage from './pages/NewProjectPage';

import PrivateRoute from './components/PrivateRoute';
import EmptyState from './components/EmptyState';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';

// Define a estrutura global e mapeia as URLs para as telas da aplicação.
export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cadastro" element={<SignUpPage />} />
          <Route path="/projeto/novo" element={<NewProjectPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} />
          </Route>

          <Route
            path="*"
            element={<EmptyState icon="compass" title="Página não encontrada" description="Verifique o endereço e tente novamente." />}
          />
        </Routes>
      </main>
    </div>
  );
}
