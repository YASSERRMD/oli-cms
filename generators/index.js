/**
 * Page Generators Configuration
 * Defines built-in generators with field schemas and page templates
 */

'use strict';

// =============================================================================
// FIELD TYPES REFERENCE
// =============================================================================

/**
 * Supported field types:
 * - text: Single line text input
 * - textarea: Multi-line text input
 * - rich-text: HTML/Markdown rich text editor
 * - number: Numeric input
 * - boolean: Checkbox/toggle
 * - date: Date picker
 * - url: URL input with validation
 * - email: Email input with validation
 * - file: Single file upload
 * - file-multiple: Multiple file uploads
 * - array: Array of values
 * - object: Nested object with subfields
 * - select: Dropdown selection
 */

// =============================================================================
// BUILT-IN GENERATORS
// =============================================================================

const generators = {
    // ---------------------------------------------------------------------------
    // GENERATOR 1: Blog Post
    // ---------------------------------------------------------------------------
    'blog-post': {
        id: 'blog-post',
        name: 'Blog Post',
        description: 'Create a blog post with hero image, title, content, and metadata',
        icon: '📝',
        category: 'content',
        version: '1.0.0',

        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Post Title',
                placeholder: 'Enter your blog post title',
                required: true,
                maxLength: 200,
                validation: {
                    minLength: 1,
                    maxLength: 200
                }
            },
            {
                name: 'excerpt',
                type: 'textarea',
                label: 'Excerpt',
                placeholder: 'A brief summary of your post (displayed in listings)',
                required: false,
                maxLength: 500,
                rows: 3,
                validation: {
                    maxLength: 500
                }
            },
            {
                name: 'content',
                type: 'rich-text',
                label: 'Post Content',
                placeholder: 'Write your blog post content here...',
                required: true,
                validation: {
                    minLength: 1
                }
            },
            {
                name: 'featuredImage',
                type: 'file',
                label: 'Featured Image',
                accept: 'image/*',
                required: false,
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                maxSize: 5 * 1024 * 1024 // 5MB
            },
            {
                name: 'author',
                type: 'text',
                label: 'Author Name',
                placeholder: 'Enter author name',
                required: true,
                maxLength: 100,
                validation: {
                    minLength: 1,
                    maxLength: 100
                }
            },
            {
                name: 'tags',
                type: 'array',
                label: 'Tags',
                itemType: 'text',
                placeholder: 'Add tags to categorize your post',
                required: false,
                maxItems: 10,
                validation: {
                    maxItems: 10,
                    itemMaxLength: 50
                }
            },
            {
                name: 'publishDate',
                type: 'date',
                label: 'Publish Date',
                required: true,
                defaultValue: 'now'
            },
            {
                name: 'category',
                type: 'select',
                label: 'Category',
                required: false,
                options: [
                    { value: 'technology', label: 'Technology' },
                    { value: 'business', label: 'Business' },
                    { value: 'lifestyle', label: 'Lifestyle' },
                    { value: 'travel', label: 'Travel' },
                    { value: 'food', label: 'Food & Recipes' },
                    { value: 'other', label: 'Other' }
                ]
            }
        ],

        template: {
            sections: [
                {
                    type: 'hero',
                    mapping: {
                        backgroundImage: 'featuredImage',
                        title: 'title',
                        subtitle: 'excerpt'
                    },
                    config: {
                        height: 'large',
                        overlay: true,
                        overlayOpacity: 0.4
                    }
                },
                {
                    type: 'text',
                    mapping: {
                        content: 'author',
                        prefix: 'By '
                    },
                    config: {
                        tag: 'small',
                        className: 'post-author',
                        alignment: 'center'
                    }
                },
                {
                    type: 'text',
                    mapping: {
                        content: 'publishDate'
                    },
                    config: {
                        tag: 'time',
                        className: 'post-date',
                        alignment: 'center',
                        format: 'date'
                    }
                },
                {
                    type: 'rich-text',
                    mapping: {
                        content: 'content'
                    },
                    config: {
                        className: 'post-content',
                        maxWidth: '800px'
                    }
                },
                {
                    type: 'custom',
                    templateId: 'tags-list',
                    mapping: {
                        tags: 'tags',
                        category: 'category'
                    }
                }
            ]
        },

        seo: {
            titleTemplate: '{title} | Blog',
            descriptionField: 'excerpt',
            imageField: 'featuredImage'
        }
    },

    // ---------------------------------------------------------------------------
    // GENERATOR 2: Landing Page
    // ---------------------------------------------------------------------------
    'landing-page': {
        id: 'landing-page',
        name: 'Landing Page',
        description: 'Single-page marketing site with CTA',
        icon: '🚀',
        category: 'marketing',
        version: '1.0.0',

        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Headline',
                placeholder: 'Your main headline',
                required: true,
                maxLength: 100,
                validation: {
                    minLength: 1,
                    maxLength: 100
                }
            },
            {
                name: 'subtitle',
                type: 'text',
                label: 'Subheadline',
                placeholder: 'Supporting text below headline',
                required: false,
                maxLength: 200,
                validation: {
                    maxLength: 200
                }
            },
            {
                name: 'heroImage',
                type: 'file',
                label: 'Hero Image',
                accept: 'image/*',
                required: false,
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                maxSize: 10 * 1024 * 1024 // 10MB
            },
            {
                name: 'description',
                type: 'rich-text',
                label: 'Main Description',
                placeholder: 'Describe your product or service...',
                required: true,
                validation: {
                    minLength: 1
                }
            },
            {
                name: 'ctaText',
                type: 'text',
                label: 'CTA Button Text',
                placeholder: 'e.g., Get Started, Sign Up, Learn More',
                required: true,
                maxLength: 50,
                validation: {
                    minLength: 1,
                    maxLength: 50
                }
            },
            {
                name: 'ctaUrl',
                type: 'url',
                label: 'CTA Button URL',
                placeholder: 'https://example.com/signup',
                required: true,
                validation: {
                    pattern: '^https?://'
                }
            },
            {
                name: 'ctaStyle',
                type: 'select',
                label: 'CTA Button Style',
                required: false,
                defaultValue: 'primary',
                options: [
                    { value: 'primary', label: 'Primary (Solid)' },
                    { value: 'secondary', label: 'Secondary (Outline)' },
                    { value: 'accent', label: 'Accent (Highlight)' }
                ]
            },
            {
                name: 'features',
                type: 'array',
                label: 'Features',
                required: false,
                maxItems: 6,
                itemType: 'object',
                itemFields: [
                    {
                        name: 'icon',
                        type: 'text',
                        label: 'Icon (emoji or icon name)',
                        maxLength: 10
                    },
                    {
                        name: 'title',
                        type: 'text',
                        label: 'Feature Title',
                        required: true,
                        maxLength: 100
                    },
                    {
                        name: 'description',
                        type: 'textarea',
                        label: 'Feature Description',
                        maxLength: 300
                    }
                ]
            },
            {
                name: 'testimonials',
                type: 'array',
                label: 'Testimonials',
                required: false,
                maxItems: 3,
                itemType: 'object',
                itemFields: [
                    {
                        name: 'quote',
                        type: 'textarea',
                        label: 'Testimonial Quote',
                        required: true,
                        maxLength: 500
                    },
                    {
                        name: 'author',
                        type: 'text',
                        label: 'Author Name',
                        required: true,
                        maxLength: 100
                    },
                    {
                        name: 'role',
                        type: 'text',
                        label: 'Author Role/Company',
                        maxLength: 100
                    },
                    {
                        name: 'avatar',
                        type: 'file',
                        label: 'Author Photo',
                        accept: 'image/*'
                    }
                ]
            }
        ],

        template: {
            sections: [
                {
                    type: 'hero',
                    mapping: {
                        backgroundImage: 'heroImage',
                        title: 'title',
                        subtitle: 'subtitle',
                        ctaText: 'ctaText',
                        ctaUrl: 'ctaUrl',
                        ctaStyle: 'ctaStyle'
                    },
                    config: {
                        height: 'full',
                        overlay: true,
                        overlayOpacity: 0.5,
                        textAlignment: 'center'
                    }
                },
                {
                    type: 'rich-text',
                    mapping: {
                        content: 'description'
                    },
                    config: {
                        className: 'landing-description',
                        maxWidth: '900px',
                        alignment: 'center',
                        padding: 'large'
                    }
                },
                {
                    type: 'features',
                    mapping: {
                        items: 'features'
                    },
                    config: {
                        columns: 3,
                        style: 'cards',
                        iconSize: 'large'
                    }
                },
                {
                    type: 'testimonials',
                    mapping: {
                        items: 'testimonials'
                    },
                    config: {
                        style: 'carousel',
                        showAvatars: true
                    }
                },
                {
                    type: 'cta',
                    mapping: {
                        text: 'ctaText',
                        url: 'ctaUrl',
                        style: 'ctaStyle'
                    },
                    config: {
                        size: 'large',
                        fullWidth: false,
                        centered: true,
                        padding: 'large'
                    }
                }
            ]
        },

        seo: {
            titleTemplate: '{title}',
            descriptionField: 'subtitle'
        }
    },

    // ---------------------------------------------------------------------------
    // GENERATOR 3: Product Page
    // ---------------------------------------------------------------------------
    'product': {
        id: 'product',
        name: 'Product Page',
        description: 'Product showcase with specifications and pricing',
        icon: '🛍️',
        category: 'ecommerce',
        version: '1.0.0',

        fields: [
            {
                name: 'productName',
                type: 'text',
                label: 'Product Name',
                placeholder: 'Enter product name',
                required: true,
                maxLength: 100,
                validation: {
                    minLength: 1,
                    maxLength: 100
                }
            },
            {
                name: 'shortDescription',
                type: 'textarea',
                label: 'Short Description',
                placeholder: 'Brief product summary',
                required: false,
                maxLength: 200,
                rows: 2
            },
            {
                name: 'description',
                type: 'rich-text',
                label: 'Full Description',
                placeholder: 'Detailed product description...',
                required: true,
                validation: {
                    minLength: 1
                }
            },
            {
                name: 'price',
                type: 'number',
                label: 'Price',
                placeholder: '0.00',
                required: true,
                min: 0,
                step: 0.01,
                validation: {
                    min: 0
                }
            },
            {
                name: 'currency',
                type: 'select',
                label: 'Currency',
                required: false,
                defaultValue: 'USD',
                options: [
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' },
                    { value: 'JPY', label: 'JPY (¥)' },
                    { value: 'CAD', label: 'CAD (C$)' },
                    { value: 'AUD', label: 'AUD (A$)' }
                ]
            },
            {
                name: 'salePrice',
                type: 'number',
                label: 'Sale Price (optional)',
                placeholder: 'Leave empty if not on sale',
                required: false,
                min: 0,
                step: 0.01
            },
            {
                name: 'images',
                type: 'file-multiple',
                label: 'Product Images',
                accept: 'image/*',
                required: true,
                maxFiles: 10,
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                maxSize: 5 * 1024 * 1024, // 5MB per image
                validation: {
                    minFiles: 1,
                    maxFiles: 10
                }
            },
            {
                name: 'specifications',
                type: 'array',
                label: 'Specifications',
                required: false,
                maxItems: 20,
                itemType: 'object',
                itemFields: [
                    {
                        name: 'name',
                        type: 'text',
                        label: 'Spec Name',
                        required: true,
                        maxLength: 100
                    },
                    {
                        name: 'value',
                        type: 'text',
                        label: 'Spec Value',
                        required: true,
                        maxLength: 200
                    }
                ]
            },
            {
                name: 'sku',
                type: 'text',
                label: 'SKU',
                placeholder: 'Product SKU/ID',
                required: false,
                maxLength: 50
            },
            {
                name: 'inStock',
                type: 'boolean',
                label: 'In Stock',
                required: true,
                defaultValue: true
            },
            {
                name: 'stockQuantity',
                type: 'number',
                label: 'Stock Quantity',
                required: false,
                min: 0,
                step: 1
            },
            {
                name: 'category',
                type: 'text',
                label: 'Product Category',
                placeholder: 'e.g., Electronics, Clothing',
                required: false,
                maxLength: 100
            }
        ],

        template: {
            sections: [
                {
                    type: 'gallery',
                    mapping: {
                        images: 'images'
                    },
                    config: {
                        layout: 'thumbnails',
                        thumbnailPosition: 'bottom',
                        zoom: true,
                        autoplay: false
                    }
                },
                {
                    type: 'text',
                    mapping: {
                        content: 'productName'
                    },
                    config: {
                        tag: 'h1',
                        className: 'product-title'
                    }
                },
                {
                    type: 'custom',
                    templateId: 'product-price',
                    mapping: {
                        price: 'price',
                        salePrice: 'salePrice',
                        currency: 'currency'
                    }
                },
                {
                    type: 'text',
                    mapping: {
                        content: 'shortDescription'
                    },
                    config: {
                        tag: 'p',
                        className: 'product-short-description'
                    }
                },
                {
                    type: 'custom',
                    templateId: 'stock-status',
                    mapping: {
                        inStock: 'inStock',
                        quantity: 'stockQuantity'
                    }
                },
                {
                    type: 'form',
                    formType: 'add-to-cart',
                    mapping: {
                        productId: 'sku',
                        productName: 'productName',
                        price: 'price'
                    },
                    config: {
                        showQuantity: true,
                        buttonText: 'Add to Cart',
                        buttonStyle: 'primary'
                    }
                },
                {
                    type: 'rich-text',
                    mapping: {
                        content: 'description'
                    },
                    config: {
                        className: 'product-description',
                        heading: 'Description'
                    }
                },
                {
                    type: 'custom',
                    templateId: 'specifications-table',
                    mapping: {
                        specs: 'specifications'
                    },
                    config: {
                        heading: 'Specifications',
                        style: 'striped'
                    }
                }
            ]
        },

        seo: {
            titleTemplate: '{productName} | Shop',
            descriptionField: 'shortDescription',
            imageField: 'images[0]'
        }
    },

    // ---------------------------------------------------------------------------
    // GENERATOR 4: Blank/Custom Page
    // ---------------------------------------------------------------------------
    'custom': {
        id: 'custom',
        name: 'Blank Page',
        description: 'Start with an empty page and build it manually section by section',
        icon: '✨',
        category: 'utility',
        version: '1.0.0',

        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Page Title',
                placeholder: 'Enter page title',
                required: true,
                maxLength: 200,
                validation: {
                    minLength: 1,
                    maxLength: 200
                }
            },
            {
                name: 'slug',
                type: 'text',
                label: 'URL Slug',
                placeholder: 'page-url-slug (auto-generated if empty)',
                required: false,
                maxLength: 100,
                validation: {
                    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
                    patternMessage: 'Slug must be lowercase with hyphens only'
                }
            },
            {
                name: 'description',
                type: 'textarea',
                label: 'Page Description (for SEO)',
                placeholder: 'Brief description for search engines',
                required: false,
                maxLength: 300,
                rows: 2
            }
        ],

        template: {
            sections: []
        },

        seo: {
            titleTemplate: '{title}',
            descriptionField: 'description'
        }
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get a generator by ID
 * @param {string} id - Generator ID
 * @returns {Object|null} Generator object or null if not found
 */
