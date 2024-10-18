document.addEventListener('DOMContentLoaded', () => {
    // Inicializar o efeito de fundo Vanta.js
    VANTA.NET({
        el: "#vanta-background",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x0000ff,
        backgroundColor: 0x000000,
        points: 20.00,
        maxDistance: 30.00,
        spacing: 15.00
    });

    // Implementar o cursor personalizado
    const cursor = document.querySelector('.custom-cursor');
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
    });

    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
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
        } else {
            window.location.href = 'login.html';
        }
    });
});

function displayProductDetails(product) {
    const productDetails = document.getElementById('productDetails');
    productDetails.innerHTML = `
        <h2 class="text-3xl font-bold text-blue-400 mb-4">${product.name}</h2>
        <img src="${product.imageUrl}" alt="${product.name}" class="w-full max-w-md mx-auto mb-4 rounded-lg">
        <p class="text-2xl font-bold text-green-500 mb-2">R$ ${product.currentPrice.toFixed(2)}</p>
        <p class="text-lg text-gray-300 mb-4">${product.description}</p>
        <p class="text-md text-gray-400">Categoria: ${product.category || 'Não especificada'}</p>
    `;
    gsap.from(productDetails, {duration: 0.5, opacity: 0, y: 20, ease: "power2.out"});
}

async function generateQRCode(product) {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    qrCodeContainer.innerHTML = '<p class="text-blue-300">Gerando QR Code...</p>';

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

        if (data.qr_code_data && data.payment_id) {
            qrCodeContainer.innerHTML = `
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qr_code_data)}" alt="QR Code de Pagamento" class="mb-4">
                <p class="text-blue-300 mb-2">Escaneie este QR code com o aplicativo do Mercado Pago para realizar o pagamento.</p>
                <p class="text-sm text-gray-400 bg-gray-800 p-2 rounded">Código PIX: ${data.qr_code_data}</p>
            `;
            gsap.from(qrCodeContainer.children, {duration: 0.5, opacity: 0, y: 20, stagger: 0.1, ease: "power2.out"});
            
            // Iniciar verificação do status do pagamento
            checkPaymentStatus(data.payment_id);
        } else {
            qrCodeContainer.innerHTML = '<p class="text-red-500">QR Code não disponível. Por favor, tente novamente.</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        qrCodeContainer.innerHTML = `<p class="text-red-500">Erro ao gerar QR Code: ${error.message}</p>`;
    }
}

async function checkPaymentStatus(paymentId) {
    const statusCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/check_payment_status?payment_id=${paymentId}`);
            const data = await response.json();

            if (data.status === 'approved') {
                clearInterval(statusCheckInterval);
                showPaymentConfirmation();
            }
        } catch (error) {
            console.error('Erro ao verificar status do pagamento:', error);
        }
    }, 5000); // Verifica a cada 5 segundos
}

function showPaymentConfirmation() {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    qrCodeContainer.innerHTML = `
        <div class="bg-green-500 text-white p-4 rounded-lg text-center">
            <h3 class="text-2xl font-bold mb-2">PIX Confirmado!</h3>
            <p>Seu pagamento foi processado com sucesso.</p>
        </div>
    `;
    gsap.from(qrCodeContainer.children, {duration: 0.5, opacity: 0, y: 20, ease: "power2.out"});
}
