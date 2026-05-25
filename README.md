# Resume OS

Resume OS is an automated ATS (Applicant Tracking System) optimization workflow built with Next.js. It takes a user's current resume (PDF or TXT) and a target Job Description (JD), then uses Google's Gemini LLM to strategically tailor the resume content for that specific role. Finally, it compiles a beautifully formatted, professional-grade LaTeX PDF on the fly.

## Features & Capabilities

* **Dynamic ATS Optimization:** Automatically rewrites your professional summary and experience bullet points to mirror the vocabulary, tone, and keywords of the target job description.
* **Strict "Zero Hallucination" Engine:** The prompt engineering enforces absolute factual accuracy. The AI is strictly instructed to *never* invent, assume, or fabricate skills, metrics, or experiences not found in the source text.
* **Smart Content Filtering:** Evaluates the candidate's projects and work history against the JD. It retains domain-relevant projects while stripping away completely irrelevant ones to maximize ATS keyword density and keep the resume concise.
* **Native PDF Parsing:** Extracts text directly from uploaded PDF resumes using `pdfjs-dist`.
* **JD Boilerplate Trimming:** Automatically sanitizes the pasted Job Description by stripping out generic HR fluff (e.g., "Equal Opportunity Employer", "Benefits", "What we offer") to save context window tokens and focus the AI on actual requirements.
* **Server-Side LaTeX Compilation:** Converts the AI-structured JSON response into a `.tex` file via Handlebars, and then natively compiles it into a polished PDF using `pdflatex`.
* **Smart Caching:** Avoids redundant LLM calls and LaTeX compilations by hashing the inputs; if the resume and JD haven't changed, it instantly displays the cached result.

## How It Works

1. **Upload & Input:** The user uploads a source resume and pastes a target job description in the frontend (`app/page.tsx`).
2. **Text Extraction & Sanitization:** The backend (`app/api/generate/route.ts`) extracts raw text from the PDF and trims unnecessary boilerplate from the JD.
3. **AI Processing:** Using the Vercel AI SDK and `gemini-3.1-flash-lite`, the system parses the resume against a strict Zod schema. It filters, rewrites, and optimizes the content based on the JD.
4. **Templating:** The structured JSON output is passed through Handlebars (`base_template.tex`), ensuring LaTeX special characters are properly escaped.
5. **Compilation:** The server spawns a child process to run `pdflatex`, generates the PDF in a temporary directory, returns the file buffer to the frontend, and automatically cleans up the temporary compilation files (`.aux`, `.log`, `.out`, etc.).
6. **Live Preview:** The resulting PDF is displayed in an interactive iframe directly in the browser.

## Tech Stack

* **Framework:** Next.js
* **Frontend:** React, Tailwind CSS 
* **AI / LLM:** Google `gemini-3.1-flash-lite` via `@ai-sdk/google`
* **Validation & Schema:** Zod
* **PDF Handling:** `pdfjs-dist` (extraction)
* **Templating:** Handlebars
* **Typesetting:** LaTeX (`pdflatex`)