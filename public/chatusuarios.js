document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, iniciando script chatusuarios.js');

    const chatUsersToggle = document.getElementById('chat-users-toggle');
    const chatUsersList = document.getElementById('chat-users-list');

    console.log('Elementos DOM obtidos:', { chatUsersToggle, chatUsersList });

    let usersListOpen = false;

    chatUsersToggle.addEventListener('click', () => {
        console.log('Botão de toggle clicado');
        usersListOpen = !usersListOpen;
        console.log('Estado da lista de usuários:', usersListOpen ? 'aberto' : 'fechado');
        chatUsersList.classList.toggle('hidden', !usersListOpen);
        chatUsersToggle.querySelector('span:last-child').style.transform = usersListOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        if (usersListOpen) {
            console.log('Chamando loadAllUsers()');
            loadAllUsers();
        }
    });

    function loadAllUsers() {
        console.log('Iniciando loadAllUsers()');
        const currentUser = firebase.auth().currentUser;
        console.log('Usuário atual:', currentUser);
        if (!currentUser) {
            console.error('Usuário não está autenticado');
            return;
        }

        chatUsersList.innerHTML = '<div class="p-4 text-center text-blue-300">Carregando usuários...</div>';

        const db = firebase.firestore();
        console.log('Instância do Firestore obtida');
        const usersRef = db.collection('usuarios');
        console.log('Referência para coleção usuarios obtida');

        usersRef.get().then((snapshot) => {
            console.log('Snapshot de usuarios obtido, tamanho:', snapshot.size);
            
            if (snapshot.empty) {
                console.log('Nenhum usuário encontrado');
                chatUsersList.innerHTML = '<div class="p-4 text-center text-blue-300">Nenhum usuário encontrado.</div>';
            } else {
                console.log('Iniciando listagem de usuários');
                chatUsersList.innerHTML = '';
                snapshot.forEach((doc) => {
                    const userData = doc.data();
                    console.log('Dados do usuário:', userData);
                    if (doc.id !== currentUser.uid) {
                        const userElement = createUserElement(doc.id, userData.nome || userData.email || 'Usuário sem nome');
                        chatUsersList.appendChild(userElement);
                        console.log('Elemento do usuário adicionado à lista');
                    }
                });
            }
        }).catch((error) => {
            console.error("Erro ao carregar usuários:", error);
            chatUsersList.innerHTML = '<div class="p-4 text-center text-red-500">Erro ao carregar usuários.</div>';
        });
    }

    function createUserElement(userId, username) {
        console.log('Criando elemento para usuário:', { userId, username });
        const userDiv = document.createElement('div');
        userDiv.classList.add('p-3', 'hover:bg-gray-800', 'cursor-pointer', 'transition-colors', 'duration-300');
        userDiv.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span class="text-blue-300 hover:text-blue-100">${username}</span>
            </div>
        `;
        userDiv.addEventListener('click', () => {
            console.log('Elemento do usuário clicado:', { userId, username });
            initializePrivateChat(userId, username);
        });
        return userDiv;
    }

    console.log('Script chatusuarios.js carregado completamente');
});
