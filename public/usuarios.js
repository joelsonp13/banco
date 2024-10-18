// Não declare firebaseConfig aqui, pois já deve estar declarado em firebase.js

let searchType = 'nome'; // Agora, a busca será sempre por nome

let vantaEffect = null;

function initVanta() {
    if (vantaEffect) {
        vantaEffect.destroy();
    }
    vantaEffect = VANTA.NET({
        el: "#vanta-background",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: window.innerHeight,
        minWidth: window.innerWidth,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x0000ff,
        backgroundColor: 0x0,
        points: 20.00,
        maxDistance: 30.00,
        spacing: 15.00
    });
}

// Função para carregar e exibir os usuários
function carregarUsuarios(searchTerm = '') {
    const listaUsuarios = document.getElementById('lista-usuarios');
    const db = firebase.firestore();
    
    let query = db.collection('usuarios');

    if (searchTerm) {
        query = query.where('nome', '>=', searchTerm)
                     .where('nome', '<=', searchTerm + '\uf8ff');
    }

    query.get().then((snapshot) => {
        listaUsuarios.innerHTML = ''; // Limpa a lista antes de adicionar os usuários
        
        snapshot.forEach((doc) => {
            const usuario = doc.data();
            const usuarioElement = document.createElement('div');
            
            let nivelClass, nivelText, textClass, extraClass = '';
            switch(usuario.nivel) {
                case '5':
                case 'Lendário':
                    nivelClass = 'lendario';
                    nivelText = 'Lendário';
                    textClass = 'text-yellow-300';
                    extraClass = 'font-bold text-shadow-legendary';
                    break;
                case '4':
                case 'Mestre':
                    nivelClass = 'mestre';
                    nivelText = 'Mestre';
                    textClass = 'text-red-500';
                    extraClass = 'font-bold text-shadow-fire';
                    break;
                case '3':
                case 'Avançado':
                    nivelClass = 'avancado';
                    nivelText = 'Avançado';
                    textClass = 'text-purple-300';
                    break;
                case '2':
                case 'Intermediário':
                    nivelClass = 'intermediario';
                    nivelText = 'Intermediário';
                    textClass = 'text-blue-300';
                    break;
                default:
                    nivelClass = 'novato';
                    nivelText = 'Novato';
                    textClass = 'text-blue-200';
            }
            
            const nivelBadge = `<span class="nivel-badge ${nivelClass}">${nivelText}</span>`;
            
            if (usuario.isVendedor) {
                usuarioElement.className = `usuario-item vendedor p-6 rounded-lg shadow-lg opacity-0 ${nivelClass}`;
                usuarioElement.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-2xl font-bold ${textClass} ${extraClass}">${usuario.nome || 'Nome não informado'} ${nivelBadge}</h3>
                        <span class="bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">Vendedor</span>
                    </div>
                    <div class="mt-4 pt-4 border-t border-yellow-500">
                        <p class="${textClass} ${extraClass} font-bold">Vendedor ${nivelText}</p>
                    </div>
                `;
            } else {
                usuarioElement.className = `usuario-item p-6 rounded-lg shadow-lg opacity-0 ${nivelClass}`;
                usuarioElement.innerHTML = `
                    <h3 class="text-2xl font-bold mb-2 ${textClass} ${extraClass}">${usuario.nome || 'Nome não informado'} ${nivelBadge}</h3>
                    <p class="${textClass} ${extraClass}"><span class="font-bold">Tipo:</span> Cliente ${nivelText}</p>
                `;
            }
            
            // Adicionar evento de clique ao card do usuário
            usuarioElement.addEventListener('click', () => {
                window.location.href = `perfilusuario.html?id=${doc.id}`;
            });
            
            listaUsuarios.appendChild(usuarioElement);
            
            // Adiciona animação de fade-in
            setTimeout(() => {
                usuarioElement.style.transition = 'opacity 0.5s ease';
                usuarioElement.style.opacity = '1';
            }, 50);
        });

        if (listaUsuarios.children.length === 0) {
            listaUsuarios.innerHTML = '<p class="text-center text-blue-300 text-xl">Nenhum usuário encontrado.</p>';
        }
    }).catch((error) => {
        console.error("Erro ao carregar usuários:", error);
        showFeedback('Erro ao carregar usuários. Por favor, tente novamente.', 'error');
    });
}

// Função para mostrar feedback
function showFeedback(message, type = 'info') {
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

// Carregar usuários quando a página for carregada
document.addEventListener('DOMContentLoaded', () => {
    // Verifique se o Firebase está inicializado corretamente
    if (typeof firebase !== 'undefined' && firebase.app()) {
        carregarUsuarios();
    } else {
        console.error('Firebase não está inicializado corretamente');
        showFeedback('Erro ao inicializar o Firebase. Por favor, recarregue a página.', 'error');
    }

    // Verifique se o VANTA está disponível
    if (typeof VANTA !== 'undefined' && VANTA.NET) {
        initVanta();

        // Ajustar o tamanho do fundo quando a janela for redimensionada
        window.addEventListener('resize', () => {
            if (vantaEffect) {
                vantaEffect.resize();
            }
        });
    } else {
        console.error('VANTA.NET não está disponível');
    }

    // Configurar o cursor personalizado
    const cursor = document.querySelector('.custom-cursor');
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { duration: 0.2, left: e.clientX, top: e.clientY });
    });

    // Hover effect for interactive elements
    function applyInteractiveCursorEffect() {
        document.querySelectorAll('button, input, a, #searchInput, .usuario-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('interactive');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('interactive');
            });
        });
    }

    applyInteractiveCursorEffect();

    // Configurar a busca
    const searchInput = document.getElementById('searchInput');

    // Adicione um evento de input para buscar a cada letra digitada
    searchInput.addEventListener('input', () => {
        carregarUsuarios(searchInput.value.trim());
    });

    searchInput.placeholder = 'Buscar por nome';

    // Carregar todos os usuários inicialmente
    carregarUsuarios();

    // Configurar o botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Erro ao fazer logout:', error);
            showFeedback('Erro ao fazer logout. Por favor, tente novamente.', 'error');
        });
    });

    // Chame applyInteractiveCursorEffect() após carregar os usuários
    function carregarUsuarios(searchTerm = '') {
        const listaUsuarios = document.getElementById('lista-usuarios');
        const db = firebase.firestore();
        
        let query = db.collection('usuarios');

        if (searchTerm) {
            query = query.where('nome', '>=', searchTerm)
                         .where('nome', '<=', searchTerm + '\uf8ff');
        }

        query.get().then((snapshot) => {
            listaUsuarios.innerHTML = ''; // Limpa a lista antes de adicionar os usuários
            
            snapshot.forEach((doc) => {
                const usuario = doc.data();
                const usuarioElement = document.createElement('div');
                
                let nivelClass, nivelText, textClass, extraClass = '';
                switch(usuario.nivel) {
                    case '5':
                    case 'Lendário':
                        nivelClass = 'lendario';
                        nivelText = 'Lendário';
                        textClass = 'text-yellow-300';
                        extraClass = 'font-bold text-shadow-legendary';
                        break;
                    case '4':
                    case 'Mestre':
                        nivelClass = 'mestre';
                        nivelText = 'Mestre';
                        textClass = 'text-red-500';
                        extraClass = 'font-bold text-shadow-fire';
                        break;
                    case '3':
                    case 'Avançado':
                        nivelClass = 'avancado';
                        nivelText = 'Avançado';
                        textClass = 'text-purple-300';
                        break;
                    case '2':
                    case 'Intermediário':
                        nivelClass = 'intermediario';
                        nivelText = 'Intermediário';
                        textClass = 'text-blue-300';
                        break;
                    default:
                        nivelClass = 'novato';
                        nivelText = 'Novato';
                        textClass = 'text-blue-200';
                }
                
                const nivelBadge = `<span class="nivel-badge ${nivelClass}">${nivelText}</span>`;
                
                if (usuario.isVendedor) {
                    usuarioElement.className = `usuario-item vendedor p-6 rounded-lg shadow-lg opacity-0 ${nivelClass}`;
                    usuarioElement.innerHTML = `
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-2xl font-bold ${textClass} ${extraClass}">${usuario.nome || 'Nome não informado'} ${nivelBadge}</h3>
                            <span class="bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">Vendedor</span>
                        </div>
                        <div class="mt-4 pt-4 border-t border-yellow-500">
                            <p class="${textClass} ${extraClass} font-bold">Vendedor ${nivelText}</p>
                        </div>
                    `;
                } else {
                    usuarioElement.className = `usuario-item p-6 rounded-lg shadow-lg opacity-0 ${nivelClass}`;
                    usuarioElement.innerHTML = `
                        <h3 class="text-2xl font-bold mb-2 ${textClass} ${extraClass}">${usuario.nome || 'Nome não informado'} ${nivelBadge}</h3>
                        <p class="${textClass} ${extraClass}"><span class="font-bold">Tipo:</span> Cliente ${nivelText}</p>
                    `;
                }
                
                // Adicionar evento de clique ao card do usuário
                usuarioElement.addEventListener('click', () => {
                    window.location.href = `perfilusuario.html?id=${doc.id}`;
                });
                
                listaUsuarios.appendChild(usuarioElement);
                
                // Adiciona animação de fade-in
                setTimeout(() => {
                    usuarioElement.style.transition = 'opacity 0.5s ease';
                    usuarioElement.style.opacity = '1';
                }, 50);
            });

            if (listaUsuarios.children.length === 0) {
                listaUsuarios.innerHTML = '<p class="text-center text-blue-300 text-xl">Nenhum usuário encontrado.</p>';
            }
        }).catch((error) => {
            console.error("Erro ao carregar usuários:", error);
            showFeedback('Erro ao carregar usuários. Por favor, tente novamente.', 'error');
        });
    }
});
