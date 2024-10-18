document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const formTitle = document.getElementById('formTitle');
    const toggleAuth = document.getElementById('toggleAuth');
    const nameField = document.getElementById('nameField');
    const cursor = document.querySelector('.custom-cursor');
    let isLogin = true;

    const db = firebase.firestore();

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

    // Custom cursor
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { duration: 0.2, left: e.clientX, top: e.clientY });
    });

    // Hover effect for interactive elements
    document.querySelectorAll('button, input, a').forEach(el => {
        el.addEventListener('mouseenter', () => {
            gsap.to(cursor, { duration: 0.3, scale: 1.5, mixBlendMode: 'difference' });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(cursor, { duration: 0.3, scale: 1, mixBlendMode: 'normal' });
        });
    });

    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        if (isLogin) {
            formTitle.textContent = 'Login';
            formTitle.setAttribute('data-text', 'Login');
            toggleAuth.textContent = 'Criar uma conta';
            nameField.classList.add('hidden');
        } else {
            formTitle.textContent = 'Cadastro';
            formTitle.setAttribute('data-text', 'Cadastro');
            toggleAuth.textContent = 'Já tem uma conta? Faça login';
            nameField.classList.remove('hidden');
        }
        formTitle.classList.add('animate-pulse');
        setTimeout(() => formTitle.classList.remove('animate-pulse'), 1000);
    });

    // Função para obter parâmetros da URL
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Verificar se há um código de referência na URL
    const referralCode = getUrlParameter('ref');
    if (referralCode) {
        document.getElementById('referralCode').value = referralCode;
    }

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const referralCode = document.getElementById('referralCode').value;

        try {
            if (isLogin) {
                // Tenta fazer login
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                
                // Verifica se o e-mail foi confirmado
                if (!userCredential.user.emailVerified) {
                    // Se o e-mail não foi verificado, mostra uma mensagem e faz logout
                    showCustomMessage('Por favor, verifique seu e-mail antes de fazer login.', true);
                    await userCredential.user.sendEmailVerification();
                    await firebase.auth().signOut();
                } else {
                    // Se o e-mail foi verificado, permite o login
                    showLoadingScreen();
                }
            } else {
                const name = document.getElementById('name').value;
                
                // Verificar se o nome já existe
                const nameExists = await checkIfNameExists(name);
                if (nameExists) {
                    showErrorMessage('auth/name-already-in-use');
                    return;
                }

                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({ displayName: name });
                
                // Enviar e-mail de verificação
                await userCredential.user.sendEmailVerification();
                
                // Armazenar temporariamente os dados do usuário
                localStorage.setItem('pendingUserData', JSON.stringify({
                    name,
                    email,
                    referralCode
                }));
                
                // Mostrar mensagem para o usuário verificar o e-mail
                showVerificationMessage();
                
                // Fazer logout do usuário até que ele verifique o e-mail
                await firebase.auth().signOut();
            }
        } catch (error) {
            console.error("Erro durante autenticação:", error);
            showErrorMessage(error.code);
        }
    });

    // Adicione esta nova função para verificar se o nome já existe
    async function checkIfNameExists(name) {
        const nameQuery = await db.collection('usuarios').where('nome', '==', name).get();
        return !nameQuery.empty;
    }

    function showVerificationMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
        messageDiv.innerHTML = `
            <div class="bg-black bg-opacity-80 text-white p-8 rounded-lg shadow-lg text-center neon-border custom-message max-w-md mx-4">
                <p class="text-xl mb-4">Um e-mail de verificação foi enviado.</p>
                <p class="text-lg mb-4">Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.</p>
                <p class="text-base mb-6">Após verificar seu e-mail, você poderá fazer login.</p>
                <button id="closeMessageBtn" class="neon-button neon-button-blue">Fechar</button>
            </div>
        `;

        document.body.appendChild(messageDiv);

        const closeBtn = messageDiv.querySelector('#closeMessageBtn');
        closeBtn.addEventListener('click', () => {
            messageDiv.remove();
            // Recarregar a página para voltar ao estado de login
            window.location.reload();
        });
    }

    async function updateReferrerExperience(referralCode) {
        try {
            console.log("Procurando usuário com código de referência:", referralCode);
            const referrerQuery = await db.collection('usuarios').where('customId', '==', referralCode).get();
            if (!referrerQuery.empty) {
                const referrerDoc = referrerQuery.docs[0];
                const referrerId = referrerDoc.id;
                const referrerData = referrerDoc.data();
                const oldExperience = referrerData.experiencia || 0;
                const newExperience = oldExperience + 50;
                
                console.log("Atualizando experiência para o usuário:", referrerId);
                
                const oldLevel = calculateLevel(oldExperience);
                const newLevel = calculateLevel(newExperience);
                
                const updateData = {
                    experiencia: newExperience,
                    nivel: newLevel
                };

                await db.collection('usuarios').doc(referrerId).update(updateData);
                
                console.log(`Experiência atualizada para o usuário ${referrerId}: ${newExperience}`);
            } else {
                console.log(`Código de referência não encontrado: ${referralCode}`);
            }
        } catch (error) {
            console.error("Erro ao atualizar experiência do referenciador:", error);
        }
    }

    function calculateLevel(experience) {
        if (experience < 100) return 'Novato';
        if (experience < 500) return 'Intermediário';
        if (experience < 1000) return 'Avançado';
        if (experience < 2000) return 'Mestre';
        return 'Lendário';
    }

    function showErrorMessage(errorCode) {
        let errorMessage = '';
        switch (errorCode) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'E-mail inválido. Por favor, verifique o endereço de e-mail.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Usuário não encontrado. Verifique seu e-mail ou crie uma nova conta.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Senha incorreta. Por favor, tente novamente.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Senha fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/name-already-in-use':
                errorMessage = 'Este nome já está em uso. Por favor, escolha outro nome.';
                break;
            default:
                errorMessage = 'Ocorreu um erro. Por favor, tente novamente mais tarde.';
        }

        const errorElement = document.createElement('div');
        errorElement.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4';
        errorElement.innerHTML = `<strong class="font-bold">Erro!</strong> <span class="block sm:inline">${errorMessage}</span>`;
        
        const existingError = authForm.querySelector('.bg-red-100');
        if (existingError) {
            existingError.remove();
        }
        
        authForm.appendChild(errorElement);

        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    function showLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
        loadingScreen.innerHTML = `
            <div class="text-center">
                <h2 class="text-3xl font-extrabold mb-4 text-blue-400 animate-pulse glitch" data-text="Bem-vindo à Sublyme!">Bem-vindo à Sublyme!</h2>
                <p class="text-xl text-gray-300">Espero que você encontre o que procura...</p>
                <div class="mt-4 w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
            </div>
        `;
        document.body.appendChild(loadingScreen);

        setTimeout(() => {
            window.location.href = 'principal.html';
        }, 3000); // Redireciona após 3 segundos
    }

    // Easter egg: Konami Code
    let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                alert('Código secreto ativado! Você desbloqueou um desconto especial!');
                document.body.classList.add('discount-mode');
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    // Adicionar efeito de hover 3D ao formulário
    const loginCard = document.querySelector('.neon-border');
    loginCard.addEventListener('mousemove', (e) => {
        const { left, top, width, height } = loginCard.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;
        
        const tiltX = (y - 0.5) * 10;
        const tiltY = (x - 0.5) * 10;
        
        gsap.to(loginCard, {
            duration: 0.5,
            rotationX: -tiltX,
            rotationY: tiltY,
            transformPerspective: 1000,
            ease: 'power2.out'
        });
    });

    loginCard.addEventListener('mouseleave', () => {
        gsap.to(loginCard, {
            duration: 0.5,
            rotationX: 0,
            rotationY: 0,
            transformPerspective: 1000,
            ease: 'power2.out'
        });
    });

    // Adicione isso após as outras declarações de constantes no topo do arquivo
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Adicione isso após os outros event listeners
    togglePassword.addEventListener('click', function (e) {
        // Alterna o tipo do input entre "password" e "text"
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Alterna o ícone
        this.querySelector('svg').innerHTML = type === 'password' 
            ? '<path fill="currentColor" d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"></path>'
            : '<path fill="currentColor" d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"></path>';
    });

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && user.emailVerified) {
            const pendingUserData = localStorage.getItem('pendingUserData');
            if (pendingUserData) {
                const { name, email, referralCode } = JSON.parse(pendingUserData);
                
                // Verificar novamente se o nome já existe antes de salvar
                const nameExists = await checkIfNameExists(name);
                if (nameExists) {
                    showCustomMessage('O nome escolhido já está em uso. Por favor, faça login novamente e escolha outro nome.');
                    await firebase.auth().signOut();
                    localStorage.removeItem('pendingUserData');
                    return;
                }

                // Criar ID personalizado único
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 8);
                const customId = `user-${timestamp}-${randomString}`;
                
                // Salvar dados do usuário no Firestore
                await db.collection('usuarios').doc(user.uid).set({
                    nome: name,
                    email: email,
                    nivel: 'Novato',
                    experiencia: 0,
                    customId: customId
                });

                console.log("Novo usuário criado:", user.uid);

                // Se houver um código de referência, atualizar a experiência do usuário que referenciou
                if (referralCode) {
                    console.log("Código de referência encontrado:", referralCode);
                    await updateReferrerExperience(referralCode);
                }

                // Limpar os dados temporários
                localStorage.removeItem('pendingUserData');

                showLoadingScreen();
            }
        } else if (user && !user.emailVerified) {
            // Se o usuário está logado mas o e-mail não está verificado, fazer logout
            await firebase.auth().signOut();
        }
    });

    function showCustomMessage(message, isConfirmation = false, onConfirm = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
        messageDiv.innerHTML = `
            <div class="bg-black bg-opacity-80 text-white p-8 rounded-lg shadow-lg text-center neon-border custom-message max-w-md w-full mx-4">
                <p class="text-2xl mb-6 neon-text">${message}</p>
                ${isConfirmation ? `
                    <div class="flex justify-center space-x-4">
                        <button id="confirmBtn" class="neon-button neon-button-blue">Confirmar</button>
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(messageDiv);

        // Animação de entrada
        gsap.from(messageDiv.firstElementChild, {duration: 0.5, opacity: 0, scale: 0.8, ease: "back.out(1.7)"});

        if (isConfirmation) {
            const confirmBtn = messageDiv.querySelector('#confirmBtn');
            const cancelBtn = messageDiv.querySelector('#cancelBtn');

            confirmBtn.addEventListener('click', () => {
                if (onConfirm) onConfirm();
                removeMessage();
            });

            cancelBtn.addEventListener('click', removeMessage);
        } else {
            // Remove a mensagem após 3 segundos com animação de saída
            setTimeout(removeMessage, 3000);
        }

        function removeMessage() {
            gsap.to(messageDiv.firstElementChild, {
                duration: 0.5, 
                opacity: 0, 
                scale: 0.8, 
                ease: "back.in(1.7)", 
                onComplete: () => messageDiv.remove()
            });
        }

        return messageDiv;
    }
});