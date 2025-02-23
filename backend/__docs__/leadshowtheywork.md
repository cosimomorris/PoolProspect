# Lead Management Documentation

## Overview
This system manages leads and automated email follow-ups with customizable intervals per lead.

## Lead Model Structure
```javascript
{
  email: String,        // Required, unique email address
  status: String,       // 'active', 'paused', or 'completed'
  emailInterval: Number, // Minutes between follow-up emails (customizable per lead)
  lastContactedAt: Date // Timestamp of last email sent
}
```

## Email Intervals

Each lead can have their own custom interval, enabling:
- Different follow-up frequencies per lead
- Personalized engagement strategies
- A/B testing of different intervals

### Interval Configuration
- Default: 10 minutes
- Minimum: 1 minute
- Can be updated individually via PUT request
- Set during creation (single or bulk)

## API Examples

### Creating a Lead with Custom Interval
```json
POST /api/leads
{
    "email": "example@email.com",
    "emailInterval": 15  // This lead gets emails every 15 minutes
}
```

### Bulk Import with Different Intervals
```json
POST /api/leads/bulk
{
    "leads": [
        {"email": "lead1@email.com", "emailInterval": 5},
        {"email": "lead2@email.com", "emailInterval": 10},
        {"email": "lead3@email.com", "emailInterval": 20}
    ]
}
```

### Updating Interval
```json
PUT /api/leads/:id
{
    "emailInterval": 30  // Change to every 30 minutes
}
```

## Lead States

### Active
- Currently receiving automated emails
- System checks interval and sends follow-ups
- Default state for new leads

### Paused
- Temporarily stop emails
- Maintain lead information
- Can be reactivated later

### Completed
- No more emails will be sent
- Lead has completed the funnel
- Historical data maintained

## Email Processing
- System checks all active leads every minute
- Each lead is processed based on their individual interval
- Emails are only sent if: `(currentTime - lastContactedAt) >= emailInterval`

## SendGrid Integration
- Uses SendGrid for reliable email delivery
- Requires verified sender email
- Environment variables:
  - SENDGRID_API_KEY
  - VERIFIED_SENDER

## Security
- All endpoints require JWT authentication
- Token must be included in Authorization header
- Leads are associated with authenticated users

## API Endpoints

### Authentication
- POST /api/auth/register - Create new user
- POST /api/auth/login - Get JWT token
- GET /api/auth/me - Get current user

### Leads
- GET /api/leads - List all leads
- POST /api/leads - Create single lead
- POST /api/leads/bulk - Import multiple leads
- PUT /api/leads/:id - Update lead
- DELETE /api/leads/:id - Delete single lead
- DELETE /api/leads - Delete all leads
- POST /api/test-lead-email - Test email sending

## Best Practices
1. Start with longer intervals (10+ minutes)
2. Monitor email engagement
3. Adjust intervals based on response rates
4. Use paused state for temporary stops
5. Regular cleanup of completed leads

## Error Handling
- Invalid emails are rejected
- Failed sends are logged
- Automatic retry on temporary failures
- Rate limiting protection