function getGenerator(id) {
    if (!id || typeof id !== 'string') {
        return null;
    }
    return generators[id] || null;
}

/**
 * Get all generators
 * @returns {Object} All generators keyed by ID
 */
function getAllGenerators() {
    return { ...generators };
}

/**
 * Get generators by category
 * @param {string} category - Category name
 * @returns {Array} Array of generators in the category
 */
function getGeneratorsByCategory(category) {
    return Object.values(generators).filter(gen => gen.category === category);
}

/**
 * List all generator summaries
 * @returns {Array} Array of generator summaries
 */
function listGenerators() {
    return Object.values(generators).map(gen => ({
        id: gen.id,
        name: gen.name,
        description: gen.description,
        icon: gen.icon,
        category: gen.category,
        version: gen.version,
        fieldCount: gen.fields.length,
        sectionCount: gen.template.sections.length
    }));
}

/**
 * Validate data against a generator's field schema
 * @param {string} generatorId - Generator ID
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result {valid, errors}
 */
function validateGeneratorData(generatorId, data) {
    const generator = getGenerator(generatorId);

    if (!generator) {
        return {
            valid: false,
            errors: [{ field: '_generator', message: `Generator '${generatorId}' not found` }]
        };
    }

    if (!data || typeof data !== 'object') {
        return {
            valid: false,
            errors: [{ field: '_data', message: 'Data must be an object' }]
        };
    }

    const errors = [];

    for (const field of generator.fields) {
        const value = data[field.name];
        const fieldErrors = validateField(field, value);
        errors.push(...fieldErrors);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate a single field value
 * @param {Object} field - Field definition
 * @param {*} value - Value to validate
 * @returns {Array} Array of error objects
 */
function validateField(field, value) {
    const errors = [];
    const { name, type, required, validation = {} } = field;

    // Check required
    if (required) {
        if (value === undefined || value === null || value === '') {
            errors.push({
                field: name,
                message: `${field.label || name} is required`
            });
            return errors; // No point checking further if required field is missing
        }

        // Special handling for arrays
        if (type === 'array' && (!Array.isArray(value) || value.length === 0)) {
            errors.push({
                field: name,
                message: `${field.label || name} must have at least one item`
            });
            return errors;
        }

        // Special handling for file-multiple
        if (type === 'file-multiple' && (!Array.isArray(value) || value.length === 0)) {
            errors.push({
                field: name,
                message: `${field.label || name} requires at least one file`
            });
            return errors;
        }
    }

    // Skip further validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
        return errors;
    }

    // Type-specific validation
    switch (type) {
        case 'text':
        case 'textarea':
            if (typeof value !== 'string') {
                errors.push({ field: name, message: `${field.label || name} must be a string` });
            } else {
                if (validation.minLength && value.length < validation.minLength) {
                    errors.push({ field: name, message: `${field.label || name} must be at least ${validation.minLength} characters` });
                }
                if (validation.maxLength && value.length > validation.maxLength) {
                    errors.push({ field: name, message: `${field.label || name} must not exceed ${validation.maxLength} characters` });
                }
                if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
                    errors.push({ field: name, message: validation.patternMessage || `${field.label || name} format is invalid` });
                }
            }
            break;

        case 'rich-text':
            if (typeof value !== 'string') {
                errors.push({ field: name, message: `${field.label || name} must be a string` });
            } else if (validation.minLength && value.length < validation.minLength) {
                errors.push({ field: name, message: `${field.label || name} must have content` });
            }
            break;

        case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
                errors.push({ field: name, message: `${field.label || name} must be a number` });
            } else {
                if (validation.min !== undefined && value < validation.min) {
                    errors.push({ field: name, message: `${field.label || name} must be at least ${validation.min}` });
                }
                if (validation.max !== undefined && value > validation.max) {
                    errors.push({ field: name, message: `${field.label || name} must not exceed ${validation.max}` });
                }
            }
            break;

        case 'boolean':
            if (typeof value !== 'boolean') {
                errors.push({ field: name, message: `${field.label || name} must be true or false` });
            }
            break;

        case 'date':
            if (typeof value !== 'string' || isNaN(Date.parse(value))) {
                errors.push({ field: name, message: `${field.label || name} must be a valid date` });
            }
            break;

        case 'url':
            if (typeof value !== 'string') {
                errors.push({ field: name, message: `${field.label || name} must be a string` });
            } else {
                try {
                    new URL(value);
                } catch {
                    errors.push({ field: name, message: `${field.label || name} must be a valid URL` });
                }
            }
            break;

        case 'email':
            if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push({ field: name, message: `${field.label || name} must be a valid email address` });
            }
            break;

        case 'array':
            if (!Array.isArray(value)) {
                errors.push({ field: name, message: `${field.label || name} must be an array` });
            } else {
                if (validation.maxItems && value.length > validation.maxItems) {
                    errors.push({ field: name, message: `${field.label || name} must not exceed ${validation.maxItems} items` });
                }
                // Validate array items if itemFields defined
                if (field.itemFields && field.itemType === 'object') {
                    value.forEach((item, index) => {
                        for (const itemField of field.itemFields) {
                            const itemErrors = validateField(itemField, item[itemField.name]);
                            itemErrors.forEach(err => {
                                errors.push({
                                    field: `${name}[${index}].${err.field}`,
                                    message: err.message
                                });
                            });
                        }
                    });
                }
            }
            break;

        case 'select':
            if (field.options) {
                const validValues = field.options.map(opt => opt.value);
                if (!validValues.includes(value)) {
                    errors.push({ field: name, message: `${field.label || name} must be one of: ${validValues.join(', ')}` });
                }
            }
            break;

        case 'file':
        case 'file-multiple':
            // File validation is typically handled during upload
            // Here we just check the structure
            if (type === 'file-multiple' && !Array.isArray(value)) {
                errors.push({ field: name, message: `${field.label || name} must be an array of files` });
            }
            break;
    }

    return errors;
}

