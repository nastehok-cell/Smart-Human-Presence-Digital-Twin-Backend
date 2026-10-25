FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install dependencies first so this layer is cached between code changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=3001
EXPOSE 3001

USER node
CMD ["node", "server.js"]
