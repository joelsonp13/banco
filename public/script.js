document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Tentando obter a chave pública do Mercado Pago...');
        const response = await fetch('/api/get_public_key');
        const data = await response.json();
        
        if (data.error) {
            console.error('Erro ao obter a chave pública:', data.error);
        } else {
            window.mercadoPagoPublicKey = data.publicKey;
            console.log('Chave pública do Mercado Pago obtida com sucesso');
        }
    } catch (error) {
        console.error('Erro ao obter a chave pública:', error);
    }

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

        console.log('Enviando requisição para criar preferência...');
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
        console.log('Resposta completa do servidor:', data);

        qrCodeContainer.innerHTML = '';

        if (data.qr_code_base64) {
            console.log('QR Code base64 recebido, exibindo imagem...');
            const qrCodeImg = document.createElement('img');
            qrCodeImg.src = `data:image/png;base64,${data.qr_code_base64}`;
            qrCodeImg.alt = 'QR Code';
            qrCodeContainer.appendChild(qrCodeImg);
        } else if (data.qr_code) {
            console.log('QR Code string recebido, gerando imagem...');
            const qr = qrcode(0, 'L');
            qr.addData(data.qr_code);
            qr.make();
            qrCodeContainer.innerHTML = qr.createImgTag(5);
        } else {
            console.log('Nenhum QR Code recebido');
            qrCodeContainer.innerHTML = 'QR Code não disponível';
        }

        // Adicionar link de pagamento
        if (data.init_point) {
            const linkElement = document.createElement('p');
            linkElement.innerHTML = `<a href="${data.init_point}" target="_blank">Abrir link do pagamento</a>`;
            qrCodeContainer.appendChild(linkElement);
        } else {
            console.log('Link de pagamento não disponível');
        }

        // Remova esta parte para não exibir a resposta completa na página
        // const responseElement = document.createElement('pre');
        // responseElement.textContent = JSON.stringify(data.full_response, null, 2);
        // qrCodeContainer.appendChild(responseElement);

    } catch (error) {
        console.error('Erro:', error);
        qrCodeContainer.innerHTML = `Erro ao gerar QR Code: ${error.message}`;
    }
});
