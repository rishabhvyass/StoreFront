import React from "react";
import "./App.css";
import "./styles/Common.css";
import "./styles/Theme.css";
import "./components/product-card/Style.css";
import { Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Services from "./webComponents/Servies";
import Home from "./webComponents/Home";
import Contact from "./webComponents/Contact";
import Navigation from "./Navigation";
import Err404 from "./webComponents/Err404";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// E-commerce Pages
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CustomerPortal from "./pages/CustomerPortal";

// Backend Management Pages
import BackendDashboard from "./pages/BackendDashboard";
import ProductManagement from "./pages/ProductManagement";
import OrderManagement from "./pages/OrderManagement";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const App = () => {
  return (
    <AppProvider>
      <Navigation />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/shop"
          element={
            <ProtectedRoute>
              <Shop />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Customer Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-portal"
          element={
            <ProtectedRoute>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/success/:orderId"
          element={
            <ProtectedRoute>
              <CheckoutSuccess />
            </ProtectedRoute>
          }
        />

        {/* Protected Backend Routes */}
        <Route
          path="/backend"
          element={
            <ProtectedRoute requireInternal={true}>
              <BackendDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/products"
          element={
            <ProtectedRoute requireInternal={true}>
              <ProductManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/orders"
          element={
            <ProtectedRoute requireInternal={true}>
              <OrderManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/invoices"
          element={
            <ProtectedRoute requireInternal={true}>
              <OrderManagement initialTab="invoices" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/reports"
          element={
            <ProtectedRoute requireInternal={true}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/settings"
          element={
            <ProtectedRoute requireInternal={true}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Err404 />} />
      </Routes>
    </AppProvider>
  );
};

export default App;
