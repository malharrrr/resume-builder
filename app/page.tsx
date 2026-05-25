'use client';
import { useState } from 'react';

export default function ResumeBuilder() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const generateResume = async () => {
    if (!resumeFile || !jd) return;
    setIsGenerating(true);
    setPdfUrl(null);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobDescription', jd);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error("Compilation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error(err);
      alert("Error compiling resume. Check the job description for unusual characters.");
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-300 font-sans selection:bg-white selection:text-black">
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 border-r border-zinc-800 overflow-y-auto">
        
        <div className="mb-10">
          <h1 className="text-3xl font-medium text-white tracking-tight">Resume OS</h1>
          <p className="text-sm text-zinc-500 mt-2">Dynamic ATS optimization workflow.</p>
        </div>
        
        <div className="space-y-8 flex-grow">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Source Document
            </label>
            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full p-4 border border-zinc-800 rounded-md bg-zinc-900/50 flex items-center justify-between group-hover:border-zinc-600 transition-colors ${resumeFile ? 'border-white/30 text-white' : ''}`}>
                <span className="text-sm truncate">
                  {resumeFile ? resumeFile.name : 'Upload current resume (PDF/TXT)'}
                </span>
                <span className="text-xs border border-zinc-700 px-2 py-1 rounded bg-zinc-900">Browse</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 flex flex-col flex-grow">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Target Job Description
            </label>
            <textarea 
              className="flex-grow w-full min-h-[300px] p-4 bg-zinc-900/50 border border-zinc-800 rounded-md text-sm font-mono text-zinc-300 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all resize-none"
              placeholder="Paste the JD here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={generateResume}
            disabled={isGenerating || !resumeFile || !jd}
            className="w-full py-4 px-6 bg-white text-zinc-950 text-sm font-semibold rounded-md hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Compiling...
              </>
            ) : 'Generate Tailored Resume'}
          </button>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-[#0A0A0A] items-center justify-center p-8">
        {pdfUrl ? (
          <iframe 
            src={pdfUrl} 
            className="w-full h-full rounded-md shadow-2xl bg-white border border-zinc-800" 
            title="Resume Preview"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-700">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <p className="text-sm font-medium">Output will be rendered here</p>
          </div>
        )}
      </div>
    </div>
  );
}