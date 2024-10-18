document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'principal.html';
        });
    } else {
        console.warn('Elemento backBtn não encontrado');
    }

    const productForm = document.getElementById('productForm');
    const productList = document.getElementById('productList');
    const productImage = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    let currentPage = 1;
    const productsPerPage = 10;
    let editingProductId = null;

    const discountSection = document.getElementById('discountSection');
    const discountPercentage = document.getElementById('discountPercentage');
    const applyDiscountBtn = document.getElementById('applyDiscountBtn');
    let originalPrice = 0;
    let currentPrice = 0;
    let isDiscounted = false;

    let isProcessing = false; // Flag para evitar múltiplas submissões

    // Verificar se o usuário está logado e tem permissão de vendedor
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            db.collection('usuarios').doc(user.uid).get().then((doc) => {
                if (!doc.exists || doc.data().isVendedor !== true) {
                    // Se o usuário não tem permissão, redireciona para a página principal
                    window.location.href = 'principal.html';
                } else {
                    // Se o usuário é um vendedor, carrega os produtos
                    loadProducts();
                }
            }).catch((error) => {
                console.error("Erro ao verificar permissões:", error);
                window.location.href = 'principal.html';
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    // Preview da imagem
    productImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // Função para mostrar feedback
    function showFeedback(message, type = 'info') {
        const feedbackContainer = document.getElementById('feedbackContainer');
        if (!feedbackContainer) {
            const container = document.createElement('div');
            container.id = 'feedbackContainer';
            container.className = 'fixed top-4 right-4 z-50';
            document.body.appendChild(container);
        }

        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `bg-gray-800 bg-opacity-90 p-4 rounded-lg border border-blue-500 shadow-lg mb-2 transition-opacity duration-500 opacity-0`;
        feedbackDiv.innerHTML = `<p class="text-blue-400 text-sm font-semibold">${message}</p>`;
        
        document.getElementById('feedbackContainer').appendChild(feedbackDiv);

        // Fade in
        setTimeout(() => {
            feedbackDiv.classList.add('opacity-100');
        }, 10);

        // Fade out and remove
        setTimeout(() => {
            feedbackDiv.classList.remove('opacity-100');
            setTimeout(() => {
                feedbackDiv.remove();
            }, 500);
        }, 3000);
    }

    // Função para mostrar o modal de confirmação
    function showConfirmModal(message, onConfirm) {
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-gray-800 p-6 rounded-lg border-2 border-blue-500 shadow-lg max-w-sm w-full mx-4">
                    <p class="text-blue-400 text-lg font-semibold text-center mb-4">${message}</p>
                    <div class="flex justify-center space-x-4">
                        <button id="confirmYes" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">Sim</button>
                        <button id="confirmNo" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">Não</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);

        document.getElementById('confirmYes').addEventListener('click', () => {
            onConfirm();
            modalDiv.remove();
        });
        document.getElementById('confirmNo').addEventListener('click', () => {
            modalDiv.remove();
        });
    }

    // Função para mostrar/esconder indicador de carregamento
    function toggleLoading(show) {
        const loadingDiv = document.getElementById('loadingIndicator');
        if (show) {
            if (!loadingDiv) {
                const div = document.createElement('div');
                div.id = 'loadingIndicator';
                div.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50';
                div.innerHTML = '<div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>';
                document.body.appendChild(div);
            }
        } else {
            loadingDiv?.remove();
        }
    }

    // Função para criar ou editar um produto
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isProcessing) return;
        isProcessing = true;
        toggleLoading(true);

        const user = firebase.auth().currentUser;
        if (!user) return;

        const productName = document.getElementById('productName').value.trim();
        const productDescription = document.getElementById('productDescription').value.trim();
        const productPrice = parseFloat(document.getElementById('productPrice').value);
        const productCategory = document.getElementById('productCategory').value;
        const productImage = document.getElementById('productImage').files[0];

        // Validação
        if (!productName || !productDescription || isNaN(productPrice) || !productCategory) {
            showFeedback('Por favor, preencha todos os campos corretamente.', 'error');
            isProcessing = false;
            toggleLoading(false);
            return;
        }

        try {
            let imageUrl = '';
            let oldImageUrl = '';

            if (editingProductId) {
                const oldProductDoc = await db.collection('produtos').doc(editingProductId).get();
                oldImageUrl = oldProductDoc.data().imageUrl;
            }

            if (productImage) {
                const storageRef = firebase.storage().ref();
                const imageRef = storageRef.child(`product_images/${Date.now()}_${productImage.name}`);
                const snapshot = await imageRef.put(productImage);
                imageUrl = await snapshot.ref.getDownloadURL();

                // Se estiver editando e houver uma nova imagem, exclua a antiga
                if (editingProductId && oldImageUrl) {
                    const oldImageRef = firebase.storage().refFromURL(oldImageUrl);
                    await oldImageRef.delete();
                }
            }

            const productData = {
                name: productName,
                description: productDescription,
                category: productCategory,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (editingProductId) {
                const oldProduct = await db.collection('produtos').doc(editingProductId).get();
                const oldData = oldProduct.data();

                if (isDiscounted) {
                    // Se há desconto, mantenha o preço original e atualize o preço com desconto
                    productData.originalPrice = oldData.originalPrice;
                    productData.currentPrice = productPrice;
                    productData.discountPercentage = parseFloat(discountPercentage.value);
                } else {
                    // Se não há desconto, atualize apenas o preço atual
                    productData.originalPrice = productPrice;
                    productData.currentPrice = productPrice;
                    productData.discountPercentage = 0;
                }
            } else {
                // Novo produto
                productData.originalPrice = productPrice;
                productData.currentPrice = productPrice;
                productData.discountPercentage = 0;
            }

            if (imageUrl) {
                productData.imageUrl = imageUrl;
            }

            if (editingProductId) {
                await db.collection('produtos').doc(editingProductId).update(productData);
                showFeedback('Produto atualizado com sucesso!');
            } else {
                // Gerar um ID personalizado para o novo produto
                const customId = `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                productData.id = customId; // Adicionar o ID personalizado aos dados do produto
                productData.createdBy = user.uid;
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                
                // Usar o ID personalizado ao adicionar o documento
                await db.collection('produtos').doc(customId).set(productData);
                showFeedback('Produto criado com sucesso!');
            }

            resetForm();
            loadProducts();
        } catch (error) {
            console.error('Erro ao criar/editar produto:', error);
            showFeedback('Erro ao criar/editar produto. Por favor, tente novamente.', 'error');
        } finally {
            isProcessing = false;
            toggleLoading(false);
        }
    });

    // Função para carregar os produtos existentes
    async function loadProducts(page = 1) {
        toggleLoading(true);
        try {
            const snapshot = await db.collection('produtos')
                .orderBy('createdAt', 'desc')
                .limit(productsPerPage)
                .get();

            productList.innerHTML = ''; // Limpa a lista atual
            snapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                const li = document.createElement('li');
                li.className = 'bg-gray-700 p-4 rounded-lg flex items-center justify-between';
                updateProductDisplay(li, product);
                productList.appendChild(li);
            });

            // Adicionar eventos de edição e exclusão
            document.querySelectorAll('.editProduct').forEach(button => {
                button.addEventListener('click', (e) => editProduct(e.target.getAttribute('data-id')));
            });

            document.querySelectorAll('.deleteProduct').forEach(button => {
                button.addEventListener('click', (e) => deleteProduct(e.target.getAttribute('data-id')));
            });

            // Atualizar paginação
            updatePagination(page);

            showFeedback('Produtos carregados com sucesso!');
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            showFeedback('Erro ao carregar produtos. Por favor, recarregue a página.', 'error');
        } finally {
            toggleLoading(false);
        }
    }

    // Função para editar um produto
    async function editProduct(productId) {
        if (isProcessing) return;
        isProcessing = true;
        toggleLoading(true);

        try {
            const doc = await db.collection('produtos').doc(productId).get();
            if (doc.exists) {
                const product = doc.data();
                document.getElementById('productName').value = product.name;
                document.getElementById('productDescription').value = product.description;
                document.getElementById('productPrice').value = product.currentPrice;
                document.getElementById('productCategory').value = product.category;
                imagePreview.src = product.imageUrl;
                imagePreview.classList.remove('hidden');
                editingProductId = productId;
                document.getElementById('submitBtn').textContent = 'Atualizar Produto';
                discountSection.classList.remove('hidden');
                originalPrice = product.originalPrice;
                currentPrice = product.currentPrice;
                discountPercentage.value = product.discountPercentage || '';
                isDiscounted = product.discountPercentage > 0;
                window.scrollTo(0, 0);
                showFeedback('Produto carregado para edição.');
            }
        } catch (error) {
            console.error('Erro ao carregar produto para edição:', error);
            showFeedback('Erro ao carregar produto para edição. Por favor, tente novamente.', 'error');
        } finally {
            isProcessing = false;
            toggleLoading(false);
        }
    }

    // Função para excluir um produto
    async function deleteProduct(productId) {
        if (isProcessing) return;
        showConfirmModal('Tem certeza que deseja excluir este produto?', async () => {
            isProcessing = true;
            toggleLoading(true);
            try {
                await db.collection('produtos').doc(productId).delete();
                showFeedback('Produto excluído com sucesso!');
                if (editingProductId === productId) {
                    resetForm();
                }
                loadProducts(currentPage);
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                showFeedback('Erro ao excluir produto. Por favor, tente novamente.', 'error');
            } finally {
                isProcessing = false;
                toggleLoading(false);
            }
        });
    }

    // Função para atualizar a paginação
    async function updatePagination(currentPage) {
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = '';

        const totalProducts = await db.collection('produtos').get();
        const totalPages = Math.ceil(totalProducts.size / 10);

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.className = `px-3 py-1 rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`;
            button.addEventListener('click', () => loadProducts(i));
            paginationContainer.appendChild(button);
        }
    }

    // Aplicar desconto
    applyDiscountBtn.addEventListener('click', () => {
        if (isProcessing) return;
        isProcessing = true;
        toggleLoading(true);

        const discount = parseFloat(discountPercentage.value);
        if (isNaN(discount) || discount < 0 || discount > 100) {
            showFeedback('Por favor, insira um valor de desconto válido entre 0 e 100.', 'error');
            isProcessing = false;
            toggleLoading(false);
            return;
        }

        const discountedPrice = originalPrice * (1 - discount / 100);
        document.getElementById('productPrice').value = discountedPrice.toFixed(2);
        currentPrice = discountedPrice;
        isDiscounted = true;
        showFeedback('Desconto aplicado com sucesso!');
        isProcessing = false;
        toggleLoading(false);
    });

    // Remover desconto
    const removeDiscountBtn = document.createElement('button');
    removeDiscountBtn.textContent = 'Remover Desconto';
    removeDiscountBtn.className = 'ml-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700';
    removeDiscountBtn.addEventListener('click', () => {
        if (isProcessing) return;
        isProcessing = true;
        toggleLoading(true);

        document.getElementById('productPrice').value = originalPrice.toFixed(2);
        discountPercentage.value = '';
        currentPrice = originalPrice;
        isDiscounted = false;
        showFeedback('Desconto removido com sucesso!');
        isProcessing = false;
        toggleLoading(false);
    });
    discountSection.appendChild(removeDiscountBtn);

    // Atualizar a exibição do produto na lista
    function updateProductDisplay(li, product) {
        const originalPrice = product.originalPrice || product.currentPrice || 0;
        const currentPrice = product.currentPrice || 0;
        const discountPercentage = product.discountPercentage || 0;

        const priceDisplay = discountPercentage > 0
            ? `<p class="text-sm line-through text-red-500">R$ ${originalPrice.toFixed(2)}</p>
               <p class="text-sm text-green-500">R$ ${currentPrice.toFixed(2)}</p>`
            : `<p class="text-sm text-gray-300">R$ ${currentPrice.toFixed(2)}</p>`;

        li.innerHTML = `
            <div class="flex items-center">
                <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.name}" class="w-16 h-16 object-cover rounded mr-4">
                <div>
                    <h4 class="text-lg font-semibold">${product.name}</h4>
                    ${priceDisplay}
                    <p class="text-xs text-gray-400">${product.category || 'Sem categoria'}</p>
                </div>
            </div>
            <div>
                <button class="editProduct bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-2" data-id="${product.id}">Editar</button>
                <button class="deleteProduct bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" data-id="${product.id}">Excluir</button>
            </div>
        `;
    }

    // Função para resetar o formulário
    function resetForm() {
        productForm.reset();
        imagePreview.src = '';
        imagePreview.classList.add('hidden');
        editingProductId = null;
        document.getElementById('submitBtn').textContent = 'Criar Produto';
        discountSection.classList.add('hidden');
        isDiscounted = false;
    }

    // Carregar produtos iniciais
    loadProducts();

    // Adicione estilos CSS para as transições suaves
    const style = document.createElement('style');
    style.textContent = `
        @keyframes glow {
            0% { box-shadow: 0 0 5px #4299e1, 0 0 10px #4299e1; }
            50% { box-shadow: 0 0 20px #4299e1, 0 0 30px #4299e1; }
            100% { box-shadow: 0 0 5px #4299e1, 0 0 10px #4299e1; }
        }
        .glow-effect {
            animation: glow 2s infinite;
        }
    `;
    document.head.appendChild(style);

    // No início do seu script, adicione:
    document.body.insertAdjacentHTML('beforeend', '<div id="feedbackContainer" class="fixed top-4 right-4 z-50"></div>');

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

    // ... resto do código existente ...
});