let activePrivateChat = null;
let mediaRecorder = null;
let audioChunks = [];
let isCancelled = false;

function initializePrivateChat(userId, username) {
    // Fecha o chat privado ativo, se houver
    if (activePrivateChat) {
        const activeChatElement = document.getElementById(`private-chat-${activePrivateChat}`);
        if (activeChatElement) {
            activeChatElement.remove();
        }
    }

    // Verifica se já existe um chat privado com este usuário
    const existingPrivateChat = document.getElementById(`private-chat-${userId}`);
    if (existingPrivateChat) {
        existingPrivateChat.classList.remove('hidden');
        activePrivateChat = userId;
        return;
    }

    // Cria um novo chat privado
    const privateChatTemplate = document.getElementById('private-chat-template');
    const privateChatContainer = privateChatTemplate.content.cloneNode(true).firstElementChild;
    privateChatContainer.id = `private-chat-${userId}`;
    privateChatContainer.querySelector('.username').textContent = username;

    document.body.appendChild(privateChatContainer);

    // Atualiza o chat privado ativo
    activePrivateChat = userId;

    // Inicializa o chat privado
    initializePrivateChatFunctionality(userId, username);
}

function initializePrivateChatFunctionality(userId, username) {
    const chatContainer = document.getElementById(`private-chat-${userId}`);
    const chatToggle = chatContainer.querySelector('button');
    const chatBox = chatContainer.querySelector('div');
    const chatMessages = chatBox.querySelector('div');
    const chatInput = chatBox.querySelector('input');
    const recordButton = chatBox.querySelector('.record-audio');
    const cancelButton = chatBox.querySelector('.cancel-audio');

    let chatOpen = false;
    let isRecording = false;

    chatToggle.addEventListener('click', () => {
        chatOpen = !chatOpen;
        chatBox.classList.toggle('hidden', !chatOpen);
        chatToggle.querySelector('span:last-child').style.transform = chatOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        if (chatOpen) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
            chatInput.focus();
        }
    });

    // Adiciona um botão para fechar o chat
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.classList.add('absolute', 'top-2', 'right-2', 'text-white', 'hover:text-red-500', 'focus:outline-none');
    closeButton.addEventListener('click', () => {
        chatContainer.remove();
        activePrivateChat = null;
    });
    chatToggle.appendChild(closeButton);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            sendPrivateMessage(userId, chatInput.value.trim());
            chatInput.value = '';
        }
    });

    recordButton.addEventListener('click', () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });

    cancelButton.addEventListener('click', () => {
        cancelRecording();
    });

    function startRecording() {
        isCancelled = false;
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                isRecording = true;
                recordButton.classList.add('bg-green-500', 'hover:bg-green-600');
                recordButton.classList.remove('bg-red-500', 'hover:bg-red-600');
                cancelButton.classList.remove('hidden');

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    if (!isCancelled) {
                        const audioBlob = new Blob(audioChunks);
                        sendAudioMessage(userId, audioBlob);
                    }
                    audioChunks = [];
                });
            });
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            isRecording = false;
            recordButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            recordButton.classList.add('bg-red-500', 'hover:bg-red-600');
            cancelButton.classList.add('hidden');
        }
    }

    function cancelRecording() {
        if (mediaRecorder && isRecording) {
            isCancelled = true;
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            isRecording = false;
            recordButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            recordButton.classList.add('bg-red-500', 'hover:bg-red-600');
            cancelButton.classList.add('hidden');
            audioChunks = [];
        }
    }

    function sendPrivateMessage(recipientId, message) {
        const user = firebase.auth().currentUser;
        if (user) {
            firebase.firestore().collection('usuarios').doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    const chatId = [user.uid, recipientId].sort().join('_');
                    firebase.firestore().collection('privateChats').doc(chatId).collection('messages').add({
                        senderId: user.uid,
                        senderName: userData.nome || userData.email || 'Usuário sem nome',
                        recipientId: recipientId,
                        message: message,
                        type: 'text',
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

    function sendAudioMessage(recipientId, audioBlob) {
        const user = firebase.auth().currentUser;
        if (user) {
            const storageRef = firebase.storage().ref();
            const audioRef = storageRef.child(`audio/${Date.now()}.wav`);
            
            audioRef.put(audioBlob).then((snapshot) => {
                snapshot.ref.getDownloadURL().then((downloadURL) => {
                    firebase.firestore().collection('usuarios').doc(user.uid).get().then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            const chatId = [user.uid, recipientId].sort().join('_');
                            firebase.firestore().collection('privateChats').doc(chatId).collection('messages').add({
                                senderId: user.uid,
                                senderName: userData.nome || userData.email || 'Usuário sem nome',
                                recipientId: recipientId,
                                audioUrl: downloadURL,
                                type: 'audio',
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        } else {
                            console.error('Documento do usuário não encontrado');
                        }
                    }).catch((error) => {
                        console.error('Erro ao buscar dados do usuário:', error);
                    });
                });
            });
        } else {
            alert('Você precisa estar logado para enviar mensagens de áudio.');
        }
    }

    function displayPrivateMessage(doc) {
        const data = doc.data();
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('p-3', 'rounded-lg', 'break-words', 'shadow-md', 'transition-all', 'duration-300', 'hover:shadow-lg');
        
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
    }

    const user = firebase.auth().currentUser;
    if (user) {
        const chatId = [user.uid, userId].sort().join('_');
        firebase.firestore().collection('privateChats').doc(chatId).collection('messages')
            .orderBy('timestamp')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        displayPrivateMessage(change.doc);
                    }
                });
            });
    }
}
