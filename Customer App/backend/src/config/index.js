require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'zipbi_dev_jwt_secret_psg_sitra_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  superAdminEmail: (process.env.SUPER_ADMIN_EMAIL || 'admin@zipbi.com').toLowerCase().trim(),
  superAdminRole: 'SUPER_ADMIN',
  defaultLocation: {
    name: 'PSG College of Arts and Science Main Gate',
    area: 'SITRA / Civil Aerodrome Post, Coimbatore',
    latitude: 11.0326883,
    longitude: 77.0345773,
  },
};

