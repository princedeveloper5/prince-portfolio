# React Data App

A small 2-page React app (Vite + React Router):

- **Page 1 — Enter Data** (`/`): two input fields (Name, Email) and a "Check & Display" button.
  Pressing the button validates both fields, saves the values to shared state, and navigates to page 2.
- **Page 2 — Display Data** (`/display`): shows both entered values together, with a link back to the form.

Shared state is held in a React Context (`src/DataProvider.jsx`), so the data survives navigation
between the two pages. Navigation uses `react-router-dom` (`Link`, `NavLink`, `useNavigate`).

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173/ in your browser.

## Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # serves the production build locally
```

## Structure

```
react-data-app/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx              # app entry: Router + DataProvider
    ├── App.jsx               # nav bar + routes
    ├── DataProvider.jsx      # shared state (Context)
    ├── index.css             # styling
    └── pages/
        ├── FormPage.jsx      # page 1: inputs + button
        └── DisplayPage.jsx   # page 2: shows both values together
```
