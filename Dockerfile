FROM node:24-bookworm-slim AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY vite.config.ts tsconfig.catalogue.json ./
COPY resources ./resources
COPY kit ./kit
COPY src/data/brand.ts ./src/data/brand.ts
RUN npm run build:catalogue

FROM php:8.4-cli-bookworm
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-scripts --no-autoloader
COPY artisan LICENSE ./
COPY app ./app
COPY bootstrap ./bootstrap
COPY docker ./docker
COPY kit ./kit
COPY public ./public
COPY resources ./resources
COPY routes ./routes
COPY src/data/brand.ts ./src/data/brand.ts
RUN mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && composer dump-autoload --no-dev --optimize --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache
COPY --from=assets /app/public/build ./public/build
ENV APP_ENV=production APP_DEBUG=false SESSION_DRIVER=file CACHE_STORE=file QUEUE_CONNECTION=sync LOG_CHANNEL=stderr
USER www-data
EXPOSE 8000
CMD ["sh", "docker/start-catalogue.sh"]
