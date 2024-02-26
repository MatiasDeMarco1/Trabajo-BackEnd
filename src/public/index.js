
/* document.addEventListener("DOMContentLoaded", function () {
    const socket = io();
    socket.on("updateProducts", (updatedProducts) => {
        updateProductList(updatedProducts);
    });
    function updateProductList(products) {
        const realtimeProductList = document.getElementById("realtimeProductList");
        realtimeProductList.innerHTML = "";
        products.forEach((product) => {
            const listItem = document.createElement("li");
            listItem.classList.add("product");
            listItem.dataset.productId = product._id; 
            const buttons = `
                <button onclick="addToCart('${product._id}')">Agregar al carrito</button>
                <button onclick="updateProduct('${product._id}')">Actualizar producto</button>
                <button onclick="deleteProduct('${product._id}')">Eliminar producto</button>
            `;
            listItem.innerHTML = `
                <h3>${product.title}</h3>
                <p>${product.description}</p>
                <p>Precio: ${product.price}</p>
                ${isAdmin ? buttons : ''}
            `;
            realtimeProductList.appendChild(listItem);
        });
    }
});
 */
function deleteProduct(productId) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
        fetch(`/products/${productId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('La solicitud DELETE falló');
            }
            return response.text(); 
        })
        .then(data => {
            console.log('Respuesta del servidor:', data); 
            window.location.reload(); 
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un problema al eliminar el producto.');
        });
    }
}
async function getProductById(productId) {
    try {
        const response = await fetch(`/products/${productId}`);
        if (!response.ok) {
            throw new Error('Error al obtener el producto.');
        }
        const product = await response.json();
        return product;
    } catch (error) {
        throw new Error('Error al obtener el producto:', error);
    }
}
async function updateProduct(productId) {
    try {
        const product = await getProductById(productId);
        if (product) {
            document.getElementById('edit_title').value = product.data.title;
            document.getElementById('edit_price').value = product.data.price;
            document.getElementById('edit_description').value = product.data.description;
            document.getElementById('edit_code').value = product.data.code;
            document.getElementById('edit_stock').value = product.data.stock;
            document.getElementById('edit_category').value = product.data.category;

            document.getElementById('editProductForm').style.display = 'block';

            const editButton = document.getElementsByClassName("edit_button")[0];
            editButton.id = product.data._id;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un problema al cargar el formulario de edición del producto.');
    }
}


async function submitUpdatedProduct(event) {
    event.preventDefault();
    const editButton = document.getElementsByClassName("edit_button")[0];
    const productId = editButton.id;
    const formData = {
        title: document.getElementById('edit_title').value,
        price: document.getElementById('edit_price').value,
        description: document.getElementById('edit_description').value,
        code: document.getElementById('edit_code').value,
        stock: document.getElementById('edit_stock').value,
        category: document.getElementById('edit_category').value
    };
    try {
        const response = await fetch(`/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            throw new Error('Error al actualizar el producto.');
        }
        alert('Producto actualizado correctamente.');
        location.reload();  
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un problema al actualizar el producto.');
    }
}

async function updateProducts(updatedProducts) {
    const realtimeProductList = document.getElementById("realtimeProductList");
    realtimeProductList.innerHTML = "";
    updatedProducts.forEach((product) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `<strong>${product.title}</strong>
                            <p>${product.description}</p>
                            <p>Precio: ${product.price}</p>
                            <p>Stock: ${product.stock}</p>`;
        realtimeProductList.appendChild(listItem);
    });
}


async function addToCart(productId, userId) {
    try {
        const cartResponse = await fetch(`/api/carts/${userId}`);
        const cartData = await cartResponse.json();
        let cartId;
        if (cartData.status == "ok") {
            cartId = cartData.data._id;
        } else {
            const newCartResponse =  await fetch(`/api/carts/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
            });
            const newCartData =  await newCartResponse.json();
            cartId = newCartData.carts._id;
        }
        const addToCartResponse = await fetch(`/api/carts/${cartId}/product/${productId}`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            }
        });
        const addToCartData = await addToCartResponse.json();
        alert(addToCartData.message);
    } catch (error) {
        console.error('Error al agregar el producto al carrito:', error);
        alert('Hubo un problema al agregar el producto al carrito.');
    }
}
function redirectToCart(userId) {
    fetch(`/api/carts/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Tu carrito está vacío.');
            }
            return response.json();
        })
        .then(data => {
            let cartId
            for (let i = 0; i < data.data.length; i++){
                if  (userId = data.data[i].UserId){
                    cartId = data.data[i]._id;
                }
            }
            window.location.href = `/api/carts/${cartId}/purchase`;
        })
        .catch(error => {
            console.error('Error al redirigir al carrito:', error);
            alert(error.message);
        });
}
async function eliminarProductoCarrito(cartId, productId) {
    try {
        const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            const data = await response.json();
            const { quantity, price } = data.product;
            const cantidadElement = document.getElementById(`cantidad-${productId}`);
            const precioElement = document.getElementById(`precio-${productId}`);
            const subtotalElement = document.getElementById(`subtotal-${productId}`);
            cantidadElement.textContent = quantity;
            precioElement.textContent = price;
            subtotalElement.textContent = quantity * price;
            if (quantity === 0) {
                const filaProducto = document.getElementById(`fila-${productId}`);
                filaProducto.remove();
            }
        } else {
            console.error('Error al eliminar el producto:', response.statusText);
        }
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
    }
}