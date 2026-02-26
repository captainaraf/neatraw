# NeatRaw 📊

**Share raw data. Create any view.**

NeatRaw is a powerful, privacy-first data sharing platform that allows you to upload raw spreadsheets (Excel, CSV) and share them as interactive "packets." Recipients can view, filter, sort, and visualize the data in their own way without affecting the original source. It even includes an AI-powered chat to ask questions directly to your data.

![NeatRaw Preview](/public/neatraw.png)

## ✨ Features

- **Instant Data Packets**: Drag & drop Excel/CSV files or paste data to create a sharing link in seconds.
- **Interactive Data Grid**: Powerful tables with multi-column sorting, filtering, and row-level editing.
- **One-Click Visualizations**: Generate Bar, Line, and Pie charts instantly from any dataset.
- **AI Data Analysis**: Chat with your spreadsheets using built-in AI (powered by Groq) to gain insights using natural language.
- **Secure Sharing**: 
  - Expiring public links (1 day, 7 days, etc.).
  - Private email invitations.
  - Granular control over "is_public" status.
- **Multi-Format Export**: Download your views as CSV, Excel, PNG, or PDF.
- **Privacy First**: Data is stored securely in Supabase with strict Row Level Security (RLS) policies.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine**: [Groq SDK](https://groq.com/) (Llama 3)
- **Charts**: [Recharts](https://recharts.org/)
- **Utility**: `lucide-react`, `papaparse`, `xlsx`, `html2canvas`, `jspdf`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account
- A Groq API key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/neatraw.git
cd neatraw
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Copy the `.env.example` file and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `GROQ_API_KEY` | Your Groq Cloud API Key |

### 4. Database Setup

NeatRaw uses Supabase for storage and authentication. 

1. Create a new project in [Supabase](https://supabase.com/).
2. Run the SQL provided in `supabase_schema.sql` in your Supabase SQL Editor to set up the tables and RLS policies.
3. Enable Email/Password authentication in the Supabase Auth settings.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Database Schema

The core logic resides in 4 main tables:
- `users`: Profile management.
- `data_packets`: Meta-information about the uploaded datasets.
- `data_rows`: The actual row-level data stored as JSONB.
- `data_packet_shares`: Management of sharing tokens and invitations.

See `supabase_schema.sql` for the full implementation details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
