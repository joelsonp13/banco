const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

module.exports = async (req, res) => {
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

        const response = await mercadopago.preferences.create(preference);
        res.json({ id: response.body.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar preferência' });
    }
};
