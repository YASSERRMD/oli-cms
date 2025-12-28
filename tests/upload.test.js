/**
 * Upload API Tests
 * Integration tests for file upload operations
 */

'use strict';

const request = require('supertest');
const fs = require('fs');
const path = require('path');

let app;

// Test directories
const TEST_UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
const TEST_PAGES_DIR = path.join(__dirname, '..', 'data', 'pages');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Create test fixtures directory
const ensureFixtures = () => {
    if (!fs.existsSync(FIXTURES_DIR)) {
        fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    }

    // Create test files
    const testImagePath = path.join(FIXTURES_DIR, 'test-image.png');
    if (!fs.existsSync(testImagePath)) {
        // Create a minimal valid PNG file
        const pngHeader = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, // IHDR length
            0x49, 0x48, 0x44, 0x52, // IHDR
            0x00, 0x00, 0x00, 0x01, // width: 1
            0x00, 0x00, 0x00, 0x01, // height: 1
            0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
            0x00, 0x00, 0x00, // compression, filter, interlace
            0x90, 0x77, 0x53, 0xDE, // CRC
            0x00, 0x00, 0x00, 0x0C, // IDAT length
            0x49, 0x44, 0x41, 0x54, // IDAT
            0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01,
            0x00, 0x05, // CRC placeholder
            0x00, 0x00, 0x00, 0x00, // IEND length
            0x49, 0x45, 0x4E, 0x44, // IEND
            0xAE, 0x42, 0x60, 0x82  // CRC
        ]);
        fs.writeFileSync(testImagePath, pngHeader);
    }

    const testTextPath = path.join(FIXTURES_DIR, 'test-file.txt');
    if (!fs.existsSync(testTextPath)) {
        fs.writeFileSync(testTextPath, 'This is a test file for upload testing.');
    }

    const testPdfPath = path.join(FIXTURES_DIR, 'test-doc.pdf');
    if (!fs.existsSync(testPdfPath)) {
        // Create minimal PDF
        fs.writeFileSync(testPdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>');
    }
};

// Cleanup test files
const cleanupTestFiles = async () => {
    // Clean test uploads
    if (fs.existsSync(TEST_UPLOAD_DIR)) {
        const files = fs.readdirSync(TEST_UPLOAD_DIR);
        for (const file of files) {
            if (file !== '.gitkeep') {
                try {
                    fs.unlinkSync(path.join(TEST_UPLOAD_DIR, file));
                } catch (e) {
                    // Ignore
                }
            }
        }
    }

    // Clean test pages
    if (fs.existsSync(TEST_PAGES_DIR)) {
        const files = fs.readdirSync(TEST_PAGES_DIR).filter(f => f.startsWith('test-upload'));
        for (const file of files) {
            try {
                fs.unlinkSync(path.join(TEST_PAGES_DIR, file));
            } catch (e) {
                // Ignore
            }
        }
    }
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '0';

    ensureFixtures();
    app = require('../server');
});

afterAll(async () => {
    await cleanupTestFiles();
    // Clean fixtures
    if (fs.existsSync(FIXTURES_DIR)) {
        const files = fs.readdirSync(FIXTURES_DIR);
        for (const file of files) {
            fs.unlinkSync(path.join(FIXTURES_DIR, file));
        }
        fs.rmdirSync(FIXTURES_DIR);
    }
});

beforeEach(async () => {
    await cleanupTestFiles();
});

