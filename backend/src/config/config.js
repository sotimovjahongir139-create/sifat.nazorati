module.exports = {
  port:    process.env.PORT       || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  nodeEnv: process.env.NODE_ENV   || 'development',
  dbUrl:   process.env.DATABASE_URL,
};
