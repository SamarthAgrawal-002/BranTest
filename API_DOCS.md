# Agency Discovery Platform - API Documentation

Backend API for the startup-marketing agency discovery platform.

## Base URL

```
https://your-domain.vercel.app/api
```

## Response Format

All API endpoints return responses in this format:

```json
{
  "success": boolean,
  "data": object | null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  } | null
}
```

## Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

---

## Endpoints

### Health Check

#### `GET /api/health`

Check if the service is running.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "error": null
}
```

---

### Authentication

#### `POST /api/auth/signup`

Register a new user.

**Request Body:**
```json
{
  "email": "founder@startup.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "startup"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Min 6 characters |
| name | string | Yes | User's display name |
| role | string | Yes | `startup` or `agency` |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "firebase_uid_123",
      "role": "startup",
      "name": "John Doe",
      "email": "founder@startup.com",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJSUzI1NiIs..."
  },
  "error": null
}
```

**Error Responses:**
- `400 MISSING_FIELDS` - Required fields not provided
- `400 INVALID_INPUT` - Invalid role or password too short
- `409 ALREADY_EXISTS` - Email already registered

---

#### `POST /api/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "founder@startup.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "firebase_uid_123",
      "role": "startup",
      "name": "John Doe",
      "email": "founder@startup.com",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJSUzI1NiIs..."
  },
  "error": null
}
```

**Error Responses:**
- `400 MISSING_FIELDS` - Email or password not provided
- `401 INVALID_CREDENTIALS` - Wrong email or password

---

### Agencies

#### `GET /api/agencies`

List agencies with optional filtering. **Requires authentication.**

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (SEO, Branding, etc.) |
| area | string | Filter by area (Remote, India, etc.) |
| budgetMin | number | Minimum budget |
| budgetMax | number | Maximum budget |
| keyword | string | Search keywords in name, description |
| industry | string | Filter by industry |
| thinkingStyle | string | Filter by thinking style |
| experienceLevel | string | Filter by experience level |

**Example Request:**
```
GET /api/agencies?category=SEO&area=Remote&budgetMax=50000
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "agencies": [
      {
        "id": "agency_123",
        "userId": "user_456",
        "name": "GrowthLabs",
        "categories": ["SEO", "Content Marketing"],
        "industries": ["SaaS", "B2B"],
        "budgetMin": 5000,
        "budgetMax": 50000,
        "areas": ["Remote", "India"],
        "keywords": ["growth", "organic", "PLG"],
        "experienceLevel": "growth",
        "thinkingStyle": "data",
        "description": "Data-driven growth agency...",
        "createdAt": "2024-01-10T08:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "filters": {
      "category": "SEO",
      "area": "Remote",
      "budgetMax": 50000
    }
  },
  "error": null
}
```

---

#### `POST /api/agencies`

Create a new agency profile. **Requires authentication. Agency role only.**

**Request Body:**
```json
{
  "name": "GrowthLabs Agency",
  "categories": ["SEO", "Content Marketing", "Performance"],
  "industries": ["SaaS", "B2B", "Fintech"],
  "budgetMin": 5000,
  "budgetMax": 50000,
  "areas": ["Remote", "India", "Bangalore"],
  "keywords": ["growth hacking", "PLG", "organic growth"],
  "experienceLevel": "growth",
  "thinkingStyle": "data",
  "description": "We are a data-driven growth agency specializing in SaaS companies..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Agency name |
| categories | string[] | Yes | Service categories |
| industries | string[] | No | Industry expertise |
| budgetMin | number | Yes | Minimum project budget |
| budgetMax | number | Yes | Maximum project budget |
| areas | string[] | Yes | Service areas |
| keywords | string[] | No | Searchable keywords |
| experienceLevel | string | No | `early-stage`, `growth`, `enterprise` |
| thinkingStyle | string | Yes | `creative`, `data`, `hybrid` |
| description | string | Yes | Agency description |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "newly_created_agency_id",
    "userId": "owner_user_id",
    "name": "GrowthLabs Agency",
    "categories": ["SEO", "Content Marketing", "Performance"],
    ...
  },
  "error": null
}
```

---

#### `GET /api/agencies/:id`

Get a specific agency profile. **Requires authentication.**

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "agency_123",
    "name": "GrowthLabs Agency",
    "categories": ["SEO", "Content Marketing"],
    ...
  },
  "error": null
}
```

