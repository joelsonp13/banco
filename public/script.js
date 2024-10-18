document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Verificando o token de acesso do Mercado Pago...');
        const response = await fetch('/api/check_access_token');
        const data = await response.json();
        
        if (data.error) {
            console.error('Erro ao verificar o token de acesso:', data.error);
        } else {
            console.log('Token de acesso do Mercado Pago verificado com sucesso');
        }
    } catch (error) {
        console.error('Erro ao verificar o token de acesso:', error);
    }
});

document.getElementById('buyButton').addEventListener('click', async () => {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    qrCodeContainer.innerHTML = 'Gerando QR Code...';

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
            throw new Error(`Erro ao criar preferência de pagamento: ${errorData.error}`);
        }

        const data = await response.json();

        if (data.qr_code_url) {
            qrCodeContainer.innerHTML = ''; // Limpa o conteúdo anterior
            const qrCodeImg = document.createElement('img');
            qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qr_code_url)}`;
            qrCodeImg.alt = 'QR Code de Pagamento';
            qrCodeContainer.appendChild(qrCodeImg);
        } else {
            qrCodeContainer.innerHTML = 'QR Code não disponível';
        }

    } catch (error) {
        console.error('Erro:', error);
        qrCodeContainer.innerHTML = `Erro ao gerar QR Code: ${error.message}`;
    }
});
