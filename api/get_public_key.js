module.exports = async (req, res) => {
    console.log('Tentando obter a chave pública do Mercado Pago...');

    if (!process.env.MERCADO_PAGO_PUBLIC_KEY) {
        console.error('ERRO: Chave pública do Mercado Pago não configurada');
        return res.status(500).json({ error: 'Chave pública do Mercado Pago não configurada' });
    }

    console.log('Chave pública do Mercado Pago obtida com sucesso');
    res.json({ publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY });
};
