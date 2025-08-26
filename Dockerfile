# syntax=docker/dockerfile:1

# Etapa 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Dependências (cache-friendly)
COPY package*.json ./
RUN npm ci

# Copia o restante do código e compila
COPY .. .
# Ajuste o comando de build caso seu script seja diferente
RUN npm run build

# Remove dependências de dev e mantém apenas produção
RUN npm prune --omit=dev

# Etapa 2: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia os artefatos necessários do builder
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
# Se houver arquivos necessários em runtime (ex.: assets, views), copie-os aqui:
# COPY --chown=node:node --from=builder /app/<pasta-assets> ./<pasta-assets>

EXPOSE 3000
CMD ["node", "dist/main.js"]
