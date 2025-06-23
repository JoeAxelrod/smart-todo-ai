FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies (including dev) for TypeScript compilation
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript -> dist
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc