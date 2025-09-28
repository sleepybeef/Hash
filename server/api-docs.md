# API Documentation

## Endpoints

### POST /api/comments
- Create a new comment
- Body: `{ videoId, userId, content }`
- Returns: Comment object with username

### GET /api/comments/:videoId
- Get all comments for a video
- Returns: Array of comments with username

### DELETE /api/comments/:commentId
- Delete a comment (author only)
- Body: `{ userId }`
- Returns: Success message

## Data Models
- See `shared/schema.ts` for full schema
