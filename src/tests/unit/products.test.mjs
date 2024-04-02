import * as chai from "chai";
import supertest from "supertest";
import Product from "../../mongo/models/Product.js";

const expect = chai.expect;
const requester = supertest("http://localhost:8080");


describe('Products Router', () => {
    it('Debería obtener la lista de productos después de iniciar sesión', async () => {
        const userData = {
            _id: '660b629b878e7b8379d1bb7a', 
            first_name: 'prueba',
            last_name: 'test',
            email: 'testuser@example.com',
            age: 99,
            password: '$2b$10$n8/B3UwUBUbKY8oyZcQs/eAkL0H8Imce0ht76mGQceBZAc352PhOC',
            role: 'user',
            __v: 0
        };
        const loginRes = await requester.post('/api/sessions/login').send({
            email: userData.email,
            password: 'password123' 
        });

        expect(loginRes.status).to.equal(302);

        const userCookie = loginRes.headers['set-cookie'][0];
        const productsRes = await requester.get('/products')
            .set('Cookie', userCookie);

        expect(productsRes.status).to.equal(200);
        expect(productsRes.body).to.be.an('object')
    });

    it('Debería retornar un producto por ID', async () => {
        try { 
            const res = await requester.get(`/products/65833f3c69db2b7a2f3c57a4`);
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
        } catch (error) {
            throw error;
        }
    });

});
