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
    orderId: null,
    currency: null,
    amount: null,
  });
  useEffect(() => {
    fetch("/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: currentOrder.totalAmount, // convert amount into lowest unit (Dollar -> Cents)
        orderId: currentOrder.id,
        keyId: "rzp_test_h27cx8k0njEGHh",
        KeySecret: "KY6HyMf6wbE5dNKXUxEqgjOK",
      }),
    })
      .then((response) => response.json()) // Convert the response to JSON
      .then((data) => {
        if (data && data.order_id) {
          setOrderDetails({
            orderId: data.order_id,
            currency: data.currency,
            amount: data.amount,
          });
          setDisplayRazorpay(true);
        }
      })
      .catch((error) => {
        console.error("Error creating order:", error);
      });
  }, []);

  // const appearance = {
  //   theme: 'stripe',
  // };
  // const options = {
  //   clientSecret,
  //   appearance,
  // };

  return (
    <div className="Stripe">
      {displayRazorpay && (
        <>
        <h1>aaaaaaaa</h1>
        <RenderRazorpay
        
          amount={orderDetails.amount}
          currency={orderDetails.currency}
          orderId={orderDetails.orderId}
          keyId={process.env.REACT_APP_RAZORPAY_KEY_ID}
          keySecret={process.env.REACT_APP_RAZORPAY_KEY_SECRET}
        />
        </>
      )}
    </div>
  );
}
