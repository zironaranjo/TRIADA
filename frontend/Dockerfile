# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Force Vite to pick up env vars by writing .env before build
# This ensures vars are always available regardless of Docker cache
RUN if [ ! -f .env.production ]; then \
      echo "VITE_API_URL=https://api.triadak.io" > .env.production && \
      echo "VITE_SUPABASE_URL=https://dknhrstvlajlktahxeqs.supabase.co" >> .env.production && \
      echo "VITE_SUPABASE_ANON_KEY=sb_publishable_rV7bQaTazFEffBD0riQ1UQ_JggijzBR" >> .env.production; \
    fi

RUN npm run build

# Production Stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config to handle React Router pushState
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
