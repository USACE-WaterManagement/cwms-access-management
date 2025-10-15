FROM node:24-alpine AS builder

ARG VITE_API_URL=http://localhost:3002

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/management-ui/package.json ./apps/web/management-ui/
COPY apps/web/management-ui/tsconfig*.json ./apps/web/management-ui/
COPY apps/web/management-ui/vite.config.ts ./apps/web/management-ui/
COPY apps/web/management-ui/tailwind.config.js ./apps/web/management-ui/
COPY apps/web/management-ui/postcss.config.js ./apps/web/management-ui/
COPY tsconfig.base.json nx.json ./

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

RUN pnpm install --frozen-lockfile

COPY apps/web/management-ui ./apps/web/management-ui

ENV VITE_API_URL=$VITE_API_URL

RUN pnpm nx build management-ui --configuration=production

FROM nginx:alpine

COPY --from=builder /app/dist/apps/web/management-ui /usr/share/nginx/html

COPY apps/web/management-ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
