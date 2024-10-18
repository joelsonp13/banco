document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/get_public_key');
        const data = await response.json();
        window.mercadoPagoPublicKey = data.publicKey;
    } catch (error) {
        console.error('Erro ao obter a chave pública:', error);
    }
});

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
            throw new Error(`Erro ao criar preferência: ${errorData.error}\nDetalhes: ${errorData.details}`);
        }

        const data = await response.json();

        const qrCodeContainer = document.getElementById('qrCodeContainer');
        qrCodeContainer.innerHTML = '';

        if (data.qr_code_base64) {
            // Exibir o QR code se disponível
            qrCodeContainer.innerHTML = `<img src="data:image/png;base64,${data.qr_code_base64}" alt="QR Code">`;
        }

        // Adicionar link abaixo do QR code
        const linkElement = document.createElement('p');
        linkElement.innerHTML = `<a href="${data.qr_code}" target="_blank">Abrir link do pagamento</a>`;
        qrCodeContainer.appendChild(linkElement);

    } catch (error) {
        console.error('Erro:', error);
        alert(`Ocorreu um erro. Por favor, tente novamente.\n\nDetalhes: ${error.message}`);
    }
});
