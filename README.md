An API that features AI-generated recipe collections with textual recipes via Pollinations API and step-by-step image generation via Cloudflare AI Workers. Users can generate new recipes by sending a prompt, and the API returns structured recipe data including ingredients, instructions, and cooking metadata. Additional features such as device-based favorites for local persistence. Images are session-only and not stored persistently.

## Functionalities
**Key Functionalities**
- AI-Powered Recipe Generation using Pollinations API
- Image Generation using Cloudflare AI Workers (stable diffusion)
- Device-based Favorites with Local Preferences
- RESTful API Endpoints for Recipe CRUD

## What's Inside
**Folder Structure**  
```
-- src  
├── index.js       # Express server entry 
├── models/        # Mongoose schemas
├── routes/        # API endpoints
├── services/      # AI integrations
```

**Dependencies**  
| Package | Purpose |
| --- | --- |
| `express` | Web application framework for Node.js |
| `mongoose` | MongoDB ODM |
| `dotenv` | Managing environment variables from .env files |
| `cors` | Enabling Cross-Origin Resource Sharing |
| `axios` | HTTP Client |
