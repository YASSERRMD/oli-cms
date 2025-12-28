/**
 * Generators API Routes
 * Page template generators and customization
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

// =============================================================================
// BUILT-IN GENERATORS
// =============================================================================

/**
 * Default generators with templates
 */
const generators = {
    'blog-post': {
        id: 'blog-post',
        name: 'Blog Post',
        description: 'Create a blog article with title, content, and metadata',
        icon: '📝',
        category: 'content',
        fields: [
            { name: 'title', type: 'text', required: true, label: 'Post Title', maxLength: 200 },
            { name: 'excerpt', type: 'textarea', required: false, label: 'Excerpt', maxLength: 500 },
            { name: 'content', type: 'richtext', required: true, label: 'Post Content' },
            { name: 'author', type: 'text', required: false, label: 'Author Name' },
            { name: 'category', type: 'select', required: false, label: 'Category', options: ['Technology', 'Business', 'Lifestyle', 'News', 'Tutorial'] },
            { name: 'tags', type: 'tags', required: false, label: 'Tags' },
            { name: 'featuredImage', type: 'image', required: false, label: 'Featured Image' },
            { name: 'publishDate', type: 'date', required: false, label: 'Publish Date' }
        ],
        template: {
            sections: [
                { type: 'hero', dataMap: { title: 'title', subtitle: 'excerpt', backgroundImage: 'featuredImage' } },
                { type: 'rich-text', dataMap: { content: 'content' } },
                { type: 'custom', dataMap: { author: 'author', date: 'publishDate', category: 'category', tags: 'tags' }, templateId: 'blog-meta' }
            ]
        }
    },

    'landing-page': {
        id: 'landing-page',
        name: 'Landing Page',
        description: 'Create a marketing landing page with hero, features, and CTA',
        icon: '🚀',
        category: 'marketing',
        fields: [
            { name: 'headline', type: 'text', required: true, label: 'Main Headline', maxLength: 100 },
            { name: 'subheadline', type: 'text', required: false, label: 'Subheadline', maxLength: 200 },
            { name: 'heroImage', type: 'image', required: false, label: 'Hero Image' },
            { name: 'ctaText', type: 'text', required: true, label: 'CTA Button Text', maxLength: 50 },
            { name: 'ctaUrl', type: 'url', required: true, label: 'CTA Button URL' },
            {
                name: 'features', type: 'array', required: false, label: 'Features', itemFields: [
                    { name: 'icon', type: 'text', label: 'Icon' },
                    { name: 'title', type: 'text', label: 'Feature Title' },
                    { name: 'description', type: 'textarea', label: 'Feature Description' }
                ]
            },
            {
                name: 'testimonials', type: 'array', required: false, label: 'Testimonials', itemFields: [
                    { name: 'quote', type: 'textarea', label: 'Quote' },
                    { name: 'author', type: 'text', label: 'Author' },
                    { name: 'role', type: 'text', label: 'Role/Company' }
                ]
            }
        ],
        template: {
            sections: [
                { type: 'hero', dataMap: { title: 'headline', subtitle: 'subheadline', backgroundImage: 'heroImage', ctaText: 'ctaText', ctaUrl: 'ctaUrl' } },
                { type: 'features', dataMap: { items: 'features' } },
                { type: 'testimonials', dataMap: { items: 'testimonials' } },
                { type: 'cta', dataMap: { text: 'ctaText', url: 'ctaUrl' } }
            ]
        }
    },

    'product': {
        id: 'product',
        name: 'Product Page',
        description: 'Create a product showcase page with details and gallery',
        icon: '🛍️',
        category: 'ecommerce',
        fields: [
            { name: 'productName', type: 'text', required: true, label: 'Product Name', maxLength: 150 },
            { name: 'shortDescription', type: 'textarea', required: true, label: 'Short Description', maxLength: 300 },
            { name: 'fullDescription', type: 'richtext', required: false, label: 'Full Description' },
            { name: 'price', type: 'number', required: true, label: 'Price' },
            { name: 'currency', type: 'select', required: false, label: 'Currency', options: ['USD', 'EUR', 'GBP', 'JPY'], default: 'USD' },
            { name: 'sku', type: 'text', required: false, label: 'SKU' },
            { name: 'images', type: 'gallery', required: false, label: 'Product Images' },
            { name: 'specifications', type: 'keyvalue', required: false, label: 'Specifications' },
            { name: 'inStock', type: 'boolean', required: false, label: 'In Stock', default: true }
        ],
        template: {
            sections: [
                { type: 'hero', dataMap: { title: 'productName', subtitle: 'shortDescription' } },
                { type: 'gallery', dataMap: { images: 'images' } },
                { type: 'rich-text', dataMap: { content: 'fullDescription' } },
                { type: 'custom', dataMap: { price: 'price', currency: 'currency', sku: 'sku', inStock: 'inStock', specs: 'specifications' }, templateId: 'product-details' }
            ]
        }
    },

    'contact': {
        id: 'contact',
        name: 'Contact Page',
        description: 'Create a contact page with form and contact information',
        icon: '📧',
        category: 'utility',
        fields: [
            { name: 'title', type: 'text', required: true, label: 'Page Title', default: 'Contact Us' },
            { name: 'introduction', type: 'textarea', required: false, label: 'Introduction Text' },
            { name: 'email', type: 'email', required: false, label: 'Contact Email' },
            { name: 'phone', type: 'text', required: false, label: 'Phone Number' },
            { name: 'address', type: 'textarea', required: false, label: 'Address' },
            { name: 'mapEmbed', type: 'text', required: false, label: 'Google Maps Embed URL' },
            {
                name: 'formFields', type: 'array', required: false, label: 'Form Fields', itemFields: [
                    { name: 'name', type: 'text', label: 'Field Name' },
                    { name: 'type', type: 'select', label: 'Field Type', options: ['text', 'email', 'textarea', 'select'] },
                    { name: 'required', type: 'boolean', label: 'Required' }
                ]
            }
        ],
        template: {
            sections: [
                { type: 'hero', dataMap: { title: 'title', subtitle: 'introduction' } },
                { type: 'custom', dataMap: { email: 'email', phone: 'phone', address: 'address', map: 'mapEmbed' }, templateId: 'contact-info' },
                { type: 'form', dataMap: { fields: 'formFields' } }
            ]
        }
    },

    'about': {
        id: 'about',
        name: 'About Page',
        description: 'Create an about page with team members and company info',
        icon: 'ℹ️',
        category: 'utility',
        fields: [
            { name: 'title', type: 'text', required: true, label: 'Page Title', default: 'About Us' },
            { name: 'mission', type: 'textarea', required: false, label: 'Mission Statement' },
            { name: 'story', type: 'richtext', required: false, label: 'Our Story' },
            {
                name: 'values', type: 'array', required: false, label: 'Core Values', itemFields: [
                    { name: 'title', type: 'text', label: 'Value' },
                    { name: 'description', type: 'textarea', label: 'Description' }
                ]
            },
            {
                name: 'team', type: 'array', required: false, label: 'Team Members', itemFields: [
                    { name: 'name', type: 'text', label: 'Name' },
                    { name: 'role', type: 'text', label: 'Role' },
                    { name: 'photo', type: 'image', label: 'Photo' },
                    { name: 'bio', type: 'textarea', label: 'Bio' }
                ]
            }
        ],
        template: {
            sections: [
                { type: 'hero', dataMap: { title: 'title', subtitle: 'mission' } },
                { type: 'rich-text', dataMap: { content: 'story' } },
                { type: 'features', dataMap: { items: 'values' }, title: 'Our Values' },
                { type: 'custom', dataMap: { members: 'team' }, templateId: 'team-grid' }
            ]
        }
    },

    'faq': {
        id: 'faq',
        name: 'FAQ Page',
        description: 'Create a frequently asked questions page',
        icon: '❓',
        category: 'utility',
        fields: [
            { name: 'title', type: 'text', required: true, label: 'Page Title', default: 'Frequently Asked Questions' },
            { name: 'introduction', type: 'textarea', required: false, label: 'Introduction' },
            {
                name: 'categories', type: 'array', required: false, label: 'FAQ Categories', itemFields: [
                    { name: 'name', type: 'text', label: 'Category Name' },
                    {
                        name: 'questions', type: 'array', label: 'Questions', itemFields: [
                            { name: 'question', type: 'text', label: 'Question' },
                            { name: 'answer', type: 'textarea', label: 'Answer' }
                        ]
                    }
                ]
            }
        ],
        template: {
            sections: [
                { type: 'hero', dataMap: { title: 'title', subtitle: 'introduction' } },
                { type: 'faq', dataMap: { categories: 'categories' } }
            ]
        }
    }
};

