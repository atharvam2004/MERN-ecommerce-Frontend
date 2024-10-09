// import React, { useEffect, useState } from "react";
// import {
//   PaymentElement,
//   useStripe,
//   useElements,
// } from "@stripe/react-stripe-js";
// import { useSelector } from "react-redux";
// import { selectCurrentOrder } from "../features/order/orderSlice";

// export default function RenderRazorpay() {
//   const stripe = useStripe();
//   const elements = useElements();
//   const currentOrder = useSelector(selectCurrentOrder);

//   const [message, setMessage] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (!stripe) {
//       return;
//     }

//     const clientSecret = new URLSearchParams(window.location.search).get(
//       "payment_intent_client_secret"
//     );

//     if (!clientSecret) {
//       return;
//     }

//     stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
//       switch (paymentIntent.status) {
//         case "succeeded":
//           setMessage("Payment succeeded!");
//           break;
//         case "processing":
//           setMessage("Your payment is processing.");
//           break;
//         case "requires_payment_method":
//           setMessage("Your payment was not successful, please try again.");
//           break;
//         default:
//           setMessage("Something went wrong.");
//           break;
//       }
//     });
//   }, [stripe]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!stripe || !elements) {
//       // Stripe.js hasn't yet loaded.
//       // Make sure to disable form submission until Stripe.js has loaded.
//       return;
//     }

//     setIsLoading(true);

//     const { error } = await stripe.confirmPayment({
//       elements,
//       confirmParams: {
//         // Make sure to change this to your payment completion page
//         return_url: `https://mern-ecommerce-lyart.vercel.app/order-success/${currentOrder.id}`,
//       },
//     });

//     // This point will only be reached if there is an immediate error when
//     // confirming the payment. Otherwise, your customer will be redirected to
//     // your `return_url`. For some payment methods like iDEAL, your customer will
//     // be redirected to an intermediate site first to authorize the payment, then
//     // redirected to the `return_url`.
//     if (error.type === "card_error" || error.type === "validation_error") {
//       setMessage(error.message);
//     } else {
//       setMessage("An unexpected error occurred.");
//     }

//     setIsLoading(false);
//   };

//   const paymentElementOptions = {
//     layout: "tabs",
//   };

//   return (
//     <form id="payment-form" onSubmit={handleSubmit}>
//       <PaymentElement id="payment-element" options={paymentElementOptions} />
//       <button disabled={isLoading || !stripe || !elements} id="submit">
//         <span id="button-text">
//           {isLoading ? <div className="spinner" id="spinner"></div> : "Pay now"}
//         </span>
//       </button>
//       {/* Show any error or success messages */}
//       {message && <div id="payment-message">{message}</div>}
//     </form>
//   );
// }

import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import crypto from 'crypto-js';   
import { selectCurrentOrder } from "../features/order/orderSlice";
import { useSelector } from 'react-redux';

// Function to load script and append in DOM tree.
const loadScript = src => new Promise((resolve) => {
  const script = document.createElement('script');
  script.src = src;
  script.onload = () => {
    console.log('razorpay loaded successfully');
    resolve(true);
  };
  script.onerror = () => {
    console.log('error in loading razorpay');
    resolve(false);
  };
  document.body.appendChild(script);
});


const RenderRazorpay = ({
  orderId,
  keyId,
  keySecret,
  currency,
  amount,
}) => {
  const paymentId = useRef(null);
  const paymentMethod = useRef(null);
  const currentOrder = useSelector(selectCurrentOrder);

  // To load razorpay checkout modal script.
  const displayRazorpay = async () => {
    const res = await loadScript(
      'https://checkout.razorpay.com/v1/checkout.js',
    );

    if (!res) {
      console.log('Razorpay SDK failed to load. Are you online?');
      return;
    }
    const response = await fetch("/create-payment-intent", {
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
    }).then((t) =>
			t.json()
		)

    console.log("sada",response)
      const options = {
        key: keyId, // key id from props
        amount:(response.amount*100).toString(), // Amount in lowest denomination from props
        currency:"INR", // Currency from props.
        name: 'Dukaan', // Title for your organization to display in checkout modal
        // image, // custom logo  url
        order_id: response.orderId, // order id from props
        // This handler menthod is always executed in case of succeeded payment
        handler: (response) => {
          console.log('succeeded');
          console.log(response);
          paymentId.current = response.razorpay_payment_id;
    
          // Most important step to capture and authorize the payment. This can be done of Backend server.
          const succeeded = crypto.HmacSHA256(`${orderId}|${response.razorpay_payment_id}`, keySecret).toString() === response.razorpay_signature;
    
          // If successfully authorized. Then we can consider the payment as successful.
          if (succeeded) {
            handlePayment('succeeded', {
              orderId,
              paymentId,
              signature: response.razorpay_signature,
            });
          } else {
            handlePayment('failed', {
              orderId,
              paymentId: response.razorpay_payment_id,
            });
          }
        },
        callback_url : "https://dukaan-mern.onrender.com/payment",
        modal: {
          confirm_close: true, // this is set to true, if we want confirmation when clicked on cross button.
          // This function is executed when checkout modal is closed
          // There can be 3 reasons when this modal is closed.
          ondismiss: async (reason) => {
            const {
              reason: paymentReason, field, step, code,
            } = reason && reason.error ? reason.error : {};
            // Reason 1 - when payment is cancelled. It can happend when we click cross icon or cancel any payment explicitly. 
            if (reason === undefined) {
              console.log('cancelled');
              handlePayment('Cancelled');
            } 
            // Reason 2 - When modal is auto closed because of time out
            else if (reason === 'timeout') {
              console.log('timedout');
              handlePayment('timedout');
            } 
            // Reason 3 - When payment gets failed.
            else {
              console.log('failed');
              handlePayment('failed', {
                paymentReason, field, step, code,
              });
            }
          },
        },
        // This property allows to enble/disable retries.
        // This is enabled true by default. 
        retry: {
          enabled: false,
        },
        timeout: 900, // Time limit in Seconds
        theme: {
          color: '', // Custom color for your checkout modal.
        },
      };
    // All information is loaded in options which we will discuss later.
    const rzp1 = new window.Razorpay(options);

    // If you want to retreive the chosen payment method.
    rzp1.on('payment.submit', (response) => {
      paymentMethod.current = response.method;
    });

    // To get payment id in case of failed transaction.
    rzp1.on('payment.failed', (response) => {
      paymentId.current = response.error.metadata.payment_id;
    });

    // to open razorpay checkout modal.
    rzp1.open();
  };


  // informing server about payment
  const handlePayment = async (status, orderDetails = {}) => {
    try {
      const response = await fetch(`/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          orderDetails,
        }),
      });

      const result = await response.json();
      console.log('Payment handled successfully:', result);
    } catch (error) {
      console.error('Error handling payment:', error);
    }
  };


  // we will be filling this object in next step.

  useEffect(() => {
    console.log('in razorpay');
    displayRazorpay();
  }, []);

  return null;
};

export default RenderRazorpay;