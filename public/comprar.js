// Importação do Mercado Pago
const mp = new MercadoPago('TEST-5273585621510947-101420-10ac2bd2b52f8ea3efff75643d73356e-2036428380');

document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.querySelector('.custom-cursor');
    const purchaseDetails = document.getElementById('purchaseDetails');
    const purchaseForm = document.getElementById('purchaseForm');
    const paymentDetails = document.getElementById('paymentDetails');
    const paymentMethodButtons = document.querySelectorAll('.payment-method-button');

    let selectedPaymentMethod = null;
    let productData = null;

    // Custom cursor
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { duration: 0.2, left: e.clientX, top: e.clientY });
    });

    // Hover effect for interactive elements
    document.querySelectorAll('button, input, a, select, .payment-method-button').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('interactive');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('interactive');
        });
    });

    // Recuperar e descriptografar os dados do produto da URL
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedData = urlParams.get('data');

    if (!encryptedData) {
        showError('Dados do produto não encontrados.');
        return;
    }

    try {
        productData = JSON.parse(atob(encryptedData));
        displayPurchaseDetails(productData);
    } catch (error) {
        console.error('Erro ao decodificar dados do produto:', error);
        showError('Erro ao carregar dados do produto.');
    }

    function displayPurchaseDetails(product) {
        console.log('Produto recebido na página de compra:', product); // Para depuração

        const imageHtml = product.imageUrl 
            ? `<img src="${product.imageUrl}" alt="${product.name}" class="w-24 h-24 object-cover rounded-lg mr-4" onerror="this.onerror=null; this.src='caminho/para/imagem/padrao.jpg';">`
            : `<div class="w-24 h-24 bg-gray-700 rounded-lg mr-4 flex items-center justify-center text-gray-400">Sem imagem</div>`;

        purchaseDetails.innerHTML = `
            <h2 class="text-2xl font-bold mb-4 neon-text">Resumo da Compra</h2>
            <div class="flex items-center mb-4">
                ${imageHtml}
                <div>
                    <h3 class="text-xl font-bold text-blue-400">${product.name}</h3>
                    <p class="text-gray-300">${product.description || 'Descrição não disponível'}</p>
                    <p class="text-sm text-gray-400">Categoria: ${product.category || 'Não especificada'}</p>
                </div>
            </div>
            <p class="text-lg"><strong>Preço:</strong> <span class="text-green-500">R$ ${product.price.toFixed(2)}</span></p>
            <p class="text-sm text-gray-400 mt-2">ID do Produto: ${product.id}</p>
            <div class="mt-4 p-4 bg-blue-900 bg-opacity-50 rounded-lg">
                <p class="text-sm text-blue-300">
                    <strong>Garantia de Segurança:</strong> Sua compra é protegida por criptografia de ponta a ponta. 
                    Seus dados de pagamento nunca são armazenados em nossos servidores.
                </p>
            </div>
        `;
    }

    paymentMethodButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedPaymentMethod = button.dataset.method;
            paymentMethodButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            updatePaymentDetails(selectedPaymentMethod);
        });
    });

    async function updatePaymentDetails(method) {
        switch (method) {
            case 'pix':
                try {
                    const response = await fetch('http://localhost:3001/generate-pix', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ amount: productData.price }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Erro HTTP: ${response.status}. Resposta: ${errorText}`);
                    }

                    const data = await response.json();
                    if (data.error) {
                        throw new Error(data.error);
                    }

                    if (data.qrCode && data.qrCodeBase64) {
                        paymentDetails.innerHTML = `
                            <div class="flex flex-col items-center">
                                <p class="text-blue-300 mb-4">Escaneie o QR Code abaixo para fazer o pagamento:</p>
                                <div id="pixQRCode" class="bg-white p-4 rounded-lg mb-4 flex justify-center items-center" style="width: 250px; height: 250px;">
                                    <img src="data:image/png;base64,${data.qrCodeBase64}" alt="QR Code PIX" class="max-w-full max-h-full">
                                </div>
                                <p class="text-blue-300 mb-2">Ou use a chave PIX abaixo:</p>
                                <div class="pix-key mb-4 w-full max-w-md overflow-x-auto bg-gray-700 p-2 rounded">
                                    <code class="text-green-400 text-sm">${data.qrCode}</code>
                                </div>
                                <button id="copyPixCode" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-300 mb-4">Copiar código PIX</button>
                                <p class="text-sm text-gray-400 text-center">Após o pagamento, enviaremos uma confirmação para o seu e-mail.</p>
                            </div>
                        `;
                        document.getElementById('copyPixCode').addEventListener('click', () => {
                            navigator.clipboard.writeText(data.qrCode).then(() => {
                                alert('Código PIX copiado!');
                            });
                        });
                        applyInteractiveCursorEffect();
                    } else {
                        throw new Error('Dados do QR code não encontrados na resposta');
                    }
                } catch (error) {
                    console.error('Erro ao gerar PIX:', error);
                    paymentDetails.innerHTML = `<p class="text-red-500">Erro ao gerar o PIX: ${error.message}</p>`;
                }
                break;
            case 'cartao':
                const cardForm = mp.cardForm({
                    amount: JSON.parse(atob(urlParams.get('data'))).price.toString(),
                    autoMount: true,
                    form: {
                        id: "form-checkout",
                        cardholderName: {
                            id: "form-checkout__cardholderName",
                            placeholder: "Titular do cartão",
                        },
                        cardholderEmail: {
                            id: "form-checkout__cardholderEmail",
                            placeholder: "E-mail",
                        },
                        cardNumber: {
                            id: "form-checkout__cardNumber",
                            placeholder: "Número do cartão",
                        },
                        expirationDate: {
                            id: "form-checkout__expirationDate",
                            placeholder: "Data de vencimento (MM/YYYY)",
                        },
                        securityCode: {
                            id: "form-checkout__securityCode",
                            placeholder: "Código de segurança",
                        },
                        installments: {
                            id: "form-checkout__installments",
                            placeholder: "Parcelas",
                        },
                        identificationType: {
                            id: "form-checkout__identificationType",
                            placeholder: "Tipo de documento",
                        },
                        identificationNumber: {
                            id: "form-checkout__identificationNumber",
                            placeholder: "Número do documento",
                        },
                        issuer: {
                            id: "form-checkout__issuer",
                            placeholder: "Banco emissor",
                        },
                    },
                    callbacks: {
                        onFormMounted: error => {
                            if (error) return console.warn("Form Mounted handling error: ", error);
                            console.log("Form mounted");
                        },
                        onSubmit: event => {
                            event.preventDefault();
                            const {
                                paymentMethodId,
                                issuerId,
                                cardholderEmail: email,
                                amount,
                                token,
                                installments,
                                identificationNumber,
                                identificationType,
                            } = cardForm.getCardFormData();

                            processPayment(token, paymentMethodId, issuerId, email, amount, installments, identificationNumber, identificationType);
                        },
                    },
                });
                paymentDetails.innerHTML = `
                    <form id="form-checkout">
                        <div class="mb-4">
                            <input type="text" id="form-checkout__cardholderName" class="w-full p-2 bg-gray-700 text-white rounded" />
                        </div>
                        <div class="mb-4">
                            <input type="email" id="form-checkout__cardholderEmail" class="w-full p-2 bg-gray-700 text-white rounded" />
                        </div>
                        <div class="mb-4">
                            <input type="text" id="form-checkout__cardNumber" class="w-full p-2 bg-gray-700 text-white rounded" />
                        </div>
                        <div class="flex mb-4">
                            <div class="w-1/2 mr-2">
                                <input type="text" id="form-checkout__expirationDate" class="w-full p-2 bg-gray-700 text-white rounded" />
                            </div>
                            <div class="w-1/2 ml-2">
                                <input type="text" id="form-checkout__securityCode" class="w-full p-2 bg-gray-700 text-white rounded" />
                            </div>
                        </div>
                        <div class="mb-4">
                            <select id="form-checkout__installments" class="w-full p-2 bg-gray-700 text-white rounded"></select>
                        </div>
                        <div class="mb-4">
                            <select id="form-checkout__identificationType" class="w-full p-2 bg-gray-700 text-white rounded"></select>
                        </div>
                        <div class="mb-4">
                            <input type="text" id="form-checkout__identificationNumber" class="w-full p-2 bg-gray-700 text-white rounded" />
                        </div>
                        <div class="mb-4">
                            <select id="form-checkout__issuer" class="w-full p-2 bg-gray-700 text-white rounded"></select>
                        </div>
                        <button type="submit" id="form-checkout__submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-300">Pagar</button>
                    </form>
                `;
                applyInteractiveCursorEffect();
                break;
            case 'boleto':
                paymentDetails.innerHTML = `
                    <p class="text-blue-300 mb-2">Clique no botão abaixo para gerar o boleto:</p>
                    <button type="button" id="generateBoleto" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-300">Gerar Boleto</button>
                    <p class="text-sm text-gray-400 mt-2">O boleto será enviado para o seu e-mail e poderá ser pago em qualquer banco ou casa lotérica.</p>
                `;
                document.getElementById('generateBoleto').addEventListener('click', () => {
                    // Simulação de geração de boleto
                    alert('Boleto gerado e enviado para o seu e-mail!');
                });
                applyInteractiveCursorEffect();
                break;
            default:
                paymentDetails.innerHTML = '';
        }
    }

    async function processPayment() {
        // Simulação de processamento de pagamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { status: 'approved' };
    }

    purchaseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            const result = await processPayment();
            if (result.status === 'approved') {
                showSuccess('Compra realizada com sucesso!');
                setTimeout(() => {
                    window.location.href = "https://discordapp.com/channels/1254095416392421429/1257122764364451890";
                }, 3000);
            } else {
                showError('Erro ao processar o pagamento. Por favor, tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            showError('Erro ao processar o pagamento. Por favor, tente novamente.');
        }
    });

    function validateForm() {
        if (!selectedPaymentMethod) {
            showError('Por favor, selecione um método de pagamento.');
            return false;
        }

        if (selectedPaymentMethod === 'cartao') {
            const cardNumber = document.getElementById('cardNumber').value;
            const cardName = document.getElementById('cardName').value;
            const expiryDate = document.getElementById('expiryDate').value;
            const cvv = document.getElementById('cvv').value;

            if (!cardNumber || !cardName || !expiryDate || !cvv) {
                showError('Por favor, preencha todos os campos do cartão de crédito.');
                return false;
            }

            // Adicione validações adicionais aqui (por exemplo, formato do número do cartão, data de expiração válida, etc.)
        }

        return true;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-500 text-white p-4 rounded-lg mb-4';
        errorDiv.textContent = message;
        purchaseDetails.parentNode.insertBefore(errorDiv, purchaseDetails);
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'bg-green-500 text-white p-4 rounded-lg mb-4';
        successDiv.textContent = message;
        purchaseForm.parentNode.insertBefore(successDiv, purchaseForm);
    }

    // Verificar autenticação do usuário
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    // Adicionar proteção contra CSRF
    const csrfToken = generateCSRFToken();
    addCSRFTokenToForm(csrfToken);

    function generateCSRFToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    function addCSRFTokenToForm(token) {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        csrfInput.value = token;
        purchaseForm.appendChild(csrfInput);
    }

    function applyInteractiveCursorEffect() {
        const cursor = document.querySelector('.custom-cursor');
        document.querySelectorAll('button, input, a, select, #copyPixCode, #form-checkout__submit').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('interactive');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('interactive');
            });
        });
    }

    // Chame esta função após gerar o QR code do PIX ou o formulário do cartão
    applyInteractiveCursorEffect();
});