import * as paymentController from '../mobile/paymentController.js';

// Reusing mobile logic for payments as the logic for ZaloPay/VNPay is mostly the same,
// just need to ensure the returnUrl/callbackUrl works for web as well.

export const createVNPayPayment = paymentController.createVNPayPayment;
export const vnpayReturn = paymentController.vnpayReturn;
export const createZaloPay = paymentController.createZaloPay;
export const zaloPayCallback = paymentController.zaloPayCallback;
