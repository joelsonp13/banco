const mercadopago = require('mercadopago');

module.exports = async (req, res) => {
    console.log('Recebida requisição para criar preferência');

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        console.error('Token de acesso do Mercado Pago não configurado');
        return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    mercadopago.configure({
        access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
    });

    try {
        const { title, price, quantity } = req.body;

        console.log('Dados recebidos:', { title, price, quantity });

        if (!title || typeof price !== 'number' || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
            console.error('Dados inválidos recebidos');
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

        console.log('Criando preferência:', preference);

        const response = await mercadopago.preferences.create(preference);

        console.log('Resposta do Mercado Pago:', JSON.stringify(response.body, null, 2));

        let qrCode = null;
        let qrCodeBase64 = null;
        let initPoint = response.body.init_point;

        if (response.body.point_of_interaction && response.body.point_of_interaction.transaction_data) {
            qrCode = response.body.point_of_interaction.transaction_data.qr_code;
            qrCodeBase64 = response.body.point_of_interaction.transaction_data.qr_code_base64;
        }

        res.json({ 
            id: response.body.id,
            init_point: initPoint,
            qr_code: qrCode,
            qr_code_base64: qrCodeBase64,
            full_response: response.body // Adicionando a resposta completa para diagnóstico
        });
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message,
            stack: error.stack
        });
    }
};
