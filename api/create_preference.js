const mercadopago = require('mercadopago');

module.exports = async (req, res) => {
    console.log('1. Recebida requisição para criar preferência de pagamento');

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        console.error('2. ERRO: Token de acesso do Mercado Pago não configurado');
        return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    try {
        mercadopago.configure({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });

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
        };

        const response = await mercadopago.preferences.create(preference);

        if (!response.body.id) {
            throw new Error('ID da preferência não recebido do Mercado Pago');
        }

        const qrCodeData = await mercadopago.qr.create({
            external_reference: response.body.id,
            amount: Number(price),
            description: title,
        });

        if (!qrCodeData.body || !qrCodeData.body.qr_data) {
            throw new Error('Dados do QR code não recebidos do Mercado Pago');
        }

        res.json({ qr_code_data: qrCodeData.body.qr_data });
    } catch (error) {
        console.error('ERRO ao criar preferência de pagamento:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};
