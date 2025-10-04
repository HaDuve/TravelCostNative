# Signal CLI Setup Checklist

Use this checklist to set up Signal CLI REST API for Firebase Cloud Functions notifications.

## Prerequisites

- [ ] Docker installed on your system
- [ ] Docker Compose installed
- [ ] A phone number for Signal registration
- [ ] Firebase CLI installed and authenticated
- [ ] Firebase project access

## Setup Steps

### 1. Signal CLI Server Setup

- [ ] Run the setup script: `./scripts/setup-signal-cli.sh`
- [ ] Verify server is running: `curl http://localhost:8080/v1/about`
- [ ] Check Docker container: `docker ps | grep signal-cli`

### 2. Phone Number Registration

- [ ] Register your phone number:
  ```bash
  curl -X POST "http://localhost:8080/v1/register/+YOUR_PHONE_NUMBER"
  ```
- [ ] Check your phone for SMS verification code
- [ ] Verify registration:
  ```bash
  curl -X POST "http://localhost:8080/v1/register/+YOUR_PHONE_NUMBER/verify/VERIFICATION_CODE"
  ```

### 3. Test Signal API

- [ ] Run the test script: `./scripts/test-signal-api.sh`
- [ ] Test with your phone number: `./scripts/test-signal-api.sh http://localhost:8080 +YOUR_PHONE_NUMBER`
- [ ] Verify you receive the test message on your phone

### 4. Configure Firebase Functions

- [ ] Set Signal API URL:
  ```bash
  firebase functions:config:set signal.api_url="http://localhost:8080"
  ```
- [ ] Set sender phone number:
  ```bash
  firebase functions:config:set signal.sender="+YOUR_PHONE_NUMBER"
  ```
- [ ] Set recipient phone number:
  ```bash
  firebase functions:config:set signal.recipient="+YOUR_PHONE_NUMBER"
  ```

### 5. Deploy and Test

- [ ] Deploy Firebase Functions: `firebase deploy --only functions`
- [ ] Test feedback submission through your app
- [ ] Check function logs: `firebase functions:log --only onFeedbackCreated`
- [ ] Verify you receive Signal notification

## Production Setup (Optional)

### VPS/Cloud Deployment

- [ ] Set up VPS or cloud instance
- [ ] Install Docker and Docker Compose
- [ ] Deploy Signal CLI server
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Update Firebase Functions config with production URL

### Security Configuration

- [ ] Use HTTPS for production API
- [ ] Set up API authentication (if needed)
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

## Troubleshooting

### Common Issues

- [ ] **Server won't start**: Check Docker logs, ensure port 8080 is free
- [ ] **Registration fails**: Verify phone number format, check SMS delivery
- [ ] **Messages not sending**: Ensure both numbers are registered Signal users
- [ ] **Firebase can't connect**: Check network connectivity, verify API URL

### Debug Commands

```bash
# Check server status
docker-compose -f docker-compose.signal.yml ps

# View server logs
docker-compose -f docker-compose.signal.yml logs -f

# Test API health
curl http://localhost:8080/v1/about

# Check registered accounts
curl http://localhost:8080/v1/accounts

# View Firebase Functions logs
firebase functions:log --only onFeedbackCreated
```

## Verification

### Final Tests

- [ ] Submit feedback through the app
- [ ] Check Firebase Functions logs for successful execution
- [ ] Verify Signal notification is received
- [ ] Test error handling (disconnect Signal API, submit feedback)
- [ ] Verify error logging works correctly

## Maintenance

### Regular Tasks

- [ ] Monitor server uptime
- [ ] Check for Signal CLI updates
- [ ] Review function logs for errors
- [ ] Backup Signal CLI configuration
- [ ] Test notification flow monthly

## Success Criteria

- [ ] Signal CLI server running and accessible
- [ ] Phone number registered and verified
- [ ] Test message sent and received successfully
- [ ] Firebase Functions configured with Signal API
- [ ] End-to-end feedback notification working
- [ ] Error handling and logging working
- [ ] Documentation complete and up-to-date

## Next Steps

Once setup is complete:

1. Monitor the system for a few days
2. Set up alerts for function failures
3. Consider production deployment if needed
4. Document any custom configurations
5. Train team members on maintenance procedures
