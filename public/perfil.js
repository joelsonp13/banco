document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');

    const userInfo = document.getElementById('userInfo');
    const profilePic = document.getElementById('profilePic');
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePicContainer = document.getElementById('profilePicContainer');

    // Inicialize o Firebase Storage
    const storage = firebase.storage();

    // Remova ou comente todas as funções relacionadas ao Vanta.js e à personalização de partículas

    firebase.auth().onAuthStateChanged((user) => {
        console.log('Estado de autenticação alterado');
        if (user) {
            console.log('Usuário autenticado:', user.uid);
            const db = firebase.firestore();
            
            db.collection('usuarios').doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    updateUserInfo(userData, user);
                    loadProfilePicture(userData.profilePicUrl);
                    
                    // Verifica se existem personalizações e inicializa as partículas
                    if (userData.personalizacoes) {
                        initializeParticles(
                            userData.personalizacoes.particleImageUrl,
                            userData.personalizacoes.particleColor,
                            userData.personalizacoes.particleCount,
                            userData.personalizacoes.particleSize
                        );
                    } else {
                        initializeParticles(null, "#ffffff", 80, 5);
                    }
                } else {
                    console.log("No such document!");
                }
            }).catch((error) => {
                console.log("Error getting document:", error);
            });

            profilePicContainer.addEventListener('click', () => {
                profilePicInput.click();
            });

            profilePicInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    uploadProfilePicture(file, user.uid);
                }
            });
        } else {
            console.log('Usuário não autenticado. Redirecionando para login.html');
            window.location.href = 'login.html';
        }
    });

    // Lógica do cursor personalizado
    const cursor = document.querySelector('.custom-cursor');

    // Custom cursor
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { duration: 0.2, left: e.clientX, top: e.clientY });
    });

    // Hover effect for interactive elements
    function applyInteractiveCursorEffect() {
        document.querySelectorAll('button, input, a, select, .profile-pic-container, #customizeBtn, #logoutBtn').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('interactive');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('interactive');
            });
        });
    }

    applyInteractiveCursorEffect();

    function updateUserInfo(userData, user) {
        const experience = userData.experiencia !== undefined ? userData.experiencia : 0;
        const currentLevel = calculateLevel(experience);

        // Verifica se o nível atual é diferente do nível armazenado
        if (currentLevel !== userData.nivel) {
            showLevelUpMessage(currentLevel);
            // Atualiza o nível no Firestore
            db.collection('usuarios').doc(user.uid).update({ 
                nivel: currentLevel,
                levelUpMessageShown: false
            });
        }

        userInfo.innerHTML = `
            <div class="user-info-item"><strong>Nome:</strong> ${userData.nome || 'Não informado'}</div>
            <div class="user-info-item"><strong>E-mail:</strong> ${user.email}</div>
            <div class="user-info-item flex items-center space-x-2">
                <strong>Senha:</strong>
                <span>********</span>
                <button id="changePasswordBtn" class="icon-button" title="Redefinir Senha">
                    <i class="fas fa-key"></i>
                </button>
            </div>
            <div class="user-info-item"><strong>Nível:</strong> ${currentLevel}</div>
            <div class="user-info-item"><strong>Experiência:</strong> ${experience}</div>
            <div class="user-info-item"><strong>Tipo de Usuário:</strong> ${userData.isVendedor ? 'Vendedor' : 'Cliente'}</div>
            <div class="user-info-item"><strong>Data de Registro:</strong> ${user.metadata.creationTime}</div>
            <div class="user-info-item"><strong>Último Login:</strong> ${user.metadata.lastSignInTime}</div>
            <div class="user-info-item">
                <strong>Seu Link de Referência:</strong><br>
                <input type="text" value="https://seusite.com/login.html?ref=${userData.customId}" 
                       readonly class="bg-gray-700 text-white p-2 rounded w-full mt-2">
                <button onclick="copyToClipboard(this)" class="bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600 transition duration-300">Copiar Link</button>
            </div>
        `;

        // Removemos o togglePasswordBtn e seu event listener

        const changePasswordBtn = document.getElementById('changePasswordBtn');

        let isChangingPassword = false;

        changePasswordBtn.addEventListener('click', () => {
            if (isChangingPassword) return;
            isChangingPassword = true;
            changePasswordBtn.disabled = true;
            changePasswordBtn.classList.add('opacity-50', 'cursor-not-allowed');

            const messageDiv = showCustomMessage("Deseja redefinir sua senha? Um e-mail será enviado com as instruções.", true, () => {
                firebase.auth().sendPasswordResetEmail(user.email).then(() => {
                    showCustomMessage('Um e-mail para redefinição de senha foi enviado para o seu endereço de e-mail.');
                }).catch((error) => {
                    console.error('Erro ao enviar e-mail de redefinição de senha:', error);
                    showCustomMessage('Erro ao enviar e-mail de redefinição de senha. Por favor, tente novamente mais tarde.');
                });
            });

            messageDiv.addEventListener('click', (e) => {
                if (e.target === messageDiv) {
                    messageDiv.remove();
                    resetChangePasswordState();
                }
            });

            const cancelBtn = messageDiv.querySelector('#cancelBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', resetChangePasswordState);
            }
        });

        function resetChangePasswordState() {
            isChangingPassword = false;
            changePasswordBtn.disabled = false;
            changePasswordBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        applyInteractiveCursorEffect(); // Aplica o efeito do cursor após atualizar as informações do usuário
    }

    function calculateLevel(experience) {
        if (experience < 100) return 'Novato';
        if (experience < 500) return 'Intermediário';
        if (experience < 1000) return 'Avançado';
        if (experience < 2000) return 'Mestre';
        return 'Lendário';
    }

    function showLevelUpMessage(newLevel) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white p-8 rounded-lg shadow-lg z-50 text-center neon-border level-up-message';
        messageDiv.innerHTML = `
            <h2 class="text-4xl font-bold mb-4 neon-text glitch" data-text="Parabéns!">Parabéns!</h2>
            <p class="text-2xl mb-4">Você subiu para o nível</p>
            <p class="text-5xl font-bold mb-6 neon-text">${newLevel}</p>
            <p class="text-xl">Continue evoluindo e desbloqueando novas habilidades!</p>
        `;
        document.body.appendChild(messageDiv);

        // Adiciona animação de entrada
        gsap.from(messageDiv, {duration: 0.5, scale: 0, ease: "back.out(1.7)"});

        // Remove a mensagem após 5 segundos com animação de saída
        setTimeout(() => {
            gsap.to(messageDiv, {
                duration: 0.5, 
                scale: 0, 
                opacity: 0, 
                ease: "back.in(1.7)", 
                onComplete: () => messageDiv.remove()
            });
        }, 5000);
    }

    // Função para copiar o link para a área de transferência
    window.copyToClipboard = function(button) {
        const input = button.previousElementSibling;
        input.select();
        document.execCommand('copy');
        button.textContent = 'Copiado!';
        setTimeout(() => {
            button.textContent = 'Copiar Link';
        }, 2000);
    }

    function loadProfilePicture(url) {
        if (url) {
            profilePic.src = url;
        } else {
            profilePic.src = 'path/to/default-profile-pic.jpg';
        }
    }

    function uploadProfilePicture(file, userId) {
        const storageRef = storage.ref(`profile_pictures/${userId}`);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // Progresso do upload
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            }, 
            (error) => {
                // Erro no upload
                console.error('Error uploading picture:', error);
            }, 
            () => {
                // Upload completo
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    updateProfilePictureUrl(userId, downloadURL);
                    profilePic.src = downloadURL;
                });
            }
        );
    }

    function updateProfilePictureUrl(userId, url) {
        const db = firebase.firestore();
        db.collection('usuarios').doc(userId).update({
            profilePicUrl: url
        }).then(() => {
            console.log("Profile picture URL updated successfully");
        }).catch((error) => {
            console.error("Error updating profile picture URL:", error);
        });
    }

    function showCustomMessage(message, isConfirmation = false, onConfirm = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'fixed inset-0 flex items-center justify-center z-50';
        messageDiv.innerHTML = `
            <div class="bg-black bg-opacity-80 text-white p-8 rounded-lg shadow-lg text-center neon-border custom-message">
                <p class="text-2xl mb-6">${message}</p>
                ${isConfirmation ? `
                    <div class="flex justify-center space-x-4">
                        <button id="confirmBtn" class="neon-button neon-button-blue">Confirmar</button>
                        <button id="cancelBtn" class="neon-button neon-button-red">Cancelar</button>
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

    function initializeParticles(particleImageUrl, particleColor, particleCount, particleSize) {
        const particlesConfig = {
            particles: {
                number: {
                    value: parseInt(particleCount) || 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: particleColor || "#ffffff"
                },
                shape: {
                    type: particleImageUrl ? "image" : "circle",
                    image: {
                        src: particleImageUrl,
                        width: 100,
                        height: 100
                    }
                },
                opacity: {
                    value: 0.5,
                    random: false,
                    anim: {
                        enable: false,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                    }
                },
                size: {
                    value: parseInt(particleSize) || 5,
                    random: true,
                    anim: {
                        enable: false,
                        speed: 40,
                        size_min: 0.1,
                        sync: false
                    }
                },
                line_linked: {
                    enable: false
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: "none",
                    random: false,
                    straight: false,
                    out_mode: "out",
                    bounce: false,
                    attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200
                    }
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: {
                        enable: true,
                        mode: "repulse"
                    },
                    onclick: {
                        enable: true,
                        mode: "push"
                    },
                    resize: true
                },
                modes: {
                    repulse: {
                        distance: 100,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: true
        };

        particlesJS('particles-js', particlesConfig);
    }

    // Adicione este código no final do arquivo perfil.js

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

    // Certifique-se de que o evento de logout já está configurado
    // Se não estiver, adicione o seguinte código:
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Erro ao fazer logout:', error);
        });
    });

    document.getElementById('customizeBtn').addEventListener('click', () => {
        document.getElementById('customizeModal').classList.remove('hidden');
        loadCurrentCustomization(); // Carrega as personalizações atuais
    });

    function loadCurrentCustomization() {
        const userId = firebase.auth().currentUser.uid;
        firebase.firestore().collection('usuarios').doc(userId).get()
            .then((doc) => {
                if (doc.exists && doc.data().personalizacoes) {
                    const data = doc.data().personalizacoes;
                    
                    // Preencha os campos do modal com os dados carregados
                    document.getElementById('bgColor').value = data.bgColor || '#000000';
                    document.getElementById('textColor').value = data.textColor || '#ffffff';
                    document.getElementById('profileEffect').value = data.profileEffect || 'none';
                    document.getElementById('particleColor').value = data.particleColor || '#ffffff';
                    document.getElementById('particleCount').value = data.particleCount || '80';
                    document.getElementById('particleSize').value = data.particleSize || '5';
                    document.getElementById('particleDirection').value = data.particleDirection || 'none';
                    
                    // Se houver mais campos no seu modal de personalização, adicione-os aqui

                    // Atualize a visualização das partículas
                    updateParticles(data.particleImageUrl, data.particleColor, data.particleCount, data.particleSize);

                    console.log('Personalizações carregadas com sucesso');
                } else {
                    console.log('Nenhuma personalização encontrada');
                }
            })
            .catch((error) => {
                console.error("Erro ao carregar personalização:", error);
            });
    }

    function updateParticles(particleImageUrl, particleColor, particleCount, particleSize) {
        // Atualize a configuração das partículas
        const particlesConfig = {
            particles: {
                number: {
                    value: parseInt(particleCount) || 80,
                },
                color: {
                    value: particleColor || "#ffffff"
                },
                shape: {
                    type: particleImageUrl ? "image" : "circle",
                    image: {
                        src: particleImageUrl,
                        width: 100,
                        height: 100
                    }
                },
                size: {
                    value: parseInt(particleSize) || 5,
                }
                // ... outras configurações de partículas
            }
            // ... outras configurações
        };

        // Recarregue as partículas com a nova configuração
        if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
            window.pJSDom[0].pJS.fn.particlesRefresh();
        } else {
            particlesJS('particles-js', particlesConfig);
        }
    }
});