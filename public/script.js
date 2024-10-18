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

        console.log('Enviando requisição para criar preferência de pagamento...');
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
            throw new Error(`Erro ao criar preferência de pagamento: ${errorData.error}\nDetalhes: ${errorData.details}`);
        }

        const data = await response.json();
        console.log('Resposta completa do servidor:', data);

        qrCodeContainer.innerHTML = '';

        if (data.qr_code_base64) {
            console.log('QR Code base64 recebido, exibindo imagem...');
            const qrCodeImg = document.createElement('img');
            qrCodeImg.src = `data:image/png;base64,${data.qr_code_base64}`;
            qrCodeImg.alt = 'QR Code de Pagamento';
            qrCodeContainer.appendChild(qrCodeImg);

            const linkElement = document.createElement('a');
            linkElement.href = data.init_point;
            linkElement.target = '_blank';
            linkElement.textContent = 'Abrir página de pagamento';
            qrCodeContainer.appendChild(document.createElement('br'));
            qrCodeContainer.appendChild(linkElement);
        } else {
            console.log('Nenhum QR Code recebido');
            qrCodeContainer.innerHTML = 'QR Code não disponível';
        }

    } catch (error) {
        console.error('Erro:', error);
        qrCodeContainer.innerHTML = `Erro ao gerar QR Code: ${error.message}`;
    }
});
