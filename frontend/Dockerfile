FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
RUN npm install && npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
EXPOSE 3000
