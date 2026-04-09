const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  req.body = result.data;
  next();
};

const analyzeSchema = z.object({
  text: z
    .string({ required_error: 'text is required' })
    .min(3, 'Thought must be at least 3 characters')
    .max(2000, 'Thought must be under 2000 characters')
    .transform((s) => s.trim()),
});

module.exports = { validate, analyzeSchema };
