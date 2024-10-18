const mercadopago = require('mercadopago');

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

        // Função para formatar a data no formato correto
        function formatDate(date) {
            return date.toISOString().replace('Z', '-03:00');
        }

        const now = new Date();
        const expirationDate = new Date(now.getTime() + 30 * 60000); // 30 minutos a partir de agora

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
            expiration_date_from: formatDate(now),
            expiration_date_to: formatDate(expirationDate),
        };

        console.log('8. Criando preferência de pagamento');
        const response = await mercadopago.preferences.create(preference);

        console.log('9. Resposta do Mercado Pago recebida');
        console.log('10. Resposta do Mercado Pago:', JSON.stringify(response.body, null, 2));

        if (!response.body.id) {
            throw new Error('ID da preferência não recebido do Mercado Pago');
        }

        // Obter o QR code do Mercado Pago
        console.log('11. Obtendo QR code do Mercado Pago');
        const qrResponse = await mercadopago.qr.create({
            file_type: 'image/png',
            size: 500,
            preference_id: response.body.id
        });

        console.log('12. QR code obtido com sucesso');

        console.log('13. Enviando resposta ao cliente');
        res.json({ 
            preference_id: response.body.id,
            init_point: response.body.init_point,
            qr_code_base64: qrResponse.base64
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
