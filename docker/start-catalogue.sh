#!/bin/sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
    key_file=storage/framework/catalogue.key
    if [ ! -s "$key_file" ]; then
        (umask 077 && php artisan key:generate --show --no-ansi > "$key_file")
    fi
    APP_KEY=$(cat "$key_file")
    export APP_KEY
fi

exec php artisan serve --host=0.0.0.0 --port=8000 --no-reload
