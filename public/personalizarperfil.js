// No início do arquivo
let particlesLoaded = false;
let particlesConfig = null;

// Mova estas variáveis para o escopo global
let audioPlayer = null;
let isMuted = false;
let currentVolume = 0.5; // Valor padrão para o volume (50%)

// No início do arquivo, após as outras declarações de variáveis
let particleCountInput, particleColorInput, particleDirectionSelect, particleSizeInput, particleShapeSelect;

// Adicione esta variável global
let particleImageInput;

// Adicione esta função no início do arquivo
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}


// Função para inicializar os elementos do DOM
function initializeElements() {
    particleCountInput = document.getElementById('particleCount');
    particleColorInput = document.getElementById('particleColor');
    particleDirectionSelect = document.getElementById('particleDirection');
    particleSizeInput = document.getElementById('particleSize');
    particleShapeSelect = document.getElementById('particleShape');
    particleImageInput = document.getElementById('particleImage');
}

// Defina a função initParticleEffect no escopo global
function initParticleEffect() {
    console.log('Iniciando efeito de partículas');
    if (window.particlesJS) {
        console.log('particlesJS está disponível');
        fetch('particles.json')
            .then(response => response.json())
            .then(config => {
                particlesConfig = config;
                console.log('Configuração de partículas carregada:', particlesConfig);
                initializeElements(); // Inicialize os elementos antes de chamar updateParticles
                updateParticles();
            })
            .catch(error => {
                console.error('Erro ao carregar particles.json:', error);
            });
    } else {
        console.log('particles.js ainda não está carregado. Tentando novamente em 100ms.');
        setTimeout(initParticleEffect, 100);
    }
}

// Modifique a função updateParticles para aceitar parâmetros opcionais
function updateParticles(customization) {
    if (!particlesConfig) {
        console.log('Configuração de partículas não carregada');
        return;
    }

    const particleCount = customization?.particleCount || particleCountInput?.value || 80;
    const particleColor = customization?.particleColor || particleColorInput?.value || '#ffffff';
    const particleSize = customization?.particleSize || particleSizeInput?.value || 3;
    const particleDirection = customization?.particleDirection || particleDirectionSelect?.value || 'none';

    console.log('Atualizando partículas:', { particleCount, particleColor, particleSize, particleDirection });

    particlesConfig.particles.number.value = parseInt(particleCount);
    particlesConfig.particles.color.value = particleColor;
    particlesConfig.particles.size.value = parseInt(particleSize);

    // Verifica se uma imagem foi selecionada ou se há uma URL de imagem personalizada
    if (customization?.particleImageUrl) {
        loadParticleImage(customization.particleImageUrl);
    } else if (particleImageInput && particleImageInput.files && particleImageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preloadImage(e.target.result).then(img => {
                particlesConfig.particles.shape.type = 'image';
                particlesConfig.particles.shape.image = {
                    src: e.target.result,
                    width: img.width,
                    height: img.height
                };
                applyParticleChanges();
            }).catch(error => {
                console.error('Erro ao carregar a imagem da partícula:', error);
                particlesConfig.particles.shape.type = 'circle';
                delete particlesConfig.particles.shape.image;
                applyParticleChanges();
            });
        };
        reader.readAsDataURL(particleImageInput.files[0]);
    } else {
        particlesConfig.particles.shape.type = 'circle';
        delete particlesConfig.particles.shape.image;
        applyParticleChanges();
    }
}


function loadParticleImage(url) {
    preloadImage(url).then(img => {
        particlesConfig.particles.shape.type = 'image';
        particlesConfig.particles.shape.image = {
            src: url,
            width: img.width,
            height: img.height
        };
        applyParticleChanges();
    }).catch(error => {
        console.error('Erro ao carregar a imagem da partícula:', error);
        particlesConfig.particles.shape.type = 'circle';
        delete particlesConfig.particles.shape.image;
        applyParticleChanges();
    });
}