**Error Responses:**
- `404 NOT_FOUND` - Agency not found

---

#### `PUT /api/agencies/:id`

Update an agency profile. **Requires authentication. Owner only.**

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Agency Name",
  "budgetMax": 75000,
  "keywords": ["new", "keywords"]
}
```

---

#### `DELETE /api/agencies/:id`

Delete an agency profile. **Requires authentication. Owner only.**

---

### Match Engine

#### `POST /api/match`

**Core Feature** - Find matching agencies based on startup preferences. **Requires authentication. Startup role only.**

**Request Body:**
```json
{
  "budget": 25000,
  "categories": ["SEO", "Content Marketing"],
  "industries": ["SaaS", "B2B"],
  "areas": ["Remote"],
  "thinkingPreference": "data",
  "experienceLevel": "growth",
  "keywords": ["PLG", "product-led growth"],
  "minScore": 30,
  "limit": 10
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| budget | number | Yes | Project budget |
| categories | string[] | Yes | Desired service categories |
| industries | string[] | No | Your industry |
| areas | string[] | No | Preferred areas |
| thinkingPreference | string | Yes | `creative`, `data`, or `hybrid` |
| experienceLevel | string | No | `early-stage`, `growth`, `enterprise` |
| keywords | string[] | No | Relevant keywords |
| minScore | number | No | Minimum match score (default: 20) |
| limit | number | No | Max results (default: 20) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "agency": {
          "id": "agency_123",
          "name": "GrowthLabs",
          "categories": ["SEO", "Content Marketing"],
          "industries": ["SaaS", "B2B"],
          "budgetMin": 10000,
          "budgetMax": 50000,
          "areas": ["Remote", "India"],
          "thinkingStyle": "data",
          "experienceLevel": "growth",
          "description": "Data-driven growth agency..."
        },
        "thinking_match_score": 100,
        "overall_score": 87,
        "why_matched": [
          "Perfect thinking style match: Both favor data approach",
          "Budget aligned: Your budget of $25,000 fits within their $10,000-$50,000 range",
          "Expertise in: SEO, Content Marketing",
          "Industry experience: SaaS, B2B",
          "Available in: Remote",
          "Specializes in growth startups"
        ]
      }
    ],
    "total_matches": 5,
    "preferences_used": {
      "budget": 25000,
      "categories": ["SEO", "Content Marketing"],
      "thinkingPreference": "data"
    }
  },
  "error": null
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| MISSING_FIELDS | 400 | Required fields not provided |
| INVALID_INPUT | 400 | Invalid field value |
| UNAUTHORIZED | 401 | Authentication required |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| INVALID_TOKEN | 401 | Token expired or invalid |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| ALREADY_EXISTS | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |

---

## Firestore Schema

### Collection: `users`

```javascript
{
  // Document ID = Firebase Auth UID
  "role": "startup" | "agency",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### Collection: `agencies`

```javascript
{
  // Document ID = auto-generated
  "userId": "firebase_uid",           // Owner's user ID
  "name": "Agency Name",
  "categories": ["SEO", "Branding"],  // Array of service categories
  "industries": ["SaaS", "D2C"],      // Array of industry expertise
  "budgetMin": 5000,                  // Minimum project budget
  "budgetMax": 50000,                 // Maximum project budget
  "areas": ["Remote", "India"],       // Service areas
  "keywords": ["growth", "PLG"],      // Searchable keywords
  "experienceLevel": "growth",        // early-stage | growth | enterprise
  "thinkingStyle": "data",            // creative | data | hybrid
  "description": "Agency description...",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### Indexes Required

Create these composite indexes in Firebase Console:

1. **agencies** - `thinkingStyle` ASC, `experienceLevel` ASC
2. **agencies** - `userId` ASC

---

## Environment Variables

Required environment variables for deployment:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

The `FIREBASE_SERVICE_ACCOUNT_KEY` should be the full JSON content of your Firebase service account key file, as a single-line string.

---

## Thinking Style Matching Algorithm

The match engine uses weighted scoring:

| Factor | Weight |
|--------|--------|
| Thinking Style | 30% |
| Budget | 25% |
| Categories | 20% |
| Industries | 10% |
| Areas | 10% |
| Keywords | 5% |

**Thinking Style Scoring:**
- Exact match: 100 points
- Hybrid with any style: 75 points
- Creative vs Data: 25 points (opposite styles)
