# JagoPakaiAI API Integration Guide

This document outlines the API specifications that the `jagopakaiai-cli` CLI consumes from the JagoPakaiAI remote server.

---

## Base Endpoint URL
```text
https://jagopakaiai.my.id/api
```

---

## Authentication
Every request made to JagoPakaiAI APIs requires HTTP Bearer Authentication. 
Include your API Key in the `Authorization` request header:

```http
Authorization: Bearer <YOUR_API_KEY>
```

---

## Endpoints

### 1. Fetch Skill Instruction Rules

Fetches the customized developer instructions for a specific skill profile.

- **URL Path**: `/skills/:skillName`
- **Method**: `GET`
- **Headers**:
  - `Authorization: Bearer <API_KEY>`
  - `Accept: application/json`

#### Response Formats

##### Standard Format (JSON)
The API is expected to return the payload with a `content` block containing the markdown instructions:
```json
{
  "name": "laravel-clean-api",
  "content": "# Laravel Clean API Instructions\n\n- Use Repository Pattern...\n- Keep controllers light..."
}
```

##### Fallback Format (JSON)
If the server response uses `rules` instead of `content`:
```json
{
  "name": "laravel-clean-api",
  "rules": "# Laravel Clean API Instructions\n\n..."
}
```

##### List Fallback
If the server returns a list of skills under query parameter fallback `/skills?name=:skillName`:
```json
[
  {
    "slug": "laravel-clean-api",
    "name": "laravel-clean-api",
    "content": "# Laravel Clean API Instructions..."
  }
]
```

---

## Error Handling

### 401 Unauthorized
Returned when the `Authorization` header is missing, malformed, or contains an invalid key.
```json
{
  "error": "Unauthorized access. Invalid API Key."
}
```

### 404 Not Found
Returned when the requested skill name slug does not match any register on the JagoPakaiAI server.
```json
{
  "error": "Skill not found."
}
```
