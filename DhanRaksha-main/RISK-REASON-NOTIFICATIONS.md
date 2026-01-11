# Risk Reason Notification Examples

## User-Facing Messages

When transactions are flagged for suspicious activity, users now receive clear explanations:

### PENDING Transaction Examples:
```
"Your payment of ₹50,000.00 for: Test transaction is pending because: Amount > 3x daily average, New device + high amount"
```

```
"Your payment of ₹75,000.00 for: Investment transfer is pending because: High transaction velocity, Geo/IP mismatch"
```

### FAILED Transaction Examples:
```
"Your payment of ₹100,000.00 for: Luxury purchase failed because: Amount > 3x daily average, New device + high amount, High transaction velocity"
```

```
"Your payment of ₹25,000.00 for: Online shopping failed because: Geo/IP mismatch"
```

### Normal Transaction (No Risk Reasons):
```
"Your payment of ₹5,000.00 for: Grocery shopping is pending"
```

```
"Your transaction of ₹10,000.00 for: Salary credit has been completed"
```

## Risk Reasons Available

The system automatically generates these specific reasons:

- **"Amount > 3x daily average"** - Transaction amount exceeds user's normal spending pattern
- **"New device + high amount"** - Transaction from unrecognized device with significant amount  
- **"High transaction velocity"** - Too many transactions in short time period
- **"Geo/IP mismatch"** - Transaction location doesn't match user's usual location

## Implementation Details

- Risk reasons are automatically passed from the fraud detection engine
- Multiple reasons are joined with commas for clarity
- Only PENDING and FAILED transactions show risk reasons
- COMPLETED transactions show standard success messages
- Admin notifications continue to receive detailed risk information
