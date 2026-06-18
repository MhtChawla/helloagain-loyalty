# API Spec

## Base setup

- Base URL: `https://api.demo.helloagain.at`
- Use following client ID: 753d6b63-dc6b-4b28-83fc-6ead93660958
- Use following user
  - username: testUser@dev.null
  - password: challenge-2026
- Use `Accept: application/json`
- Use `Content-Type: application/json` for `POST`
- Use auth header after login: `Authorization: Token <token>`
- To scan a coupon, use following code in a qr code: `YFQY2D`

## App flow

1. Login
2. Fetch customer relationship (`CR`) for points
3. Fetch profile
4. Fetch rewards from `/bounties/`
5. Redeem a coupon to get points by scanning a coupon QR code
6. Redeem a reward from the list

## Endpoints

### 1. Login

`POST /api/v1/users/token/?client_id=${CLIENT_ID}`

Request:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Response:

```json
{
  "id": 12804393369473025,
  "success": true,
  "access_token": "token-value",
  "token": "token-value"
}
```

### 2. Fetch CR

`GET /api/v1/customer-relationships/client/${CLIENT_ID}/`

Use `points` as the current balance.

```json
{
  "id": 29359144,
  "points": 330,
  "appuser": {
    "id": "1c8904cc-8c9b-470c-897b-50506bed8efb",
    "email": "user@example.com",
    "name": "Example User"
  }
}
```

### 3. Fetch profile

`GET /api/v1/users/profile/?client_id=${CLIENT_ID}`

```json
{
  "id": "1c8904cc-8c9b-470c-897b-50506bed8efb",
  "email": "user@example.com",
  "name": "Example User",
  "first_name": "Example",
  "last_name": "User",
  "locale": "en",
  "customer_id": "1000000"
}
```

### 4. Fetch rewards

`GET /api/v1/clients/${CLIENT_ID}/bounties/`

Response shape:

```json
[
  {
    "id": "f431d603-d4e7-4497-ba10-885a757cfba0",
    "name": "10% Rabatt",
    "description": "10% Vergünstigung auf deinen nächsten Einkauf.",
    "is_redeemable": true,
    "needed_points": 10,
    "cr_points": 330
  }
]
```

Fields the app should use:

- `id`
- `name`
- `description`
- `is_redeemable`
- `needed_points`
- `cr_points`

### 5. Redeem QR code to get points

`POST /api/v1/clients/${CLIENT_ID}/redeem/`

Request:

```json
{
  "code": "YFQY2D"
}
```

```json
{
  "success": true,
  "coupon": "YFQY2D",
  "points": 50,
  "cr_points": 380
}
```

### 6. Redeem reward

`POST /api/v1/clients/${CLIENT_ID}/bounties/redeem/`

Request:

```json
{
  "bounty_id": "f431d603-d4e7-4497-ba10-885a757cfba0"
}
```

Response:

```json
{
  "bounty_id": "f431d603-d4e7-4497-ba10-885a757cfba0"
}
```

## Minimum app behavior

- Login with email and password
- Show current points from CR
- Show profile info
- list rewards from `/bounties/`
- Allow code / QR redemption to get points
- Allow reward redemption for redeemable bounties
