# COSMOS

COSMOS is an interactive 3D solar system explorer built with React, TypeScript, and Three.js.

## Run locally

Use Node.js 22.12 or newer on the 22.x release line.

```sh
npm ci
npm run dev
```

## Deploy to GitHub Pages

1. Open the repository's **Settings → Pages** and select **GitHub Actions** under **Build and deployment → Source**.
2. Push the workflow to `main` for the first deployment. If the workflow is already on `main`, open **Actions → Deploy COSMOS to GitHub Pages** and select **Run workflow** with `main` selected.
3. Open the deployment URL from the workflow run or the repository's Pages settings.

Future pushes to `main` build and publish the site automatically. The workflow installs the locked dependencies, type-checks and builds the app, and deploys the generated `dist` folder. Vite generates relative asset URLs so the site can run under `/cosmos/`.
