const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_KEYSECRET,
});

const paymentService = {
    createOrder: async (amount, currency = 'INR', receipt = 'receipt_' + Date.now()) => {
        try {
            const options = {
                amount: amount * 100, // amount in the smallest currency unit (paise for INR)
                currency,
                receipt,
            };
            const order = await razorpay.orders.create(options);
            return { success: true, order };
        } catch (error) {
            console.error('Razorpay order creation failed:', error);
            return { success: false, error: error.message };
        }
    },

    verifyPayment: (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEYSECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            return { success: true };
        } else {
            return { success: false };
        }
    }
};

module.exports = paymentService;
