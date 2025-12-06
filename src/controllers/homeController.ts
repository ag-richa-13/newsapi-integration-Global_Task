import { Request, Response } from "express";
import { readCache, writeCache } from "../cache/cacheService";
import { newsApiClient } from "../api/newsApiClient";
import { safeApiCall } from "../api/safeApiCall";

export const showHome = async (req: Request, res: Response) => {
  let cache = readCache();

  // Auto fetch if no cached data
  if (cache.topHeadlines.length === 0 && cache.everything.length === 0) {
    try {
      const top = await safeApiCall(
        newsApiClient.get("/top-headlines", { params: { country: "us" } }),
        []
      );
      const tech = await safeApiCall(
        newsApiClient.get("/everything", { params: { q: "technology" } }),
        []
      );

      cache.topHeadlines = top.data.articles || [];
      cache.everything = tech.data.articles || [];

      writeCache(cache);
    } catch (e) {
      // ignore, will just show "click Refresh" message
    }
  }

  const totalHeadlines = cache.topHeadlines.length;
  const totalTech = cache.everything.length;
  const totalAll = totalHeadlines + totalTech;
  const noData = totalAll === 0;

  res.send(`
  <html>
  <head>
    <title>News Dashboard</title>

    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
      * { box-sizing: border-box; }

      body {
        transition: background 0.4s, color 0.4s;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body.light {
        background: radial-gradient(circle at top left, #ffffff, #e3f0ff);
        color: #1f2933;
      }

      body.dark {
        background: radial-gradient(circle at top left, #111827, #020617);
        color: #e5e7eb;
      }

      .glass {
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        background: rgba(255, 255, 255, 0.15);
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.4);
      }

      body.dark .glass {
        background: rgba(15, 23, 42, 0.7);
        border-color: rgba(148, 163, 184, 0.4);
      }

      .sidebar {
        width: 240px;
        height: 100vh;
        position: fixed;
        left: 0;
        top: 0;
        padding: 24px 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .sidebar-brand {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.04em;
        margin-bottom: 10px;
      }

      .nav-link-custom {
        border-radius: 10px;
        padding: 10px 12px;
        text-decoration: none;
        color: inherit;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
      }

      .nav-link-custom:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.35);
        background: rgba(255, 255, 255, 0.12);
      }

      .content {
        margin-left: 260px;
        padding: 26px;
      }

      @media (max-width: 768px) {
        .sidebar {
          position: static;
          width: 100%;
          height: auto;
          margin-bottom: 16px;
          flex-direction: row;
          flex-wrap: wrap;
        }
        .content {
          margin-left: 0;
          padding: 16px;
        }
      }

      .metric-card {
        border-radius: 18px;
        padding: 18px;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .metric-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.38);
      }

      .metric-label {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        opacity: 0.8;
      }

      .metric-value {
        font-size: 30px;
        font-weight: 700;
        margin-top: 4px;
      }

      .fade-in {
        animation: fadeInUp 0.7s ease forwards;
        opacity: 0;
      }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Loading Screen */
      #loader {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.9);
        z-index: 9999;
        color: white;
        flex-direction: column;
        gap: 12px;
      }

      .dot-spinner {
        display: grid;
        grid-template-columns: repeat(3, 10px);
        gap: 6px;
      }
      .dot-spinner div {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #38bdf8;
        animation: bounce 0.6s infinite alternate;
      }
      .dot-spinner div:nth-child(2) { animation-delay: 0.2s; }
      .dot-spinner div:nth-child(3) { animation-delay: 0.4s; }

      @keyframes bounce {
        from { transform: translateY(0); opacity: 0.5;}
        to { transform: translateY(-6px); opacity: 1;}
      }

      .pill-warning {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 13px;
        background: rgba(248, 250, 252, 0.16);
      }
        .theme-toggle-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  transition: 0.3s ease-in-out;
  color: white;
  margin-top: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
}

.theme-toggle-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 25px rgba(255, 255, 255, 0.5);
}

body.dark .theme-toggle-btn {
  background: rgba(40, 40, 40, 0.65);
  color: #ffe066;
}

.theme-toggle-btn:active {
  transform: scale(0.92);
}

    </style>

    <script>
      let chartInstance;

      function toggleTheme() {
        document.body.classList.toggle("dark");
        document.body.classList.toggle("light");
        if (chartInstance) {
          const isDark = document.body.classList.contains("dark");
          chartInstance.options.scales.x.ticks.color = isDark ? "#e5e7eb" : "#111827";
          chartInstance.options.scales.y.ticks.color = isDark ? "#e5e7eb" : "#111827";
          chartInstance.update();
        }
      }

      function hideLoader() {
        const loader = document.getElementById("loader");
        if (loader) loader.style.display = "none";
      }

      function initChart() {
        const ctx = document.getElementById("newsChart").getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, "rgba(56, 189, 248, 0.8)");
        gradient.addColorStop(1, "rgba(56, 189, 248, 0.05)");

        chartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels: ["Top Headlines", "Technology"],
            datasets: [{
              data: [${totalHeadlines}, ${totalTech}],
              fill: true,
              backgroundColor: gradient,
              borderColor: "#38bdf8",
              tension: 0.35,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#0ea5e9"
            }]
          },
          options: {
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                ticks: { color: "#111827" }
              },
              y: {
                ticks: { color: "#111827" }
              }
            }
          }
        });
      }

      window.addEventListener("load", () => {
        document.body.classList.add("light");
        initChart();
        setTimeout(hideLoader, 500);
      });
      function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById("themeIcon");

  body.classList.toggle("dark");
  body.classList.toggle("light");

  if (body.classList.contains("dark")) {
    themeIcon.textContent = "☀️";
  } else {
    themeIcon.textContent = "🌙";
  }

  if (chartInstance) {
    const isDark = body.classList.contains("dark");
    chartInstance.options.scales.x.ticks.color = isDark ? "#e5e7eb" : "#111827";
    chartInstance.options.scales.y.ticks.color = isDark ? "#e5e7eb" : "#111827";
    chartInstance.update();
  }
}

    </script>
  </head>

  <body>
    <div id="loader">
      <div class="dot-spinner">
        <div></div><div></div><div></div>
      </div>
      <div>Loading dashboard...</div>
    </div>

    <!-- Sidebar -->
    <div class="sidebar glass fade-in">
      <div class="sidebar-brand">📰 NewsBoard</div>
      <a href="/" class="nav-link-custom">🏠 <span>Dashboard</span></a>
      <a href="/news/list" class="nav-link-custom">📄 <span>News List</span></a>
      <a href="/news/fetch" class="nav-link-custom">🔄 <span>Refresh News</span></a>
      <button onclick="toggleTheme()" id="themeBtn" class="theme-toggle-btn">
  <span id="themeIcon">🌙</span>
</button>

    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="fade-in">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <h2 class="mb-2">Dashboard Overview</h2>
          ${
            noData
              ? `<div class="pill-warning">
                  ⚠ No data loaded. Please click <b>Refresh News</b> from the sidebar.
                 </div>`
              : ""
          }
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <div class="glass metric-card">
              <div class="metric-label">Top Headlines</div>
              <div class="metric-value">${totalHeadlines}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="glass metric-card">
              <div class="metric-label">Technology Articles</div>
              <div class="metric-value">${totalTech}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="glass metric-card">
              <div class="metric-label">Total Cached Articles</div>
              <div class="metric-value">${totalAll}</div>
            </div>
          </div>
        </div>

        <div class="glass p-3 mt-3">
          <h6 class="mb-2">Articles Distribution</h6>
          <canvas id="newsChart" height="120"></canvas>
        </div>
      </div>
    </div>
  </body>
  </html>
  `);
};
