import { defineConfig } from 'drizzle-kit'

// drizzle-kit は .env を自動では読まないので、ここで読み込む
try {
  process.loadEnvFile('.env')
} catch {
  // .env が無いときは、シェルの環境変数をそのまま使う
}

export default defineConfig({
  dialect: 'turso',
  schema: './db/schema.ts',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
})
