const mercadopago = require('mercadopago');
const qrcode = require('qrcode');

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

        // Gerar QR code manualmente
        const qrCodeData = response.body.init_point;
        const qrCodeBase64 = await qrcode.toDataURL(qrCodeData);

        res.json({ 
            id: response.body.id,
            init_point: response.body.init_point,
            qr_code: qrCodeData,
            qr_code_base64: qrCodeBase64.split(',')[1], // Remove o prefixo "data:image/png;base64,"
            // Remova a linha abaixo para não enviar a resposta completa
            // full_response: response.body
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
