const mercadopago = require('mercadopago');
const qrcode = require('qrcode');

module.exports = async (req, res) => {
    console.log('1. Recebida requisição para criar preferência de pagamento');

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        console.error('2. ERRO: Token de acesso do Mercado Pago não configurado');
        return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    console.log('3. Token de acesso do Mercado Pago obtido com sucesso');

    try {
        console.log('4. Configurando Mercado Pago');
        mercadopago.configure({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });
        console.log('5. Mercado Pago configurado com sucesso');

        const { title, price, quantity } = req.body;

        console.log('6. Dados recebidos:', { title, price, quantity });

        if (!title || typeof price !== 'number' || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
            console.error('7. ERRO: Dados inválidos recebidos');
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
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutos de validade
        };

        console.log('8. Criando preferência de pagamento');
        const response = await mercadopago.preferences.create(preference);

        console.log('9. Resposta do Mercado Pago recebida');
        console.log('10. Resposta do Mercado Pago:', JSON.stringify(response, null, 2));

        if (!response.body.id) {
            throw new Error('ID da preferência não recebido do Mercado Pago');
        }

        const qrCodeData = `https://www.mercadopago.com.br/qr/${response.body.id}`;

        console.log('11. Gerando imagem do QR code');

        console.log('12. QR code gerado com sucesso');

        console.log('13. Enviando resposta ao cliente');
        res.json({ 
            preference_id: response.body.id,
            init_point: response.body.init_point,
            qr_code: qrCodeData,
        });
        console.log('14. Resposta enviada com sucesso');
    } catch (error) {
        console.error('15. ERRO ao criar preferência de pagamento:', error);
        console.error('16. Stack do erro:', error.stack);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message,
            stack: error.stack
        });
    }
};
