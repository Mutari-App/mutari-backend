# Gunakan Node.js sebagai base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json dan install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy semua file proyek ke container
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build aplikasi
RUN npm run build

# Gunakan stage baru untuk menjalankan aplikasi
FROM node:18-alpine AS runner
WORKDIR /app

# Copy hasil build dari tahap sebelumnya
COPY --from=builder /app /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port aplikasi
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "run", "start:prod"]
