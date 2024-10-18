module.exports = async (req, res) => {
    console.log('Verificando o token de acesso do Mercado Pago...');

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        console.error('ERRO: Token de acesso do Mercado Pago não configurado');
        return res.status(500).json({ error: 'Token de acesso do Mercado Pago não configurado' });
    }

    console.log('Token de acesso do Mercado Pago verificado com sucesso');
    res.json({ success: true });
};
