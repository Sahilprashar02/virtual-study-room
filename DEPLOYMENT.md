# Deployment Guide

This guide details how to deploy the **Virtual Study Room** application.
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: MongoDB (via Railway or Atlas)

## Prerequisites

1.  **GitHub Account**: Ensure your project is pushed to a GitHub repository.
2.  **Vercel Account**: [Sign up here](https://vercel.com/).
3.  **Railway Account**: [Sign up here](https://railway.app/).

---

## Part 1: Backend Deployment (Railway)

We will deploy the backend first so we have the API URL ready for the frontend.

1.  **Login to Railway** and go to your Dashboard.
2.  **New Project**: Click "New Project" > "Deploy from GitHub repo".
3.  **Select Repository**: Choose your `virtual-study-room` repository.
4.  **Configure Service**:
    *   Railway might try to deploy the root. We need to tell it to deploy the `backend` folder.
    *   Go to **Settings** -> **Root Directory** and set it to `/backend`.
5.  **Add Database (MongoDB)**:
    *   In the project view, Right Click (or click "New") > "Database" > "Add MongoDB".
    *   Wait for it to initialize.
6.  **Environment Variables**:
    *   Go to the **Variables** tab of your Backend Service.
    *   Add the following:
        *   `PORT`: `8080` (Railway often expects this, or just rely on the default provided by Railway usually `PORT`). *Better to just use the variable if Railway provides it, but our code uses `process.env.PORT || 5000`. Railway sets `PORT` automatically.*
        *   `MONGODB_URI`:
            *   Click on your MongoDB service in Railway.
            *   Go to "Connect" tab.
            *   Copy the **Mongo Connection URL**.
            *   Paste this as the value for `MONGODB_URI` in your Backend Service variables.
        *   `FRONTEND_URL`: `https://your-vercel-app-name.vercel.app` (You will update this AFTER deploying the frontend, for now you can put `*` or leave it pending).
7.  **Build & Deploy**:
    *   Railway should automatically detect `package.json` and start the deployment.
    *   Check "Deployments" tab for logs.
    *   Once "Active", copy the **Service URL** (e.g., `https://backend-production.up.railway.app`).

---

## Part 2: Frontend Deployment (Vercel)

1.  **Login to Vercel** and go to Dashboard.
2.  **Add New Project**: Click "Add New..." > "Project".
3.  **Import Git Repository**: Select your `virtual-study-room` repo.
4.  **Configure Project**:
    *   **Framework Preset**: Create React App (should be auto-detected).
    *   **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add:
        *   `REACT_APP_API_URL`: The Backend URL from Part 1 (e.g., `https://backend-production.up.railway.app`).
            *   *Note: Ensure no trailing slash `/` at the end if your code appends paths manually, but usually it's fine.*
        *   `REACT_APP_SOCKET_URL`: Same as `REACT_APP_API_URL` (e.g., `https://backend-production.up.railway.app`).
6.  **Deploy**:
    *   Click **Deploy**.
    *   Vercel will build your React app.
    *   Once complete, you will get a **Production Deployment URL** (e.g., `https://virtual-study-room-tau.vercel.app`).

---

## Part 3: Final Configuration

1.  **Update Backend CORS**:
    *   Go back to **Railway Dashboard** -> Backend Service -> **Variables**.
    *   Update `FRONTEND_URL` to your actual Vercel URL (e.g., `https://virtual-study-room-tau.vercel.app`).
    *   Railway will automatically redeploy the backend with the new variable.

2.  **Test the Application**:
    *   Open your Vercel URL.
    *   Try to Log in / Sign up.
    *   Create a room and verify Socket connection (Console logs should show "Socket connected").

---

## Troubleshooting

-   **404 on Refresh**: If you get a 404 error when refreshing a page on the frontend, ensure the `vercel.json` file is present in the `frontend` directory with the rewrite rules.
-   **CORS Errors**: Check the console. If you see CORS errors, verify the `FRONTEND_URL` on Railway matches exactly your Vercel URL (no trailing slash usually preferred for exact matching strings, or check how `server.js` handles it).
-   **Socket Connection Fail**: Ensure `REACT_APP_SOCKET_URL` is set correctly on Vercel and that the Backend is running (check Railway logs).
