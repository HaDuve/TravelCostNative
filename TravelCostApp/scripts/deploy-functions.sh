#!/bin/bash

# Deploy Firebase Cloud Functions
# Usage: ./scripts/deploy-functions.sh

set -e

echo "🚀 Deploying Firebase Cloud Functions..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

# Navigate to functions directory
cd functions

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Go back to project root
cd ..

# Deploy functions
echo "🚀 Deploying to Firebase..."
firebase deploy --only functions

echo "✅ Deployment complete!"
echo ""
echo "To view function logs:"
echo "   firebase functions:log"
echo ""
echo "To test the function:"
echo "   1. Submit feedback through the app"
echo "   2. Check logs: firebase functions:log --only onFeedbackCreated"
