const mercadopago = require('mercadopago');

module.exports = async (req, res) => {
    console.log('Recebida requisição para criar preferência');
    console.log('Access Token:', process.env.MERCADO_PAGO_ACCESS_TOKEN);

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        console.error('Access Token não configurado');
        return res.status(500).json({ error: 'Access Token não configurado' });
    }

    mercadopago.configure({
        access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
    });

    try {
        console.log('Dados recebidos:', req.body);

        const preference = {
            items: [
                {
                    title: req.body.title,
                    unit_price: Number(req.body.price),
                    quantity: Number(req.body.quantity),
                }
            ],
            payment_methods: {
                excluded_payment_types: [
                    { id: "credit_card" }
                ],
                installments: 1
            },
            external_reference: "QR_CODE_PAYMENT",
            binary_mode: true
        };

        console.log('Preferência criada:', preference);

        const response = await mercadopago.preferences.create(preference);
        console.log('Resposta do Mercado Pago:', response.body);

        res.json({ 
            id: response.body.id,
            init_point: response.body.init_point
        });
    } catch (error) {
        console.error('Erro detalhado:', error);
        res.status(500).json({ error: 'Erro ao criar preferência', details: error.message, stack: error.stack });
    }
};
