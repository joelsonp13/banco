document.addEventListener('DOMContentLoaded', () => {
    const productDetails = document.getElementById('productDetails');
    const reviewsList = document.getElementById('reviewsList');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

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

    // Implementar o cursor personalizado com melhor desempenho
    const cursor = document.querySelector('.custom-cursor');
    let rafId = null;

    function updateCursor(e) {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
            const x = e.clientX;
            const y = e.clientY;
            cursor.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    document.addEventListener('mousemove', updateCursor);

    // Otimizar o efeito de hover
    const hoverElements = document.querySelectorAll('a, button, input, textarea');
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        element.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    const dropdownButton = document.querySelector('nav button');
    const dropdownMenu = document.querySelector('nav .group > div');

    dropdownButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !dropdownButton.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    if (!productId) {
        productDetails.innerHTML = '<p class="text-red-500">Produto não encontrado.</p>';
        return;
    }

    // Otimizar carregamento de produtos e avaliações
    let productData = null;
    let reviewsData = [];

    async function loadProductDetails(productId) {
        return firebase.firestore().collection('produtos').doc(productId).get()
            .then((doc) => {
                if (doc.exists) {
                    const product = doc.data();
                    product.id = doc.id; // Garantir que o ID do documento seja incluído
                    console.log('Produto carregado:', product); // Para depuração
                    displayProductDetails(product);
                    return product;
                } else {
                    console.log('Produto não encontrado');
                    throw new Error('Produto não encontrado');
                }
            })
            .catch((error) => {
                console.error('Erro ao carregar detalhes do produto:', error);
                productDetails.innerHTML = '<p class="text-red-500">Erro ao carregar detalhes do produto.</p>';
            });
    }

    async function loadReviews(productId) {
        try {
            const snapshot = await firebase.firestore().collection('reviews')
                .where('productId', '==', productId)
                .get();

            reviewsData = snapshot.docs.map(doc => doc.data());
            displayReviews();
            animateReviews();
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            reviewsList.innerHTML = '<p class="text-red-500">Erro ao carregar avaliações. Por favor, tente novamente mais tarde.</p>';
        }
    }

    function displayReviews() {
        if (reviewsData.length === 0) {
            reviewsList.innerHTML = '<p class="text-gray-400">Ainda não há avaliações para este produto.</p>';
        } else {
            reviewsList.innerHTML = reviewsData.map(review => `
                <div class="review-card bg-gray-700 p-4 rounded mb-2">
                    <p class="text-gray-300">${review.text}</p>
                    <p class="text-sm text-gray-400">Por: ${review.userName}</p>
                </div>
            `).join('');
        }
    }

    function displayProductDetails(product) {
        const priceDisplay = product.discountPercentage > 0
            ? `<p class="text-2xl font-bold text-green-500" id="productPrice">R$ ${product.currentPrice.toFixed(2)}</p>
               <p class="text-lg line-through text-red-500">R$ ${product.originalPrice.toFixed(2)}</p>`
            : `<p class="text-2xl font-bold text-blue-400" id="productPrice">R$ ${product.currentPrice.toFixed(2)}</p>`;

        function translateDuration(duration) {
            const translations = {
                '1day': '1 dia',
                '1week': '1 semana',
                '1month': '1 mês',
                'lifetime': 'Vitalício'
            };
            return translations[duration] || duration;
        }

        const keyOptionsHtml = product.keyOptions && product.keyOptions.length > 0
            ? `<div class="mt-4">
                <h3 class="text-xl font-bold text-blue-400 mb-2">Escolha a duração:</h3>
                <select id="durationSelect" class="w-full p-2 bg-gray-800 text-white rounded border border-blue-500 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                    ${product.keyOptions.map(option => `
                        <option value="${option.duration}" data-price="${option.price}">
                            ${translateDuration(option.duration)} - R$ ${option.price.toFixed(2)}
                        </option>
                    `).join('')}
                </select>
               </div>`
            : '';

        const downloadInfo = product.deliveryTypes && product.deliveryTypes.includes('download')
            ? '<p class="text-green-500 mt-2">Download disponível</p>'
            : '<p class="text-red-500 mt-2">Download não disponível</p>';

        productDetails.innerHTML = `
            <div class="flex flex-col md:flex-row">
                <div class="zoom-container w-full md:w-1/2">
                    <img src="${product.imageUrl}" alt="${product.name}" class="zoom-image w-full h-auto object-cover rounded-lg">
                </div>
                <div class="md:ml-8 mt-4 md:mt-0">
                    <h2 class="text-3xl font-bold text-blue-400 mb-4">${product.name}</h2>
                    ${priceDisplay}
                    <p class="text-gray-300 my-4">${product.description}</p>
                    <p class="text-sm text-gray-400 mb-4">Categoria: ${product.category || 'Sem categoria'}</p>
                    ${keyOptionsHtml}
                    ${downloadInfo}
                    <button id="buyNowBtn" class="buy-now bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-all duration-300 neon-border mt-4">Comprar Agora</button>
                </div>
            </div>
        `;

        const buyNowBtn = document.getElementById('buyNowBtn');
        buyNowBtn.addEventListener('click', () => buyNow(product));

        const durationSelect = document.getElementById('durationSelect');
        if (durationSelect) {
            durationSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const newPrice = parseFloat(selectedOption.dataset.price);
                document.getElementById('productPrice').textContent = `R$ ${newPrice.toFixed(2)}`;
                product.selectedDuration = e.target.value;
                product.currentPrice = newPrice;
            });
            // Trigger change event to set initial price and duration
            durationSelect.dispatchEvent(new Event('change'));
        }
    }

    function buyNow(product) {
        console.log('Produto sendo enviado para compra:', product); // Para depuração
        const encryptedData = btoa(JSON.stringify({
            id: product.id,
            name: product.name,
            currentPrice: product.currentPrice,
            imageUrl: product.imageUrl,
            description: product.description,
            category: product.category,
            selectedDuration: product.selectedDuration, // Adicionando a duração selecionada
            deliveryTypes: product.deliveryTypes
        }));

        window.location.href = `comprar.html?data=${encryptedData}`;
    }

    function showFeedback(message, type = 'success') {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `fixed top-4 right-4 p-4 rounded-lg text-white ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} opacity-0 transition-opacity duration-300 z-50`;
        feedbackDiv.textContent = message;
        document.body.appendChild(feedbackDiv);

        gsap.to(feedbackDiv, { opacity: 1, duration: 0.3, ease: "power2.out" });

        setTimeout(() => {
            gsap.to(feedbackDiv, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => feedbackDiv.remove()
            });
        }, 3000);
    }

    // Implementar lazy loading para imagens
    function lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Otimizar animações GSAP
    function animateElements() {
        gsap.from(productDetails, {duration: 0.5, opacity: 0, y: 20, ease: "power2.out"});
    }

    function animateReviews() {
        gsap.from("#reviewsSection", {duration: 0.5, opacity: 0, y: 20, ease: "power2.out"});
    }

    // Inicializar componentes após o carregamento do DOM
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            Promise.all([
                loadProductDetails(productId),
                loadReviews(productId)
            ]);
        } else {
            window.location.href = 'login.html';
        }
    });

    // Remover animações duplicadas
    // gsap.from(productDetails, {duration: 1, opacity: 0, y: 50, ease: "power3.out"});
    // gsap.from("#reviewsSection", {duration: 1, opacity: 0, y: 50, ease: "power3.out", delay: 0.5});

    // ... (resto do código)
});
