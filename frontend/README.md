# Roopam Retail Frontend

The modern web application for the **Roopam Custom Bag Retail & ERP Management System**. Built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**.

## Features

- **Interactive 2D Custom Bag Studio**: Custom bag visualizer with parametric customization (type, size, fabric, hardware, monogram) and dynamic pricing calculations.
- **Enterprise ERP Views**: Product catalog, supplier management, brand & category master data.
- **Stock Ledger**: Real-time stock audit transactions (`IN`, `OUT`, `ADJUSTMENT`).
- **Point of Sale (POS)**: Fast billing counter with invoice auto-generation and multiple payment modes.
- **Reports & Analytics**: Real-time sales dashboards, trends, and category performance charts.

## Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

> **Note:** The development server automatically proxies all `/api/*` requests to the Spring Boot backend on `http://localhost:8080`.

### 3. Build for Production
```bash
npm run build
```

### 4. Lint Code
```bash
npm run lint
```
