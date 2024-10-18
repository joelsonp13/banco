const mp = new MercadoPago('APP_USR-c8f7ccb0-e15e-4b43-9a96-33ee147bb9e6');

document.getElementById('buyButton').addEventListener('click', async () => {
    try {
        const price = parseFloat(document.getElementById('productPrice').value);
        
        if (isNaN(price) || price <= 0) {
            alert('Por favor, insira um valor válido para o produto.');
            return;
        }

        const response = await fetch('/api/create_preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: 'Produto de Teste',
                price: price,
                quantity: 1
            }),
        });

        const preference = await response.json();

        const qrCode = await mp.bricks().create("wallet", "qrCodeContainer", {
            initialization: {
                preferenceId: preference.id
            }
        });
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
    }
});
