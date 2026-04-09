# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependências (npm ci usa o lockfile para builds reprodutíveis)
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar código e fazer build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine

# Remover config default do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Config nginx para SPA (todas as rotas → index.html)
COPY --from=build /app/dist /usr/share/nginx/html

RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # Gzip\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;\n\
    gzip_min_length 256;\n\
\n\
    # Assets com hash — cache longo\n\
    location /assets/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    # SPA fallback — qualquer rota desconhecida devolve index.html\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/app.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
