# consumer-supplier-frontend

# Description﻿

B2B platform connecting suppliers and consumers through a supplier web portal, backend services, and consumer mo-
bile application. Features include role-based access control, product catalog management, order processing, consumer
management, and complaint handling.

Demo Link: https://consumer-supplier-frontend.vercel.app/ (only frontend is deployed, so no backend functionality is available)

## Project Structure

This repository contains the **frontend** application. The backend is maintained in a separate repository.

## Quick Start

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure backend URL (optional):
   ```bash
   cp .env.example .env
   # Edit .env and set VITE_API_URL to your backend URL
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173` (or next available port)
