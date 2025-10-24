#!/bin/bash

echo "🤖 Starting Circle Management Bot..."

if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

mkdir -p logs

echo "🚀 Starting bot..."
npm start
