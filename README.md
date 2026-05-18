# LegalEase — AI-Powered Contract Analysis

> Instantly analyze any contract with Google Gemini 1.5 Flash. Get a risk score, plain-English insights, and a streaming AI summary.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Lucide React |
| Backend | Python, FastAPI, Motor (async MongoDB), sse-starlette |
| AI | Google Gemini 1.5 Flash |
| Database | MongoDB |
| File Parsing | pdfplumber, python-docx |

---

## Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB running locally (`mongodb://localhost:27017`) **or** a MongoDB Atlas URI
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini 1.5 Flash)

---

## 1 — Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit backend/.env and fill in your values:
#   GEMINI_API_KEY=your_key_here
#   MONGODB_URL=mongodb://localhost:27017
#   MONGODB_DB=legalease
#   ALLOWED_ORIGINS=http://localhost:3000

# Start the API server
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## 2 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

App available at: http://localhost:3000

---

## Environment Variables

### `backend/.env`
```
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=legalease
ALLOWED_ORIGINS=http://localhost:3000
```

### `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/analyze` | Analyze pasted contract text |
| `POST` | `/analyze/file` | Upload PDF or DOCX for analysis |
| `GET` | `/analyze/stream?id=` | SSE stream of AI summary |
| `GET` | `/history` | List all past analyses |
| `GET` | `/history/{id}` | Get single analysis |
| `DELETE` | `/history/{id}` | Delete an analysis |

---

## Project Structure

```
legaleasefinal/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── models.py            # Pydantic models
│   ├── requirements.txt
│   ├── .env
│   ├── routers/
│   │   ├── analyze.py       # /analyze endpoints + SSE
│   │   └── history.py       # /history CRUD
│   └── services/
│       ├── db.py            # Motor async MongoDB
│       ├── gemini.py        # Gemini AI integration
│       └── parser.py        # PDF/DOCX text extraction
└── frontend/
    ├── app/
    │   ├── layout.tsx        # Root layout + Toaster
    │   ├── page.tsx          # Dashboard (main page)
    │   ├── globals.css       # Design system + keyframes
    │   └── history/
    │       └── page.tsx      # History page
    ├── components/
    │   ├── Navbar.tsx
    │   ├── RiskGauge.tsx     # Animated SVG arc gauge
    │   ├── InsightCard.tsx   # Floating insight cards
    │   ├── SummaryPanel.tsx  # SSE streaming summary
    │   └── UploadZone.tsx    # Drag-and-drop file upload
    └── lib/
        └── api.ts            # Typed API client
```
