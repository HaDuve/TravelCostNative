#!/bin/bash

# Signal CLI REST API Setup Script
# This script helps set up the Signal CLI REST API server using Docker

set -e

echo "🚀 Setting up Signal CLI REST API Server..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

# Create docker-compose file for Signal CLI
echo "📝 Creating Docker Compose configuration..."
cat > docker-compose.signal.yml << 'EOF'
version: '3.8'

services:
  signal-cli:
    image: bbernhard/signal-cli-rest-api:latest
    container_name: signal-cli-rest-api
    ports:
      - "8080:8080"
    environment:
      - SIGNAL_CLI_CONFIG_DIR=/home/.local/share/signal-cli
    volumes:
      - signal-cli-data:/home/.local/share/signal-cli
    restart: unless-stopped
    command: [
      "signal-cli-rest-api",
      "--signal-cli-config-dir=/home/.local/share/signal-cli",
      "--spring.profiles.active=dev"
    ]

volumes:
  signal-cli-data:
EOF

echo "✅ Docker Compose file created: docker-compose.signal.yml"

# Start the Signal CLI server
echo "🐳 Starting Signal CLI REST API server..."
docker-compose -f docker-compose.signal.yml up -d

# Wait for the server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Check if the server is running
if curl -s http://localhost:8080/v1/about > /dev/null; then
    echo "✅ Signal CLI REST API server is running!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Register your phone number:"
    echo "   curl -X POST 'http://localhost:8080/v1/register/+YOUR_PHONE_NUMBER'"
    echo ""
    echo "2. Verify with the SMS code you receive:"
    echo "   curl -X POST 'http://localhost:8080/v1/register/+YOUR_PHONE_NUMBER/verify/VERIFICATION_CODE'"
    echo ""
    echo "3. Configure Firebase Functions:"
    echo "   firebase functions:config:set signal.api_url='http://localhost:8080'"
    echo "   firebase functions:config:set signal.recipient='+YOUR_PHONE_NUMBER'"
    echo "   firebase functions:config:set signal.sender='+YOUR_PHONE_NUMBER'"
    echo ""
    echo "4. Test the API:"
    echo "   curl http://localhost:8080/v1/about"
    echo ""
    echo "📖 For more details, see: docs/signal-cli-setup-guide.md"
else
    echo "❌ Failed to start Signal CLI server. Check the logs:"
    echo "   docker-compose -f docker-compose.signal.yml logs"
    exit 1
fi
