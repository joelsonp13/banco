const mercadopago = require('mercadopago');
const qrcode = require('qrcode');

module.exports = async (req, res) => {
    console.log('1. Recebida requisição para criar QR code de pagamento');

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

        console.log('8. Criando QR code de pagamento');
        const qrCodeResponse = await mercadopago.qr.create({
            external_reference: "QR_CODE_PAYMENT",
            items: [
                {
                    title: title,
                    unit_price: Number(price),
                    quantity: Number(quantity),
                    currency_id: "BRL"
                }
            ],
            total_amount: Number(price) * Number(quantity),
            description: `Pagamento para ${title}`,
            expiration_date: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutos de validade
        });

        console.log('9. Resposta do Mercado Pago recebida');
        console.log('10. Resposta do Mercado Pago:', JSON.stringify(qrCodeResponse, null, 2));

        if (!qrCodeResponse.qr_data) {
            throw new Error('QR code data não recebido do Mercado Pago');
        }

        console.log('11. Gerando imagem do QR code');
        const qrCodeBase64 = await qrcode.toDataURL(qrCodeResponse.qr_data);

        console.log('12. QR code gerado com sucesso');

        console.log('13. Enviando resposta ao cliente');
        res.json({ 
            qr_code: qrCodeResponse.qr_data,
            qr_code_base64: qrCodeBase64.split(',')[1], // Remove o prefixo "data:image/png;base64,"
        });
        console.log('14. Resposta enviada com sucesso');
    } catch (error) {
        console.error('15. ERRO ao criar QR code de pagamento:', error);
        console.error('16. Stack do erro:', error.stack);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message,
            stack: error.stack
        });
    }
};
