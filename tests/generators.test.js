/**
 * Generators API Tests
 */

'use strict';

const request = require('supertest');
let app;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '0';
    app = require('../server');
});

describe('Generators API', () => {
    describe('GET /api/generators', () => {
        it('should return list of generators', async () => {
            const res = await request(app)
                .get('/api/generators')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.generators).toBeInstanceOf(Array);
            expect(res.body.count).toBeGreaterThan(0);
        });

        it('should include built-in generators', async () => {
            const res = await request(app).get('/api/generators').expect(200);
            const ids = res.body.generators.map(g => g.id);
            expect(ids).toContain('blog-post');
            expect(ids).toContain('landing-page');
        });
    });

    describe('GET /api/generators/:id', () => {
        it('should return generator details', async () => {
            const res = await request(app)
                .get('/api/generators/blog-post')
                .expect(200);

            expect(res.body.generator.id).toBe('blog-post');
            expect(res.body.generator.fields).toBeInstanceOf(Array);
        });

        it('should return 404 for non-existent', async () => {
            await request(app)
                .get('/api/generators/non-existent')
                .expect(404);
        });
    });

    describe('POST /api/generators/:id/generate', () => {
        it('should generate page from template', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const { csrfToken } = csrfRes.body;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .post('/api/generators/blog-post/generate')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({
                    pageId: 'test-blog',
                    data: { title: 'Test', content: 'Content', author: 'Author', publishDate: new Date().toISOString() }
                })
                .expect(200);

            expect(res.body.page.generator).toBe('blog-post');
        });
    });

    describe('POST /api/generators/custom/register', () => {
        it('should register custom generator', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const { csrfToken } = csrfRes.body;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .post('/api/generators/custom/register')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({
                    id: 'custom-test',
                    name: 'Custom Test',
                    fields: [{ name: 'title', type: 'text', required: true }],
                    template: { sections: [] }
                })
                .expect(201);

            expect(res.body.generator.isCustom).toBe(true);
        });
    });
});
