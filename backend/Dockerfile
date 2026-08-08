FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./package.json

EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