describe('Upload API', () => {
    // Helper to create a test page
    const createTestPage = async (pageId) => {
        const csrfRes = await request(app).get('/api/csrf-token');
        const csrfToken = csrfRes.body.csrfToken;
        const cookies = csrfRes.headers['set-cookie'];

        await request(app)
            .post('/api/pages')
            .set('Cookie', cookies)
            .set('X-CSRF-Token', csrfToken)
            .send({ id: pageId, title: `Test Page ${pageId}` });

        return { csrfToken, cookies };
    };

    // ==========================================================================
    // POST /api/upload - Single File Upload
    // ==========================================================================
    describe('POST /api/upload', () => {
        it('should upload a single image file', async () => {
            const { csrfToken, cookies } = await createTestPage('test-upload-single');

            const res = await request(app)
                .post('/api/upload')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .field('pageId', 'test-upload-single')
                .attach('file', path.join(FIXTURES_DIR, 'test-image.png'))
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.file).toBeDefined();
            expect(res.body.file.filename).toMatch(/^[a-f0-9]{32}\.png$/);
            expect(res.body.file.category).toBe('image');
        });

        it('should upload a PDF document', async () => {
            const { csrfToken, cookies } = await createTestPage('test-upload-pdf');

            const res = await request(app)
                .post('/api/upload')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .field('pageId', 'test-upload-pdf')
                .attach('file', path.join(FIXTURES_DIR, 'test-doc.pdf'))
                .expect(201);

            expect(res.body.file.category).toBe('document');
        });

        it('should return 404 if page does not exist', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .post('/api/upload')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .field('pageId', 'non-existent-page')
                .attach('file', path.join(FIXTURES_DIR, 'test-image.png'))
                .expect(404);

            expect(res.body.error).toBe('Not Found');
        });

        it('should require pageId', async () => {
            const csrfRes = await request(app).get('/api/csrf-token');
            const csrfToken = csrfRes.body.csrfToken;
            const cookies = csrfRes.headers['set-cookie'];

            const res = await request(app)
                .post('/api/upload')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .attach('file', path.join(FIXTURES_DIR, 'test-image.png'))
                .expect(422);

            expect(res.body.error).toBe('Validation Error');
        });

        it('should return 400 if no file uploaded', async () => {
            const { csrfToken, cookies } = await createTestPage('test-upload-nofile');

            const res = await request(app)
                .post('/api/upload')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .field('pageId', 'test-upload-nofile')
                .expect(400);

            expect(res.body.message).toContain('No file');
        });
    });

    // ==========================================================================
    // POST /api/upload/multiple - Multiple File Upload
    // ==========================================================================
    describe('POST /api/upload/multiple', () => {
        it('should upload multiple files', async () => {
            const { csrfToken, cookies } = await createTestPage('test-upload-multi');

            const res = await request(app)
                .post('/api/upload/multiple')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .field('pageId', 'test-upload-multi')
                .attach('files', path.join(FIXTURES_DIR, 'test-image.png'))
                .attach('files', path.join(FIXTURES_DIR, 'test-doc.pdf'))
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.count).toBe(2);
            expect(res.body.files).toHaveLength(2);
        });
    });

    // ==========================================================================
    // GET /api/upload/:pageId - List Files
    // ==========================================================================
    describe('GET /api/upload/:pageId', () => {
        it('should list files for a page', async () => {
            const { csrfToken, cookies } = await createTestPage('test-upload-list');

            // Upload a file
            await request(app)
                .post('/api/upload')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .field('pageId', 'test-upload-list')
                .attach('file', path.join(FIXTURES_DIR, 'test-image.png'));

            // List files
            const res = await request(app)
                .get('/api/upload/test-upload-list')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.files.length).toBeGreaterThan(0);
        });

        it('should return 404 for non-existent page', async () => {
            const res = await request(app)
                .get('/api/upload/non-existent-page')
                .expect(404);

            expect(res.body.error).toBe('Not Found');
        });
    });

    // ==========================================================================
    // DELETE /api/upload/:pageId/:filename - Delete File
    // ==========================================================================
    describe('DELETE /api/upload/:pageId/:filename', () => {
        it('should delete a file from a page', async () => {
            const { csrfToken, cookies } = await createTestPage('test-upload-delete');

            // Upload a file
            const uploadRes = await request(app)
                .post('/api/upload')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .field('pageId', 'test-upload-delete')
                .attach('file', path.join(FIXTURES_DIR, 'test-image.png'));

            const filename = uploadRes.body.file.filename;

            // Delete the file
            const res = await request(app)
                .delete(`/api/upload/test-upload-delete/${filename}`)
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .expect(200);

            expect(res.body.success).toBe(true);
        });

        it('should return 404 for non-existent file', async () => {
            const { csrfToken, cookies } = await createTestPage('test-upload-del-404');

            const res = await request(app)
                .delete('/api/upload/test-upload-del-404/nonexistent12345678901234567890ab.png')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .expect(404);

            expect(res.body.error).toBe('Not Found');
        });
    });

    // ==========================================================================
    // GET /api/upload/stats/:pageId - Upload Statistics
    // ==========================================================================
    describe('GET /api/upload/stats/:pageId', () => {
        it('should return upload statistics', async () => {
            const { csrfToken, cookies } = await createTestPage('test-upload-stats');

            // Upload files
            await request(app)
                .post('/api/upload')
                .set('Cookie', cookies)
                .set('X-CSRF-Token', csrfToken)
                .field('pageId', 'test-upload-stats')
                .attach('file', path.join(FIXTURES_DIR, 'test-image.png'));

            // Get stats
            const res = await request(app)
                .get('/api/upload/stats/test-upload-stats')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.stats).toBeDefined();
            expect(res.body.stats.totalFiles).toBeGreaterThanOrEqual(1);
            expect(res.body.stats.byCategory).toBeDefined();
        });
    });
});
