const Joi = require('joi');

const phoneNumberSchema = Joi.string()
  .pattern(/^62\d{8,13}$/)
  .required()
  .messages({
    'string.pattern.base': 'Nomor telepon harus dimulai dengan 62 dan memiliki 10-15 digit',
    'any.required': 'Nomor telepon wajib diisi',
  });

const nameSchema = Joi.string()
  .min(2)
  .max(50)
  .required()
  .messages({
    'string.min': 'Nama minimal 2 karakter',
    'string.max': 'Nama maksimal 50 karakter',
    'any.required': 'Nama wajib diisi',
  });

const groupNameSchema = Joi.string()
  .min(2)
  .max(30)
  .required()
  .messages({
    'string.min': 'Nama grup minimal 2 karakter',
    'string.max': 'Nama grup maksimal 30 karakter',
    'any.required': 'Nama grup wajib diisi',
  });

const bonusActionSchema = Joi.string()
  .valid('list', 'all')
  .pattern(/^\d+$/)
  .messages({
    'any.only': 'Parameter bonus harus "list", "all", atau nomor bonus',
    'string.pattern.base': 'Parameter bonus harus berupa nomor',
  });

const kickActionSchema = Joi.string()
  .valid('list')
  .pattern(/^\d+$/)
  .messages({
    'any.only': 'Parameter kick harus "list" atau nomor anggota',
    'string.pattern.base': 'Parameter kick harus berupa nomor',
  });

const validators = {
  validatePhoneNumber: (value) => phoneNumberSchema.validate(value),
  validateName: (value) => nameSchema.validate(value),
  validateGroupName: (value) => groupNameSchema.validate(value),
  validateBonusAction: (value) => bonusActionSchema.validate(value),
  validateKickAction: (value) => kickActionSchema.validate(value),
  
  // Combined validators
  validateCreateCircle: (data) => {
    const schema = Joi.object({
      nomorAdmin: phoneNumberSchema,
      nomorAnggota: phoneNumberSchema,
      namaGroup: groupNameSchema,
      namaAdmin: nameSchema,
      namaAnggota: nameSchema,
    });
    return schema.validate(data);
  },
  
  validateInviteMember: (data) => {
    const schema = Joi.object({
      nomorAdmin: phoneNumberSchema,
      nomorAnggota: phoneNumberSchema,
      namaAnggota: nameSchema,
    });
    return schema.validate(data);
  },
};

module.exports = validators;
