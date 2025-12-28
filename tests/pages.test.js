/**
 * Pages API Tests
 * Integration tests for page CRUD operations
 */

'use strict';

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Import app (we'll need to create a test setup)
let app;
let server;

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, '..', 'data', 'pages');

// Helper to clean test pages
const cleanTestPages = async () => {
    const testFiles = fs.readdirSync(TEST_DATA_DIR)
        .filter(f => f.startsWith('test-') && f.endsWith('.json'));

    for (const file of testFiles) {
        try {
            fs.unlinkSync(path.join(TEST_DATA_DIR, file));
        } catch (e) {
            // Ignore
        }
    }
};

// Setup and teardown
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = '0'; // Use random port

    // Import app after setting env
    app = require('../server');
});

afterAll(async () => {
    await cleanTestPages();
    if (server) {
        server.close();
    }
});

beforeEach(async () => {
    await cleanTestPages();
});

describe('Pages API', () => {
    // ==========================================================================
    // GET /api/pages - List Pages
    // ==========================================================================
    describe('GET /api/pages', () => {
        it('should return empty array when no pages exist', async () => {
            const res = await request(app)
                .get('/api/pages')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.pages).toBeInstanceOf(Array);
            expect(res.body.count).toBeGreaterThanOrEqual(0);
        });

        it('should return pages after creation', async () => {
            // First create a page
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({
                    id: 'test-list-page',
                    title: 'Test Page for Listing'
                });

            const res = await request(app)
                .get('/api/pages')
                .expect(200);

            expect(res.body.pages.length).toBeGreaterThan(0);
            const testPage = res.body.pages.find(p => p.id === 'test-list-page');
            expect(testPage).toBeDefined();
            expect(testPage.title).toBe('Test Page for Listing');
        });

        it('should filter pages with search query', async () => {
            // Create multiple pages
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-search-alpha', title: 'Alpha Page' });

            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-search-beta', title: 'Beta Page' });

            const res = await request(app)
                .get('/api/pages?search=alpha')
                .expect(200);

            expect(res.body.pages.some(p => p.title.toLowerCase().includes('alpha'))).toBe(true);
        });
    });

    // ==========================================================================
    // GET /api/pages/:id - Get Single Page
    // ==========================================================================
    describe('GET /api/pages/:id', () => {
        it('should return 404 for non-existent page', async () => {
            const res = await request(app)
                .get('/api/pages/non-existent-page')
                .expect(404);

            expect(res.body.error).toBe('Not Found');
        });

        it('should return page by ID', async () => {
            // Create a page first
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({
                    id: 'test-get-page',
                    title: 'Page to Get'
                });

            const res = await request(app)
                .get('/api/pages/test-get-page')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.page.id).toBe('test-get-page');
            expect(res.body.page.title).toBe('Page to Get');
        });

        it('should reject invalid page ID format', async () => {
            const res = await request(app)
                .get('/api/pages/invalid..id')
                .expect(422);

            expect(res.body.error).toBe('Validation Error');
        });
    });

    // ==========================================================================
    // POST /api/pages - Create Page
    // ==========================================================================
    describe('POST /api/pages', () => {
        it('should create a new page', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({
                    id: 'test-new-page',
                    title: 'New Test Page',
                    slug: 'new-test-page'
                })
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.page.id).toBe('test-new-page');
            expect(res.body.page.slug).toBe('new-test-page');
            expect(res.body.page.status).toBe('draft');
        });

        it('should auto-generate slug from title', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({
                    id: 'test-auto-slug',
                    title: 'My Amazing Page Title'
                })
                .expect(201);

            expect(res.body.page.slug).toBe('my-amazing-page-title');
        });

        it('should return 409 for duplicate page ID', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            // Create first page
            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-duplicate', title: 'First Page' });

            // Try to create duplicate
            const res = await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-duplicate', title: 'Duplicate Page' })
                .expect(409);

            expect(res.body.error).toBe('Conflict');
        });

        it('should require page ID', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ title: 'No ID Page' })
                .expect(422);

            expect(res.body.error).toBe('Validation Error');
            expect(res.body.details.some(e => e.field === 'id')).toBe(true);
        });

        it('should require title', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-no-title' })
                .expect(422);

            expect(res.body.details.some(e => e.field === 'title')).toBe(true);
        });

        it('should reject invalid page ID characters', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test page with spaces', title: 'Invalid ID' })
                .expect(422);

            expect(res.body.error).toBe('Validation Error');
        });
    });

    // ==========================================================================
    // PUT /api/pages/:id - Update Page
    // ==========================================================================
    describe('PUT /api/pages/:id', () => {
        it('should update an existing page', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            // Create page
            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-update', title: 'Original Title' });

            // Update page
            const res = await request(app)
                .put('/api/pages/test-update')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ title: 'Updated Title' })
                .expect(200);

            expect(res.body.page.title).toBe('Updated Title');
        });

        it('should return 404 for non-existent page', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .put('/api/pages/non-existent')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ title: 'New Title' })
                .expect(404);

            expect(res.body.error).toBe('Not Found');
        });

        it('should update status', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-status', title: 'Status Page' });

            const res = await request(app)
                .put('/api/pages/test-status')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ status: 'published' })
                .expect(200);

            expect(res.body.page.status).toBe('published');
        });
    });

    // ==========================================================================
    // DELETE /api/pages/:id - Delete Page
    // ==========================================================================
    describe('DELETE /api/pages/:id', () => {
        it('should delete an existing page', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            // Create page
            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-delete', title: 'Page to Delete' });

            // Delete page
            const res = await request(app)
                .delete('/api/pages/test-delete')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.pageId).toBe('test-delete');

            // Verify deleted
            await request(app)
                .get('/api/pages/test-delete')
                .expect(404);
        });

        it('should return 404 for non-existent page', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .delete('/api/pages/non-existent')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .expect(404);

            expect(res.body.error).toBe('Not Found');
        });
    });

    // ==========================================================================
    // Sections Management
    // ==========================================================================
    describe('POST /api/pages/:id/sections', () => {
        it('should add a section to a page', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            // Create page
            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-sections', title: 'Sections Page' });

            // Add section
            const res = await request(app)
                .post('/api/pages/test-sections/sections')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ type: 'hero', data: { title: 'Hero Title' } })
                .expect(201);

            expect(res.body.section).toBeDefined();
            expect(res.body.section.type).toBe('hero');
            expect(res.body.page.content.sections.length).toBe(1);
        });

        it('should reject invalid section type', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            await request(app)
                .post('/api/pages')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ id: 'test-invalid-section', title: 'Invalid Section Page' });

            const res = await request(app)
                .post('/api/pages/test-invalid-section/sections')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .send({ type: 'invalid-type', data: {} })
                .expect(422);

            expect(res.body.error).toBe('Validation Error');
        });
    });
});
