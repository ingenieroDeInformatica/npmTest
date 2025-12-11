// checkout.routes.js
const express = require('express');
const braintree = require('braintree');
const dotenv = require("dotenv").config();

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BT_MERCHANT_ID,
  publicKey: process.env.BT_PUBLIC_KEY,
  privateKey: process.env.BT_PRIVATE_KEY,
});

const router = express.Router();



// GET /checkout/token → returns client token
router.get('/token', (req, res) => {
    // console.log("Arrived.", res); //-- This is reached.
  gateway.clientToken.generate({}, (err, response) => {
    if (err) return res.status(500).send(err);
    res.send(response.clientToken);
  });
});

router.post('/vault', express.json(), (req, res) => {
  const { paymentMethodNonce } = req.body;

  gateway.customer.create({
    firstName: "Vault",
    lastName: "Only",
    paymentMethodNonce
  }, (err, result) => {
    if (err || !result.success) {
      return res.status(500).send({ error: err || result.message });
    }

    const token = result.customer.paymentMethods[0].token;

    res.send({
      success: true,
      paymentMethodToken: token,
      customerId: result.customer.id,
      result: result
    });
  });
});

// Checkout Only Endpoint --- NO VAULT
router.post('/checkout', express.json(), (req, res) => {
  const { paymentMethodNonce, amount, lineItems } = req.body;

  gateway.transaction.sale({
    amount,
    paymentMethodNonce,
    lineItems: lineItems, 
    options: { submitForSettlement: true }
  }, (err, result) => {
    if (err || !result.success) {
      return res.status(500).send({ error: err || result.message });
    }

    res.send({
      success: true,
      transactionId: result.transaction.id,
      result: result
    });
  });
});

// Checkout with Vault Endpoint
router.post('/vaultWithCheckout', express.json(), (req, res) => {
  const { paymentMethodNonce, amount, lineItems } = req.body;

  gateway.transaction.sale({
    amount,
    paymentMethodNonce,
    lineItems: lineItems, 
    customer: {
      firstName: "Checkout",
      lastName: "WithVault",
      // Optionally include email or ID here:
      // email: "vaultuser@example.com",
      // id: "user-1234"
    },
    options: {
      submitForSettlement: true,
      storeInVaultOnSuccess: true // vaults the method
    }
  }, (err, result) => {
    if (err || !result.success) {
      return res.status(500).send({ error: err || result.message });
    }

    const paymentMethodToken = result.transaction?.creditCard?.token || result.transaction?.paypalAccount?.token;
    // Successful Response which is seen in the NEtwork response for 'vault-and-checkout'
    res.send({
      success: true,
      transactionId: result.transaction.id,
      paymentMethodToken: paymentMethodToken,
      customerID: result.transaction.customer.id,
      result: result
    });
  });
});


module.exports = router;

