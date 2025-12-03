# HRMS Backend and Frontend

This project consists of a Django backend for HRMS functionalities and a React frontend to interact with it.

## Running the Backend Application

1. **Set up a virtual environment:**
   ```bash
   python3 -m venv venv
   ```

2. **Activate the virtual environment:**
   - On macOS and Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

3. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Django development server:**
   ```bash
   cd hrms_backend
   python manage.py runserver
   ```
   The backend API will be available at `http://127.0.0.1:8000/`. If port 8000 is in use, you can specify another port:
   ```bash
   python manage.py runserver 8001
   ```

## Running the Frontend Application (React with Vite)

### 1. Create the React Project (if not already created)
   Open your terminal in the `MiniProj` directory (the same level as `hrms_backend`) and run:
   ```bash
   npm create vite@latest frontend -- --template react
   cd frontend
   npm install # or yarn install
   ```

### 2. Install Axios
   ```bash
   npm install axios # or yarn add axios
   ```

### 3. Configure Proxy for API Requests
   Create or modify `frontend/vite.config.js` to include the proxy configuration:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     server: {
       proxy: {
         '/api': {
           target: 'http://127.0.0.1:8000', // Or your Django backend port
           changeOrigin: true,
           rewrite: (path) => path.replace(/^\/api/, '/api'),
         },
       },
     },
   })
   ```

### 4. Basic Login Component (`frontend/src/App.jsx`)
   Replace the content of `frontend/src/App.jsx` with the provided login component code (as discussed in previous interactions).

### 5. Run the React Development Server
   Navigate to the `frontend` directory and run:
   ```bash
   cd frontend
   npm run dev # or yarn dev
   ```
   The React app will usually start on `http://localhost:5173`.

## API Endpoints (Backend)

- `GET /`: Welcome message for the root URL.
- `POST /api/login/`: Login for all users.
- `GET/POST /api/admin/`: Admin page.
- `GET/POST/DELETE /api/hod/`: HOD page.
- `GET/POST/DELETE /api/principal/`: Principal page.
- `GET /api/employee/`: Employee page.
- `GET/POST /api/leave-request/`: Submit and view leave requests.
- `GET/POST/DELETE /api/announcements/`: View, create, and delete announcements.
- `GET /api/dashboard/`: Get dashboard metrics.
