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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}, details: ${errorData.details}`);
        }

        const data = await response.json();

        // Exibir o QR code
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        qrCodeContainer.innerHTML = `<img src="${data.qr_code}" alt="QR Code para pagamento">`;

    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        alert(`Ocorreu um erro ao gerar o QR Code. Por favor, tente novamente. Detalhes: ${error.message}`);
    }
});
