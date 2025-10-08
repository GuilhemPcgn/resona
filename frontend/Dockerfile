# ---- build ----
    FROM node:20-alpine AS build
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci
    COPY . .
    RUN npm run build  # next build
    
    # ---- run ----
    FROM node:20-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    # dépendances runtime seulement
    COPY --from=build /app/package*.json ./
    RUN npm ci --omit=dev
    # 👇 indispensable : standalone + assets + public
    COPY --from=build /app/.next/standalone ./
    COPY --from=build /app/.next/static ./.next/static
    COPY --from=build /app/public ./public
    EXPOSE 3000
    CMD ["node", "server.js"]
    