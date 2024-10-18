const mercadopago = require('mercadopago');

module.exports = async (req, res) => {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    mercadopago.configure({
        access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
    });

    try {
        const { title, price, quantity } = req.body;

        if (!title || typeof price !== 'number' || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const preference = {
            items: [
                {
                    title: title,
                    unit_price: Number(price),
                    quantity: Number(quantity),
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

        const response = await mercadopago.preferences.create(preference);

        res.json({ 
            id: response.body.id,
            init_point: response.body.init_point
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
