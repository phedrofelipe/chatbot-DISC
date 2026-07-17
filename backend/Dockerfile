# Build stage
FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /usr/src/app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/main"]
