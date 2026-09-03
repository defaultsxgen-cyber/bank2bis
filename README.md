# Bank2BiS v1.3

## Vercel deployment (fixed)
This version uses the simplest Vercel layout:
- `index.html` and `app.js` are static files at the project root.
- `api/index.js` is the Express serverless function.
- `vercel.json` only rewrites `/api/*` requests to the API.

### Deploy
1. Upload the contents of this folder to GitHub.
2. Import the GitHub repository into Vercel.
3. Deploy with the default settings.
4. Open the assigned `*.vercel.app` URL.
5. Test `/api/health`; it should return:
   `{"status":"ok","app":"Bank2BiS","version":"1.3.0"}`

### Why v1.2 could show 404
The previous package placed the HTML under `public/` while relying on Express to serve it from a serverless function. Vercel's static deployment does not automatically route `/` into that Express function. v1.3 puts the homepage at the project root and leaves the API under `/api`.
