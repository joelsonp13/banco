const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

module.exports = async (req, res) => {
    const { title, price, quantity } = req.body;

    if (!title || !price || !quantity) {
        return res.status(400).json({ error: 'Título, preço e quantidade são obrigatórios' });
    }

    const preferenceData = {
        items: [
            {
                title: title,
                quantity: parseInt(quantity),
                currency_id: 'BRL',
                unit_price: parseFloat(price)
            }
        ],
        payment_methods: {
            excluded_payment_methods: [
                { id: "credit_card" },
                { id: "debit_card" }
            ],
            excluded_payment_types: [
                { id: "ticket" }
            ]
        },
        binary_mode: true
    };

    try {
        const preference = await mercadopago.preferences.create(preferenceData);
        const payment = await mercadopago.payment.create({
            transaction_amount: parseFloat(price),
            description: title,
            payment_method_id: 'pix',
            payer: {
                email: 'test@test.com',
            }
        });

        if (payment.body.status === 'rejected') {
            console.error('Pagamento rejeitado:', payment.body);
            return res.status(400).json({ 
                error: 'Pagamento rejeitado pelo PSP do recebedor',
                details: payment.body.status_detail
            });
        }

        res.status(200).json({
            qr_code_data: payment.body.point_of_interaction.transaction_data.qr_code,
            payment_id: payment.body.id
        });
    } catch (error) {
        console.error('Erro ao criar preferência de pagamento:', error);
        res.status(500).json({ 
            error: 'Erro ao criar preferência de pagamento',
            details: error.message
        });
    }
};
