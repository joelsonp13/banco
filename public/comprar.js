document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedData = urlParams.get('data');
    
    if (!encryptedData) {
        window.location.href = 'principal.html';
        return;
    }

    const product = JSON.parse(atob(encryptedData));
    displayProductDetails(product);

    const generateQRCodeButton = document.getElementById('generateQRCode');
    generateQRCodeButton.addEventListener('click', () => generateQRCode(product));
});

function displayProductDetails(product) {
    const productDetails = document.getElementById('productDetails');
    productDetails.innerHTML = `
        <h2 class="text-3xl font-bold text-blue-400 mb-4">${product.name}</h2>
        <img src="${product.image}" alt="${product.name}" class="w-full max-w-md mx-auto mb-4 rounded-lg">
        <p class="text-2xl font-bold text-green-500 mb-2">R$ ${product.currentPrice.toFixed(2)}</p>
        <p class="text-lg text-gray-300 mb-4">${product.description}</p>
        <p class="text-md text-gray-400">Categoria: ${product.category}</p>
    `;
}

async function generateQRCode(product) {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    qrCodeContainer.innerHTML = 'Gerando QR Code...';

    try {
        const response = await fetch('/api/create_preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: product.name,
                price: product.currentPrice,
                quantity: 1
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Erro ao criar preferência de pagamento: ${data.error}`);
        }

        if (data.qr_code_data) {
            qrCodeContainer.innerHTML = '';
            const qrCodeImg = document.createElement('img');
            qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qr_code_data)}`;
            qrCodeImg.alt = 'QR Code de Pagamento';
            qrCodeContainer.appendChild(qrCodeImg);

            const instructionText = document.createElement('p');
            instructionText.textContent = 'Escaneie este QR code com o aplicativo do Mercado Pago para realizar o pagamento.';
            instructionText.className = 'mt-4 text-blue-300';
            qrCodeContainer.appendChild(instructionText);

            const pixCodeText = document.createElement('p');
            pixCodeText.textContent = `Código PIX: ${data.qr_code_data}`;
            pixCodeText.className = 'mt-2 text-sm text-gray-400';
            qrCodeContainer.appendChild(pixCodeText);
        } else {
            qrCodeContainer.innerHTML = 'QR Code não disponível';
        }
    } catch (error) {
        console.error('Erro:', error);
        qrCodeContainer.innerHTML = `Erro ao gerar QR Code: ${error.message}`;
    }
}

