#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Migrations are executed in the Render start command so they run against the runtime database.

# Create superuser if needed (optional)
# python manage.py createsuperuser --no-input || true
