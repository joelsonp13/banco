document.addEventListener('DOMContentLoaded', () => {
    const productDetails = document.getElementById('productDetails');
    const reviewsList = document.getElementById('reviewsList');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // Inicializar o efeito de fundo Vanta.js com configurações otimizadas
    VANTA.NET({
        el: "#vanta-background",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 0.75,
        color: 0x0000ff,
        backgroundColor: 0x000000,
        points: 10.00, // Reduzido de 20 para 10
        maxDistance: 20.00, // Reduzido de 30 para 20
        spacing: 20.00, // Aumentado de 15 para 20
        showDots: false, // Desativa a renderização de pontos
        backgroundColor: 0x000000,
        backgroundAlpha: 0.9, // Reduz a opacidade do fundo
        speed: 0.5 // Reduz a velocidade da animação
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
                    product.id = doc.id;
                    displayProductDetails(product);
                    return product;
                } else {
                    throw new Error('Produto não encontrado');
                }
            })
            .catch((error) => {
                productDetails.innerHTML = '<p class="text-red-500">Erro ao carregar detalhes do produto.</p>';
            });
    }

    async function loadReviews(productId) {
        try {
            const snapshot = await firebase.firestore().collection('reviews')
                .where('productId', '==', productId)
                .get();

            reviewsData = await Promise.all(snapshot.docs.map(async doc => {
                const review = doc.data();
                const userSnapshot = await firebase.firestore().collection('usuarios').doc(review.userId).get();
                const userData = userSnapshot.exists ? userSnapshot.data() : {};
                return {
                    id: doc.id, // Importante: incluir o ID do documento
                    ...review,
                    userPhotoURL: userData.profilePicUrl || '/path/to/default-profile.png',
                    userName: userData.nome || 'Anônimo'
                };
            }));

            displayReviews();
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            reviewsList.innerHTML = '<p class="text-red-500">Erro ao carregar avaliações. Por favor, tente novamente mais tarde.</p>';
        }
    }

    function displayReviews() {
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsData.length === 0) {
            reviewsList.innerHTML = '<p class="text-gray-400">Ainda não há avaliações para este produto.</p>';
        } else {
            reviewsList.innerHTML = reviewsData.map(review => {
                const isCurrentUser = firebase.auth().currentUser && firebase.auth().currentUser.uid === review.userId;
                return `
                    <div class="review-card bg-gray-700 p-4 rounded mb-2 flex items-center justify-between" data-review-id="${review.id}">
                        <div class="flex items-center">
                            <img src="${review.userPhotoURL}" alt="Foto de perfil" class="w-10 h-10 rounded-full mr-4">
                            <div>
                                <p class="text-blue-300 font-bold">${review.userName}</p>
                                <p class="text-white review-text">${review.text}</p>
                            </div>
                        </div>
                        ${isCurrentUser ? `
                        <div class="relative">
                            <button class="text-white focus:outline-none p-2" onclick="toggleOptionsMenu(this)">
                                &#x22EE;
                            </button>
                            <div class="options-menu hidden absolute right-0 mt-2 w-48 bg-black bg-opacity-90 rounded-md shadow-lg z-50 flex">
                                <button class="block px-4 py-2 text-sm text-blue-300 hover:bg-blue-600 hover:text-white" onclick="editComment('${review.id}')">Editar</button>
                                <button class="block px-4 py-2 text-sm text-blue-300 hover:bg-blue-600 hover:text-white" onclick="deleteComment('${review.id}')">Remover</button>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
    }

    window.toggleOptionsMenu = function(button) {
        const menu = button.nextElementSibling;
        menu.classList.toggle('hidden');
        document.addEventListener('click', function hideMenu(e) {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.classList.add('hidden');
                document.removeEventListener('click', hideMenu);
            }
        });
    }

    window.editComment = async function(reviewId) {
        const reviewCard = document.querySelector(`[data-review-id="${reviewId}"]`);
        const reviewTextElement = reviewCard.querySelector('.review-text');
        const originalText = reviewTextElement.textContent;
        const editContainer = document.createElement('div');
        
        editContainer.innerHTML = `
            <div class="relative w-full">
                <textarea class="p-4 bg-gray-800 text-white rounded border border-blue-500 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 min-h-[150px] w-full">${originalText}</textarea>
            </div>
            <div class="flex space-x-2 mt-2">
                <button class="neon-button-sm save-btn">Salvar</button>
                <button class="neon-button-red-sm cancel-btn">Cancelar</button>
            </div>
        `;
        reviewTextElement.replaceWith(editContainer);

        const textarea = editContainer.querySelector('textarea');
        textarea.style.width = '100%';
        textarea.style.minWidth = '100%';
        textarea.style.maxWidth = '100%';

        const saveButton = editContainer.querySelector('.save-btn');
        const cancelButton = editContainer.querySelector('.cancel-btn');

        saveButton.addEventListener('click', async () => {
            const newText = textarea.value;
            if (newText && newText !== originalText) {
                try {
                    await firebase.firestore().collection('reviews').doc(reviewId).update({
                        text: newText
                    });
                    reviewTextElement.textContent = newText;
                    editContainer.replaceWith(reviewTextElement);
                    showFeedback('Comentário editado com sucesso', 'success');
                } catch (error) {
                    showFeedback('Erro ao editar comentário', 'error');
                }
            }
        });

        cancelButton.addEventListener('click', () => {
            editContainer.replaceWith(reviewTextElement);
        });
    }

    window.deleteComment = async function(reviewId) {
        try {
            await firebase.firestore().collection('reviews').doc(reviewId).delete();
            reviewsData = reviewsData.filter(review => review.id !== reviewId);
            displayReviews();
            showFeedback('Comentário removido com sucesso', 'success');
        } catch (error) {
            showFeedback('Erro ao remover comentário', 'error');
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
                    <div id="actionButtonContainer" class="mt-4">
                        <button id="buyNowBtn" class="mt-6 neon-button">Comprar Agora</button>
                    </div>
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
            durationSelect.dispatchEvent(new Event('change'));
        }
    }

    function buyNow(product) {
        const encryptedData = btoa(JSON.stringify({
            id: product.id,
            name: product.name,
            currentPrice: product.currentPrice,
            imageUrl: product.imageUrl,
            description: product.description,
            category: product.category,
            selectedDuration: product.selectedDuration,
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
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const [product, reviews] = await Promise.all([
                    loadProductDetails(productId),
                    loadReviews(productId)
                ]);

                const hasPurchased = await checkIfUserHasPurchased(user.uid, productId);
                if (hasPurchased) {
                    showDownloadOption(product);
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    async function checkIfUserHasPurchased(userId, productId) {
        const db = firebase.firestore();
        const purchasesRef = db.collection('purchases');
        const querySnapshot = await purchasesRef
            .where('userId', '==', userId)
            .where('productId', '==', productId)
            .where('status', '==', 'completed')
            .get();

        return !querySnapshot.empty;
    }

    function showDownloadOption(product) {
        const purchaseInfo = `
            <p class="text-green-500 mt-2">Você já adquiriu este produto!</p>
        `;
        const downloadButton = `
            <div class="mt-4">
                <a href="${product.downloadUrl}" download="${product.downloadFileName || 'produto'}" 
                   class="mt-6 neon-button">Baixar</a>
            </div>
        `;
        document.getElementById('actionButtonContainer').innerHTML = purchaseInfo + downloadButton;
        showCommentSection(); // Mostra a seção de comentários
    }

    function showCommentSection() {
        const commentSection = `
            <div class="mt-8">
                <h3 class="text-xl font-bold text-blue-400 mb-2">Deixe seu comentário:</h3>
                <textarea class="w-full p-2 bg-gray-800 text-white rounded border border-blue-500 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" rows="4" placeholder="Escreva seu comentário aqui..."></textarea>
                <button id="sendCommentBtn" class="mt-6 neon-button">Enviar Comentário</button>
            </div>
        `;
        productDetails.innerHTML += commentSection;

        const commentButton = document.getElementById('sendCommentBtn');
        commentButton.addEventListener('click', async () => {
            const commentText = document.querySelector('textarea').value;
            console.log('Botão de enviar comentário clicado');
            console.log('Texto do comentário:', commentText);
            if (commentText.trim() === '') {
                console.error('Erro: Comentário vazio');
                return;
            }
            console.log('Comentário não está vazio, processando...');

            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    console.error('Usuário não autenticado');
                    return;
                }

                const reviewData = {
                    productId: productId,
                    userId: user.uid,
                    userName: user.displayName || 'Anônimo',
                    userPhotoURL: user.photoURL || 'default-profile.png',
                    text: commentText,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };

                await firebase.firestore().collection('reviews').add(reviewData);
                console.log('Comentário salvo com sucesso');
                loadReviews(productId); // Recarregar as avaliações para exibir o novo comentário
            } catch (error) {
                console.error('Erro ao salvar comentário:', error);
            }
        });
    }

    // Remover animações duplicadas
    // gsap.from(productDetails, {duration: 1, opacity: 0, y: 50, ease: "power3.out"});
    // gsap.from("#reviewsSection", {duration: 1, opacity: 0, y: 50, ease: "power3.out", delay: 0.5});

    // ... (resto do código)
});
