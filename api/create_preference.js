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
        const preference = {
            items: [
                {
                    title: req.body.title,
                    unit_price: Number(req.body.price),
                    quantity: Number(req.body.quantity),
                }
            ],
            back_urls: {
                success: `${req.headers.origin}/success`,
                failure: `${req.headers.origin}/failure`,
                pending: `${req.headers.origin}/pending`
            },
            auto_return: 'approved',
        };

        console.log('Preferência criada:', preference);

        const response = await mercadopago.preferences.create(preference);
        console.log('Resposta do Mercado Pago:', response.body);
        res.json({ id: response.body.id });
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ error: 'Erro ao criar preferência', details: error.message });
    }
};
