# Signal CLI REST API Setup Guide

This guide covers setting up the Signal CLI REST API server for sending notifications from Firebase Cloud Functions.

## Overview

The Signal CLI REST API allows sending Signal messages programmatically. We'll set up a server that our Firebase Cloud Functions can communicate with to send feedback notifications.

## Setup Options

### Option 1: Docker Setup (Recommended)

Easiest to set up and manage, runs in a container.

### Option 2: Local Installation

Install directly on your system (macOS/Linux).

### Option 3: VPS/Cloud Instance

Deploy to a cloud server for production use.

## Option 1: Docker Setup (Recommended)

### Prerequisites

- Docker installed on your system
- A phone number for Signal registration

### Step 1: Create Docker Compose File

Create `docker-compose.signal.yml`:

```yaml
version: "3.8"

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
    command:
      [
        "signal-cli-rest-api",
        "--signal-cli-config-dir=/home/.local/share/signal-cli",
        "--spring.profiles.active=dev",
      ]

volumes:
  signal-cli-data:
```

### Step 2: Start the Server

```bash
# Start the Signal CLI REST API server
docker-compose -f docker-compose.signal.yml up -d

# Check if it's running
docker-compose -f docker-compose.signal.yml ps

# View logs
docker-compose -f docker-compose.signal.yml logs -f
```

### Step 3: Register Your Phone Number

```bash
# Register your phone number (replace +1234567890 with your number)
curl -X POST "http://localhost:8080/v1/register/+1234567890"

# You'll receive a verification code via SMS
# Verify the registration
curl -X POST "http://localhost:8080/v1/register/+1234567890/verify/123456"
```

## Option 2: Local Installation

### Prerequisites

- Java 11 or higher
- A phone number for Signal registration

### Step 1: Install Signal CLI

#### macOS (using Homebrew)

```bash
brew install signal-cli
```

#### Linux (Ubuntu/Debian)

```bash
# Download the latest release
wget https://github.com/AsamK/signal-cli/releases/latest/download/signal-cli-*.tar.gz
tar -xzf signal-cli-*.tar.gz
sudo mv signal-cli-*/bin/signal-cli /usr/local/bin/
sudo mv signal-cli-*/lib/signal-cli-*.jar /usr/local/lib/
```

### Step 2: Install Signal CLI REST API

```bash
# Clone the repository
git clone https://github.com/bbernhard/signal-cli-rest-api.git
cd signal-cli-rest-api

# Build the application
./gradlew build

# Run the server
java -jar build/libs/signal-cli-rest-api-*.jar
```

### Step 3: Register Your Phone Number

```bash
# Register your phone number
signal-cli -a +1234567890 register

# Verify with the code you receive via SMS
signal-cli -a +1234567890 verify 123456
```

## Option 3: VPS/Cloud Setup

### Recommended VPS Providers

- DigitalOcean Droplet ($5/month)
- Linode Nanode ($5/month)
- AWS EC2 t2.micro (Free tier eligible)

### Step 1: Set Up Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Deploy Signal CLI

```bash
# Create project directory
mkdir signal-cli-server
cd signal-cli-server

# Create docker-compose.yml (same as Option 1)
# Start the service
docker-compose up -d
```

### Step 3: Configure Firewall

```bash
# Allow HTTP traffic
sudo ufw allow 8080/tcp

# Allow SSH (if needed)
sudo ufw allow 22/tcp
sudo ufw enable
```

## Configuration

### Environment Variables for Firebase Functions

Set these in your Firebase Functions configuration:

```bash
# Set Signal API configuration
firebase functions:config:set signal.api_url="http://your-server:8080"
firebase functions:config:set signal.recipient="+1234567890"
firebase functions:config:set signal.sender="+0987654321"
```

### Security Considerations

1. **Use HTTPS in production**: Set up SSL/TLS certificates
2. **Restrict access**: Use firewall rules to limit API access
3. **Authentication**: Consider adding API key authentication
4. **Rate limiting**: Implement rate limiting to prevent abuse

## Testing the Setup

### Test Signal API Connection

```bash
# Test if the API is running
curl http://localhost:8080/v1/about

# Test sending a message
curl -X POST "http://localhost:8080/v2/send" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message from Signal CLI",
    "number": "+0987654321",
    "recipients": ["+1234567890"]
  }'
```

### Test with Firebase Functions

```bash
# Deploy your functions
firebase deploy --only functions

# Submit test feedback through your app
# Check function logs
firebase functions:log --only onFeedbackCreated
```

## Troubleshooting

### Common Issues

1. **Registration fails**

   - Check phone number format (+countrycode)
   - Ensure you can receive SMS
   - Try different verification methods

2. **API not responding**

   - Check if container is running: `docker ps`
   - Check logs: `docker logs signal-cli-rest-api`
   - Verify port 8080 is accessible

3. **Message sending fails**

   - Verify phone number is registered
   - Check recipient number format
   - Ensure both numbers are valid Signal users

4. **Firebase Functions can't connect**
   - Check network connectivity
   - Verify API URL is correct
   - Check firewall settings

### Debug Commands

```bash
# Check Signal CLI status
signal-cli -a +1234567890 listAccounts

# Check API health
curl http://localhost:8080/v1/about

# View detailed logs
docker logs -f signal-cli-rest-api
```

## Production Deployment

### Using Docker Compose with SSL

```yaml
version: "3.8"

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - signal-cli

  signal-cli:
    image: bbernhard/signal-cli-rest-api:latest
    environment:
      - SIGNAL_CLI_CONFIG_DIR=/home/.local/share/signal-cli
    volumes:
      - signal-cli-data:/home/.local/share/signal-cli
    restart: unless-stopped

volumes:
  signal-cli-data:
```

### Monitoring and Maintenance

1. **Set up monitoring**: Use tools like Prometheus + Grafana
2. **Backup configuration**: Regularly backup Signal CLI data
3. **Update regularly**: Keep Signal CLI and REST API updated
4. **Monitor logs**: Set up log aggregation and alerting

## Cost Considerations

### Free Options

- Local installation (free, but requires always-on computer)
- VPS free tiers (limited resources)

### Paid Options

- VPS: $5-10/month
- Cloud functions: Pay per execution
- Signal: Free to use

## Next Steps

1. Choose your preferred setup option
2. Follow the installation steps
3. Register your phone number
4. Configure Firebase Functions
5. Test the complete flow
6. Deploy to production

## Support

- [Signal CLI Documentation](https://github.com/AsamK/signal-cli)
- [Signal CLI REST API](https://github.com/bbernhard/signal-cli-rest-api)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
