# GLOBAL TREND – API Integration Internship

## NewsAPI Integration — Node.js + TypeScript

This project is part of the GLOBAL TREND API Integration Internship assignment. It demonstrates fetching from two NewsAPI endpoints, local caching, filtering, pagination, a simple UI, and robust error handling.

## Features

- Uses two NewsAPI endpoints: `/top-headlines` (US) and `/everything?q=technology`
- Local caching in `data/newsCache.json` with auto-fetch when empty
- Responsive UI built with Bootstrap (dashboard, list view, detail view)
- Search, category filter, and pagination for articles
- Graceful error handling with safe fallbacks

## Project Structure

```
newsapi-integration/
├─ src/
│ ├─ api/
│ │ ├─ newsApiClient.ts
│ │ └─ safeApiCall.ts
│ ├─ cache/
│ │ └─ cacheService.ts
│ ├─ controllers/
│ │ ├─ homeController.ts
│ │ └─ newsController.ts
│ ├─ routes/
│ │ ├─ homeRoutes.ts
│ │ └─ newsRoutes.ts
│ ├─ app.ts
│ └─ server.ts
├─ data/
│ └─ newsCache.json
├─ package.json
├─ tsconfig.json
├─ README.md
├─ .gitignore
└─ .env (ignored)
```

## Setup

- Clone the repository:

```
git clone <your-github-repo-url>
cd newsapi-integration
```

- Install dependencies:

```
npm install
```

- Create a `.env` file in the project root:

```
NEWS_API_KEY=YOUR_NEWS_API_KEY
PORT=5000
```

Note: Do not commit your real API key.

## API Key

- Get a free API key from NewsAPI:
  - Sign up at https://newsapi.org/
  - Copy your key from the account dashboard
- Add it to `.env` as `NEWS_API_KEY=<your-key>`
- The app reads this value in `src/api/newsApiClient.ts` using `dotenv`

## Run

- Development:

```
npm run dev
```

- Production:

```
npm run build
npm start
```

## API Endpoints

- `GET /` — Dashboard with cached metrics and theme toggle
- `GET /news/fetch` — Fetches `/top-headlines` and `/everything?q=technology`, then caches to `data/newsCache.json`
- `GET /news/list` — List articles with filters and pagination
  - Query params: `search` (title/description), `category` (source name), `page` (default 1)
- `GET /news/:id` — Single article details by index in the cached list
- `GET /post/{id}` — Alias to open a single article by index
  - Use `/post/5` in the browser (no colon or braces)

### Examples

```
# List with filters and pagination
curl "http://localhost:5000/news/list?search=apple&category=bbc&page=2"

# Refresh cache
curl "http://localhost:5000/news/fetch"

# Open single article by index
curl "http://localhost:5000/post/0"
```

## Error Handling

- Network failures and timeouts fall back to cached data
- Invalid/malformed API responses handled safely to prevent crashes
- Friendly UI messages on failure

## Local Caching

- Cache file: `data/newsCache.json`
- Shape:

```
{
  "topHeadlines": [],
  "everything": []
}
```

- Updated on each fetch operation

## Assumptions

- A valid `NEWS_API_KEY` is required; provided via `.env`
- Article ID is the index within the combined cached array of articles
