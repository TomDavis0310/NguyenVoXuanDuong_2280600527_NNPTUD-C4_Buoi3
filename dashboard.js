let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: null, ascending: true };
let currentProduct = null;
let editMode = false;

// Fetch products from API
async function fetchProducts() {
    try {
        document.getElementById('loadingSpinner').style.display = 'block';
        const response = await fetch('https://api.escuelajs.co/api/v1/products');
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        renderTable();
        document.getElementById('loadingSpinner').style.display = 'none';
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Error loading products. Please try again.');
        document.getElementById('loadingSpinner').style.display = 'none';
    }
}

// Render table
function renderTable() {
    const tbody = document.getElementById('productsTableBody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = filteredProducts.slice(start, end);

    tbody.innerHTML = '';

    pageProducts.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'product-row';
        row.onclick = () => showProductDetail(product);
        row.onmouseenter = (e) => showDescription(e, product.description);
        row.onmouseleave = hideDescription;

        const categoryName = product.category?.name || 'N/A';
        const imageUrl = Array.isArray(product.images) && product.images.length > 0 
            ? product.images[0] 
            : 'https://via.placeholder.com/50';

        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td><span class="badge bg-info category-badge">${categoryName}</span></td>
            <td><img src="${imageUrl}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/50'"></td>
        `;
        tbody.appendChild(row);
    });

    renderPagination();
}

// Show description tooltip
function showDescription(event, description) {
    const tooltip = document.getElementById('customTooltip');
    tooltip.textContent = description;
    tooltip.style.display = 'block';
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY + 10 + 'px';
}

// Hide description tooltip
function hideDescription() {
    document.getElementById('customTooltip').style.display = 'none';
}

// Update tooltip position on mouse move
document.addEventListener('mousemove', (e) => {
    const tooltip = document.getElementById('customTooltip');
    if (tooltip.style.display === 'block') {
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY + 10 + 'px';
    }
});

// Search functionality
function initializeSearch() {
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;
        renderTable();
    });
}

// Items per page change
function initializeItemsPerPage() {
    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
    });
}

// Sort table
function sortTable(field) {
    if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.field = field;
        currentSort.ascending = true;
    }

    filteredProducts.sort((a, b) => {
        let aVal = field === 'price' ? a[field] : a[field].toLowerCase();
        let bVal = field === 'price' ? b[field] : b[field].toLowerCase();

        if (aVal < bVal) return currentSort.ascending ? -1 : 1;
        if (aVal > bVal) return currentSort.ascending ? 1 : -1;
        return 0;
    });

    renderTable();
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('paginationInfo');

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, filteredProducts.length);
    paginationInfo.textContent = `Showing ${start}-${end} of ${filteredProducts.length} products`;

    pagination.innerHTML = '';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Previous</a>`;
    pagination.appendChild(prevLi);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>`;
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Next</a>`;
    pagination.appendChild(nextLi);
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show product detail
function showProductDetail(product) {
    currentProduct = product;
    editMode = false;
    renderDetailModal();
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

// Render detail modal
function renderDetailModal() {
    const modalBody = document.getElementById('detailModalBody');
    
    if (editMode) {
        modalBody.innerHTML = `
            <form id="editForm">
                <div class="mb-3">
                    <label class="form-label fw-bold">ID</label>
                    <input type="text" class="form-control" value="${currentProduct.id}" disabled>
                </div>
                <div class="mb-3">
                    <label for="editTitle" class="form-label fw-bold">Title</label>
                    <input type="text" class="form-control" id="editTitle" value="${currentProduct.title}">
                </div>
                <div class="mb-3">
                    <label for="editPrice" class="form-label fw-bold">Price</label>
                    <input type="number" class="form-control" id="editPrice" value="${currentProduct.price}">
                </div>
                <div class="mb-3">
                    <label for="editDescription" class="form-label fw-bold">Description</label>
                    <textarea class="form-control" id="editDescription" rows="3">${currentProduct.description}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Category</label>
                    <input type="text" class="form-control" value="${currentProduct.category?.name || 'N/A'}" disabled>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Images</label>
                    <div class="d-flex gap-2 flex-wrap">
                        ${currentProduct.images?.map(img => `
                            <img src="${img}" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/100'">
                        `).join('') || 'No images'}
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-success" onclick="updateProduct()">
                        <i class="bi bi-check-circle me-1"></i>Save Changes
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="cancelEdit()">
                        <i class="bi bi-x-circle me-1"></i>Cancel
                    </button>
                </div>
            </form>
        `;
    } else {
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>ID:</strong> ${currentProduct.id}</p>
                    <p><strong>Title:</strong> ${currentProduct.title}</p>
                    <p><strong>Price:</strong> $${currentProduct.price}</p>
                    <p><strong>Category:</strong> ${currentProduct.category?.name || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Images:</strong></p>
                    <div class="d-flex gap-2 flex-wrap">
                        ${currentProduct.images?.map(img => `
                            <img src="${img}" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/100'">
                        `).join('') || 'No images'}
                    </div>
                </div>
            </div>
            <div class="mt-3">
                <p><strong>Description:</strong></p>
                <p>${currentProduct.description}</p>
            </div>
        `;
    }
}

// Show edit mode
function showEditMode() {
    editMode = true;
    renderDetailModal();
}

// Cancel edit
function cancelEdit() {
    editMode = false;
    renderDetailModal();
}

// Update product
async function updateProduct() {
    const title = document.getElementById('editTitle').value;
    const price = parseFloat(document.getElementById('editPrice').value);
    const description = document.getElementById('editDescription').value;

    if (!title || !price || !description) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`https://api.escuelajs.co/api/v1/products/${currentProduct.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                price,
                description
            })
        });

        if (response.ok) {
            const updatedProduct = await response.json();
            
            // Update local data
            const index = allProducts.findIndex(p => p.id === currentProduct.id);
            if (index !== -1) {
                allProducts[index] = { ...allProducts[index], ...updatedProduct };
            }
            
            const filteredIndex = filteredProducts.findIndex(p => p.id === currentProduct.id);
            if (filteredIndex !== -1) {
                filteredProducts[filteredIndex] = { ...filteredProducts[filteredIndex], ...updatedProduct };
            }

            currentProduct = { ...currentProduct, ...updatedProduct };
            
            renderTable();
            editMode = false;
            renderDetailModal();
            
            alert('Product updated successfully!');
        } else {
            alert('Failed to update product');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Error updating product. Please try again.');
    }
}

// Create product
async function createProduct() {
    const title = document.getElementById('createTitle').value;
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value;
    const categoryId = parseInt(document.getElementById('createCategoryId').value);
    const images = document.getElementById('createImages').value;

    if (!title || !price || !description || !categoryId || !images) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('https://api.escuelajs.co/api/v1/products/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                price,
                description,
                categoryId,
                images: [images]
            })
        });

        if (response.ok) {
            const newProduct = await response.json();
            allProducts.unshift(newProduct);
            filteredProducts.unshift(newProduct);
            currentPage = 1;
            renderTable();
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
            modal.hide();
            document.getElementById('createForm').reset();
            
            alert('Product created successfully!');
        } else {
            alert('Failed to create product');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        alert('Error creating product. Please try again.');
    }
}

// Export to CSV
function exportToCSV() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = filteredProducts.slice(start, end);

    let csv = 'ID,Title,Price,Category,Description,Image URL\n';

    pageProducts.forEach(product => {
        const categoryName = product.category?.name || 'N/A';
        const imageUrl = Array.isArray(product.images) && product.images.length > 0 
            ? product.images[0] 
            : '';
        const description = product.description.replace(/"/g, '""');
        const title = product.title.replace(/"/g, '""');
        
        csv += `${product.id},"${title}",${product.price},"${categoryName}","${description}","${imageUrl}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_page_${currentPage}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
    initializeSearch();
    initializeItemsPerPage();
});
