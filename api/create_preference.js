const mercadopago = require('mercadopago');
const qrcode = require('qrcode');

module.exports = async (req, res) => {
    console.log('1. Recebida requisição para criar preferência');

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        console.error('2. ERRO: Token de acesso do Mercado Pago não configurado');
        return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    console.log('3. Token de acesso do Mercado Pago obtido com sucesso');
    console.log('4. Primeiros 10 caracteres do token:', process.env.MERCADO_PAGO_ACCESS_TOKEN.substring(0, 10) + '...');

    try {
        console.log('5. Configurando Mercado Pago');
        mercadopago.configure({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });
        console.log('6. Mercado Pago configurado com sucesso');

        const { title, price, quantity } = req.body;

        console.log('7. Dados recebidos:', { title, price, quantity });

        if (!title || typeof price !== 'number' || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
            console.error('8. ERRO: Dados inválidos recebidos');
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

        console.log('9. Criando preferência:', preference);

        const response = await mercadopago.preferences.create(preference);

        console.log('10. Resposta do Mercado Pago recebida');
        console.log('11. Resposta do Mercado Pago:', JSON.stringify(response.body, null, 2));

        console.log('12. Gerando QR code para pagamento');
        const qrCodeResponse = await mercadopago.qr.create({
            external_reference: response.body.id,
            amount: Number(price),
            description: title,
        });

        console.log('13. Resposta do QR code:', JSON.stringify(qrCodeResponse, null, 2));

        const qrCodeBase64 = await qrcode.toDataURL(qrCodeResponse.qr_data);
        console.log('14. QR code gerado com sucesso');

        console.log('15. Enviando resposta ao cliente');
        res.json({ 
            id: response.body.id,
            init_point: response.body.init_point,
            qr_code: qrCodeResponse.qr_data,
            qr_code_base64: qrCodeBase64.split(',')[1], // Remove o prefixo "data:image/png;base64,"
        });
        console.log('16. Resposta enviada com sucesso');
    } catch (error) {
        console.error('17. ERRO ao criar preferência ou QR code:', error);
        console.error('18. Stack do erro:', error.stack);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message,
            stack: error.stack
        });
    }
};
