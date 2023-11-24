const { promises } = require("dns")
const fs = require("fs")
const { json } = require("stream/consumers")

class ProductManager {
    constructor(){
        this.products = []
        this.path = "Products.json"
    }
    async addProduct(productData){
        let { title, description, price, thumbnail, code, stock, status, category, thumbnails } = productData;
        title = title || undefined
        description = description || undefined
        price = price ?? undefined
        thumbnail = []  
        code = code || undefined
        stock = stock ?? undefined
        category = category ?? undefined
        status = true
        let id = 0
        const statsJson = await fs.promises.stat(this.path)
        let validoCode = []
        if (statsJson.size === 0){
            validoCode = this.products.find((codeSearch) => codeSearch.code == code)
        } else {
            const buscaCode = await fs.promises.readFile(this.path, "utf-8")
            const buscaCodeParse = JSON.parse(buscaCode)
            validoCode = buscaCodeParse.find((codeSearch) => codeSearch.code == code)
        }
        if ( title == undefined || /* thumbnail == undefined||  */price == undefined || description == undefined || code == undefined || stock  == undefined || category == undefined ){
            return console.log("Es necesario que todos los campos esten completos.")
        }else if (validoCode== undefined){
            let size = 0
            if (statsJson.size !== 0){
                const leoArchivo = await fs.promises.readFile(this.path, "utf-8")
                const leoArchivoParse = JSON.parse(leoArchivo)
                this.products = leoArchivoParse
                size = leoArchivoParse.length
            }else {
                size = this.products.length
            }
            for (let i = 0; i < size; i++){
                const element = this.products[i]
                if (element.id > id){
                    id = element.id
                }
            }
            id++
            this.products.push({
                title,
                description,
                price,
                thumbnail,
                code,
                stock,
                status,
                category,
                thumbnails,
                id: id
            })
            const productosString = JSON.stringify(this.products, null , 2)
            await fs.promises.writeFile(this.path, productosString)
            return console.log("Producto ingresado con exito");
        }else{
            return console.log("Codigo de producto ya ingresado.")
        }
    }
    async getProducts(limit){
        const statsJsonProduct = await fs.promises.stat(this.path)
        if (statsJsonProduct.size === 0){
            return [];
        }else{
            const ProductosArchivo = await fs.promises.readFile(this.path, "utf-8")
            const ProductosParse = JSON.parse(ProductosArchivo)
            if (limit){
                return ProductosParse.slice(0,parseInt(limit))
            }else {
                return ProductosParse;
            }
        }
    }
    async getProductById(id){
        const statsJsonId = await fs.promises.stat(this.path)
        if (statsJsonId.size === 0){
            return console.log("No hay productos ingresados.");
        }else {
            const buscaId = await fs.promises.readFile(this.path, "utf-8")
            const buscaIdParse = JSON.parse(buscaId)
            const productoEncontrado = buscaIdParse.find((item) => (item.id == parseInt(id)))
            if (productoEncontrado){
                return productoEncontrado
            }else {
                return console.log("NOT FOUND")
            }
        }
    }
    async deleteProducts(id){
        const statJsonDelete = await fs.promises.stat(this.path)
        if (statJsonDelete.size === 0){
            return console.log("No hay productos cargados.");
        }else {
            const deleteRead = await fs.promises.readFile(this.path, "utf-8")
            const deleteProducts = JSON.parse(deleteRead)
            const index = deleteProducts.findIndex((item) => item.id === id)
            if (index !== -1){
                deleteProducts.splice(index, 1)
                const deleteContent = JSON.stringify(deleteProducts, null, 2)
                await fs.promises.writeFile(this.path, deleteContent)
                return { status: "ok", message: `Producto con ID ${id} eliminado correctamente` }
            }else {
                throw new Error(`Producto con ID ${id} no encontrado.`)
            }
        }
    }
    
    async updateProducts(id, updatedProductData){
        const statJsonUpdate = await fs.promises.stat(this.path);
        if (statJsonUpdate.size === 0) {
            throw new Error("No hay productos cargados.");
        }
        let updateContentRead = await fs.promises.readFile(this.path, "utf-8");
        const updateContent = JSON.parse(updateContentRead);
        const indexUpdate = updateContent.findIndex((item) => item.id === id);
        if (indexUpdate !== -1) {
            Object.keys(updatedProductData).forEach((key) => {
                if (key in updateContent[indexUpdate]) {
                    updateContent[indexUpdate][key] = updatedProductData[key];
                }
            });
            const updateString = JSON.stringify(updateContent, null, 2);
            await fs.promises.writeFile(this.path, updateString);
            console.log("Producto actualizado con éxito");
        } else {
            throw new Error(`Producto con ID ${id} no encontrado.`);
        }
    }
}


async function cosasAsincronas(){
    const producto = new ProductManager()
}
cosasAsincronas()

module.exports = ProductManager