function applyParticleChanges() {
    // Configurações específicas para cada tipo de partícula
    switch (particleDirection) {
        case 'rain':
            particlesConfig.particles.move.direction = 'bottom';
            particlesConfig.particles.move.speed = 15;
            particlesConfig.particles.opacity.value = 0.6;
            break;
        case 'ember':
            particlesConfig.particles.move.direction = 'top';
            particlesConfig.particles.move.speed = 3;
            particlesConfig.particles.color.value = '#ff3300';
            break;
        case 'snow':
            particlesConfig.particles.move.direction = 'bottom';
            particlesConfig.particles.move.speed = 2;
            particlesConfig.particles.opacity.random = true;
            break;
        default:
            particlesConfig.particles.move.direction = 'none';
            particlesConfig.particles.move.speed = 2;
            break;
    }

    if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
        const pJS = window.pJSDom[0].pJS;
        
        pJS.particles.number.value = particlesConfig.particles.number.value;
        pJS.particles.color.value = particlesConfig.particles.color.value;
        pJS.particles.size.value = particlesConfig.particles.size.value;
        pJS.particles.move.speed = particlesConfig.particles.move.speed;
        pJS.particles.move.direction = particlesConfig.particles.move.direction;
        pJS.particles.opacity.value = particlesConfig.particles.opacity.value;
        pJS.particles.opacity.random = particlesConfig.particles.opacity.random;
        
        // Atualizar a forma das partículas
        pJS.particles.shape.type = particlesConfig.particles.shape.type;
        if (particlesConfig.particles.shape.type === 'image') {
            pJS.particles.shape.image = particlesConfig.particles.shape.image;
        }

        // Recriar todas as partículas com as novas configurações
        pJS.particles.array = [];
        pJS.fn.particlesCreate();
        pJS.fn.particlesUpdate();

        console.log('Partículas atualizadas com sucesso');
    } else {
        console.log('Reinicializando partículas');
        window.particlesJS('particles-js', particlesConfig);
    }
    particlesLoaded = true;
    console.log('Partículas atualizadas:', particlesConfig);
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado');
    initializeElements(); // Inicialize os elementos aqui também
    const particlesContainer = document.getElementById('particles-js');
    if (particlesContainer) {
        console.log('Elemento particles-js encontrado');
        initParticleEffect();
    } else {
        console.error('Elemento particles-js não encontrado');
    }

    // Elementos do DOM
    const customizeBtn = document.getElementById('customizeBtn');
    const customizeModal = document.getElementById('customizeModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const saveCustomizationBtn = document.getElementById('saveCustomizationBtn');
    const bgColorInput = document.getElementById('bgColor');
    const textColorInput = document.getElementById('textColor');
    const profileEffectSelect = document.getElementById('profileEffect');
    // Remova a referência ao musicVisualizerSelect
    // const musicVisualizerSelect = document.getElementById('musicVisualizer');
    const backgroundMusicInput = document.getElementById('backgroundMusic');
    const particleColorInput = document.getElementById('particleColor');
    const particleCountInput = document.getElementById('particleCount');

    // Verificar se todos os elementos foram encontrados
    if (!customizeBtn || !customizeModal || !closeModalBtn || !saveCustomizationBtn ||
        !bgColorInput || !textColorInput || !profileEffectSelect || !backgroundMusicInput ||
        !particleColorInput || !particleCountInput) {
        console.error('Alguns elementos não foram encontrados no DOM');
        return;
    }

    // Evento para abrir o modal
    customizeBtn.addEventListener('click', function() {
        customizeModal.classList.remove('hidden');
        loadCurrentCustomization();
    });

    // Evento para fechar o modal
    closeModalBtn.addEventListener('click', function() {
        customizeModal.classList.add('hidden');
    });

    // Evento para salvar a personalização
    saveCustomizationBtn.addEventListener('click', saveCustomization);

    // Carregar personalização atual
    function loadCurrentCustomization() {
        const userId = firebase.auth().currentUser.uid;
        firebase.firestore().collection('usuarios').doc(userId).get()
            .then((doc) => {
                if (doc.exists && doc.data().personalizacoes) {
                    const data = doc.data().personalizacoes;
                    bgColorInput.value = data.bgColor || '#000000';
                    textColorInput.value = data.textColor || '#ffffff';
                    profileEffectSelect.value = data.profileEffect || 'none';
                    particleColorInput.value = data.particleColor || '#0000ff';
                    particleCountInput.value = data.particleCount || '80';
                    
                    // Carregar tipo de fundo e atualizar controles
                    if (data.backgroundType) {
                        document.getElementById('backgroundType').value = data.backgroundType;
                        updateBackgroundControls(data.backgroundType);
                    }

                    // Carregar cor de fundo ou cores do gradiente
                    if (data.backgroundColor) {
                        document.getElementById('backgroundColor').value = data.backgroundColor;
                    }
                    if (data.gradientColor1) {
                        document.getElementById('gradientColor1').value = data.gradientColor1;
                    }
                    if (data.gradientColor2) {
                        document.getElementById('gradientColor2').value = data.gradientColor2;
                    }

                    // Carregar tipo de partícula e atualizar controles
                    if (data.particleType) {
                        document.getElementById('particleType').value = data.particleType;
                        updateParticleControls(data.particleType);
                    }

                    // Carregar tamanho e direção das partículas
                    if (data.particleSize) {
                        document.getElementById('particleSize').value = data.particleSize;
                    }
                    if (data.particleDirection) {
                        document.getElementById('particleDirection').value = data.particleDirection;
                    }

                    updatePreview();
                }
            })
            .catch((error) => {
                console.error("Erro ao carregar personalização:", error);
            });
    }

    // Função auxiliar para atualizar os controles de partículas
    function updateParticleControls(particleType) {
        const particleColorControl = document.getElementById('particleColorControl');
        const particleImageControl = document.getElementById('particleImageControl');

        if (particleType === 'color') {
            particleColorControl.classList.remove('hidden');
            particleImageControl.classList.add('hidden');
        } else {
            particleColorControl.classList.add('hidden');
            particleImageControl.classList.remove('hidden');
        }
    }

    // Função auxiliar para atualizar os controles de fundo
    function updateBackgroundControls(backgroundType) {
        const backgroundImageControl = document.getElementById('backgroundImageControl');
        const backgroundColorControl = document.getElementById('backgroundColorControl');
        const backgroundGradientControl = document.getElementById('backgroundGradientControl');

        backgroundImageControl.classList.add('hidden');
        backgroundColorControl.classList.add('hidden');
        backgroundGradientControl.classList.add('hidden');

        switch (backgroundType) {
            case 'image':
                backgroundImageControl.classList.remove('hidden');
                break;
            case 'color':
                backgroundColorControl.classList.remove('hidden');
                break;
            case 'gradient':
                backgroundGradientControl.classList.remove('hidden');
                break;
        }
    }

    // Função para atualizar a pré-visualização
    function updatePreview() {
        const customization = getCustomizationFromInputs();
        applyCustomization(customization, true);
    }

    function getCustomizationFromInputs() {
        return {
            bgColor: document.getElementById('bgColor').value,
            textColor: document.getElementById('textColor').value,
            profileEffect: document.getElementById('profileEffect').value,
            particleType: document.getElementById('particleType').value,
            particleColor: document.getElementById('particleColor').value,
            particleCount: document.getElementById('particleCount').value,
            particleSize: document.getElementById('particleSize').value,
            particleDirection: document.getElementById('particleDirection').value,
            backgroundType: document.getElementById('backgroundType').value,
            backgroundColor: document.getElementById('backgroundColor').value,
            gradientColor1: document.getElementById('gradientColor1').value,
            gradientColor2: document.getElementById('gradientColor2').value,
            // Não incluímos backgroundMusicUrl e backgroundImageUrl aqui porque eles requerem upload de arquivo
        };
    }

    function applyCustomization(customization, isPreview = false) {
        // Aplicar cores e efeitos
        document.body.style.backgroundColor = customization.bgColor;
        document.body.style.color = customization.textColor;
        applyProfileEffect(customization.profileEffect);

        // Aplicar partículas
        updateParticles(customization);

        // Aplicar música de fundo
        if (customization.backgroundMusicUrl) {
            loadAndPlayBackgroundMusic(customization.backgroundMusicUrl);
        } else if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer = null;
        }

        // Aplicar tipo de fundo
        applyBackgroundType(customization, isPreview);

        if (!isPreview) {
            showCustomMessage("Personalização aplicada com sucesso!");
        }
    }

    function applyBackgroundType(customization, isPreview) {
        switch (customization.backgroundType) {
            case 'image':
                if (customization.backgroundImageUrl) {
                    document.body.style.backgroundImage = `url(${customization.backgroundImageUrl})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                }
                break;
            case 'color':
                document.body.style.backgroundImage = 'none';
                document.body.style.backgroundColor = customization.backgroundColor;
                break;
            case 'gradient':
                document.body.style.backgroundImage = `linear-gradient(to bottom right, ${customization.gradientColor1}, ${customization.gradientColor2})`;
                break;
            case 'vanta':
                // Implemente a lógica para o fundo Vanta aqui
                break;
        }
    }

    function loadAndPlayBackgroundMusic(url) {
        if (audioPlayer) {
            audioPlayer.pause();
        }
        audioPlayer = new Audio(url);
        audioPlayer.loop = true;
        audioPlayer.volume = 0.5; // Ajuste o volume conforme necessário
        audioPlayer.play().catch(error => {
            console.error('Erro ao reproduzir o áudio:', error);
        });
    }

    // Adicione este event listener para atualizar a pré-visualização quando qualquer input mudar
    document.querySelectorAll('#customizeModal input, #customizeModal select').forEach(input => {
        input.addEventListener('change', updatePreview);
    });

    // Adicione este event listener para o botão de salvar
    document.getElementById('saveCustomizationBtn').addEventListener('click', () => {
        const customization = getCustomizationFromInputs();
        saveCustomization(customization);
    });

    function saveCustomization(customization) {
        const userId = firebase.auth().currentUser.uid;
        
        // Fazer upload de arquivos, se necessário
        const uploadTasks = [];
        
        if (customization.backgroundMusicUrl) {
            const musicFile = document.getElementById('backgroundMusic').files[0];
            uploadTasks.push(uploadFile(musicFile, `background_music/${userId}`, (downloadURL) => {
                customization.backgroundMusicUrl = downloadURL;
            }));
        }
        
        if (customization.backgroundImageUrl && customization.backgroundType === 'image') {
            const imageFile = document.getElementById('backgroundImage').files[0];
            uploadTasks.push(uploadFile(imageFile, `background_images/${userId}`, (downloadURL) => {
                customization.backgroundImageUrl = downloadURL;
            }));
        }
        
        // Esperar todos os uploads terminarem antes de salvar no Firestore
        Promise.all(uploadTasks).then(() => {
            firebase.firestore().collection('usuarios').doc(userId).update({
                personalizacoes: customization
            }).then(() => {
                showCustomMessage("Personalização salva com sucesso!");
                applyCustomization(customization);
                document.getElementById('customizeModal').classList.add('hidden');
            }).catch((error) => {
                console.error("Erro ao salvar personalização:", error);
                showCustomMessage("Erro ao salvar personalização. Tente novamente.", "error");
            });
        });
    }

    function uploadFile(file, path, callback) {
        return new Promise((resolve, reject) => {
            const storageRef = firebase.storage().ref(path);
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    // Você pode adicionar uma barra de progresso aqui se desejar
                }, 
                (error) => {
                    console.error('Erro no upload:', error);
                    reject(error);
                }, 
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        callback(downloadURL);
                        resolve();
                    });
                }
            );
        });
    }

    // Adicionar event listeners para os inputs
    bgColorInput.addEventListener('change', updatePreview);
    textColorInput.addEventListener('change', updatePreview);
    profileEffectSelect.addEventListener('change', updatePreview);
    // Remova o event listener para musicVisualizerSelect
    // musicVisualizerSelect.addEventListener('change', updatePreview);
    particleColorInput.addEventListener('change', updatePreview);
    particleCountInput.addEventListener('input', updatePreview);

    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const volumeControl = document.getElementById('volumeControl');

    soundToggleBtn.addEventListener('click', function() {
        if (audioPlayer) {
            if (audioPlayer.paused) {
                playBackgroundMusic();
            } else {
                audioPlayer.pause();
            }
            updateSoundIcon();
        }
    });

    function updateSoundIcon() {
        const icon = soundToggleBtn.querySelector('i');
        if (audioPlayer && !audioPlayer.paused) {
            icon.className = 'fas fa-volume-up';
        } else {
            icon.className = 'fas fa-volume-mute';
        }
    }

    volumeControl.addEventListener('input', adjustVolume);

    function adjustVolume() {
        currentVolume = volumeControl.value / 100;
        if (audioPlayer) {
            audioPlayer.volume = isMuted ? 0 : currentVolume;
        }
        updateSoundIcon();
    }

    // Atualizar a função applyCustomization para usar o controle de volume
    function applyCustomization(customization) {
        console.log('Aplicando customização:', customization);
        const userInfoContainer = document.querySelector('.user-info-container');
        userInfoContainer.style.backgroundColor = customization.bgColor;
        userInfoContainer.style.color = customization.textColor;

        applyProfileEffect(customization.profileEffect);

        if (customization.backgroundMusicUrl) {
            loadAndPlayBackgroundMusic(customization.backgroundMusicUrl);
        } else {
            if (audioPlayer) {
                audioPlayer.pause();
                audioPlayer = null;
            }
        }

        // Aplicar tipo de fundo
        switch (customization.backgroundType) {
            case 'image':
                if (customization.backgroundImageUrl) {
                    document.body.style.backgroundImage = `url(${customization.backgroundImageUrl})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                }
                break;
            case 'color':
                document.body.style.backgroundImage = 'none';
                document.body.style.backgroundColor = customization.backgroundColor;
                break;
            case 'gradient':
                document.body.style.backgroundImage = `linear-gradient(to right, ${customization.gradientColor1}, ${customization.gradientColor2})`;
                break;
            case 'vanta':
                // Implemente a lógica para o fundo Vanta aqui
                break;
        }

        // Aplicar outras personalizações...
        updateParticles(customization.particleColor, customization.particleCount);

        // Aplicar o tipo de fundo selecionado
        applyBackgroundType(customization);

        console.log('Customização aplicada com sucesso');
    }

    function applyBackgroundType(customization) {
        const body = document.body;
        const vantaBackground = document.getElementById('vanta-background');

        // Remover qualquer efeito Vanta existente
        if (window.vantaEffect) {
            window.vantaEffect.destroy();
            window.vantaEffect = null;
        }

        // Remover estilos de fundo anteriores
        body.style.backgroundImage = '';
        body.style.backgroundColor = '';

        switch (customization.backgroundType) {
            case 'vanta':
                if (window.VANTA) {
                    if (vantaBackground) {
                        vantaBackground.style.display = 'block';
                    } else {
                        const newVantaBackground = document.createElement('div');
                        newVantaBackground.id = 'vanta-background';
                        newVantaBackground.style.position = 'fixed';
                        newVantaBackground.style.top = '0';
                        newVantaBackground.style.left = '0';
                        newVantaBackground.style.width = '100%';
                        newVantaBackground.style.height = '100%';
                        newVantaBackground.style.zIndex = '-1';
                        document.body.insertBefore(newVantaBackground, document.body.firstChild);
                    }
                    window.vantaEffect = VANTA.NET({
                        el: "#vanta-background",
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        scale: 1.00,
                        scaleMobile: 1.00,
                        color: 0x3f00ff,
                        backgroundColor: 0x0
                    });
                }
                break;
            case 'image':
                if (vantaBackground) vantaBackground.style.display = 'none';
                body.style.backgroundImage = `url(${customization.backgroundImageUrl})`;
                body.style.backgroundSize = 'cover';
                body.style.backgroundPosition = 'center';
                body.style.backgroundRepeat = 'no-repeat';
                break;
            case 'color':
                if (vantaBackground) vantaBackground.style.display = 'none';
                body.style.backgroundColor = customization.backgroundColor;
                break;
            case 'gradient':
                if (vantaBackground) vantaBackground.style.display = 'none';
                body.style.backgroundImage = `linear-gradient(to right, ${customization.gradientColor1}, ${customization.gradientColor2})`;
                break;
        }
    }

    function loadAndPlayBackgroundMusic(url) {
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer = null;
        }

        audioPlayer = new Audio(url);
        audioPlayer.loop = true;
        audioPlayer.volume = isMuted ? 0 : currentVolume;

        audioPlayer.play().catch(error => {
            console.error('Erro ao reproduzir o áudio:', error);
            showCustomMessage("Erro ao reproduzir a música de fundo. Por favor, tente novamente.", "error");
        });
    }

    function playBackgroundMusic() {
        console.log('Tentando reproduzir música de fundo');
        if (audioPlayer && audioPlayer.src) {
            console.log('Estado do audioPlayer antes de play:', audioPlayer.paused ? 'pausado' : 'tocando');
            
            // Verifica se o áudio já está tocando
            if (!audioPlayer.paused) {
                console.log('Áudio já está tocando');
                return;
            }

            // Usa uma Promise para lidar com a reprodução do áudio
            const playPromise = audioPlayer.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Música reproduzindo com sucesso');
                    updateSoundIcon();
                }).catch(error => {
                    if (error.name === 'AbortError') {
                        console.log('Reprodução interrompida, provavelmente devido a uma pausa');
                    } else if (error.name === 'NotAllowedError') {
                        console.log('Reprodução automática bloqueada. Aguardando interação do usuário.');
                        addPlayButton();
                    } else {
                        console.error("Erro ao reproduzir música:", error);
                        showCustomMessage("Erro ao reproduzir música. Por favor, tente novamente.", "error");
                    }
                });
            }
        } else {
            console.error('audioPlayer não está inicializado ou src está vazio');
            showCustomMessage("Nenhuma música selecionada ou URL inválida.", "error");
        }
    }

    function stopBackgroundMusic() {
        if (audioPlayer) {
            const pausePromise = audioPlayer.pause();
            if (pausePromise !== undefined) {
                pausePromise.then(() => {
                    audioPlayer.currentTime = 0;
                    console.log('Música pausada com sucesso');
                }).catch(error => {
                    console.error('Erro ao pausar a música:', error);
                });
            }
        }
    }

    function addPlayButton() {
        const playButton = document.createElement('button');
        playButton.textContent = 'Reproduzir Música';
        playButton.className = 'neon-button neon-button-blue mt-4';
        playButton.addEventListener('click', () => {
            playBackgroundMusic();
            playButton.remove();
        });
        document.querySelector('.user-info-container').appendChild(playButton);
    }

    function applyProfileEffect(effect) {
        const userInfoContainer = document.querySelector('.user-info-container');
        userInfoContainer.style.transition = 'all 0.3s ease';

        // Remover classes e estilos anteriores
        userInfoContainer.classList.remove('effect-3d', 'effect-glow', 'effect-shake', 'effect-flip', 'effect-pulse', 'effect-rainbow', 'effect-particle');
        userInfoContainer.style.transform = 'none';
        userInfoContainer.style.animation = 'none';

        // Remover eventos de mouse anteriores
        userInfoContainer.removeEventListener('mousemove', apply3DEffect);
        userInfoContainer.removeEventListener('mouseleave', reset3DEffect);

        switch (effect) {
            case 'scale':
                userInfoContainer.addEventListener('mouseenter', () => {
                    userInfoContainer.style.transform = 'scale(1.05)';
                });
                userInfoContainer.addEventListener('mouseleave', () => {
                    userInfoContainer.style.transform = 'scale(1)';
                });
                break;
            case 'rotate':
                userInfoContainer.addEventListener('mouseenter', () => {
                    userInfoContainer.style.transform = 'rotate(5deg)';
                });
                userInfoContainer.addEventListener('mouseleave', () => {
                    userInfoContainer.style.transform = 'rotate(0deg)';
                });
                break;
            case '3d':
                userInfoContainer.classList.add('effect-3d');
                // Adicionar um pequeno atraso antes de adicionar os event listeners
                setTimeout(() => {
                    userInfoContainer.addEventListener('mousemove', apply3DEffect);
                    userInfoContainer.addEventListener('mouseleave', reset3DEffect);
                }, 50);
                break;
            case 'glow':
                userInfoContainer.classList.add('effect-glow');
                break;
            case 'shake':
                userInfoContainer.classList.add('effect-shake');
                break;
            case 'flip':
                userInfoContainer.classList.add('effect-flip');
                break;
            case 'pulse':
                userInfoContainer.classList.add('effect-pulse');
                break;
            case 'rainbow':
                userInfoContainer.classList.add('effect-rainbow');
                break;
            case 'particle':
                userInfoContainer.classList.add('effect-particle');
                initParticleEffect(userInfoContainer);
                break;
            default:
                // Nenhum efeito
                break;
        }
    }

    function saveCustomization() {
        const userId = firebase.auth().currentUser.uid;
        const customization = {
            bgColor: document.getElementById('bgColor').value,
            textColor: document.getElementById('textColor').value,
            profileEffect: document.getElementById('profileEffect').value,
            particleType: document.getElementById('particleType').value,
            particleColor: document.getElementById('particleColor').value,
            particleCount: document.getElementById('particleCount').value,
            particleSize: document.getElementById('particleSize').value,
            particleDirection: document.getElementById('particleDirection').value,
            backgroundType: document.getElementById('backgroundType').value,
        };

        const backgroundMusicInput = document.getElementById('backgroundMusic');
        if (backgroundMusicInput.files.length > 0) {
            uploadFile(backgroundMusicInput.files[0], `background_music/${userId}`, (downloadURL) => {
                customization.backgroundMusicUrl = downloadURL;
                continueCustomizationSave(userId, customization);
            });
        } else {
            continueCustomizationSave(userId, customization);
        }

        // Adicionar campos específicos para cada tipo de fundo
        switch (customization.backgroundType) {
            case 'image':
                const backgroundImageInput = document.getElementById('backgroundImage');
                if (backgroundImageInput.files.length > 0) {
                    uploadFile(backgroundImageInput.files[0], `background_images/${userId}`, (downloadURL) => {
                        customization.backgroundImageUrl = downloadURL;
                        continueCustomizationSave(userId, customization);
                    });
                } else {
                    continueCustomizationSave(userId, customization);
                }
                break;
            case 'color':
                customization.backgroundColor = document.getElementById('backgroundColor').value;
                continueCustomizationSave(userId, customization);
                break;
            case 'gradient':
                customization.gradientColor1 = document.getElementById('gradientColor1').value;
                customization.gradientColor2 = document.getElementById('gradientColor2').value;
                continueCustomizationSave(userId, customization);
                break;
            case 'vanta':
                // Adicione aqui quaisquer configurações específicas para o fundo Vanta
                continueCustomizationSave(userId, customization);
                break;
            default:
                continueCustomizationSave(userId, customization);
        }
    }

    function uploadFile(file, path, callback) {
        const storageRef = firebase.storage().ref(path);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // Você pode adicionar uma barra de progresso aqui se desejar
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            }, 
            (error) => {
                console.error('Erro no upload:', error);
            }, 
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    callback(downloadURL);
                });
            }
        );
    }

    function continueCustomizationSave(userId, customization) {
        if (customization.particleType === 'image') {
            const particleImageInput = document.getElementById('particleImage');
            if (particleImageInput.files.length > 0) {
                uploadFile(particleImageInput.files[0], `particle_images/${userId}`, (downloadURL) => {
                    customization.particleImageUrl = downloadURL;
                    saveCustomizationToFirestore(userId, customization);
                });
            } else {
                saveCustomizationToFirestore(userId, customization);
            }
        } else {
            saveCustomizationToFirestore(userId, customization);
        }
    }

    function saveCustomizationToFirestore(userId, customization) {
        firebase.firestore().collection('usuarios').doc(userId).update({
            personalizacoes: customization
        }).then(() => {
            showCustomMessage("Personalização salva com sucesso!");
            applyCustomization(customization);
            const customizeModal = document.getElementById('customizeModal');
            if (customizeModal) {
                customizeModal.classList.add('hidden');
            }
        }).catch((error) => {
            console.error("Erro ao salvar personalização:", error);
            showCustomMessage("Erro ao salvar personalização. Tente novamente.", "error");
        });
    }

    // Carregar e aplicar personalização ao carregar a página
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            firebase.firestore().collection('usuarios').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const customization = doc.data().personalizacoes;
                        console.log('Customização carregada:', customization);
                        if (customization) {
                            applyCustomization(customization);
                        }
                    }
                })
                .catch((error) => {
                    console.error("Erro ao carregar personalização:", error);
                });
        }
    });

    function showCustomMessage(message, type = "success") {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.className = `custom-message ${type === "error" ? "bg-red-500" : "bg-green-500"} text-white p-4 rounded-md fixed top-4 right-4 z-50`;
        document.body.appendChild(messageElement);

        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    document.addEventListener('click', function initAudioPlayback() {
        if (audioPlayer && audioPlayer.paused) {
            playBackgroundMusic();
            document.removeEventListener('click', initAudioPlayback);
        }
    });

    function updateCustomization() {
        const customization = {
            bgColor: bgColorInput.value,
            textColor: textColorInput.value,
            profileEffect: profileEffectSelect.value,
            particleColor: particleColorInput.value,
            particleCount: particleCountInput.value
        };

        applyCustomization(customization);
        updateParticles();
    }

    // Adicionar event listeners para os novos inputs
    particleColorInput.addEventListener('change', updateCustomization);
    particleCountInput.addEventListener('input', updateCustomization);

    // Verifique se particles.js está carregado
    if (window.particlesJS) {
        particlesLoaded = true;
        initParticleEffect();
    } else {
        // Se não estiver carregado, adicione um listener para quando for carregado
        window.addEventListener('load', () => {
            if (window.particlesJS) {
                particlesLoaded = true;
                initParticleEffect();
            } else {
                console.error('particles.js não foi carregado corretamente');
            }
        });
    }

    if (saveCustomizationBtn) {
        saveCustomizationBtn.addEventListener('click', saveCustomization);
    } else {
        console.error('Botão de salvar personalização não encontrado');
    }

    // Adicione esta função para garantir que a música seja reproduzida após interação do usuário
    function enableAudioPlayback() {
        document.removeEventListener('click', enableAudioPlayback);
        playBackgroundMusic();
    }

    // Adicione este evento no final do arquivo ou dentro de uma função de inicialização
    document.addEventListener('click', enableAudioPlayback);

    // Certifique-se de que o botão de salvar chama a função saveCustomization
    document.getElementById('saveCustomizationBtn').addEventListener('click', saveCustomization);

    // Adicione estas funções se ainda não existirem
    function apply3DEffect(e) {
        const userInfoContainer = e.currentTarget;
        const rect = userInfoContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Reduzir a intensidade do efeito
        const maxRotation = 5; // Reduzido de 10 para 5 graus
        const rotateX = ((y - centerY) / centerY) * maxRotation;
        const rotateY = ((centerX - x) / centerX) * maxRotation;
        
        // Usar requestAnimationFrame para suavizar a animação
        requestAnimationFrame(() => {
            userInfoContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
    }

    function reset3DEffect(e) {
        const userInfoContainer = e.currentTarget;
        // Usar transição suave para retornar à posição original
        userInfoContainer.style.transition = 'transform 0.3s ease-out';
        userInfoContainer.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        // Remover a transição após a animação para evitar conflitos com o efeito de movimento
        setTimeout(() => {
            userInfoContainer.style.transition = '';
        }, 300);
    }

    // Adicionar event listeners para os controles de partículas
    const particleControls = [
        { id: 'particleCount', event: 'input' },
        { id: 'particleColor', event: 'input' },
        { id: 'particleDirection', event: 'change' },
        { id: 'particleSize', event: 'input' },
        { id: 'particleShape', event: 'change' }
    ];

    particleControls.forEach(control => {
        const element = document.getElementById(control.id);
        if (element) {
            element.addEventListener(control.event, updateParticles);
        } else {
            console.warn(`Elemento com id '${control.id}' não encontrado.`);
        }
    });

    // Carregar personalização do usuário
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadUserCustomization(user.uid);
        }
    });

    function loadUserCustomization(userId) {
        firebase.firestore().collection('usuarios').doc(userId).get()
            .then((doc) => {
                if (doc.exists) {
                    const customization = doc.data().personalizacoes;
                    if (customization) {
                        applyCustomization(customization);
                        updateInputs(customization);
                        updateParticles(customization);
                    }
                }
            })
            .catch((error) => {
                console.error("Erro ao carregar personalização:", error);
            });
    }

    function updateInputs(customization) {
        if (bgColorInput) bgColorInput.value = customization.bgColor || '#000000';
        if (textColorInput) textColorInput.value = customization.textColor || '#ffffff';
        if (profileEffectSelect) profileEffectSelect.value = customization.profileEffect || 'none';
        if (particleColorInput) particleColorInput.value = customization.particleColor || '#ffffff';
        if (particleCountInput) particleCountInput.value = customization.particleCount || '200';
        if (particleSizeInput) particleSizeInput.value = customization.particleSize || '3';
        if (particleDirectionSelect) particleDirectionSelect.value = customization.particleDirection || 'none';
    }

    const backgroundTypeSelect = document.getElementById('backgroundType');
    const backgroundImageControl = document.getElementById('backgroundImageControl');
    const backgroundColorControl = document.getElementById('backgroundColorControl');
    const backgroundGradientControl = document.getElementById('backgroundGradientControl');
    const backgroundImageInput = document.getElementById('backgroundImage');
    const backgroundColorInput = document.getElementById('backgroundColor');
    const gradientColor1Input = document.getElementById('gradientColor1');
    const gradientColor2Input = document.getElementById('gradientColor2');

    backgroundTypeSelect.addEventListener('change', function() {
        backgroundImageControl.classList.add('hidden');
        backgroundColorControl.classList.add('hidden');
        backgroundGradientControl.classList.add('hidden');

        switch (this.value) {
            case 'image':
                backgroundImageControl.classList.remove('hidden');
                break;
            case 'color':
                backgroundColorControl.classList.remove('hidden');
                break;
            case 'gradient':
                backgroundGradientControl.classList.remove('hidden');
                break;
        }
    });

    const particleTypeSelect = document.getElementById('particleType');
    const particleColorControl = document.getElementById('particleColorControl');
    const particleImageControl = document.getElementById('particleImageControl');

    particleTypeSelect.addEventListener('change', () => {
        if (particleTypeSelect.value === 'color') {
            particleColorControl.classList.remove('hidden');
            particleImageControl.classList.add('hidden');
        } else {
            particleColorControl.classList.add('hidden');
            particleImageControl.classList.remove('hidden');
        }
    });

    function updateBackgroundControls(backgroundType) {
        const imageControl = document.getElementById('backgroundImageControl');
        const colorControl = document.getElementById('backgroundColorControl');
        const gradientControl = document.getElementById('backgroundGradientControl');

        imageControl.classList.add('hidden');
        colorControl.classList.add('hidden');
        gradientControl.classList.add('hidden');

        switch (backgroundType) {
            case 'image':
                imageControl.classList.remove('hidden');
                break;
            case 'color':
                colorControl.classList.remove('hidden');
                break;
            case 'gradient':
                gradientControl.classList.remove('hidden');
                break;
        }
    }

    // Adicione este event listener
    document.getElementById('backgroundType').addEventListener('change', function() {
        updateBackgroundControls(this.value);
    });
});