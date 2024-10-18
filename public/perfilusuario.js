document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        console.error('ID do usuário não fornecido');
        return;
    }

    const db = firebase.firestore();
    const userRef = db.collection('usuarios').doc(userId);

    let vantaEffect = null;
    let particlesInstance = null;
    let audioPlayer = null;
    let isMuted = false;

    const cursor = document.querySelector('.custom-cursor');

    // Custom cursor
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { duration: 0.2, left: e.clientX, top: e.clientY });
    });

    // Hover effect for interactive elements
    function applyInteractiveCursorEffect() {
        document.querySelectorAll('button, input, a, select, #volumeControl, #toggleMute, .profile-pic-container, .user-info-container').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('interactive');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('interactive');
            });
        });
    }

    applyInteractiveCursorEffect();

    userRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            updateUserInfo(userData);
            applyCustomizations(userData.personalizacoes);
        } else {
            console.error('Usuário não encontrado');
        }
    }).catch((error) => {
        console.error('Erro ao carregar dados do usuário:', error);
    });

    function updateUserInfo(userData) {
        const userInfoContainer = document.getElementById('userInfo');
        userInfoContainer.innerHTML = `
            <h2 class="text-3xl font-bold mb-4">${userData.nome}</h2>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Nível:</strong> ${userData.nivel}</p>
            <p><strong>Experiência:</strong> ${userData.experiencia || 0}</p>
            <p><strong>Tipo de Usuário:</strong> ${userData.isVendedor ? 'Vendedor' : 'Cliente'}</p>
        `;

        // Atualizar foto de perfil
        const profilePic = document.getElementById('profilePic');
        if (userData.profilePicUrl) {
            profilePic.src = userData.profilePicUrl;
        }

        applyInteractiveCursorEffect();
    }

    function applyCustomizations(personalizacoes) {
        if (!personalizacoes) return;

        // Aplicar fundo do site
        applyBackgroundType(personalizacoes);

        // Atualizar o userInfo
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            // Aplicar cor de fundo ao userInfo
            if (personalizacoes.bgColor) {
                const bgColorRgb = hexToRgb(personalizacoes.bgColor);
                userInfo.style.backgroundColor = `rgba(${bgColorRgb.r}, ${bgColorRgb.g}, ${bgColorRgb.b}, 0.7)`;
            }
            
            // Aplicar cor do texto apenas ao userInfo
            if (personalizacoes.textColor) {
                userInfo.style.color = personalizacoes.textColor;
            }
        }

        // Aplicar efeito do perfil
        if (personalizacoes.profileEffect && userInfo) {
            userInfo.classList.add(`effect-${personalizacoes.profileEffect}`);
            if (personalizacoes.profileEffect === '3d') {
                apply3DEffect(userInfo);
            }
        }

        // Inicializar partículas
        initParticles(personalizacoes);

        // Tocar música de fundo
        if (personalizacoes.backgroundMusicUrl) {
            playBackgroundMusic(personalizacoes.backgroundMusicUrl);
        }

        // Atualizar estilos dos elementos com classe neon-text e neon-border
        updateNeonEffects(personalizacoes.textColor);

        applyInteractiveCursorEffect();
    }

    function applyBackgroundType(personalizacoes) {
        const body = document.body;
        const vantaBackground = document.getElementById('vanta-background');

        // Remover qualquer efeito Vanta existente
        if (vantaEffect) {
            vantaEffect.destroy();
            vantaEffect = null;
        }

        // Remover estilos de fundo anteriores
        body.style.backgroundImage = '';
        body.style.backgroundColor = '';

        switch (personalizacoes.backgroundType) {
            case 'vanta':
                if (vantaBackground) {
                    vantaBackground.style.display = 'block';
                }
                initVanta(personalizacoes.backgroundColor || '#000000');
                break;
            case 'image':
                if (vantaBackground) vantaBackground.style.display = 'none';
                if (personalizacoes.backgroundImageUrl) {
                    body.style.backgroundImage = `url(${personalizacoes.backgroundImageUrl})`;
                    body.style.backgroundSize = 'cover';
                    body.style.backgroundPosition = 'center';
                    body.style.backgroundRepeat = 'no-repeat';
                }
                break;
            case 'color':
                if (vantaBackground) vantaBackground.style.display = 'none';
                if (personalizacoes.backgroundColor) {
                    body.style.backgroundColor = personalizacoes.backgroundColor;
                }
                break;
            case 'gradient':
                if (vantaBackground) vantaBackground.style.display = 'none';
                if (personalizacoes.gradientColor1 && personalizacoes.gradientColor2) {
                    body.style.backgroundImage = `linear-gradient(to right, ${personalizacoes.gradientColor1}, ${personalizacoes.gradientColor2})`;
                }
                break;
            default:
                if (vantaBackground) vantaBackground.style.display = 'block';
                initVanta('#000000');
                break;
        }
    }

    function initVanta(backgroundColor) {
        vantaEffect = VANTA.NET({
            el: "#vanta-background",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x0000ff,
            backgroundColor: backgroundColor,
        });
    }

    // Função auxiliar para converter cor hex para RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function initParticles(personalizacoes) {
        const particlesConfig = {
            particles: {
                number: {
                    value: parseInt(personalizacoes.particleCount) || 200,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: personalizacoes.particleColor || "#ffffff"
                },
                shape: {
                    type: personalizacoes.particleShape || "circle",
                },
                opacity: {
                    value: 0.5,
                    random: true,
                },
                size: {
                    value: parseInt(personalizacoes.particleSize) || 3,
                    random: true,
                },
                line_linked: {
                    enable: false
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: personalizacoes.particleDirection || "none",
                    random: false,
                    straight: false,
                    out_mode: "out",
                    bounce: false,
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
            },
            retina_detect: true
        };

        if (personalizacoes.particleImageUrl) {
            particlesConfig.particles.shape.type = "image";
            particlesConfig.particles.shape.image = {
                src: personalizacoes.particleImageUrl,
                width: 100,
                height: 100
            };
        }

        if (particlesInstance) {
            particlesInstance.destroy();
        }
        particlesJS('particles-js', particlesConfig);
        particlesInstance = pJSDom[0].pJS;
    }

    function playBackgroundMusic(url) {
        if (audioPlayer) {
            audioPlayer.pause();
        }
        audioPlayer = new Audio(url);
        audioPlayer.loop = true;
        audioPlayer.volume = 0.5; // Volume inicial
        audioPlayer.play().catch(error => console.error('Erro ao reproduzir música:', error));

        // Configurar controles de volume
        setupVolumeControls();
    }

    function setupVolumeControls() {
        const volumeControl = document.getElementById('volumeControl');
        const toggleMute = document.getElementById('toggleMute');

        volumeControl.addEventListener('input', (e) => {
            if (audioPlayer) {
                audioPlayer.volume = e.target.value / 100;
                updateMuteButtonIcon();
            }
        });

        toggleMute.addEventListener('click', () => {
            if (audioPlayer) {
                isMuted = !isMuted;
                audioPlayer.muted = isMuted;
                updateMuteButtonIcon();
            }
        });

        function updateMuteButtonIcon() {
            const icon = toggleMute.querySelector('i');
            if (isMuted || audioPlayer.volume === 0) {
                icon.className = 'fas fa-volume-mute text-2xl';
            } else if (audioPlayer.volume < 0.5) {
                icon.className = 'fas fa-volume-down text-2xl';
            } else {
                icon.className = 'fas fa-volume-up text-2xl';
            }
        }
    }

    function apply3DEffect(element) {
        let rotateX = 0, rotateY = 0;

        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            rotateX = (e.clientY - centerY) / 80; // Reduzido de 100 para 80
            rotateY = (e.clientX - centerX) / 80; // Reduzido de 100 para 80

            requestAnimationFrame(() => {
                element.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
        });

        element.addEventListener('mouseleave', () => {
            element.style.transition = 'transform 0.3s ease-out';
            element.style.transform = 'perspective(1500px) rotateX(0) rotateY(0)';
            setTimeout(() => {
                element.style.transition = '';
            }, 300);
        });
    }

    function updateNeonEffects(textColor) {
        const neonColor = '#0000ff'; // Cor fixa para os efeitos neon
        const neonTextElements = document.querySelectorAll('.neon-text');
        const neonBorderElements = document.querySelectorAll('.neon-border:not(.bg-black)');

        neonTextElements.forEach(element => {
            element.style.textShadow = `0 0 5px ${neonColor}, 0 0 10px ${neonColor}, 0 0 15px ${neonColor}, 0 0 20px ${neonColor}, 0 0 35px ${neonColor}, 0 0 40px ${neonColor}`;
        });

        neonBorderElements.forEach(element => {
            element.style.boxShadow = `0 0 5px ${neonColor}, 0 0 10px ${neonColor}, 0 0 15px ${neonColor}, 0 0 20px ${neonColor}, 0 0 35px ${neonColor}, 0 0 40px ${neonColor}`;
        });
    }
});
