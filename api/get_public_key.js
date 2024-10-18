module.exports = async (req, res) => {
    if (!process.env.MERCADO_PAGO_PUBLIC_KEY) {
        return res.status(500).json({ error: 'Chave pública do Mercado Pago não configurada' });
    }

    res.json({ publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY });
};
