import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useSelector } from "react-redux";

import RenderRazorpay from "./CheckoutForm";
import "../Stripe.css";
import { selectCurrentOrder } from "../features/order/orderSlice";

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.

export default function StripeCheckout() {
  const currentOrder = useSelector(selectCurrentOrder);
  const [displayRazorpay, setDisplayRazorpay] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    orderId: currentOrder.id,
    currency:  "INR",
    amount: currentOrder.totalAmount,
  });

  // const appearance = {
  //   theme: 'stripe',
  // };
  // const options = {
  //   clientSecret,
  //   appearance,
  // };

  return (
    <div className="Stripe">
        <>
        <h1>aaaaaaaa</h1>
        <RenderRazorpay
        
          amount={orderDetails.amount}
          currency={orderDetails.currency}
          orderId={orderDetails.orderId}
          keyId="rzp_test_h27cx8k0njEGHh"
          keySecret="KY6HyMf6wbE5dNKXUxEqgjOK"
        />
        </>
    </div>
  );
}
