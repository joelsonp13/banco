(function() {
    // Verifique se o Firebase já foi inicializado
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Importe a instância do Firestore e do Storage
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Declare as variáveis globais
    let isProcessing = false;
    let originalPrice = 0;
    let currentPrice = 0;
    let isDiscounted = false;

    // Defina as funções globalmente
    window.editProduct = function(productId) {
        if (isProcessing) return;
        isProcessing = true;
        toggleLoading(true);

        db.collection('produtos').doc(productId).get().then((doc) => {
            if (doc.exists) {
                const product = doc.data();
                openEditModal(productId, product);
            } else {
                showFeedback("Produto não encontrado", "error");
            }
        }).catch((error) => {
            showFeedback("Erro ao obter o produto. Tente novamente.", "error");
        }).finally(() => {
            isProcessing = false;
            toggleLoading(false);
        });
    }

    window.deleteProduct = function(productId) {
        if (isProcessing) return;
        showConfirmModal('Tem certeza que deseja excluir este produto?', async () => {
            isProcessing = true;
            toggleLoading(true);
            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    throw new Error('Usuário não autenticado');
                }

                const userDoc = await db.collection('usuarios').doc(user.uid).get();
                if (!userDoc.exists) {
                    throw new Error('Documento do usuário não encontrado');
                }
                const userData = userDoc.data();

                if (!userData.isVendedor) {
                    throw new Error('Usuário não é um vendedor');
                }

                const productDoc = await db.collection('produtos').doc(productId).get();
                if (!productDoc.exists) {
                    throw new Error('Produto não encontrado');
                }

                await db.collection('produtos').doc(productId).delete();
                document.querySelector(`[data-product-id="${productId}"]`).remove();
                showFeedback('Produto excluído com sucesso!');
            } catch (error) {
                showFeedback('Erro ao excluir produto. Por favor, tente novamente.', 'error');
            } finally {
                isProcessing = false;
                toggleLoading(false);
            }
        });
    }

    async function deleteImage(imageUrl) {
        try {
            const imageRef = storage.refFromURL(imageUrl);
            await imageRef.delete();
        } catch (error) {
            showFeedback('Erro ao deletar imagem antiga', 'error');
        }
    }

    function openEditModal(productId, product) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 p-8 rounded-lg w-full max-w-4xl relative">
                <h2 class="text-2xl font-bold mb-4 neon-text">Editar Produto</h2>
                <form id="editProductForm" class="space-y-4">
                    <div class="flex space-x-4">
                        <div class="w-2/3">
                            <div>
                                <label for="editName" class="block text-sm font-medium text-gray-300">Nome do Produto</label>
                                <input type="text" id="editName" name="editName" value="${product.name}" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                            </div>
                            <div class="mt-4">
                                <label for="editDescription" class="block text-sm font-medium text-gray-300">Descrição</label>
                                <textarea id="editDescription" name="editDescription" rows="3" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">${product.description}</textarea>
                            </div>
                             <div class="mb-4">
                    <label for="editCategory" class="block text-sm font-medium text-gray-300">Categoria</label>
                    <select id="editCategory" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                        <option value="hack" ${product.category === 'hack' ? 'selected' : ''}>Hack</option>
                        <option value="cheat" ${product.category === 'cheat' ? 'selected' : ''}>Cheat</option>
                        <option value="programas" ${product.category === 'programas' ? 'selected' : ''}>Programas</option>
                        <option value="outros" ${product.category === 'outros' ? 'selected' : ''}>Outros</option>
                    </select>
                </div>
                            <div class="mt-4">
                                <label for="editPrice" class="block text-sm font-medium text-gray-300">Preço (R$)</label>
                                <input type="number" id="editPrice" name="editPrice" value="${product.currentPrice}" step="0.01" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                            </div>
                            <div class="mt-4">
                                <label for="editDiscount" class="block text-sm font-medium text-gray-300">Desconto (%)</label>
                                <div class="flex items-center">
                                    <input type="number" id="editDiscount" name="editDiscount" value="${product.discountPercentage || 0}" min="0" max="100" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                                    <button type="button" id="applyDiscountBtn" class="ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-300">Aplicar</button>
                                    <button type="button" id="removeDiscountBtn" class="ml-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-300">Remover</button>
                                </div>
                            </div>
                            <div class="mt-4">
                                <label for="editImage" class="block text-sm font-medium text-gray-300">Imagem do Produto</label>
                                <input type="file" id="editImage" name="editImage" accept="image/*" class="mt-1 block w-full text-white">
                                <img id="imagePreview" src="${product.imageUrl}" alt="${product.name}" class="mt-2 max-w-full h-auto">
                            </div>
                        </div>
                        <div class="w-1/3">
                            <div class="sticky top-4">
                                <h3 class="text-lg font-semibold mb-2">Preview</h3>
                                <div class="bg-gray-700 p-4 rounded-lg">
                                    <img id="previewImage" src="${product.imageUrl}" alt="${product.name}" class="w-full h-48 object-cover rounded-lg mb-2">
                                    <h4 id="previewName" class="text-lg font-semibold">${product.name}</h4>
                                    <p id="previewPrice" class="text-lg font-bold">R$ ${product.currentPrice.toFixed(2)}</p>
                                    <p id="previewCategory" class="text-sm text-gray-400">Categoria: ${product.category || 'Sem categoria'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end space-x-2 mt-6">
                        <button type="button" id="cancelEdit" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancelar</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Atualizar Produto</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        originalPrice = product.originalPrice || product.currentPrice;
        currentPrice = product.currentPrice;
        isDiscounted = product.discountPercentage > 0;

        const editProductForm = document.getElementById('editProductForm');
        editProductForm.dataset.productId = productId;

        const applyDiscountBtn = document.getElementById('applyDiscountBtn');
        const removeDiscountBtn = document.getElementById('removeDiscountBtn');
        const editImage = document.getElementById('editImage');
        const imagePreview = document.getElementById('imagePreview');

        editProductForm.addEventListener('submit', handleProductUpdate);
        applyDiscountBtn.addEventListener('click', applyDiscount);
        removeDiscountBtn.addEventListener('click', removeDiscount);
        editImage.addEventListener('change', handleImageChange);

        document.getElementById('cancelEdit').addEventListener('click', () => {
            modal.remove();
        });

        // Atualizar preview em tempo real
        ['editName', 'editPrice', 'editCategory'].forEach(id => {
            document.getElementById(id).addEventListener('input', updatePreview);
        });

        updatePreview();
    }

    async function handleProductUpdate(e) {
        e.preventDefault();
        if (isProcessing) return;
        isProcessing = true;
        toggleLoading(true);

        const productId = e.target.dataset.productId;

        if (!productId) {
            showFeedback("Erro: ID do produto não encontrado", "error");
            isProcessing = false;
            toggleLoading(false);
            return;
        }

        const imageFile = document.getElementById('editImage').files[0];
        let imageUrl = document.getElementById('imagePreview').src;

        try {
            const productDoc = await db.collection('produtos').doc(productId).get();
            const currentProduct = productDoc.data();

            if (imageFile) {
                // Deletar imagem antiga se existir
                if (currentProduct.imageUrl) {
                    await deleteImage(currentProduct.imageUrl);
                }
                // Fazer upload da nova imagem
                imageUrl = await uploadImage(imageFile);
            } else if (!currentProduct.imageUrl) {
                // Se não há imagem nova e não há imagem existente, use uma imagem padrão
                imageUrl = 'https://via.placeholder.com/300x300?text=Sem+Imagem';
            }

            const updatedProduct = {
                name: document.getElementById('editName').value,
                description: document.getElementById('editDescription').value,
                category: document.getElementById('editCategory').value,
                currentPrice: parseFloat(document.getElementById('editPrice').value),
                discountPercentage: parseFloat(document.getElementById('editDiscount').value) || 0,
                imageUrl: imageUrl,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (isDiscounted) {
                updatedProduct.originalPrice = originalPrice;
            } else {
                updatedProduct.originalPrice = updatedProduct.currentPrice;
            }

            await db.collection('produtos').doc(productId).update(updatedProduct);
            document.querySelector('.fixed').remove();
            updateProductCard(productId, updatedProduct);
            showFeedback("Produto atualizado com sucesso!", "success");
        } catch (error) {
            showFeedback("Erro ao atualizar o produto. Tente novamente.", "error");
        } finally {
            isProcessing = false;
            toggleLoading(false);
        }
    }

    async function uploadImage(file) {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`product_images/${Date.now()}_${file.name}`);
        await fileRef.put(file);
        return await fileRef.getDownloadURL();
    }

    function applyDiscount() {
        if (isProcessing) return;
        isProcessing = true;
        toggleLoading(true);

        const discount = parseFloat(document.getElementById('editDiscount').value);
        if (isNaN(discount) || discount < 0 || discount > 100) {
            showFeedback('Por favor, insira um valor de desconto válido entre 0 e 100.', 'error');
            isProcessing = false;
            toggleLoading(false);
            return;
        }

        const discountedPrice = originalPrice * (1 - discount / 100);
        document.getElementById('editPrice').value = discountedPrice.toFixed(2);
        currentPrice = discountedPrice;
        isDiscounted = true;
        showFeedback('Desconto aplicado com sucesso!');
        updatePreview();
        isProcessing = false;
        toggleLoading(false);
    }

    function removeDiscount() {
        if (isProcessing) return;
        isProcessing = true;
        toggleLoading(true);

        document.getElementById('editPrice').value = originalPrice.toFixed(2);
        document.getElementById('editDiscount').value = '0';
        currentPrice = originalPrice;
        isDiscounted = false;
        showFeedback('Desconto removido com sucesso!');
        updatePreview();
        isProcessing = false;
        toggleLoading(false);
    }

    function updatePreview() {
        const previewImage = document.getElementById('previewImage');
        const previewName = document.getElementById('previewName');
        const previewPrice = document.getElementById('previewPrice');
        const previewCategory = document.getElementById('previewCategory');

        // Não atualize a imagem aqui, isso será feito em handleImageChange
        previewName.textContent = document.getElementById('editName').value;
        previewPrice.textContent = `R$ ${parseFloat(document.getElementById('editPrice').value).toFixed(2)}`;
        previewCategory.textContent = `Categoria: ${document.getElementById('editCategory').value || 'Sem categoria'}`;
    }

    function updateProductCard(productId, updatedProduct) {
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if (card) {
            const image = card.querySelector('img');
            const name = card.querySelector('h3');
            const description = card.querySelector('p:not(.text-sm)');
            const priceElement = card.querySelector('.text-lg.font-bold');
            const categoryElement = card.querySelector('.text-sm.text-gray-400');

            image.src = updatedProduct.imageUrl;
            image.alt = updatedProduct.name;
            name.textContent = updatedProduct.name;
            description.textContent = updatedProduct.description.length > 100 
                ? updatedProduct.description.substring(0, 97) + '...'
                : updatedProduct.description;
            priceElement.textContent = `R$ ${updatedProduct.currentPrice.toFixed(2)}`;
            categoryElement.textContent = `Categoria: ${updatedProduct.category || 'Sem categoria'}`;

            if (updatedProduct.discountPercentage > 0) {
                const discountElement = card.querySelector('.text-sm.line-through') || document.createElement('p');
                discountElement.className = 'text-sm line-through text-red-500';
                discountElement.textContent = `R$ ${updatedProduct.originalPrice.toFixed(2)}`;
                priceElement.parentNode.insertBefore(discountElement, priceElement);
            } else {
                const discountElement = card.querySelector('.text-sm.line-through');
                if (discountElement) discountElement.remove();
            }
        }
    }

    function toggleLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (show) {
            if (!loadingElement) {
                const loading = document.createElement('div');
                loading.id = 'loading';
                loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                loading.innerHTML = '<div class="text-white text-2xl">Carregando...</div>';
                document.body.appendChild(loading);
            }
        } else {
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    }

    function showConfirmModal(message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 p-8 rounded-lg">
                <p class="text-white mb-4">${message}</p>
                <div class="flex justify-end space-x-2">
                    <button id="cancelConfirm" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancelar</button>
                    <button id="confirmAction" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Confirmar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('cancelConfirm').addEventListener('click', () => modal.remove());
        document.getElementById('confirmAction').addEventListener('click', () => {
            onConfirm();
            modal.remove();
        });
    }

    function showFeedback(message, type = 'success') {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        feedbackElement.textContent = message;
        document.body.appendChild(feedbackElement);

        setTimeout(() => {
            feedbackElement.remove();
        }, 3000);
    }

    function handleImageChange(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('imagePreview').src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    }

    // Certifique-se de que todas as funções auxiliares também sejam acessíveis globalmente
    window.toggleLoading = toggleLoading;
    window.showConfirmModal = showConfirmModal;
    window.showFeedback = showFeedback;
})();
