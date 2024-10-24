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
    qrCodeContainer.innerHTML = '<p class="text-blue-300">Gerando opções de pagamento...</p>';

    try {
        const user = firebase.auth().currentUser;
        const response = await fetch('/api/create_preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: product.name,
                price: product.currentPrice,
                quantity: 1,
                userEmail: user.email
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro detalhado:', data);
            throw new Error(data.error || 'Erro ao criar preferência de pagamento');
        }

        if (data.init_point && data.qr_code_base64) {
            qrCodeContainer.innerHTML = `
                <div class="flex flex-col items-center">
                    <img src="data:image/png;base64,${data.qr_code_base64}" alt="QR Code PIX" class="mb-4 w-48 h-48">
                    <p class="text-sm text-gray-400 mb-4">Escaneie o QR Code acima para pagar via PIX</p>
                    <a href="${data.init_point}" target="_blank" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2">
                        Pagar com Mercado Pago
                    </a>
                    <p class="text-sm text-gray-400 mt-2">Ou clique no botão acima para outras opções de pagamento.</p>
                </div>
            `;
            gsap.from(qrCodeContainer.children, {duration: 0.5, opacity: 0, y: 20, stagger: 0.1, ease: "power2.out"});
            
            // Iniciar verificação do status do pagamento
            checkPaymentStatus(data.payment_id, product); // Passando o produto como segundo argumento
        } else {
            qrCodeContainer.innerHTML = '<p class="text-red-500">Opções de pagamento não disponíveis. Por favor, tente novamente.</p>';
        }
    } catch (error) {
        console.error('Erro completo:', error);
        qrCodeContainer.innerHTML = `
            <p class="text-red-500">Erro ao gerar opções de pagamento: ${error.message}</p>
            <p class="text-sm text-gray-400 mt-2">Por favor, tente novamente mais tarde ou entre em contato com o suporte.</p>
            <p class="text-xs text-gray-500 mt-2">Detalhes técnicos: ${JSON.stringify(error)}</p>
        `;
    }
}

async function checkPaymentStatus(paymentId, product) {
    const statusCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/check_payment_status?payment_id=${paymentId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao verificar status do pagamento');
            }

            console.log('Status do pagamento:', data.status);

            if (data.status === 'approved') {
                clearInterval(statusCheckInterval);
                const purchaseId = await savePurchaseToFirebase(paymentId, product);
                showPaymentConfirmation(purchaseId, product);
                
                // Enviar email de confirmação (implementar no backend)
                await fetch('/api/send_purchase_confirmation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        purchaseId: purchaseId,
                        userEmail: firebase.auth().currentUser.email,
                        productName: product.name
                    }),
                });
            } else if (data.status === 'rejected' || data.status === 'cancelled') {
                clearInterval(statusCheckInterval);
                showPaymentError(data.status_detail);
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            clearInterval(statusCheckInterval);
            showPaymentError(error.message);
        }
    }, 5000);
}

async function savePurchaseToFirebase(paymentId, product) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        const purchaseId = `PURCHASE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const db = firebase.firestore();
        const purchaseRef = db.collection('purchases').doc(purchaseId);

        // Salvar todas as informações da compra
        await purchaseRef.set({
            purchaseId: purchaseId,
            userId: user.uid,
            userEmail: user.email,
            productId: product.id,
            productName: product.name,
            productPrice: product.currentPrice,
            purchaseDate: firebase.firestore.FieldValue.serverTimestamp(),
            paymentId: paymentId,
            status: 'completed',
            downloadUrl: product.downloadUrl || null,
            downloadFileName: product.downloadFileName || null,
            deliveryType: product.deliveryTypes || [],
            keyOptions: product.keyOptions || null,
            category: product.category,
            originalPrice: product.originalPrice,
            discountApplied: product.discountPercentage > 0 ? product.discountPercentage : null
        });

        console.log('Compra salva com sucesso:', purchaseId);
        return purchaseId;
    } catch (error) {
        console.error('Erro ao salvar compra:', error);
        throw error;
    }
}

function showPaymentConfirmation(purchaseId, product) {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    let downloadButton = '';
    
    if (product.downloadUrl) {
        downloadButton = `
            <a href="${product.downloadUrl}" download="${product.downloadFileName}" 
               class="mt-4 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all duration-300 neon-border">
                Baixar Produto
            </a>
        `;
    }

    qrCodeContainer.innerHTML = `
        <div class="bg-green-500 text-white p-4 rounded-lg text-center">
            <h3 class="text-2xl font-bold mb-2">Pagamento Confirmado!</h3>
            <p>Seu pagamento foi processado e confirmado.</p>
            <p class="mt-2">ID da compra: ${purchaseId}</p>
            ${downloadButton}
            <p class="mt-4 text-sm">Um email com os detalhes da compra foi enviado para você.</p>
        </div>
    `;
    
    gsap.from(qrCodeContainer.children, {duration: 0.5, opacity: 0, y: 20, ease: "power2.out"});
}

function showPaymentError(errorDetail) {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    qrCodeContainer.innerHTML = `
        <div class="bg-red-500 text-white p-4 rounded-lg text-center">
            <h3 class="text-2xl font-bold mb-2">Erro no Pagamento</h3>
            <p>Houve um problema com o seu pagamento: ${errorDetail}</p>
            <p class="mt-2">Por favor, tente novamente ou entre em contato com o suporte.</p>
        </div>
    `;
    gsap.from(qrCodeContainer.children, {duration: 0.5, opacity: 0, y: 20, ease: "power2.out"});
}
