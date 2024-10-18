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

        console.log('Resposta do Mercado Pago:', response.body);

        // Gerar o QR code para pagamento
        let qrCodeUrl = response.body.init_point;
        let qrCodeBase64 = null;

        if (mercadopago.qr && typeof mercadopago.qr.create === 'function') {
            try {
                const qrResponse = await mercadopago.qr.create({
                    file_type: "image/png",
                    size: 500,
                    preference_id: response.body.id
                });
                qrCodeBase64 = qrResponse.response.qr;
            } catch (qrError) {
                console.error('Erro ao gerar QR code:', qrError);
            }
        } else {
            console.warn('mercadopago.qr.create não está disponível. Usando URL padrão.');
        }

        res.json({ 
            id: response.body.id,
            qr_code_base64: qrCodeBase64,
            qr_code_url: qrCodeUrl
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
