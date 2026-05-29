# Resume OS: ATS-Optimized Resume Builder

Resume OS is an automated ATS (Applicant Tracking System) optimization workflow built with Next.js. It takes a user's current resume and a target Job Description (JD), uses Google's Gemini LLM to strategically tailor the resume content, and compiles a beautifully formatted, professional-grade LaTeX PDF on the fly. 

## Features & Capabilities

* **Advanced Resume Analytics & Health Checks:** Generates a comprehensive dashboard post-compilation. It calculates an ATS Keyword Match score, detects technical skills, counts quantifiable achievements, and provides actionable warnings (e.g., missing summary, lacking metrics).
* **A/B Test Insights:** Provides transparency into the AI's decision-making process by displaying a summary of changes, explicitly showing whether a bullet point was rewritten for ATS keyword alignment or to highlight a quantifiable metric.
* **Dynamic ATS Optimization:** Automatically reorganizes sections, filters irrelevant projects, and rewrites your professional summary and experience bullet points to mirror the vocabulary and tone of the target JD.
* **Strict "Zero Hallucination" Engine:** The prompt engineering enforces absolute factual accuracy. The AI is strictly instructed to *never* invent or fabricate skills or experiences. It relies heavily on a custom Regex engine (`METRIC_REGEX`) to ensure exact numbers and percentages are preserved without generalization.
* **Enterprise-Grade Security & Validation:** Includes active malicious prompt detection (Anti-Jailbreak) to prevent users from overriding the "Zero Hallucination" rule via the Job Description input. It also features strict file validation, catching corrupted PDFs, scanned images, and enforcing a 5MB size limit.
* **Action Logging & Telemetry:** Built-in logging API (`/api/log`) to track system health, user events, and generation failure rates for continuous platform improvement.
* **Multi-Format Export:** Instantly preview the generated PDF in the browser, with one-click downloads for both the finalized PDF and the raw LaTeX (`.tex`) source code.

## How It Works

1. **Upload & Input:** The user uploads a source resume (PDF or TXT, max 5MB) and pastes a target job description (minimum 100 characters) in the frontend.
2. **Validation & Extraction:** The backend (`app/api/generate/route.ts`) validates the JD, extracts raw text from the PDF using `pdfjs-dist`, and checks for corrupted or image-only scans. Generic HR boilerplate is stripped from the JD.
3. **Baseline Health Check:** Before AI processing, the system parses the raw text to calculate a baseline health score, extracting existing metrics, skills, and identifying structural weaknesses.
4. **AI Processing:** Using the Vercel AI SDK and `gemini-3.1-flash-lite`, the system parses the resume against a strict Zod schema. It filters, rewrites, and optimizes the content based on the JD while strictly preserving historical metrics.
5. **Quality Comparison:** The system compares the AI's output against the original resume, calculating the improvement in ATS keyword matching and metric density to generate the A/B testing data.
6. **Templating & Compilation:** The structured JSON output is sanitized (removing emojis/unsupported unicode) and passed through Handlebars to a `.tex` template. The server spawns a child process to run `pdflatex`, generates the PDF, and returns a Base64-encoded PDF along with the analytics payload.
7. **Interactive Dashboard:** The frontend renders the PDF preview alongside the interactive Analytics Dashboard.

## Tech Stack

* **Framework:** Next.js
* **Frontend:** React, Tailwind CSS 
* **AI / LLM:** Google `gemini-3.1-flash-lite` via `@ai-sdk/google`
* **Validation & Schema:** Zod
* **PDF Handling:** `pdfjs-dist` (extraction)
* **Templating:** Handlebars
* **Typesetting:** LaTeX (`pdflatex`)