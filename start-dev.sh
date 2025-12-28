#!/bin/bash
cd backend_django && python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!
echo "Django started with PID $DJANGO_PID"
sleep 2
cd .. && NODE_ENV=development npx tsx server/index.ts
