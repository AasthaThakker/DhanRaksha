# Admin Analytics API Documentation

## Overview

The Admin Analytics system provides comprehensive user management and analytics capabilities for the DhanRaksha application. It includes CRUD operations, detailed user analytics, and bulk operations for efficient user management.

## Endpoints

### 1. Main Analytics Endpoint
**GET** `/api/admin/analytics`

Comprehensive user analytics with pagination, filtering, and sorting.

#### Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Users per page (default: 10)
- `search` (string): Search by name or email
- `role` (string): Filter by role ('USER', 'ADMIN', 'ALL')
- `sortBy` (string): Sort field ('createdAt', 'name', 'email', 'updatedAt')
- `sortOrder` (string): Sort order ('asc', 'desc')

#### Response:
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    },
    "analytics": {
      "overview": {
        "totalUsers": 50,
        "totalAdmins": 2,
        "totalRegularUsers": 48,
        "totalBalance": 150000,
        "highRiskUsers": 5,
        "activeUsers": 30,
        "recentTransactions": 125
      },
      "userDistribution": {
        "byRole": { "admins": 2, "users": 48 },
        "byRisk": { "high": 5, "monitored": 15, "low": 30 },
        "byActivity": { "active": 30, "inactive": 20 }
      }
    }
  }
}
```

### 2. User-Specific Analytics
**GET** `/api/admin/user-analytics?userId={userId}`

Detailed analytics for a specific user.

#### Response:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "analytics": {
      "overview": {
        "accountAge": 45,
        "daysSinceLastActivity": 2,
        "isActive": true,
        "riskLevel": "LOW"
      },
      "transactions": {
        "total": 25,
        "byType": { "INCOME": { "count": 15, "totalAmount": 5000 }, ... },
        "byStatus": { "COMPLETED": 20, "FAILED": 5 },
        "totalVolume": 10000,
        "averageAmount": 400,
        "highRiskTransactions": 2,
        "recentTransactions": 8
      },
      "behavior": {
        "totalSessions": 10,
        "averageScore": 25.5,
        "riskDistribution": { "LOW": 7, "MEDIUM": 2, "HIGH": 1 },
        "highRiskSessions": 1,
        "recentSessions": 3
      },
      "notifications": {
        "total": 15,
        "unread": 3,
        "byType": { "TRANSACTION_COMPLETED": 8, "USER_FLAGGED": 2, ... },
        "recent": 5
      },
      "accounts": {
        "totalAccounts": 2,
        "totalBalance": 8000,
        "accountCurrencies": ["INR", "USD"],
        "oldestAccount": "2024-01-01T00:00:00.000Z",
        "newestAccount": "2024-02-01T00:00:00.000Z"
      },
      "risk": {
        "overallRisk": "LOW",
        "riskFactors": {
          "highRiskTransactions": false,
          "highRiskSessions": false,
          "unusualActivity": false,
          "accountBalance": "NORMAL"
        },
        "protectionEnabled": true
      }
    }
  }
}
```

### 3. CRUD Operations

#### Create User
**POST** `/api/admin/analytics`

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "initialDeposit": 1000,
  "role": "USER"
}
```

#### Update User
**PUT** `/api/admin/analytics`

```json
{
  "userId": "user_id",
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "USER",
  "balance": 2000,
  "receiveAnomalyProtection": true
}
```

#### Delete User
**DELETE** `/api/admin/analytics?userId={userId}`

### 4. Bulk Operations
**POST** `/api/admin/bulk-operations`

#### Supported Operations:
- `UPDATE_ROLE`: Update role for multiple users
- `DELETE`: Delete multiple users
- `EXPORT`: Export user data
- `BLOCK`: Block users (create high-risk sessions)
- `UNBLOCK`: Unblock users (remove high-risk sessions)

#### Example:
```json
{
  "operation": "UPDATE_ROLE",
  "userIds": ["user1_id", "user2_id"],
  "data": { "role": "ADMIN" }
}
```

**GET** `/api/admin/bulk-operations` - Get bulk operation statistics

## Features

### User Analytics
- **Account Overview**: Age, activity status, risk level
- **Transaction Analytics**: Volume, patterns, risk assessment
- **Behavior Analysis**: Session scores, risk distribution
- **Notification Tracking**: Read/unread ratios, type distribution
- **Account Management**: Multiple accounts, balances, currencies
- **Risk Assessment**: Overall risk score with contributing factors

### Search & Filtering
- **Text Search**: Search by name or email (case-insensitive)
- **Role Filtering**: Filter by user roles
- **Pagination**: Efficient data loading with customizable page sizes
- **Sorting**: Sort by multiple fields with ascending/descending order

### Bulk Operations
- **Mass Updates**: Update roles or properties for multiple users
- **Bulk Export**: Export user data for analysis
- **User Management**: Block/unblock users based on behavior
- **Safe Operations**: Prevents self-modification and validates permissions

### Security & Permissions
- **Admin Authentication**: All endpoints require admin role
- **Input Validation**: Comprehensive validation using Zod schemas
- **Error Handling**: Detailed error messages and proper HTTP status codes
- **Cascading Deletes**: Proper cleanup of related data

## Usage Examples

### Get paginated users with search
```javascript
const response = await fetch('/api/admin/analytics?page=1&limit=20&search=john&role=USER&sortBy=createdAt&sortOrder=desc');
const data = await response.json();
```

### Get detailed user analytics
```javascript
const response = await fetch('/api/admin/user-analytics?userId=abc123');
const analytics = await response.json();
```

### Create new user with initial deposit
```javascript
const response = await fetch('/api/admin/analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    initialDeposit: 5000
  })
});
```

### Bulk update user roles
```javascript
const response = await fetch('/api/admin/bulk-operations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'UPDATE_ROLE',
    userIds: ['user1', 'user2', 'user3'],
    data: { role: 'ADMIN' }
  })
});
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (no session)
- `403`: Forbidden (not admin)
- `404`: Not Found (user doesn't exist)
- `500`: Internal Server Error

## Testing

Use the provided test script `test-admin-analytics.js` to verify all functionality:

```bash
node test-admin-analytics.js
```

Ensure:
1. Development server is running on http://localhost:3000
2. You're logged in as an admin user
3. Database connection is working

## Performance Considerations

- **Pagination**: Limits data transfer and improves response times
- **Selective Queries**: Only fetch required fields using Prisma select
- **Batch Operations**: Efficient bulk operations with Promise.all
- **Caching Ready**: Structure supports future caching implementation
- **Database Indexes**: Ensure proper indexes on frequently queried fields