// Store for custom generators (in-memory)
const customGenerators = {};

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            error: 'Validation Error',
            message: 'The request data failed validation.',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Generator ID validation
 */
const validateGeneratorId = [
    param('id')
        .trim()
        .notEmpty()
        .withMessage('Generator ID is required')
        .isLength({ max: 50 })
        .withMessage('Generator ID must not exceed 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Generator ID can only contain letters, numbers, hyphens, and underscores'),
    handleValidationErrors
];

/**
 * Generate page validation
 */
const validateGenerate = [
    param('id')
        .trim()
        .notEmpty()
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid Generator ID format'),
    body('pageId')
        .trim()
        .notEmpty()
        .withMessage('Page ID is required')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid Page ID format'),
    body('data')
        .optional()
        .isObject()
        .withMessage('Data must be an object'),
    handleValidationErrors
];

/**
 * Register custom generator validation
 */
const validateRegisterGenerator = [
    body('id')
        .trim()
        .notEmpty()
        .withMessage('Generator ID is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Generator ID must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Generator ID can only contain letters, numbers, hyphens, and underscores')
        .custom((value) => {
            if (generators[value] || customGenerators[value]) {
                throw new Error('Generator ID already exists');
            }
            return true;
        }),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Generator name is required')
        .isLength({ max: 100 })
        .withMessage('Generator name must not exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    body('icon')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('Icon must not exceed 10 characters'),
    body('fields')
        .isArray()
        .withMessage('Fields must be an array'),
    body('template')
        .isObject()
        .withMessage('Template must be an object'),
    handleValidationErrors
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all generators (built-in + custom)
 */
function getAllGenerators() {
    return { ...generators, ...customGenerators };
}

/**
 * Generate slug from text
 */
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Generate unique section ID
 */
function generateSectionId() {
    return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Map data to template section
 */
function mapDataToSection(sectionTemplate, data) {
    const section = {
        id: generateSectionId(),
        type: sectionTemplate.type,
        data: {},
        createdAt: new Date().toISOString()
    };

    if (sectionTemplate.dataMap) {
        for (const [sectionKey, dataKey] of Object.entries(sectionTemplate.dataMap)) {
            if (data[dataKey] !== undefined) {
                section.data[sectionKey] = data[dataKey];
            }
        }
    }

    if (sectionTemplate.templateId) {
        section.templateId = sectionTemplate.templateId;
    }

    if (sectionTemplate.title) {
        section.data.sectionTitle = sectionTemplate.title;
    }

    return section;
}

/**
 * Validate required fields
 */
function validateRequiredFields(generator, data) {
    const errors = [];

    for (const field of generator.fields) {
        if (field.required && (data[field.name] === undefined || data[field.name] === '')) {
            errors.push({
                field: field.name,
                message: `${field.label || field.name} is required`
            });
        }
    }

    return errors;
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /generators
 * List all available generators
 */
router.get('/', (req, res) => {
    const allGenerators = getAllGenerators();

    const generatorList = Object.values(allGenerators).map(gen => ({
        id: gen.id,
        name: gen.name,
        description: gen.description,
        icon: gen.icon,
        category: gen.category,
        isCustom: !!customGenerators[gen.id]
    }));

    // Group by category
    const byCategory = {};
    for (const gen of generatorList) {
        const category = gen.category || 'other';
        if (!byCategory[category]) {
            byCategory[category] = [];
        }
        byCategory[category].push(gen);
    }

    res.json({
        success: true,
        count: generatorList.length,
        generators: generatorList,
        byCategory
    });
});

/**
 * GET /generators/:id
 * Get generator details with schema
 */
router.get('/:id', validateGeneratorId, (req, res) => {
    const { id } = req.params;
    const allGenerators = getAllGenerators();

    const generator = allGenerators[id];
    if (!generator) {
        return res.status(404).json({
            error: 'Not Found',
            message: `Generator '${id}' not found`
        });
    }

    res.json({
        success: true,
        generator: {
            ...generator,
            isCustom: !!customGenerators[id]
        }
    });
});

/**
 * POST /generators/:id/generate
 * Generate page from template
 */
router.post('/:id/generate', validateGenerate, (req, res) => {
    const { id } = req.params;
    const { pageId, data = {} } = req.body;

    const allGenerators = getAllGenerators();
    const generator = allGenerators[id];

    if (!generator) {
        return res.status(404).json({
            error: 'Not Found',
            message: `Generator '${id}' not found`
        });
    }

    // Validate required fields
    const validationErrors = validateRequiredFields(generator, data);
    if (validationErrors.length > 0) {
        return res.status(422).json({
            error: 'Validation Error',
            message: 'Required fields are missing',
            details: validationErrors
        });
    }

    // Generate page from template
    const sections = generator.template.sections.map((sectionTemplate, index) => {
        const section = mapDataToSection(sectionTemplate, data);
        section.order = index;
        return section;
    });

    // Build generated page (not saved)
    const generatedPage = {
        id: pageId,
        title: data.title || data.headline || data.productName || data.name || 'Untitled Page',
        slug: generateSlug(data.title || data.headline || data.productName || pageId),
        generator: id,
        status: 'draft',
        content: {
            sections
        },
        metadata: {
            generatedAt: new Date().toISOString(),
            generatorId: id,
            generatorName: generator.name,
            sourceData: data
        },
        attachments: []
    };

    res.json({
        success: true,
        message: 'Page generated successfully. Use POST /api/pages to save.',
        page: generatedPage,
        notice: 'This page has not been saved. Submit it to POST /api/pages to persist.'
    });
});

/**
 * POST /generators/custom/register
 * Register custom generator
 */
router.post('/custom/register', validateRegisterGenerator, (req, res) => {
    const { id, name, description, icon, fields, template, category } = req.body;

    const customGenerator = {
        id,
        name,
        description: description || '',
        icon: icon || '📄',
        category: category || 'custom',
        fields,
        template,
        createdAt: new Date().toISOString()
    };

    customGenerators[id] = customGenerator;

    res.status(201).json({
        success: true,
        message: 'Custom generator registered successfully',
        generator: {
            id: customGenerator.id,
            name: customGenerator.name,
            description: customGenerator.description,
            icon: customGenerator.icon,
            category: customGenerator.category,
            isCustom: true
        }
    });
});

/**
 * DELETE /generators/custom/:id
 * Remove custom generator
 */
router.delete('/custom/:id', validateGeneratorId, (req, res) => {
    const { id } = req.params;

    // Cannot delete built-in generators
    if (generators[id]) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Cannot delete built-in generators'
        });
    }

    if (!customGenerators[id]) {
        return res.status(404).json({
            error: 'Not Found',
            message: `Custom generator '${id}' not found`
        });
    }

    delete customGenerators[id];

    res.json({
        success: true,
        message: 'Custom generator deleted successfully',
        generatorId: id
    });
});

/**
 * GET /generators/:id/preview
 * Preview generated page structure
 */
router.get('/:id/preview', validateGeneratorId, (req, res) => {
    const { id } = req.params;
    const allGenerators = getAllGenerators();

    const generator = allGenerators[id];
    if (!generator) {
        return res.status(404).json({
            error: 'Not Found',
            message: `Generator '${id}' not found`
        });
    }

    // Generate preview with sample data
    const sampleData = {};
    for (const field of generator.fields) {
        if (field.default !== undefined) {
            sampleData[field.name] = field.default;
        } else if (field.type === 'text') {
            sampleData[field.name] = `Sample ${field.label || field.name}`;
        } else if (field.type === 'textarea' || field.type === 'richtext') {
            sampleData[field.name] = `Sample content for ${field.label || field.name}`;
        } else if (field.type === 'number') {
            sampleData[field.name] = 0;
        } else if (field.type === 'boolean') {
            sampleData[field.name] = true;
        } else if (field.type === 'array') {
            sampleData[field.name] = [];
        }
    }

    const sections = generator.template.sections.map((sectionTemplate, index) => {
        const section = mapDataToSection(sectionTemplate, sampleData);
        section.order = index;
        return section;
    });

    res.json({
        success: true,
        generator: {
            id: generator.id,
            name: generator.name
        },
        preview: {
            sections,
            sampleData
        }
    });
});

module.exports = router;
