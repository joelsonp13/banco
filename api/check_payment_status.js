const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

module.exports = async (req, res) => {
    const { payment_id } = req.query;

    if (!payment_id) {
        return res.status(400).json({ error: 'Payment ID is required' });
    }

    try {
        const payment = await mercadopago.payment.get(payment_id);
        console.log('Resposta do Mercado Pago:', JSON.stringify(payment, null, 2)); // Adicione este log

        res.status(200).json({ 
            status: payment.body.status,
            status_detail: payment.body.status_detail
        });
    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        res.status(500).json({ error: 'Erro ao verificar status do pagamento' });
    }
};
