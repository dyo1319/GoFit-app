const Joi = require('joi');

const DateValidator = Joi.alternatives().try(
  Joi.date().iso(), 
  Joi.string().pattern(/^\d{1,2}\/\d{1,2}\/\d{4}$/), 
  Joi.string().pattern(/^\d{4}-\d{1,2}-\d{1,2}$/) 
).custom((value, helpers) => {
  if (typeof value === 'string') {
    if (value.includes('/')) {
      const [day, month, year] = value.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return value; 
}, 'Date conversion');


const subscriptionListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().pattern(/^[a-z_]+:(asc|desc)$/i).default('end_date:asc'),
  query: Joi.string().allow('').default(''),
  status: Joi.string().valid('active','expired','canceled','paused').allow(''),
  statuses: Joi.string().allow(''),
  payment_status: Joi.string().valid('pending','paid','failed','refunded').allow(''),
  expiresInDays: Joi.number().integer().min(0).allow(null),
  userId: Joi.number().integer().min(1).allow(null),
});

const subscriptionCreateSchema = Joi.object({
  user_id: Joi.number().integer().min(1).required(),
  start_date: DateValidator.required(),
  end_date: Joi.date().min(Joi.ref('start_date')).required(),
  payment_status: Joi.string().valid('pending','paid','failed','refunded').default('pending')
});

const subscriptionUpdateSchema = Joi.object({
  start_date: DateValidator.optional(),
  end_date: Joi.alternatives().conditional('start_date', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('start_date')),  
    otherwise: Joi.date()                   
  }),
  payment_status: Joi.string().valid('pending','paid','failed','refunded').optional()
}).min(1);

const paymentStatusSchema = Joi.object({
  status: Joi.string().valid('pending','paid','failed','refunded').required()
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

const userCreateSchema = Joi.object({
  username: Joi.string().trim().min(2).max(50).required(),
  phone: Joi.string().trim().pattern(/^\d+$/).min(9).max(15).required(),
  password: Joi.string().min(3).required(),
  role: Joi.string().valid('trainee','trainer','admin').allow(null),
  gender: Joi.string().valid('male','female').allow(null),
  birth_date: DateValidator.required(),
  weight: Joi.number().min(0).max(300).allow(null),
  height: Joi.number().min(0).max(250).allow(null),
  body_fat: Joi.number().min(0).max(100).allow(null),
  muscle_mass: Joi.number().min(0).allow(null),
  circumference: Joi.number().min(0).allow(null),
  recorded_at: DateValidator.allow(null),
  start_date: DateValidator.allow(null),
  end_date: Joi.date().min(Joi.ref('start_date')).allow(null),
  payment_status: Joi.string().valid('pending','paid','failed','refunded').default('pending'),
  access_profile: Joi.string().valid('default','readonly','custom').default('default'),
  permissions_json: Joi.alternatives().conditional('access_profile', {
    is: 'custom',
    then: Joi.array().items(Joi.string().max(64)).min(1).required(),
    otherwise: Joi.forbidden()
  }).default(null)
});

const userUpdateSchema = Joi.object({
  username: Joi.string().trim().min(2).max(50).optional(),
  phone: Joi.string().trim().pattern(/^\d+$/).min(9).max(15).optional(),
  birth_date: DateValidator.optional(),
  role: Joi.string().valid('trainee','trainer','admin').allow(null).optional(),
  gender: Joi.string().valid('male','female').allow(null).optional(),
  weight: Joi.number().min(0).max(300).allow(null).optional(),
  height: Joi.number().min(0).max(250).allow(null).optional(),
  body_fat: Joi.number().min(0).max(100).allow(null).optional(),
  muscle_mass: Joi.number().min(0).allow(null).optional(),
  circumference: Joi.number().min(0).allow(null).optional(),
  recorded_at: DateValidator.allow(null).optional(),
  start_date: DateValidator.allow(null).optional(),
  end_date: Joi.date().when('start_date', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('start_date')),
    otherwise: Joi.date().optional()
  }).allow(null).optional(),
  payment_status: Joi.string().valid('pending','paid','failed','refunded').optional(),
  access_profile: Joi.string().valid('default','readonly','custom').optional(),
  permissions_json: Joi.alternatives().conditional('access_profile', {
    is: 'custom',
    then: Joi.array().items(Joi.string().max(64)).min(1).required(),
    otherwise: Joi.forbidden()
  }).optional()
}).min(1);

const userSearchSchema = Joi.object({
  q: Joi.string().trim().min(1).required()
});

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { 
      abortEarly: false, 
      stripUnknown: true,
      convert: true 
    });
    
    if (error) {
      return res.status(400).json({ 
        error: 'validation_error', 
        details: error.details.map(d => d.message) 
      });
    }
    req[source] = value;
    next();
  };
}

const analyticsDateRangeSchema = Joi.object({
  from: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
  to: Joi.string().pattern(/^\d{4}-\d{2}$/).optional()
});


const roleParamSchema = Joi.object({
  role: Joi.string().valid('trainee','trainer','admin').required()
});

const rbacPutPresetSchema = Joi.object({
  perm_keys: Joi.array().items(Joi.string().max(64)).min(0).required()
});

const staffUpdateAccessSchema = Joi.object({
  role: Joi.string().valid('trainee','trainer','admin').optional(),
  access_profile: Joi.string().valid('default','readonly','custom').optional(),
  permissions_json: Joi.alternatives().conditional('access_profile', {
    is: 'custom',
    then: Joi.array().items(Joi.string().max(64)).min(1).required(),
    otherwise: Joi.forbidden()
  })
}).min(1);

const authSignupSchema = Joi.object({
  phone_number: Joi.string().trim().pattern(/^\d+$/).min(9).max(15).required(),
  username: Joi.string().trim().min(2).max(50).required(),
  password: Joi.string().min(3).required(),
  date_birth: DateValidator.allow(null),
  gender: Joi.string().valid('male','female').allow(null)
});

const authSigninSchema = Joi.object({
  phone_number: Joi.string().trim().pattern(/^\d+$/).min(9).max(15).required(),
  password: Joi.string().min(3).required()
});

const profileUpdateSchema = Joi.object({
  username: Joi.string().trim().min(2).max(50).optional(),
  date_birth: DateValidator.allow(null).optional(),
  gender: Joi.string().valid('male','female').allow(null).optional()
}).min(1);

module.exports = {
  validate,
  subscriptionListQuerySchema,
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  paymentStatusSchema,
  idParamSchema,
  userCreateSchema,
  userUpdateSchema,
  userSearchSchema,
  analyticsDateRangeSchema,
  roleParamSchema,
  rbacPutPresetSchema,
  staffUpdateAccessSchema,
  DateValidator,
  authSignupSchema,
  authSigninSchema,
  profileUpdateSchema
};