'use client';
import { useState } from 'react';

interface ATSScores {
  overallScore: number;
  semanticSimilarity: number;
  keywordCoverage: number;
  formatReadiness: number;
  skillsMatch: number;
  breakdown: {
    jdKeywords: string[];
    matchedKeywords: string[];
    missingKeywords: string[];
  };
}

interface Analytics {
  atsScores: ATSScores;
  resumeHealth: {
    score: number;
    metrics: number;
    sections: number;
    formatting: number;
    content: number;
  };
  improvement: {
    beforeATS: number;
    afterATS: number;
    improvement: number;
  };
}

export default function ResumeBuilder() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [texData, setTexData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const logUserAction = async (action: string, details?: any) => {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details }),
      });
    } catch (e) {}
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        alert('Resume file exceeds 5MB limit. Please reduce file size and try again.');
        logUserAction('FILE_UPLOAD_REJECTED_SIZE', { fileName: file.name, fileSize: file.size });
        return;
      }
      
      setResumeFile(file);
      logUserAction('FILE_UPLOADED', { fileName: file.name, fileSize: file.size, type: file.type });
    }
  };

  const generateResume = async () => {
    if (!resumeFile || !jd) return;
    if (jd.trim().length < 100) {
      alert('Please provide a complete job description (at least 100 characters).');
      logUserAction('GENERATE_REJECTED_SHORT_JD', { jdLength: jd.length });
      return;
    }
    
    logUserAction('GENERATE_BUTTON_CLICKED', { jdLength: jd.length });

    const currentHash = `${resumeFile.name}-${jd.length}-${jd.substring(0, 20)}`;
    if (currentHash === lastHash && pdfUrl) {
      alert("Inputs haven't changed. Displaying cached result.");
      logUserAction('GENERATE_CACHED_RESULT');
      return;
    }

    setIsGenerating(true);
    setPdfUrl(null);
    setPdfBase64(null);
    setTexData(null);
    setAnalytics(null);
    setShowAnalytics(false);
    
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobDescription', jd);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Compilation failed");
      }

      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
      setPdfBase64(data.pdf);
      setTexData(data.tex);
      setLastHash(currentHash);
      
      if (data.analytics) {
        setAnalytics(data.analytics);
        setShowAnalytics(true);
      }
      
      logUserAction('GENERATE_SUCCESS');

    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || "Error compiling resume. Please try again.";
      logUserAction('GENERATE_FAILED', { error: errorMsg });
      if (errorMsg.includes('exceeds 5MB')) {
        alert('Resume file is too large. Maximum size is 5MB. Please reduce and try again.');
      } else if (errorMsg.includes('scan or image')) {
        alert('Resume must be a text-based PDF, not a scanned image. Please use a text-based PDF.');
      } else if (errorMsg.includes('Corrupted')) {
        alert('Resume file appears to be corrupted. Please try a different file.');
      } else if (errorMsg.includes('Job description')) {
        alert('Please provide a complete job description (at least 100 characters).');
      } else if (errorMsg.includes('suspicious')) {
        alert('Job description validation failed. Please provide a legitimate job description.');
      } else if (errorMsg.includes('Missing inputs')) {
        alert('Please upload a resume and provide a job description.');
      } else {
        alert(errorMsg);
      }
    }
    setIsGenerating(false);
  };

  const downloadTex = () => {
    if (!texData) return;
    logUserAction('DOWNLOAD_TEX_CLICKED');
    const blob = new Blob([texData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailored_resume.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    if (!pdfBase64) return;
    logUserAction('DOWNLOAD_PDF_CLICKED');
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailored_resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-900/20';
    if (score >= 60) return 'bg-yellow-900/20';
    return 'bg-orange-900/20';
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[100dvh] h-[100dvh] w-full bg-zinc-950 text-zinc-300 font-sans selection:bg-white selection:text-black overflow-hidden">
      <div className={`w-full lg:w-1/2 flex-col p-6 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-y-auto shrink-0 h-full ${pdfUrl ? 'hidden lg:flex' : 'flex'}`}>
        
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">Resume OS</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2">Dynamic ATS optimization with AI-powered analysis.</p>
        </div>
        
        <div className="space-y-6 sm:space-y-8 flex-grow">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Source Document
            </label>
            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf,application/pdf,.txt,text/plain"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full p-4 border border-zinc-800 rounded-md bg-zinc-900/50 flex items-center justify-between group-hover:border-zinc-600 transition-colors ${resumeFile ? 'border-white/30 text-white' : ''}`}>
                <span className="text-sm truncate pr-2">
                  {resumeFile ? resumeFile.name : 'Upload current resume (PDF/TXT)'}
                </span>
                <span className="text-xs border border-zinc-700 px-2 py-1 rounded bg-zinc-900 shrink-0">Browse</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600">Maximum file size: 5MB</p>
          </div>

          <div className="space-y-3 flex flex-col flex-grow">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Target Job Description
            </label>
            <textarea 
              className="w-full min-h-[250px] lg:flex-grow p-4 bg-zinc-900/50 border border-zinc-800 rounded-md text-sm font-mono text-zinc-300 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all resize-none"
              placeholder="Paste the target JD here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <p className="text-xs text-zinc-600">Minimum {jd.length < 100 ? `${100 - jd.length} more` : ''} characters {jd.length >= 100 ? '✓' : ''}</p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <button 
            onClick={generateResume}
            disabled={isGenerating || !resumeFile || !jd || jd.trim().length < 100}
            className="w-full py-4 px-6 bg-white text-zinc-950 text-sm font-semibold rounded-md hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Analyzing & Compiling...
              </>
            ) : 'Generate Tailored Resume'}
          </button>
        </div>
      </div>

      <div className={`w-full lg:w-1/2 bg-[#0A0A0A] flex-col items-center justify-center p-6 sm:p-8 shrink-0 h-full overflow-y-auto ${pdfUrl ? 'flex' : 'hidden lg:flex'}`}>
        
        {pdfUrl ? (
          <>
            <div className="hidden lg:flex flex-col w-full h-full max-h-full">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <span className="text-sm font-medium text-zinc-400">ATS Analysis Complete</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {analytics && (
                    <button 
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 border border-blue-700 rounded hover:bg-blue-800 transition-colors"
                    >
                      {showAnalytics ? 'Hide' : 'Show'} Analysis
                    </button>
                  )}
                  <button onClick={downloadPdf} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors">
                    Get PDF
                  </button>
                  <button onClick={downloadTex} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-white rounded hover:bg-zinc-200 transition-colors">
                    Get .tex
                  </button>
                </div>
              </div>

              {showAnalytics && analytics ? (
                <div className="w-full flex-grow rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 p-4 mb-4 overflow-y-auto max-h-96">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3">ATS Score Analysis</h3>
                      
                      <div className={`${getScoreBgColor(analytics.atsScores.overallScore)} rounded-lg p-4 mb-4 border border-zinc-700`}>
                        <p className="text-xs text-zinc-400 mb-2">Overall ATS Score</p>
                        <p className={`text-4xl font-bold ${getScoreColor(analytics.atsScores.overallScore)}`}>
                          {analytics.atsScores.overallScore}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-zinc-800 rounded p-3">
                          <p className="text-xs text-zinc-400 mb-1">Keyword Coverage</p>
                          <p className={`text-2xl font-bold ${getScoreColor(analytics.atsScores.keywordCoverage)}`}>
                            {analytics.atsScores.keywordCoverage}%
                          </p>
                          <p className="text-xs text-zinc-500">JD keywords matched</p>
                        </div>

                        <div className="bg-zinc-800 rounded p-3">
                          <p className="text-xs text-zinc-400 mb-1">Format Readiness</p>
                          <p className={`text-2xl font-bold ${getScoreColor(analytics.atsScores.formatReadiness)}`}>
                            {analytics.atsScores.formatReadiness}%
                          </p>
                          <p className="text-xs text-zinc-500">ATS parseability</p>
                        </div>

                        <div className="bg-zinc-800 rounded p-3">
                          <p className="text-xs text-zinc-400 mb-1">Semantic Match</p>
                          <p className={`text-2xl font-bold ${getScoreColor(analytics.atsScores.semanticSimilarity)}`}>
                            {analytics.atsScores.semanticSimilarity}%
                          </p>
                          <p className="text-xs text-zinc-500">Concept alignment</p>
                        </div>

                        <div className="bg-zinc-800 rounded p-3">
                          <p className="text-xs text-zinc-400 mb-1">Skills Match</p>
                          <p className={`text-2xl font-bold ${getScoreColor(analytics.atsScores.skillsMatch)}`}>
                            {analytics.atsScores.skillsMatch}%
                          </p>
                          <p className="text-xs text-zinc-500">Technical overlap</p>
                        </div>
                      </div>

                      <div className="bg-green-900/20 border border-green-700 rounded p-3 mb-4">
                        <p className="text-xs font-semibold text-green-200 mb-2">ATS Improvement</p>
                        <div className="flex justify-between text-xs">
                          <div>
                            <p className="text-zinc-400">Baseline</p>
                            <p className="font-bold text-white">{analytics.improvement.beforeATS}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-green-400 font-bold">+{analytics.improvement.improvement}</p>
                          </div>
                          <div>
                            <p className="text-zinc-400">Optimized</p>
                            <p className="font-bold text-green-400">{analytics.improvement.afterATS}</p>
                          </div>
                        </div>
                      </div>

                      {analytics.atsScores.breakdown.matchedKeywords.length > 0 && (
                        <div className="bg-zinc-800 rounded p-3 border border-zinc-700">
                          <p className="text-xs font-semibold text-white mb-2">Matched Keywords ({analytics.atsScores.breakdown.matchedKeywords.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {analytics.atsScores.breakdown.matchedKeywords.slice(0, 8).map((kw, idx) => (
                              <span key={idx} className="text-xs bg-green-900/40 text-green-300 px-2 py-1 rounded">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {analytics.atsScores.breakdown.missingKeywords.length > 0 && (
                        <div className="bg-zinc-800 rounded p-3 border border-zinc-700 mt-3">
                          <p className="text-xs font-semibold text-white mb-2">Missing Keywords ({analytics.atsScores.breakdown.missingKeywords.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {analytics.atsScores.breakdown.missingKeywords.slice(0, 5).map((kw, idx) => (
                              <span key={idx} className="text-xs bg-orange-900/40 text-orange-300 px-2 py-1 rounded">
                                {kw}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-zinc-400 mt-2">Consider adding these terms if relevant to your background</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="relative w-full flex-grow rounded-md overflow-hidden bg-white border border-zinc-800">
                <iframe src={pdfUrl} className="absolute inset-0 w-full h-full" title="Resume Preview"/>
              </div>
            </div>

            <div className="flex lg:hidden flex-col items-center justify-center w-full h-full space-y-6">
              <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-2">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Resume Ready!</h2>
                <p className="text-sm text-zinc-400 max-w-[250px] mx-auto">
                  Your ATS-optimized resume has been analyzed and compiled.
                </p>
              </div>

              {analytics && (
                <div className="w-full max-w-sm bg-zinc-900 rounded-lg p-4 border border-zinc-800 mb-4">
                  <p className="text-xs font-semibold text-white mb-3">ATS Score</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-zinc-400">Overall</p>
                      <p className={`text-2xl font-bold ${getScoreColor(analytics.atsScores.overallScore)}`}>
                        {analytics.atsScores.overallScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Improvement</p>
                      <p className="text-2xl font-bold text-green-400">
                        +{analytics.improvement.improvement}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full flex flex-col gap-3 mt-8 max-w-sm">
                <button onClick={downloadPdf} className="w-full py-4 bg-white text-black font-semibold rounded-md shadow-sm hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Download PDF
                </button>
                <button onClick={downloadTex} className="w-full py-4 bg-zinc-900 border border-zinc-800 text-white font-semibold rounded-md hover:bg-zinc-800 transition-colors flex justify-center items-center gap-2">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                  Download Source (.tex)
                </button>
              </div>

              <button onClick={() => setPdfUrl(null)} className="mt-8 text-sm text-zinc-500 hover:text-white transition-colors underline underline-offset-4">
                Start a new optimization
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-700">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <p className="text-sm font-medium">Upload your resume to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}