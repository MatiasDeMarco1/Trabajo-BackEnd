import * as chai from "chai";
import supertest from "supertest";
import isAuthenticated from "../../middleware/auth.middleware.js"; 

const expect = chai.expect;
const requester = supertest("http://localhost:8080");

describe('Session Router', () => {

    it('Debería iniciar sesión con éxito', async () => {
        const loginData = {
            email: 'testuser@example.com',
            password: 'password123'
        };
        const res = await requester.post('/api/sessions/login').send(loginData);
        expect(res.status).to.equal(302);
    });

    it('Debería cerrar sesión con éxito', async () => {
        const res = await requester.get('/api/sessions/logout');
        
        expect(res.status).to.equal(302);
    });
});