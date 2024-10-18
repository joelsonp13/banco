let activeChat = 'general';
let mediaRecorder = null;
let audioChunks = [];
let isCancelled = false;
let messageListeners = {};
let unreadMessages = {};
let unreadCounts = {};
let lastSeenMessages = {};

document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.querySelector('.custom-cursor');

    // Custom cursor
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { duration: 0.2, left: e.clientX, top: e.clientY });
    });

    // Hover effect for interactive elements
    function applyInteractiveCursorEffect() {
        document.querySelectorAll('button, input, a, #chat-input, #record-audio, #cancel-audio, .chat-tab').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('interactive');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('interactive');
            });
        });
    }

    applyInteractiveCursorEffect();

    const chatContainer = document.getElementById('chat-container');
    const usersList = document.getElementById('users-list');
    const chatTabs = document.getElementById('chat-tabs');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const recordButton = document.getElementById('record-audio');
    const cancelButton = document.getElementById('cancel-audio');
    const userNameElement = document.getElementById('user-name');
    const generalChatButton = document.getElementById('general-chat-button');

    // Verificar autenticação e inicializar chat
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            userNameElement.textContent = user.displayName || user.email || 'Usuário autenticado';
            initializeChat();
        } else {
            console.error('Usuário não está autenticado');
            window.location.href = 'login.html'; // Redirecionar para a página de login
        }
    });

    function initializeChat() {
        loadAllUsers();
        displayWelcomeScreen();

        // Remova a aba do chat geral, se existir
        const generalChatTab = document.getElementById('chat-tab-general');
        if (generalChatTab) {
            generalChatTab.remove();
        }

        chatInput.addEventListener('keypress', handleChatInput);
        recordButton.addEventListener('click', handleRecordAudio);
        cancelButton.addEventListener('click', cancelRecording);
        generalChatButton.addEventListener('click', switchToGeneralChat);

        applyInteractiveCursorEffect();

        // Remova qualquer chamada para switchToGeneralChat() aqui
    }

    function displayWelcomeScreen() {
        activeChat = null; // Defina activeChat como null para indicar que nenhum chat está ativo
        chatMessages.innerHTML = '';
        const welcomeDiv = document.createElement('div');
        welcomeDiv.classList.add('text-center', 'p-4', 'bg-gray-800', 'rounded-lg', 'shadow-md');
        welcomeDiv.innerHTML = `
            <h2 class="text-4xl font-bold mb-4 neon-text">Sublyme</h2>
            <p class="text-xl">Bem-vindo ao chat da Sublyme</p>
            <p class="mt-4">Selecione um usuário para iniciar um chat privado ou clique em "Chat Geral" para participar da conversa pública.</p>
        `;
        chatMessages.appendChild(welcomeDiv);

        // Limpe as abas de chat existentes
        chatTabs.innerHTML = '';
    }

    function loadAllUsers() {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error('Usuário não está autenticado');
            return;
        }

        const db = firebase.firestore();
        const usersRef = db.collection('usuarios');

        usersRef.onSnapshot((snapshot) => {
            usersList.innerHTML = '<h2 class="text-xl font-bold mb-4">Usuários</h2>';
            snapshot.forEach((doc) => {
                const userData = doc.data();
                if (doc.id !== currentUser.uid) {
                    const userElement = createUserElement(doc.id, userData.nome || userData.email || 'Usuário sem nome');
                    usersList.appendChild(userElement);
                }
            });
        }, (error) => {
            console.error("Erro ao carregar usuários:", error);
        });
    }

    function createUserElement(userId, username) {
        const userDiv = document.createElement('div');
        userDiv.classList.add('user-item', 'flex', 'justify-between', 'items-center', 'p-2', 'hover:bg-gray-700', 'cursor-pointer');
        userDiv.setAttribute('data-user-id', userId);
        userDiv.innerHTML = `
            <span>${username}</span>
            <span class="unread-badge bg-red-500 text-white rounded-full px-2 py-1 text-xs hidden">0</span>
        `;
        userDiv.addEventListener('click', () => initializePrivateChat(userId, username));
        return userDiv;
    }

    function initializeGeneralChat() {
        activeChat = 'general';
        chatMessages.innerHTML = '';

        const messagesRef = firebase.firestore().collection('chat').orderBy('timestamp');

        // Remover listener anterior, se existir
        if (messageListeners['general']) {
            messageListeners['general']();
        }

        // Criar novo listener
        messageListeners['general'] = messagesRef.onSnapshot((snapshot) => {
            if (activeChat !== 'general') return;

            if (snapshot.size === 0) {
                // O chat foi limpo
                chatMessages.innerHTML = '';
                displayMessage({
                    senderId: 'system',
                    senderName: 'Sistema',
                    message: 'O chat foi limpo por um administrador.',
                    type: 'text',
                    timestamp: firebase.firestore.Timestamp.now()
                });
            } else {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        displayMessage(change.doc.data());
                    }
                });
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, (error) => {
            console.error("Erro ao carregar mensagens:", error);
        });
    }

    function switchToGeneralChat() {
        if (activeChat !== 'general') {
            updateLastSeenMessageForActiveChat();
        }

        activeChat = 'general';
        chatMessages.innerHTML = '';
        updateChatTabs('general', 'Chat Geral');
        initializeGeneralChat();

        const db = firebase.firestore();
        db.collection('chat')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    updateLastSeenMessage('general', snapshot.docs[0].id);
                }
            });

        updateUnreadCount('general', 0);
    }

    function initializePrivateChat(userId, username) {
        if (activeChat !== userId) {
            updateLastSeenMessageForActiveChat();
        }

        activeChat = userId;
        chatMessages.innerHTML = '';
        updateChatTabs(userId, username);
        loadPrivateChat(userId);

        // Adicione esta linha para criar o contador de teste
        createTestCounter();

        // Atualizar a última mensagem vista do chat privado
        const db = firebase.firestore();
        const chatId = [firebase.auth().currentUser.uid, userId].sort().join('_');
        db.collection('privateChats').doc(chatId).collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    updateLastSeenMessage(userId, snapshot.docs[0].id);
                }
            });

        updateUnreadCount(userId, 0);
    }

    function updateChatTabs(chatId, username = 'Chat Geral') {
        document.querySelectorAll('#chat-tabs button').forEach(tab => {
            tab.classList.remove('active');
        });

        let chatTab = document.getElementById(`chat-tab-${chatId}`);
        if (!chatTab) {
            chatTab = document.createElement('button');
            chatTab.id = `chat-tab-${chatId}`;
            chatTab.classList.add('chat-tab', 'flex', 'items-center');
            
            const tabText = document.createElement('span');
            tabText.textContent = username;
            chatTab.appendChild(tabText);

            const unreadBadge = document.createElement('span');
            unreadBadge.classList.add('unread-badge', 'bg-red-500', 'text-white', 'rounded-full', 'px-2', 'py-1', 'text-xs', 'ml-2', 'hidden');
            chatTab.appendChild(unreadBadge);

            if (chatId !== 'general') {
                const closeBtn = document.createElement('span');
                closeBtn.innerHTML = '&times;';
                closeBtn.classList.add('close-tab', 'ml-2');
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeChat(chatId);
                });
                chatTab.appendChild(closeBtn);
            }

            chatTab.addEventListener('click', () => {
                if (chatId === 'general') {
                    switchToGeneralChat();
                } else {
                    initializePrivateChat(chatId, username);
                }
            });
            chatTabs.appendChild(chatTab);
        }

        chatTab.classList.add('active');

        applyInteractiveCursorEffect(); // Aplica o efeito do cursor após atualizar as abas
    }

    function closeChat(chatId) {
        const tab = document.getElementById(`chat-tab-${chatId}`);
        if (tab) {
            tab.remove();
        }
        if (messageListeners[chatId]) {
            messageListeners[chatId]();
            delete messageListeners[chatId];
        }
        if (activeChat === chatId) {
            switchToGeneralChat();
        }
    }

    function loadPrivateChat(userId) {
        const currentUser = firebase.auth().currentUser;
        const chatId = [currentUser.uid, userId].sort().join('_');
        
        // Remover listener anterior, se existir
        if (messageListeners[activeChat]) {
            messageListeners[activeChat]();
        }
        
        // Criar novo listener
        messageListeners[activeChat] = firebase.firestore().collection('privateChats').doc(chatId).collection('messages')
            .orderBy('timestamp')
            .onSnapshot((snapshot) => {
                if (activeChat !== userId) return;

                if (snapshot.size === 0) {
                    // O chat foi limpo
                    chatMessages.innerHTML = '';
                    displayMessage({
                        senderId: 'system',
                        senderName: 'Sistema',
                        message: 'O chat privado foi limpo por um administrador.',
                        type: 'text',
                        timestamp: firebase.firestore.Timestamp.now()
                    });
                } else {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const messageData = change.doc.data();
                            displayMessage(messageData);
                        }
                    });
                }
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, (error) => {
                console.error("Erro ao carregar mensagens privadas:", error);
            });
    }

    function displayPrivateMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('mb-4', 'p-3', 'rounded-lg', 'break-words', 'shadow-md', 'transition-all', 'duration-300', 'hover:shadow-lg');
        
        const isCurrentUser = firebase.auth().currentUser && firebase.auth().currentUser.uid === data.senderId;
        
        if (isCurrentUser) {
            messageDiv.classList.add('bg-green-600', 'text-white', 'ml-8');
        } else {
            messageDiv.classList.add('bg-gray-700', 'text-white', 'mr-8');
        }

        const time = data.timestamp ? data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

        messageDiv.innerHTML = `
            <div class="flex justify-between items-baseline mb-1">
                <span class="font-bold ${isCurrentUser ? 'text-green-300' : 'text-green-400'}">${data.senderName}</span>
                <span class="text-xs text-gray-400">${time}</span>
            </div>
        `;

        if (data.type === 'text') {
            messageDiv.innerHTML += `<p class="text-sm">${data.message}</p>`;
        } else if (data.type === 'audio') {
            messageDiv.innerHTML += `
                <audio controls class="w-full mt-2">
                    <source src="${data.audioUrl}" type="audio/wav">
                    Seu navegador não suporta o elemento de áudio.
                </audio>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Adicione esta linha para atualizar o contador de teste
        updateTestCounter();
    }

    function displayMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('mb-4', 'p-3', 'rounded-lg', 'break-words', 'shadow-md', 'transition-all', 'duration-300', 'hover:shadow-lg');
        
        const isCurrentUser = firebase.auth().currentUser && firebase.auth().currentUser.uid === data.senderId;
        
        if (isCurrentUser) {
            messageDiv.classList.add('bg-green-600', 'text-white', 'ml-8');
        } else {
            messageDiv.classList.add('bg-gray-700', 'text-white', 'mr-8');
        }

        const time = data.timestamp ? data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

        // Usa senderName em vez de username
        const senderName = data.senderName || 'Usuário desconhecido';

        messageDiv.innerHTML = `
            <div class="flex justify-between items-baseline mb-1">
                <span class="font-bold ${isCurrentUser ? 'text-green-300' : 'text-green-400'}">${senderName}</span>
                <span class="text-xs text-gray-400">${time}</span>
            </div>
        `;

        if (data.type === 'text') {
            messageDiv.innerHTML += `<p class="text-sm">${data.message}</p>`;
        } else if (data.type === 'audio') {
            messageDiv.innerHTML += `
                <audio controls class="w-full mt-2">
                    <source src="${data.audioUrl}" type="audio/wav">
                    Seu navegador não suporta o elemento de áudio.
                </audio>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleChatInput(e) {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            const message = chatInput.value.trim();
            if (message === '/clear') {
                checkAdminAndClearChat();
            } else {
                sendMessage(message);
            }
            chatInput.value = '';
        }
    }

    function checkAdminAndClearChat() {
        const user = firebase.auth().currentUser;
        if (user) {
            firebase.firestore().collection('usuarios').doc(user.uid).get().then((doc) => {
                if (doc.exists && doc.data().isAdmin) {
                    clearChat();
                } else {
                    displayMessage({
                        senderId: 'system',
                        senderName: 'Sistema',
                        message: 'Você não tem permissão para limpar o chat.',
                        type: 'text',
                        timestamp: firebase.firestore.Timestamp.now()
                    });
                }
            }).catch(error => {
                console.error("Erro ao verificar permissões de administrador:", error);
            });
        }
    }

    function clearChat() {
        if (activeChat === 'general') {
            firebase.firestore().collection('chat')
                .get()
                .then((snapshot) => {
                    const batch = firebase.firestore().batch();
                    snapshot.docs.forEach((doc) => {
                        batch.delete(doc.ref);
                    });
                    return batch.commit();
                })
                .then(() => {
                    // Não precisamos limpar o chatMessages aqui, o listener cuidará disso
                    console.log("Chat geral limpo com sucesso");
                })
                .catch((error) => {
                    console.error("Erro ao limpar o chat:", error);
                });
        } else {
            const chatId = [firebase.auth().currentUser.uid, activeChat].sort().join('_');
            firebase.firestore().collection('privateChats').doc(chatId).collection('messages')
                .get()
                .then((snapshot) => {
                    const batch = firebase.firestore().batch();
                    snapshot.docs.forEach((doc) => {
                        batch.delete(doc.ref);
                    });
                    return batch.commit();
                })
                .then(() => {
                    // Não precisamos limpar o chatMessages aqui, o listener cuidará disso
                    console.log("Chat privado limpo com sucesso");
                })
                .catch((error) => {
                    console.error("Erro ao limpar o chat privado:", error);
                });
        }
    }

    function sendMessage(message) {
        const user = firebase.auth().currentUser;
        if (user) {
            firebase.firestore().collection('usuarios').doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    const messageData = {
                        senderId: user.uid,
                        senderName: userData.nome || user.displayName || user.email || 'Usuário anônimo',
                        message: message,
                        type: 'text',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    if (activeChat === 'general') {
                        firebase.firestore().collection('chat').add(messageData);
                    } else {
                        const chatId = [user.uid, activeChat].sort().join('_');
                        firebase.firestore().collection('privateChats').doc(chatId).collection('messages').add(messageData);
                    }
                }
            }).catch(error => {
                console.error("Erro ao buscar informações do usuário:", error);
            });
        } else {
            console.error('Usuário não está autenticado');
        }
    }

    function handleRecordAudio() {
        if (activeChat === 'general') {
            console.log('Gravação de áudio não disponível no chat geral');
            return;
        }

        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            startRecording();
        } else if (mediaRecorder.state === 'recording') {
            stopRecording();
        }
    }

    function startRecording() {
        isCancelled = false;
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                audioChunks = []; // Limpa os chunks de áudio anteriores
                recordButton.classList.add('bg-green-500', 'hover:bg-green-600');
                recordButton.classList.remove('bg-red-500', 'hover:bg-red-600');
                cancelButton.classList.remove('hidden');

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    if (!isCancelled) {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        sendAudioMessage(audioBlob);
                    }
                    stream.getTracks().forEach(track => track.stop()); // Libera o stream de áudio
                    mediaRecorder = null; // Reset o mediaRecorder
                });
            })
            .catch(error => {
                console.error("Erro ao acessar o microfone:", error);
            });
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            recordButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            recordButton.classList.add('bg-red-500', 'hover:bg-red-600');
            cancelButton.classList.add('hidden');
        }
    }

    function cancelRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            isCancelled = true;
            mediaRecorder.stop();
            recordButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            recordButton.classList.add('bg-red-500', 'hover:bg-red-600');
            cancelButton.classList.add('hidden');
        }
    }

    function sendAudioMessage(audioBlob) {
        const user = firebase.auth().currentUser;
        if (user && activeChat !== 'general') {
            const storageRef = firebase.storage().ref();
            const audioRef = storageRef.child(`audio/${Date.now()}.wav`);
            
            audioRef.put(audioBlob).then((snapshot) => {
                snapshot.ref.getDownloadURL().then((downloadURL) => {
                    firebase.firestore().collection('usuarios').doc(user.uid).get().then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            const messageData = {
                                senderId: user.uid,
                                senderName: userData.nome || userData.email || 'Usuário sem nome',
                                type: 'audio',
                                audioUrl: downloadURL,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            };

                            const chatId = [user.uid, activeChat].sort().join('_');
                            firebase.firestore().collection('privateChats').doc(chatId).collection('messages').add(messageData);
                        }
                    });
                });
            });
        }
    }

    // Inicialize o fundo Vanta.js
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

    function updateLastSeenMessage(chatId, messageId) {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return;

        lastSeenMessages[chatId] = messageId;
        
        const db = firebase.firestore();
        db.collection('userChatState').doc(currentUser.uid).set({
            [chatId]: messageId
        }, { merge: true });
    }

    function loadLastSeenMessages() {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return;

        const db = firebase.firestore();
        db.collection('userChatState').doc(currentUser.uid).get().then((doc) => {
            if (doc.exists) {
                lastSeenMessages = doc.data();
            }
        });
    }

    function countUnreadMessages(chatId, messages) {
        const lastSeenMessageId = lastSeenMessages[chatId];
        if (!lastSeenMessageId) return messages.length;

        const lastSeenIndex = messages.findIndex(msg => msg.id === lastSeenMessageId);
        return lastSeenIndex === -1 ? messages.length : messages.length - lastSeenIndex - 1;
    }

    function updateUnreadCount(chatId, count) {
        unreadCounts[chatId] = count;
        console.log(`Atualizando contagem para ${chatId}: ${count}`);
        const tabBadge = document.querySelector(`#chat-tab-${chatId} .unread-badge`);
        const userBadge = document.querySelector(`#users-list [data-user-id="${chatId}"] .unread-badge`);
        const generalBadge = document.querySelector('#general-chat-button .unread-count');

        if (chatId === 'general' && generalBadge) {
            generalBadge.textContent = count;
            generalBadge.classList.toggle('hidden', count === 0);
        } else if (tabBadge && userBadge) {
            tabBadge.textContent = count;
            userBadge.textContent = count;
            tabBadge.classList.toggle('hidden', count === 0);
            userBadge.classList.toggle('hidden', count === 0);
        }
    }

    function listenForNewMessages() {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return;

        const db = firebase.firestore();

        // Listener para o chat geral
        messageListeners['general'] = db.collection('chat')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const messages = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
                const lastSeenMessageId = lastSeenMessages['general'];
                let unreadCount = 0;

                for (const message of messages) {
                    if (message.id === lastSeenMessageId) {
                        break;
                    }
                    if (message.senderId !== currentUser.uid) {
                        unreadCount++;
                    }
                }

                updateUnreadCount('general', unreadCount);
                
                if (activeChat === 'general') {
                    displayNewMessages('general', messages);
                    if (messages.length > 0) {
                        updateLastSeenMessage('general', messages[0].id);
                    }
                }
            });

        // Listener para chats privados
        db.collection('privateChats')
            .where('participants', 'array-contains', currentUser.uid)
            .onSnapshot((snapshot) => {
                snapshot.forEach((doc) => {
                    const chatData = doc.data();
                    const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
                    
                    if (!messageListeners[otherUserId]) {
                        messageListeners[otherUserId] = db.collection('privateChats').doc(doc.id).collection('messages')
                            .orderBy('timestamp', 'desc')
                            .onSnapshot((messagesSnapshot) => {
                                const messages = messagesSnapshot.docs.map(msgDoc => ({id: msgDoc.id, ...msgDoc.data()}));
                                const lastSeenMessageId = lastSeenMessages[otherUserId];
                                let unreadCount = 0;

                                for (const message of messages) {
                                    if (message.id === lastSeenMessageId) {
                                        break;
                                    }
                                    if (message.senderId !== currentUser.uid) {
                                        unreadCount++;
                                    }
                                }

                                updateUnreadCount(otherUserId, unreadCount);
                                
                                if (activeChat === otherUserId) {
                                    displayNewMessages(otherUserId, messages);
                                    if (messages.length > 0) {
                                        updateLastSeenMessage(otherUserId, messages[0].id);
                                    }
                                }
                            });
                    }
                });
            });
    }

    function displayNewMessages(chatId, messages) {
        if (activeChat !== chatId) return;

        chatMessages.innerHTML = '';
        messages.reverse().forEach(message => {
            displayMessage(message);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateLastSeenMessageForActiveChat() {
        const db = firebase.firestore();
        if (activeChat === 'general') {
            db.collection('chat')
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get()
                .then((snapshot) => {
                    if (!snapshot.empty) {
                        updateLastSeenMessage('general', snapshot.docs[0].id);
                    }
                });
        } else {
            const currentUser = firebase.auth().currentUser;
            db.collection('privateChats')
                .doc([currentUser.uid, activeChat].sort().join('_'))
                .collection('messages')
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get()
                .then((snapshot) => {
                    if (!snapshot.empty) {
                        updateLastSeenMessage(activeChat, snapshot.docs[0].id);
                    }
                });
        }
    }

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadLastSeenMessages();
            listenForNewMessages();
            
            document.getElementById('chat-tabs').addEventListener('click', (e) => {
                const chatTab = e.target.closest('.chat-tab');
                if (chatTab) {
                    const chatId = chatTab.id.replace('chat-tab-', '');
                    if (chatId === 'general') {
                        switchToGeneralChat();
                    } else {
                        initializePrivateChat(chatId, chatTab.querySelector('span').textContent);
                    }
                }
            });

            document.getElementById('general-chat-button').addEventListener('click', switchToGeneralChat);
        }
    });

    // Adicionar evento para quando o usuário sair da página
    window.addEventListener('beforeunload', updateLastSeenMessageForActiveChat);

    // Reseta o contador de novas mensagens
    localStorage.setItem('newMessageCount', '0');

    // Adicione esta função para debug
    function logUnreadCounts() {
        console.log("Contagens não lidas:", unreadCounts);
        console.log("Últimas mensagens vistas:", lastSeenMessages);
    }

    // Chame esta função periodicamente
    setInterval(logUnreadCounts, 5000);

    // Adicione esta nova função para atualizar o contador de teste
    function updateTestCounter() {
        const testCounterElement = document.getElementById('test-counter');
        if (testCounterElement) {
            const currentCount = parseInt(testCounterElement.textContent) || 0;
            testCounterElement.textContent = currentCount + 1;
        }
    }

    // Adicione esta nova função para criar o contador de teste
    function createTestCounter() {
        const existingCounter = document.getElementById('test-counter');
        if (!existingCounter) {
            const counterDiv = document.createElement('div');
            counterDiv.id = 'test-counter';
            counterDiv.classList.add('fixed', 'top-4', 'right-4', 'bg-red-500', 'text-white', 'rounded-full', 'px-3', 'py-1', 'text-sm', 'font-bold');
            counterDiv.textContent = '0';
            document.body.appendChild(counterDiv);
        }
    }
});