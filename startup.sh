#!/bin/sh

# Set NODE_ENV
export NODE_ENV=production

# Install dependencies and generate prisma client
npm ci
npx prisma generate

# Start the application
npm start
