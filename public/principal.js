document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');

    // Verifique se o Firebase está inicializado
    if (typeof firebase === 'undefined') {
        console.error('Firebase não está definido. Verifique se os scripts do Firebase foram carregados corretamente.');
        return;
    }

    // Verifique se editProduct está definido
    if (typeof window.editProduct === 'undefined') {
        console.error('A função editProduct não está definida. Verifique se editarprodutos.js foi carregado corretamente.');
        return;
    }

    const userDisplay = document.getElementById('userDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const vendorAreaBtn = document.getElementById('vendorAreaBtn');
    const cursor = document.querySelector('.custom-cursor');
    const editContentBtn = document.getElementById('editContentBtn');
    let isEditMode = false;

    console.log('Elementos DOM obtidos');

    // Verificar se o usuário está logado e tem permissão de vendedor
    firebase.auth().onAuthStateChanged((user) => {
        console.log('Estado de autenticação alterado');
        if (user) {
            console.log('Usuário logado:', user.email);
            userDisplay.textContent = `Olá, ${user.displayName || user.email}!`;
            
            // Verificar se o usuário tem permissão de vendedor
            db.collection('usuarios').doc(user.uid).get().then((doc) => {
                console.log('Documento do usuário obtido');
                if (doc.exists && doc.data().isVendedor === true) {
                    console.log('Usuário é vendedor');
                    vendorAreaBtn.classList.remove('hidden');
                    editContentBtn.classList.remove('hidden'); // Mostra o botão "Editar Conteúdo"
                } else {
                    console.log('Usuário não é vendedor');
                    vendorAreaBtn.classList.add('hidden');
                    editContentBtn.classList.add('hidden'); // Esconde o botão "Editar Conteúdo"
                }
            }).catch((error) => {
                console.error("Erro ao verificar permissões:", error);
            });
        } else {
            console.log('Usuário não está logado, redirecionando para login');
            window.location.href = 'login.html';
        }
    });

    // Função de logout
    logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Erro ao fazer logout:', error);
        });
    });

    // Função para ir para a área do vendedor
    vendorAreaBtn.addEventListener('click', () => {
        window.location.href = 'areadovendedoradm.html';
    });

    // Custom cursor
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { duration: 0.2, left: e.clientX, top: e.clientY });
    });

    // Hover effect for interactive elements
    document.querySelectorAll('button, .product-card, a, input, textarea, select').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('interactive');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('interactive');
        });
    });

    // Esconder o cursor padrão
    document.body.style.cursor = 'none';

    // Add to cart animation
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const cart = document.createElement('div');
            cart.style.position = 'fixed';
            cart.style.right = '20px';
            cart.style.top = '20px';
            cart.style.width = '30px';
            cart.style.height = '30px';
            cart.style.backgroundColor = '#0000ff';
            cart.style.borderRadius = '50%';
            cart.style.zIndex = '9999';
            document.body.appendChild(cart);

            const buttonRect = e.target.getBoundingClientRect();
            const startX = buttonRect.left + buttonRect.width / 2;
            const startY = buttonRect.top + buttonRect.height / 2;

            gsap.fromTo(cart, 
                { x: startX, y: startY, scale: 0 },
                { x: window.innerWidth - 50, y: 20, scale: 1, duration: 1, ease: "power1.inOut",
                    onComplete: () => {
                        document.body.removeChild(cart);
                        // Aqui você pode atualizar o contador do carrinho
                    }
                }
            );
        });
    });

    // Parallax effect for product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Aumentamos o multiplicador para 30 para um efeito mais pronunciado
            const xPercent = (x / rect.width - 0.5) * 30;
            const yPercent = (y / rect.height - 0.5) * 30;

            gsap.to(card, {
                duration: 0.5,
                rotationY: xPercent,
                rotationX: -yPercent,
                scale: 1.1, // Aumentamos a escala para 1.1
                ease: 'power2.out',
                transformPerspective: 1000, // Adicionamos perspectiva para um efeito 3D mais pronunciado
                transformStyle: "preserve-3d" // Garante que o efeito 3D seja preservado
            });

            // Adicionamos um efeito de profundidade aos elementos internos do card
            card.querySelectorAll('h3, p, button').forEach((el, index) => {
                gsap.to(el, {
                    duration: 0.5,
                    z: 50 + (index * 20), // Cada elemento tem uma profundidade diferente
                    ease: 'power2.out'
                });
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                duration: 0.5,
                rotationY: 0,
                rotationX: 0,
                scale: 1,
                ease: 'power2.out'
            });

            // Resetamos a profundidade dos elementos internos
            card.querySelectorAll('h3, p, button').forEach(el => {
                gsap.to(el, {
                    duration: 0.5,
                    z: 0,
                    ease: 'power2.out'
                });
            });
        });
    });

    // Vanta.js background
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
        backgroundColor: 0x0
    });

    // Glitch effect on hover
    document.querySelectorAll('.glitch').forEach(el => {
        el.addEventListener('mouseenter', () => {
            el.classList.add('active');
        });
        el.addEventListener('mouseleave', () => {
            el.classList.remove('active');
        });
    });

    // Floating animation for logo
    gsap.to('.floating', {
        y: -10,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
    });

    // Particles.js
    const particlesContainer = document.getElementById('particles-js');
    if (particlesContainer) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: '#0000ff' },
                shape: { type: 'circle' },
                opacity: { value: 0.5, random: false },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: '#0000ff', opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
                modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
            },
            retina_detect: true
        });
    } else {
        console.warn('Elemento #particles-js não encontrado. O efeito de partículas não será aplicado.');
    }

    // Audio feedback on interactions
    // let hoverSound, clickSound;
    // function loadSounds() {
    //     hoverSound = new Audio('sounds/hover-sound.mp3');
    //     clickSound = new Audio('sounds/click-sound.mp3');

    //     // Adicione event listeners para lidar com erros de carregamento
    //     hoverSound.addEventListener('error', () => console.warn('Não foi possível carregar hover-sound.mp3'));
    //     clickSound.addEventListener('error', () => console.warn('Não foi possível carregar click-sound.mp3'));
    // }

    // function playSoundIfLoaded(sound) {
    //     if (sound && sound.readyState === 4) { // 4 means HAVE_ENOUGH_DATA
    //         sound.play().catch(e => console.warn('Erro ao reproduzir som:', e));
    //     }
    // }

    // loadSounds();

    // document.querySelectorAll('button, .product-card').forEach(el => {
    //     el.addEventListener('mouseenter', () => {
    //         playSoundIfLoaded(hoverSound);
    //     });
    //     el.addEventListener('click', () => {
    //         playSoundIfLoaded(clickSound);
    //     });
    // });

    // Easter egg: Konami code
    let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    function activateEasterEgg() {
        alert('Easter Egg Activated! Você desbloqueou um desconto secreto de 20%!');
        // Adicione aqui a lógica para aplicar o desconto
    }

    // Função para carregar e exibir produtos
    async function loadProducts() {
        console.log('Iniciando carregamento de produtos');
        const productGrid = document.querySelector('.grid');
        if (!productGrid) {
            console.error('Elemento .grid não encontrado');
            return;
        }
        productGrid.innerHTML = ''; // Limpa o grid existente

        try {
            console.log('Tentando acessar o Firestore');
            if (!db) {
                console.error('Instância do Firestore não encontrada');
                return;
            }
            console.log('Buscando produtos no Firestore');
            const snapshot = await db.collection('produtos').get();
            console.log('Snapshot recebido:', snapshot);
            if (snapshot.empty) {
                console.log('Nenhum produto encontrado');
                showFeedback('Nenhum produto encontrado.', 'info');
                return;
            }

            snapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                console.log('Produto:', product);
                const productCard = createProductCard(product);
                productGrid.appendChild(productCard);
            });

            console.log('Produtos carregados, aplicando efeitos visuais');
            applyVisualEffects();
            applyInteractiveCursorEffect(); // Adicione esta linha
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            showFeedback('Erro ao carregar produtos. Por favor, recarregue a página.', 'error');
        }
    }

    // Função para criar um card de produto
    function createProductCard(product) {
        console.log('Criando card para o produto:', product.name);
        const card = document.createElement('div');
        card.className = 'product-card bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 flex flex-col h-full cursor-pointer';
        card.dataset.productId = product.id;
        
        const priceDisplay = product.discountPercentage > 0
            ? `<p class="text-sm line-through text-red-500">R$ ${product.originalPrice.toFixed(2)}</p>
               <p class="text-lg font-bold text-green-500">R$ ${product.currentPrice.toFixed(2)}</p>`
            : `<p class="text-lg font-bold text-blue-400">R$ ${product.currentPrice.toFixed(2)}</p>`;

        const shortDescription = product.description.length > 100 
            ? product.description.substring(0, 97) + '...'
            : product.description;

        card.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-48 object-cover">
            <div class="p-4 flex flex-col flex-grow">
                <h3 class="text-xl font-bold text-blue-400 mb-2">${product.name}</h3>
                <p class="text-gray-300 mb-4 flex-grow">${shortDescription}</p>
                <div class="mt-auto">
                    ${priceDisplay}
                    <p class="text-sm text-gray-400 mb-4">Categoria: ${product.category || 'Sem categoria'}</p>
                    <button class="add-to-cart bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all duration-300 w-full neon-border">Ver Detalhes</button>
                </div>
            </div>
        `;

        card.addEventListener('click', cardClickHandler);
        card.addEventListener('mousemove', card3DEffectHandler);
        card.addEventListener('mouseleave', card3DResetHandler);
        
        return card;
    }

    // Função para aplicar efeitos visuais aos cards de produto
    function applyVisualEffects() {
        const cursor = document.querySelector('.custom-cursor');

        document.querySelectorAll('.product-card').forEach(card => {
            // Efeito parallax
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const xPercent = (x / rect.width - 0.5) * 30;
                const yPercent = (y / rect.height - 0.5) * 30;

                gsap.to(card, {
                    duration: 0.5,
                    rotationY: xPercent,
                    rotationX: -yPercent,
                    scale: 1.1,
                    ease: 'power2.out',
                    transformPerspective: 1000,
                    transformStyle: "preserve-3d"
                });

                card.querySelectorAll('h3, p, button').forEach((el, index) => {
                    gsap.to(el, {
                        duration: 0.5,
                        z: 50 + (index * 20),
                        ease: 'power2.out'
                    });
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    duration: 0.5,
                    rotationY: 0,
                    rotationX: 0,
                    scale: 1,
                    ease: 'power2.out'
                });

                card.querySelectorAll('h3, p, button').forEach(el => {
                    gsap.to(el, {
                        duration: 0.5,
                        z: 0,
                        ease: 'power2.out'
                    });
                });
            });

            // Adicionar efeito do cursor interativo
            card.addEventListener('mouseenter', () => {
                cursor.classList.add('interactive');
            });
            card.addEventListener('mouseleave', () => {
                cursor.classList.remove('interactive');
            });
        });

        // Reaplica o ScrollReveal se estiver definido
        if (typeof ScrollReveal !== 'undefined') {
            ScrollReveal().reveal('.product-card', { interval: 200 });
        } else {
            console.warn('ScrollReveal não está definido. O efeito de revelação não será aplicado.');
        }
    }

    // Função para mostrar feedback
    window.showFeedback = function(message, type = 'info') {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `fixed top-4 right-4 p-4 rounded-lg text-white ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} opacity-0 transition-opacity duration-300`;
        feedbackDiv.textContent = message;
        document.body.appendChild(feedbackDiv);

        setTimeout(() => {
            feedbackDiv.style.opacity = '1';
        }, 100);

        setTimeout(() => {
            feedbackDiv.style.opacity = '0';
            setTimeout(() => {
                feedbackDiv.remove();
            }, 300);
        }, 3000);
    }

    console.log('Chamando loadProducts');
    loadProducts();

    console.log('Script principal.js concluído');

    editContentBtn.addEventListener('click', () => {
        // Verificar novamente se o usuário tem permissão antes de ativar o modo de edição
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                db.collection('usuarios').doc(user.uid).get().then((doc) => {
                    if (doc.exists && doc.data().isVendedor === true) {
                        isEditMode = !isEditMode;
                        if (isEditMode) {
                            editContentBtn.textContent = 'Salvar Alterações';
                            editContentBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                            editContentBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                            activateEditMode();
                        } else {
                            editContentBtn.textContent = 'Editar Conteúdo';
                            editContentBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                            editContentBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
                            deactivateEditMode();
                        }
                    } else {
                        console.log('Usuário não tem permissão para editar conteúdo');
                        showFeedback('Você não tem permissão para editar o conteúdo.', 'error');
                    }
                }).catch((error) => {
                    console.error("Erro ao verificar permissões:", error);
                });
            }
        });
    });

    function activateEditMode() {
        document.querySelectorAll('.product-card').forEach(card => {
            // Remover o evento de clique que redireciona para a página de detalhes
            card.removeEventListener('click', cardClickHandler);
            
            // Remover os eventos de mousemove e mouseleave que criam o efeito 3D
            card.removeEventListener('mousemove', card3DEffectHandler);
            card.removeEventListener('mouseleave', card3DResetHandler);
            
            // Resetar a transformação do card imediatamente
            gsap.to(card, {
                duration: 0,
                rotationY: 0,
                rotationX: 0,
                scale: 1,
                clearProps: "all"
            });
            
            // Resetar a transformação dos elementos internos do card
            card.querySelectorAll('h3, p, button').forEach(el => {
                gsap.to(el, {
                    duration: 0,
                    z: 0,
                    clearProps: "all"
                });
            });
            
            // Adicionar uma classe para indicar que o card está em modo de edição
            card.classList.add('edit-mode');
            
            // Desativar a transição CSS
            card.style.transition = 'none';
            
            // Adicionar botões de edição e exclusão
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.className = 'edit-product-btn bg-yellow-500 text-white px-2 py-1 rounded mr-2';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Excluir';
            deleteBtn.className = 'delete-product-btn bg-red-500 text-white px-2 py-1 rounded';
            
            const btnContainer = document.createElement('div');
            btnContainer.className = 'edit-buttons mt-2';
            btnContainer.appendChild(editBtn);
            btnContainer.appendChild(deleteBtn);
            
            card.appendChild(btnContainer);
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = card.dataset.productId;
                console.log('Editando produto:', productId);
                window.editProduct(productId);  // Use window.editProduct aqui
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = card.dataset.productId;
                window.deleteProduct(productId);  // Use window.deleteProduct aqui
            });
        });
    }

    function deactivateEditMode() {
        document.querySelectorAll('.product-card').forEach(card => {
            // Remover os botões de edição
            const editButtons = card.querySelector('.edit-buttons');
            if (editButtons) {
                editButtons.remove();
            }
            
            // Remover a classe de modo de edição
            card.classList.remove('edit-mode');
            
            // Reativar a transição CSS
            card.style.transition = '';
            
            // Reativar o evento de clique para redirecionamento
            card.addEventListener('click', cardClickHandler);
            
            // Reativar os eventos para o efeito 3D
            card.addEventListener('mousemove', card3DEffectHandler);
            card.addEventListener('mouseleave', card3DResetHandler);
        });
    }

    function cardClickHandler(e) {
        if (!e.target.classList.contains('add-to-cart')) {
            const productId = this.dataset.productId;
            window.location.href = `verdetalhes.html?id=${productId}`;
        }
    }

    function card3DEffectHandler(e) {
        const card = this;
        
        // Se o card estiver em modo de edição, não aplicar o efeito 3D
        if (card.classList.contains('edit-mode')) {
            return;
        }
        
        
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const xPercent = (x / rect.width - 0.5) * 30;
        const yPercent = (y / rect.height - 0.5) * 30;

        gsap.to(card, {
            duration: 0.5,
            rotationY: xPercent,
            rotationX: -yPercent,
            scale: 1.1,
            ease: 'power2.out',
            transformPerspective: 1000,
            transformStyle: "preserve-3d"
        });

        card.querySelectorAll('h3, p, button').forEach((el, index) => {
            gsap.to(el, {
                duration: 0.5,
                z: 50 + (index * 20),
                ease: 'power2.out'
            });
        });
    }

    function card3DResetHandler() {
        const card = this;
        gsap.to(card, {
            duration: 0.5,
            rotationY: 0,
            rotationX: 0,
            scale: 1,
            ease: 'power2.out'
        });

        card.querySelectorAll('h3, p, button').forEach(el => {
            gsap.to(el, {
                duration: 0.5,
                z: 0,
                ease: 'power2.out'
            });
        });
    }
    
    // Adicione isso após a inicialização do cursor personalizado
    const dropdownButton = document.querySelector('nav .group > button');
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

    // Remova estes eventos de mouse
    // dropdownButton.addEventListener('mouseenter', () => {
    //     dropdownMenu.classList.remove('hidden');
    // });

    // const navGroup = document.querySelector('nav .group');
    // navGroup.addEventListener('mouseleave', () => {
    //     dropdownMenu.classList.add('hidden');
    // });

    // Adicione esta função no escopo global do seu script
    function applyInteractiveCursorEffect() {
        const cursor = document.querySelector('.custom-cursor');
        document.querySelectorAll('button, .product-card, a, input, textarea, select').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('interactive');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('interactive');
            });
        });
    }

    const messageCount = document.getElementById('messageCount');

    function updateMessageCount() {
        const count = parseInt(localStorage.getItem('newMessageCount') || '0');
        if (count > 0) {
            messageCount.textContent = count;
            messageCount.classList.remove('hidden');
        } else {
            messageCount.classList.add('hidden');
        }
    }

    // Atualiza o contador a cada 5 segundos
    setInterval(updateMessageCount, 5000);

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // ... (código existente) ...
            updateMessageCount();
        } else {
            // ... (código existente) ...
            messageCount.classList.add('hidden');
        }
    });

    // Adicione um evento de clique para o link do chat
    const chatLink = document.querySelector('a[href="chat.html"]');
    chatLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('newMessageCount', '0');
        window.location.href = 'chat.html';
    });
});