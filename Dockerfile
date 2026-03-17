# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose NestJS default port
EXPOSE 3000

# Start in development mode (hot reload)
CMD ["npm", "run", "start:dev"]