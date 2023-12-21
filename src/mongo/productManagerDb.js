const Product = require('../mongo/models/Product');
const { promises } = require("dns");
const fs = require("fs");
const { json } = require("stream/consumers");

class ProductManagerDb {
    constructor() {
        this.path = "Products.json";
    }

    async addProduct(productData) {
        try {
            const { title, description, price, code, stock, category, thumbnails } = productData;

            const existingProduct = await Product.findOne({ code });

            if (existingProduct) {
                console.log("Código de producto ya ingresado.");
                return;
            }

            const newProduct = new Product({
                title,
                description,
                price,
                code,
                stock,
                status: true,
                category,
                thumbnails,
            });

            await newProduct.save();

            console.log("Producto ingresado con éxito");
        } catch (error) {
            console.error("Error al agregar el producto:", error);
        }
    }

    async getProducts(limit) {
        try {
            let query = Product.find();

            if (limit) {
                query = query.limit(parseInt(limit));
            }

            const products = await query.exec();
            return products;
        } catch (error) {
            console.error("Error al obtener productos:", error);
            return [];
        }
    }

    async getProductById(id) {
        try {
            const product = await Product.findById(id);
            if (product) {
                return product;
            } else {
                console.log("Producto no encontrado");
                return null;
            }
        } catch (error) {
            console.error("Error al obtener el producto por ID:", error);
            return null;
        }
    }

    async deleteProducts(id) {
        try {
            const result = await Product.findByIdAndDelete(id);
            if (result) {
                console.log(`Producto con ID ${id} eliminado correctamente`);
                return { status: "ok", message: `Producto con ID ${id} eliminado correctamente` };
            } else {
                throw new Error(`Producto con ID ${id} no encontrado.`);
            }
        } catch (error) {
            console.error("Error al eliminar el producto:", error);
            return { status: "error", message: "Error al eliminar el producto." };
        }
    }

    async updateProducts(id, updatedProductData) {
        try {
            const result = await Product.findByIdAndUpdate(id, updatedProductData, { new: true });
            if (result) {
                console.log("Producto actualizado con éxito");
                return result;
            } else {
                throw new Error(`Producto con ID ${id} no encontrado.`);
            }
        } catch (error) {
            console.error("Error al actualizar el producto:", error);
            throw error;
        }
    }
}

module.exports = ProductManagerDb;