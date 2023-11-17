const { promises } = require("dns")
const fs = require("fs")
const { json } = require("stream/consumers")

class ProductManager {
    constructor(){
        this.products = []
        this.path = "Products.json"
    }
    async addProduct(title, description, price, thumbnail, code, stock){
        title = title || undefined
        description = description || undefined
        price = price ?? undefined
        thumbnail = thumbnail ?? undefined
        code = code || undefined
        stock = stock ?? undefined
        let id = 0
        const statsJson = await fs.promises.stat(this.path)
        let validoCode = []
        // Aca verifico si hay o no productos cargados en el Products.json para no repetir productos con el mismo codigo
        if (statsJson.size === 0){
            validoCode = this.products.find((codeSearch) => codeSearch.code == code)
        } else {
            const buscaCode = await fs.promises.readFile(this.path, "utf-8")
            const buscaCodeParse = JSON.parse(buscaCode)
            validoCode = buscaCodeParse.find((codeSearch) => codeSearch.code == code)
        }
        if ( title == undefined || thumbnail == undefined|| price == undefined || description == undefined || code == undefined || stock  == undefined ){
            return console.log("Es necesario que todos los campos esten completos.")
        }else if (validoCode== undefined){
            let size = 0
            // le asigno el valor a products lo que hay en el archivo, asi se escriben todos los archivos y no me borre los anteriores
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
            this.products.push({title, description, price, thumbnail, code,stock, id: id})
            const productosString = JSON.stringify(this.products, null , 2)
            await fs.promises.writeFile(this.path, productosString)
            return console.log("Producto ingresado con exito");
        }else{
            return console.log("Codigo de producto ya ingresado.")
        }
    }
    async getProducts(limit){
        // siempre verifico que exista algo en el archivo
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
        // siempre verifico que exista algo en el archivo
        const statsJsonId = await fs.promises.stat(this.path)
        if (statsJsonId.size === 0){
            return console.log("No hay productos ingresados.");
        }else {
            // busco el id consiguiendo el array que esta almacenado en json 
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
        // siempre verifico que exista algo en el archivo
        const statJsonDelete = await fs.promises.stat(this.path)
        if (statJsonDelete.size === 0){
            return console.log("No hay productos cargados.");
        }else {
            // busco el id del producto a eliminar, lo elimino del array y sobreescribo el producs.json sin el producto eliminado
            const deleteRead = await fs.promises.readFile(this.path, "utf-8")
            const deleteProducts = JSON.parse(deleteRead)
            const index = deleteProducts.findIndex((item) => item.id === id)
            if (index !== -1){
                // splice para eliminar el objeto del array con su indice
                deleteProducts.splice(index, 1)
                const deleteContent = JSON.stringify(deleteProducts, null, 2)
                await fs.promises.writeFile(this.path, deleteContent)
                return console.log(`Producto de id: ${id} eliminado correctamente`);
            }else {
                return console.log(`ID ${id} no encontrado`);
            }
        }
    }
    async updateProducts(id, CamposUpdate){
        // siempre verifico que exista algo en el archivo
        const statJsonUpdate = await fs.promises.stat(this.path)
        if (statJsonUpdate.size === 0){
            return console.log("No hay productos cargados");
        }else{
            // busco el objeto con su id, consiguiendo el array del archivo.
            let updateContentRead = await fs.promises.readFile(this.path, "utf-8")
            const updateContent = JSON.parse(updateContentRead)
            const indexUpdate = updateContent.findIndex((item) => item.id === id)
            if (indexUpdate !== -1){
                // el object.assign lo utilizo para seleccionar solamente los campos especificados
                Object.assign(updateContent[indexUpdate], CamposUpdate)
                const updateString = JSON.stringify(updateContent, null, 2)
                await fs.promises.writeFile(this.path, updateString)
                return console.log("Contenido actualizado con exito");
            }else {
                return console.log("Producto no encontrado.");
            }
        }
    }
}


async function cosasAsincronas(){
    const producto = new ProductManager()
    await producto.addProduct("hola", "yo", 10, "nada", "abc123", 120) 
    await producto.addProduct("holasda", "y123o", 10, "na123da", "abc123", 120) 
    await producto.addProduct("otro", "nose", 13, "ajam", "alojamama", 10)
    await producto.addProduct("holasda2", "y123o12", 11, "qwe23", "abc1233", 1210)
    await producto.addProduct("holasda3", "y123o13", 12, "qasdqw2", "abc1234", 1270)
    await producto.addProduct("holasda4", "y123o14", 13, "sdgfsdf3", "abc1236", 1250)
    await producto.addProduct("holasda5", "y123o15", 14, "sdafsdf123", "abc12313", 1820)
    await producto.addProduct("holasda7", "y123o16", 15, "213sda", "abc13223", 1250)
    await producto.addProduct("holasda6", "y123o17", 16, "asdqaw123", "abc43123", 1240)
    await producto.addProduct("holasda8", "y123o18", 17, "123asdas", "abc1221233", 1820) 
}
cosasAsincronas()

module.exports = ProductManager

