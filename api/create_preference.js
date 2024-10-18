const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

module.exports = async (req, res) => {
    const { title, price, quantity } = req.body;

    if (!title || !price || !quantity) {
        return res.status(400).json({ error: 'Título, preço e quantidade são obrigatórios' });
    }

    try {
        const payment = await mercadopago.payment.create({
            transaction_amount: parseFloat(price),
            description: title,
            payment_method_id: 'pix',
            payer: {
                email: 'test@test.com',
            }
        });

        console.log('Resposta do Mercado Pago:', JSON.stringify(payment, null, 2));

        if (payment.response.status === 'rejected') {
            console.error('Pagamento rejeitado:', payment.response);
            return res.status(400).json({ 
                error: 'Pagamento rejeitado pelo PSP do recebedor',
                details: payment.response.status_detail,
                fullResponse: payment.response
            });
        }

        res.status(200).json({
            qr_code_data: payment.response.point_of_interaction.transaction_data.qr_code,
            payment_id: payment.response.id
        });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        res.status(500).json({ 
            error: 'Erro ao criar pagamento',
            details: error.message,
            stack: error.stack
        });
    }
};
