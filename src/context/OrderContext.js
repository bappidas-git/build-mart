import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import apiService from "../services/api";
import Swal from "sweetalert2";

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserOrders = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userOrders = await apiService.orders.getByUserId(user.id);
      const list = Array.isArray(userOrders)
        ? userOrders
        : userOrders?.data || userOrders?.orders || [];
      // Sort by date, newest first
      const sortedOrders = [...list].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load user's orders when authenticated
  useEffect(() => {
    if (user) {
      loadUserOrders();
    } else {
      setOrders([]);
    }
  }, [user, loadUserOrders]);

  const createOrder = async (orderData) => {
    // NEBM is an enquiry platform: an enquiry (flagged `type: "enquiry"`)
    // captures contact + items + note and carries ONLY a workflow `status`
    // (starts "New"). It must not seed the payment/fulfillment/shipping
    // dimensions an e-commerce order needs — those fields are what make the mock
    // API fire the payment/coupon/wallet side effects, so an enquiry that omits
    // them stays side-effect-free. Legacy (non-enquiry) orders keep the full
    // three-status shape the rest of the app reads.
    const isEnquiry = orderData?.type === "enquiry";
    try {
      setIsLoading(true);

      const timestamp = new Date().toISOString();
      const order = isEnquiry
        ? {
            ...orderData,
            userId: user?.id ?? null,
            enquiryNumber: generateEnquiryNumber(),
            status: orderData.status || "New",
            adminNotes: orderData.adminNotes || "",
            createdAt: timestamp,
            updatedAt: timestamp,
          }
        : {
            ...orderData,
            userId: user?.id ?? null,
            orderNumber: generateOrderNumber(),
            paymentStatus: orderData.paymentStatus || "pending",
            fulfillmentStatus: orderData.fulfillmentStatus || "unfulfilled",
            shippingStatus: orderData.shippingStatus || "pending",
            trackingNumber: orderData.trackingNumber ?? null,
            shiprocketOrderId: orderData.shiprocketOrderId ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

      // Save to API
      const savedOrder = await apiService.orders.create(order);

      // Update local state
      setOrders((prev) => [savedOrder, ...prev]);
      setCurrentOrder(savedOrder);

      return { success: true, order: savedOrder };
    } catch (error) {
      console.error("Error creating order:", error);

      Swal.fire({
        icon: "error",
        title: isEnquiry ? "Enquiry Failed" : "Order Failed",
        text: isEnquiry
          ? "There was an error submitting your enquiry. Please try again."
          : "There was an error processing your order. Please try again.",
      });

      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderById = (orderId) => {
    return orders.find((order) => order.id === orderId || order.orderNumber === orderId);
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  // Enquiry reference number. Mirrors generateOrderNumber's scheme but with an
  // ENQ- prefix so an enquiry is recognisable at a glance in Admin → Enquiries
  // and on the success screen (prompt 20). Orders and enquiries live in the same
  // collection for now, so keeping the two prefixes distinct avoids collisions.
  const generateEnquiryNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ENQ-${timestamp}-${random}`;
  };

  const value = {
    orders,
    currentOrder,
    isLoading,
    createOrder,
    loadUserOrders,
    getOrderById,
    setCurrentOrder,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};
