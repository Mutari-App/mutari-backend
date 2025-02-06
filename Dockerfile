# Gunakan Node.js sebagai base image untuk build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json dan install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy semua file proyek ke container
COPY . .

# 🔹 Generate Prisma Client
RUN npx prisma generate

# 🔹 Build aplikasi NestJS
RUN npm run build

# Gunakan stage baru untuk menjalankan aplikasi
FROM node:18-alpine AS runner
WORKDIR /app

# Copy hasil build dari tahap builder
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port aplikasi
EXPOSE 3001

# 🔹 Pastikan perintah run benar
CMD ["node", "dist/main"]