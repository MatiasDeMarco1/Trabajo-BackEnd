const socket = io();
socket.on("updateProducts", (updatedProducts) => {
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
});


function actualizarProductos() {
    socket.emit("updateProducts");
}


actualizarProductos();