/**
 * Get default values for a generator's fields
 * @param {string} generatorId - Generator ID
 * @returns {Object} Object with default values
 */
function getDefaultValues(generatorId) {
    const generator = getGenerator(generatorId);
    if (!generator) return {};

    const defaults = {};

    for (const field of generator.fields) {
        if (field.defaultValue !== undefined) {
            if (field.defaultValue === 'now' && field.type === 'date') {
                defaults[field.name] = new Date().toISOString();
            } else {
                defaults[field.name] = field.defaultValue;
            }
        } else if (field.type === 'array') {
            defaults[field.name] = [];
        } else if (field.type === 'boolean') {
            defaults[field.name] = false;
        }
    }

    return defaults;
}

/**
 * Get the template for a generator
 * @param {string} generatorId - Generator ID
 * @returns {Object|null} Template object or null
 */
function getGeneratorTemplate(generatorId) {
    const generator = getGenerator(generatorId);
    return generator?.template || null;
}

/**
 * Get SEO configuration for a generator
 * @param {string} generatorId - Generator ID
 * @returns {Object|null} SEO config or null
 */
function getGeneratorSEO(generatorId) {
    const generator = getGenerator(generatorId);
    return generator?.seo || null;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    // Generators object
    generators,

    // Lookup functions
    getGenerator,
    getAllGenerators,
    getGeneratorsByCategory,
    listGenerators,

    // Validation
    validateGeneratorData,
    validateField,

    // Utilities
    getDefaultValues,
    getGeneratorTemplate,
    getGeneratorSEO
};
