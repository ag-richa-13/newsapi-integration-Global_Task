import { Request, Response } from "express";
import { newsApiClient } from "../api/newsApiClient";
import { readCache, writeCache } from "../cache/cacheService";
import { safeApiCall } from "../api/safeApiCall";

// ----------------- Fetch News (same, simple HTML confirm) -----------------
export const fetchNews = async (req: Request, res: Response) => {
  try {
    const cache = readCache();

    const top = await safeApiCall(
      newsApiClient.get("/top-headlines", { params: { country: "us" } }),
      cache.topHeadlines
    );

    const tech = await safeApiCall(
      newsApiClient.get("/everything", { params: { q: "technology" } }),
      cache.everything
    );

    cache.topHeadlines = top.data.articles || cache.topHeadlines;
    cache.everything = tech.data.articles || cache.everything;

    writeCache(cache);

    res.send(`
      <html>
      <head>
        <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <div class="card shadow-lg p-4 border-0 rounded-4">
            <h3 class="mb-2">✔ News Refreshed</h3>
            <p class="text-muted mb-3">
              Headlines: <b>${cache.topHeadlines.length}</b> |
              Tech: <b>${cache.everything.length}</b>
            </p>
            <div class="d-flex gap-2 flex-wrap">
              <a class="btn btn-primary" href="/news/list">Go to News List →</a>
              <a class="btn btn-outline-secondary" href="/">Back to Dashboard</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch {
    res.send(`<h2>Failed to fetch news</h2>`);
  }
};

// ----------------- List News with search, filters, pagination -----------------
export const listNews = (req: Request, res: Response) => {
  try {
    const cache = readCache();
    let articles = [...cache.topHeadlines, ...cache.everything];
    const idParam = ((req.query.id as string) || "").trim();
    const idNum = idParam ? parseInt(idParam, 10) : NaN;
    if (!isNaN(idNum)) {
      const all = [...cache.topHeadlines, ...cache.everything];
      const selected = all[idNum];
      articles = selected ? [selected] : [];
    }

    const search = ((req.query.search as string) || "").trim().toLowerCase();
    const category = ((req.query.category as string) || "")
      .trim()
      .toLowerCase();
    const page = parseInt((req.query.page as string) || "1", 10) || 1;
    const perPage = 6;

    // search filter
    if (search) {
      articles = articles.filter(
        (a) =>
          (a.title || "").toLowerCase().includes(search) ||
          (a.description || "").toLowerCase().includes(search)
      );
    }

    // category (source) filter
    if (category) {
      articles = articles.filter(
        (a) => (a.source?.name || "").toLowerCase() === category
      );
    }

    const total = articles.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * perPage;
    const paginated = articles.slice(start, start + perPage);

    const uniqueSources = Array.from(
      new Set(
        [...cache.topHeadlines, ...cache.everything]
          .map((a) => a.source?.name)
          .filter(Boolean)
      )
    );

    const chipHtml = uniqueSources
      .map(
        (s) => `
      <a href="/news/list?category=${encodeURIComponent(
        s as string
      )}&search=${encodeURIComponent(search)}"
         class="badge rounded-pill text-decoration-none
           ${
             s && s.toString().toLowerCase() === category
               ? "bg-primary"
               : "bg-secondary-subtle text-dark"
           } me-1 mb-1">
        ${s}
      </a>`
      )
      .join("");

    const cards = paginated
      .map(
        (a, idx) => `
      <div class="col-md-4 col-sm-6">
        <div class="card border-0 rounded-4 shadow-sm mb-3"
             style="backdrop-filter: blur(10px); background: rgba(255,255,255,0.85);">
          <div style="overflow:hidden; border-radius:18px 18px 0 0;">
            <img src="${a.urlToImage || "https://via.placeholder.com/400"}"
                 class="w-100" style="height:190px; object-fit:cover; transition:transform 0.3s;">
          </div>
          <div class="card-body">
            <span class="badge bg-primary-subtle text-primary mb-2">
              ${a.source?.name || "Unknown"}
            </span>
            <h5 class="card-title" style="min-height:48px;">${
              a.title || "No title"
            }</h5>
            <p class="card-text text-muted" style="min-height:56px;">
              ${(a.description || "").slice(0, 120)}...
            </p>
            <a href="/news/${
              start + idx
            }" class="btn btn-sm btn-outline-primary rounded-pill">
              Read Details →
            </a>
          </div>
        </div>
      </div>`
      )
      .join("");

    const paginationLinks = Array.from({ length: totalPages })
      .map((_, i) => {
        const p = i + 1;
        const active = p === safePage ? "active" : "";
        const url = `/news/list?page=${p}&search=${encodeURIComponent(
          search
        )}&category=${encodeURIComponent(category)}`;
        return `
        <li class="page-item ${active}">
          <a class="page-link" href="${url}">${p}</a>
        </li>`;
      })
      .join("");

    res.send(`
      <html>
      <head>
        <title>News List</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">

        <style>
          body {
            background: linear-gradient(135deg, #e0f2fe, #f5f3ff);
          }
          .glass-bar {
            backdrop-filter: blur(14px);
            background: rgba(255,255,255,0.8);
            border-radius: 999px;
            box-shadow: 0 10px 30px rgba(15,23,42,0.18);
          }
        </style>

        <script>
          function showLoader() {
            const loader = document.getElementById("loaderList");
            if (loader) loader.style.display = "flex";
          }
          window.addEventListener("load", () => {
            const loader = document.getElementById("loaderList");
            if (loader) loader.style.display = "none";
          });
        </script>
      </head>

      <body>
        <div id="loaderList"
             style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(15,23,42,0.75); z-index:9999; color:white;">
          Loading news...
        </div>

        <div class="container py-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <button class="btn btn-outline-secondary btn-sm" onclick="history.back()">← Back</button>
              <h2 class="mt-2 mb-0">News Articles</h2>
              <small class="text-muted">${total} result(s) found</small>
            </div>
            <a href="/" class="btn btn-outline-primary btn-sm">🏠 Dashboard</a>
          </div>

          <!-- Normal Clean Search Bar -->
<form class="d-flex mb-3" method="GET" action="/news/list" onsubmit="showLoader()">
  <input
    type="text"
    class="form-control me-2"
    placeholder="Search articles..."
    name="search"
    value="${search}"
    style="border-radius: 8px;"
  />
  <input type="hidden" name="category" value="${category}">
  <button class="btn btn-primary" style="border-radius: 8px;">Search</button>
</form>


          <div class="mb-2">
            <strong>Categories:</strong><br/>
            ${
              chipHtml ||
              "<span class='text-muted'>No categories available</span>"
            }
          </div>

          <div class="row mt-3">
            ${cards || "<p>No articles to display.</p>"}
          </div>

          <nav class="mt-3">
            <ul class="pagination justify-content-center">
              ${paginationLinks}
            </ul>
          </nav>
        </div>
      </body>
      </html>
    `);
  } catch {
    res.send("<h2>Error loading news list</h2>");
  }
};

// ----------------- Single article view -----------------
export const getNewsById = (req: Request, res: Response) => {
  const id = Number((req.params as any).id ?? (req.params as any).num);
  const cache = readCache();

  const all = [...cache.topHeadlines, ...cache.everything];
  const a = all[id];

  if (!a) {
    return res.send("<h2>Article not found</h2>");
  }

  res.send(`
    <html>
    <head>
      <title>${a.title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
      <style>
        body {
          background: radial-gradient(circle at top, #e0f2fe, #fef9c3);
        }
      </style>
    </head>
    <body>
      <div class="container py-4">
        <button class="btn btn-outline-secondary mb-3" onclick="history.back()">← Back</button>

        <div class="card border-0 rounded-4 shadow-lg p-3"
             style="backdrop-filter:blur(12px); background:rgba(255,255,255,0.92);">
          <img src="${a.urlToImage || "https://via.placeholder.com/800"}"
               class="img-fluid rounded-4 mb-3" style="max-height:360px; object-fit:cover;">

          <h2>${a.title}</h2>
          <div class="mb-2 text-muted">
            <span class="badge bg-primary-subtle text-primary">
              ${a.source?.name || "Unknown"}
            </span>
            ${a.author ? ` · <small>By ${a.author}</small>` : ""}
          </div>

          <p class="mt-3">${a.description || ""}</p>

          <a href="${
            a.url
          }" target="_blank" class="btn btn-primary rounded-pill">
            Read Full Article →
          </a>
        </div>
      </div>
    </body>
    </html>
  `);
};
