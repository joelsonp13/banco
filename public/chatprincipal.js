document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chat-toggle');
    const chatBox = document.getElementById('chat-box');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');

    let chatOpen = false;

    chatToggle.addEventListener('click', () => {
        chatOpen = !chatOpen;
        chatBox.classList.toggle('hidden', !chatOpen);
        chatToggle.querySelector('span:last-child').style.transform = chatOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        if (chatOpen) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
            chatInput.focus();
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            sendMessage(chatInput.value.trim());
            chatInput.value = '';
        }
    });

    function sendMessage(message) {
        const user = firebase.auth().currentUser;
        if (user) {
            firebase.firestore().collection('usuarios').doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    firebase.firestore().collection('chat').add({
                        userId: user.uid,
                        username: userData.nome || userData.email || 'Usuário sem nome',
                        message: message,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    console.error('Documento do usuário não encontrado');
                }
            }).catch((error) => {
                console.error('Erro ao buscar dados do usuário:', error);
            });
        } else {
            alert('Você precisa estar logado para enviar mensagens.');
        }
    }

    function displayMessage(doc) {
        const data = doc.data();
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('p-3', 'rounded-lg', 'break-words', 'shadow-md', 'transition-all', 'duration-300', 'hover:shadow-lg');
        
        const isCurrentUser = firebase.auth().currentUser && firebase.auth().currentUser.uid === data.userId;
        
        if (isCurrentUser) {
            messageDiv.classList.add('bg-blue-600', 'text-white', 'ml-8');
        } else {
            messageDiv.classList.add('bg-gray-700', 'text-white', 'mr-8');
        }

        const time = data.timestamp ? data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

        messageDiv.innerHTML = `
            <div class="flex justify-between items-baseline mb-1">
                <span class="font-bold ${isCurrentUser ? 'text-blue-300' : 'text-blue-400'} cursor-pointer hover:underline" data-userid="${data.userId}">${data.username}</span>
                <span class="text-xs text-gray-400">${time}</span>
            </div>
            <p class="text-sm">${data.message}</p>
        `;

        // Adicionar evento de clique no nome do usuário
        const usernameSpan = messageDiv.querySelector('span[data-userid]');
        usernameSpan.addEventListener('click', () => {
            initializePrivateChat(data.userId, data.username);
        });

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    let initialLoad = true;
    firebase.firestore().collection('chat')
        .orderBy('timestamp')
        .limitToLast(50)
        .onSnapshot((snapshot) => {
            if (initialLoad) {
                chatMessages.innerHTML = '';
                snapshot.docs.forEach((doc) => {
                    displayMessage(doc);
                });
                initialLoad = false;
            } else {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        displayMessage(change.doc);
                    }
                });
            }
        });
});

function initializePrivateChat(userId, username) {
    // Verifica se já existe um chat privado com este usuário
    const existingPrivateChat = document.getElementById(`private-chat-${userId}`);
    if (existingPrivateChat) {
        existingPrivateChat.classList.remove('hidden');
        return;
    }

    // Cria um novo chat privado
    const privateChatContainer = document.createElement('div');
    privateChatContainer.id = `private-chat-${userId}`;
    privateChatContainer.classList.add('fixed', 'bottom-4', 'right-[420px]', 'z-50');
    privateChatContainer.innerHTML = `
        <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-t-lg w-80 text-left font-bold transition-colors duration-300 flex justify-between items-center">
            <span class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                Chat com ${username}
            </span>
            <span class="transform transition-transform duration-300">▲</span>
        </button>
        <div class="hidden bg-gray-900 bg-opacity-95 border border-green-600 rounded-b-lg w-80 h-[60vh] flex flex-col shadow-lg">
            <div class="flex-grow overflow-y-auto p-4 space-y-3"></div>
            <div class="p-4 border-t border-green-600">
                <input type="text" class="w-full bg-gray-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300" placeholder="Digite sua mensagem...">
            </div>
        </div>
    `;

    document.body.appendChild(privateChatContainer);

    // Inicializa o chat privado
    initializePrivateChatFunctionality(userId, username);
}

function initializePrivateChatFunctionality(userId, username) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('Usuário não está autenticado');
        return;
    }

    // ... resto do código ...
}
