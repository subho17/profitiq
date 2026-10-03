# ProfitIQ — Landing Site

ProfitIQ is India's intelligent profitability audit platform for dealer networks and distribution businesses.

---

## 🚀 Deploy to Vercel

This repository is pre-configured and 100% production-ready for **Vercel**.

### Option 1: Deploy with Git (Recommended)

1. Push this folder to a GitHub, GitLab, or Bitbucket repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for ProfitIQ site"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Click **Deploy** — Vercel will automatically detect the static project and deploy it instantly!

---

### Option 2: Deploy directly from CLI

You can deploy directly from your local terminal using the Vercel CLI without installing anything globally:

```bash
npx vercel
```

Follow the interactive prompts:
- **Set up and deploy?** [Y]
- **Which scope?** (Select your account)
- **Link to existing project?** [N]
- **Project name?** `profitiq-site` (or your preferred name)
- **In which directory is your code located?** `./`

To deploy straight to production:
```bash
npx vercel --prod
```

---

## 🛠 Local Development

To run the site locally:

```bash
npm start
```
or
```bash
npx serve public
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── public/          # Static site root (Vercel output directory)
│   ├── 404.html     # Custom branded 404 error page (auto-routed by Vercel)
│   ├── favicon.svg  # SVG brand favicon (IQ logo)
│   ├── index.html   # Landing page with SEO & Open Graph meta tags
│   ├── robots.txt   # Search engine crawler instructions
│   ├── script.js    # Interactive scripts (ROI calculator, AI recon simulator, demo form)
│   ├── sitemap.xml  # XML sitemap for Google & Bing indexing
│   └── styles.css   # Complete design system & responsive styling
├── package.json     # Project metadata and local dev scripts
├── vercel.json      # Vercel deployment configuration (security headers & caching)
└── .gitignore       # Git ignore rules for node, system & vercel files
```

---

## 🛡️ Vercel Optimizations Included

- **`vercel.json`**: Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`), clean URLs, and long-term asset caching headers.
- **Custom 404 Handling**: `404.html` automatically served on unknown routes with ProfitIQ branding.
- **SEO & Social Sharing**: Open Graph and Twitter Card tags, canonical link, and dynamic SVG favicon.
- **Form Integration**: Interactive demo booking form that automatically populates email fields.
