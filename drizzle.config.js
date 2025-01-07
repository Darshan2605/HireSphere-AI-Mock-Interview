/** @type { import("drizzle-kit").Config } */
export default {
  client: 'pg',
  schema: './utils/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://neondb_owner:nVp8g3YsdBPT@ep-fragrant-recipe-a5985vwk.us-east-2.aws.neon.tech/neondb?sslmode=require',
  },
  
};
