FROM node:23.3-alpine3.19 as builder

WORKDIR /app

RUN apk update && \
    apk add --no-cache \
        python3 \
        make \
        g++

# Install dependencies
RUN npm install -g npm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

RUN pnpm install

# Copy source code
COPY . .
