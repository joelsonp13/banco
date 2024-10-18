const mercadopago = require('mercadopago');

module.exports = async (req, res) => {
    console.log('1. Recebida requisição para criar preferência de pagamento');

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        console.error('2. ERRO: Token de acesso do Mercado Pago não configurado');
        return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    try {
        console.log('3. Configurando Mercado Pago');
        mercadopago.configure({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });

        const { title, price, quantity } = req.body;
        console.log('4. Dados recebidos:', { title, price, quantity });

        if (!title || typeof price !== 'number' || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
            console.error('5. ERRO: Dados inválidos');
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        console.log('6. Criando preferência');
        const preferenceData = {
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

        console.log('7. Enviando preferência para o Mercado Pago');
        const preference = await mercadopago.preferences.create(preferenceData);
        console.log('8. Resposta do Mercado Pago:', preference);

        if (!preference.body.id) {
            throw new Error('ID da preferência não recebido do Mercado Pago');
        }

        console.log('9. Gerando QR code');
        const payment = await mercadopago.payment.create({
            transaction_amount: price,
            description: title,
            payment_method_id: 'pix',
            payer: {
                email: 'test@test.com'
            }
        });
        console.log('10. Resposta do QR code:', payment);

        if (!payment.body || !payment.body.point_of_interaction || !payment.body.point_of_interaction.transaction_data || !payment.body.point_of_interaction.transaction_data.qr_code) {
            throw new Error('Dados do QR code não recebidos do Mercado Pago');
        }

        console.log('11. Enviando resposta ao cliente');
        res.status(200).json({
            qr_code_data: payment.body.point_of_interaction.transaction_data.qr_code,
            payment_id: payment.body.id
        });
    } catch (error) {
        console.error('Erro ao criar preferência de pagamento:', error);
        res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
    }
};
