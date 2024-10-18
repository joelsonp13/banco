const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

module.exports = async (req, res) => {
    const { title, price, quantity, userEmail } = req.body;

    if (!title || !price || !quantity || !userEmail) {
        return res.status(400).json({ error: 'Título, preço, quantidade e e-mail do usuário são obrigatórios' });
    }

    try {
        const preference = {
            items: [
                {
                    title: title,
                    unit_price: parseFloat(price),
                    quantity: parseInt(quantity),
                }
            ],
            payer: {
                email: userEmail,
            },
            payment_methods: {
                excluded_payment_types: [
                    { id: "credit_card" },
                    { id: "debit_card" },
                    { id: "ticket" }
                ],
                installments: 1
            },
            back_urls: {
                success: "https://seu-site.com/success",
                failure: "https://seu-site.com/failure",
                pending: "https://seu-site.com/pending"
            },
            auto_return: "approved",
            external_reference: "SUBLYME_" + Date.now(),
            notification_url: "https://seu-site.com/webhook",
        };

        const response = await mercadopago.preferences.create(preference);
        console.log('Resposta do Mercado Pago:', JSON.stringify(response, null, 2));

        if (response.body.id) {
            res.status(200).json({
                preference_id: response.body.id,
                init_point: response.body.init_point,
                sandbox_init_point: response.body.sandbox_init_point
            });
        } else {
            throw new Error('Falha ao criar preferência de pagamento');
        }
    } catch (error) {
        console.error('Erro ao criar preferência de pagamento:', error);
        res.status(500).json({ 
            error: 'Erro ao criar preferência de pagamento',
            details: error.message,
            stack: error.stack
        });
    }
};
