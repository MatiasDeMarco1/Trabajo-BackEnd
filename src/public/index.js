document.addEventListener("DOMContentLoaded", function () {
    const socket = io();

    socket.on("updateProducts", (updatedProducts) => {
        updateProductList(updatedProducts);
    });
    function updateProductList(products) {
        const realtimeProductList = document.getElementById("realtimeProductList");
        realtimeProductList.innerHTML = "";

        products.forEach((product) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${product.title}</strong>
                                <p>${product.description}</p>
                                <p>Precio: ${product.price}</p>
                                <p>Stock: ${product.stock}</p>`;
            realtimeProductList.appendChild(listItem);
        });
    }
});