interface ATSScore {
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

function extractConcepts(text: string): string[] {
  const concepts = new Set<string>();
  
  const skills = text.match(/\b(python|javascript|typescript|java|kotlin|golang|rust|csharp|php|ruby|scala|swift|objective-c|r|matlab|sql|postgres|mongodb|redis|elasticsearch|aws|azure|gcp|docker|kubernetes|terraform|jenkins|github|gitlab|react|vue|angular|node|django|flask|fastapi|spring|express|rails|laravel|next|nuxt|graphql|rest|api|microservices|devops|ci\/cd|machine learning|deep learning|nlp|computer vision|reinforcement learning|tensorflow|pytorch|scikit-learn|pandas|numpy|spark|hadoop|kafka|flink|databricks)\b/gi);
  if (skills) skills.forEach(s => concepts.add(s.toLowerCase()));

  const roles = text.match(/\b(engineer|developer|architect|lead|senior|principal|manager|director|analyst|consultant|specialist|coordinator|administrator|technician)\b/gi);
  if (roles) roles.forEach(r => concepts.add(r.toLowerCase()));

  const domains = text.match(/\b(frontend|backend|full-stack|fullstack|mobile|web|desktop|cloud|infrastructure|platform|data|security|devops|qa|testing|analytics|business intelligence|crm|erp|saas|api|database|storage|networking|systems|scalability|performance|optimization|automation|integration|deployment|monitoring|observability)\b/gi);
  if (domains) domains.forEach(d => concepts.add(d.toLowerCase()));

  const verbs = text.match(/\b(built|developed|designed|architected|implemented|created|engineered|deployed|managed|led|mentored|optimized|improved|reduced|increased|automated|integrated|collaborated|coordinated|led|directed)\b/gi);
  if (verbs) verbs.forEach(v => concepts.add(v.toLowerCase()));

  return Array.from(concepts);
}

function calculateSemanticSimilarity(resumeText: string, jdText: string): number {
  const resumeConcepts = new Set(extractConcepts(resumeText));
  const jdConcepts = new Set(extractConcepts(jdText));

  const intersection = Array.from(resumeConcepts).filter(c => jdConcepts.has(c));

  const union = new Set([...resumeConcepts, ...jdConcepts]);

  const similarity = union.size > 0 ? (intersection.length / union.size) * 100 : 0;

  const techSkillsResume = extractConcepts(resumeText).filter(c => 
    /python|javascript|java|aws|react|node|sql|docker|kubernetes/.test(c)
  );
  const techSkillsJD = extractConcepts(jdText).filter(c => 
    /python|javascript|java|aws|react|node|sql|docker|kubernetes/.test(c)
  );
  
  const techOverlap = techSkillsResume.filter(s => techSkillsJD.includes(s)).length;
  const techBoost = Math.min(techOverlap * 5, 20);

  return Math.min(similarity + techBoost, 100);
}

function calculateKeywordCoverage(resumeText: string, jdText: string): {
  score: number;
  matched: string[];
  missing: string[];
} {
  const commonWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);
  
  const jdWords = jdText.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const jdKeywords = [...new Set(jdWords)]
    .filter(w => w.length > 3 && !commonWords.has(w));

  const resumeText_lower = resumeText.toLowerCase();
  const matched = jdKeywords.filter(keyword => resumeText_lower.includes(keyword));

  const score = jdKeywords.length > 0 ? (matched.length / jdKeywords.length) * 100 : 50;
  const missing = jdKeywords.filter(k => !matched.includes(k)).slice(0, 10);

  return {
    score: Math.min(score, 100),
    matched: matched.slice(0, 10),
    missing: missing.slice(0, 10)
  };
}

function calculateFormatReadiness(resumeText: string): number {
  let score = 0;

  const sections = {
    summary: /summary|professional|about|profile/i,
    experience: /experience|work history|employment/i,
    education: /education|degree|university|college/i,
    skills: /skills|technical|competencies/i,
    projects: /projects|portfolio|work|achievements/i
  };

  Object.values(sections).forEach(regex => {
    if (regex.test(resumeText)) score += 15;
  });

  if (/@/.test(resumeText)) score += 5; 
  if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText)) score += 5;

  const lines = resumeText.split('\n').length;
  if (lines >= 20 && lines <= 150) score += 10;

  const metrics = resumeText.match(/\d+%|decreased|improved|reduced|increased|optimized|accelerated|achieved/gi);
  if (metrics && metrics.length >= 3) score += 15;

  const words = resumeText.split(/\s+/).length;
  if (words >= 200 && words <= 1000) score += 10;

  if (/linkedin|github|portfolio|website/.test(resumeText)) score += 10;

  return Math.min(score, 100);
}

function calculateSkillsMatch(resumeText: string, jdText: string): {
  score: number;
  matchedSkills: string[];
} {
  const technicalSkills = [
    'python', 'javascript', 'typescript', 'java', 'kotlin', 'golang', 'rust', 'csharp',
    'sql', 'postgres', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
    'react', 'vue', 'angular', 'node', 'express', 'django', 'fastapi', 'flask',
    'graphql', 'rest api', 'microservices', 'ci/cd', 'jenkins', 'github', 'gitlab',
    'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch', 'scikit-learn'
  ];

  const resumeSkills = technicalSkills.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(resumeText)
  );

  const jdSkills = technicalSkills.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(jdText)
  );

  const matched = resumeSkills.filter(skill => jdSkills.includes(skill));
  const score = jdSkills.length > 0 ? (matched.length / jdSkills.length) * 100 : 50;

  return {
    score: Math.min(score, 100),
    matchedSkills: matched
  };
}

export function calculateATSScore(resumeText: string, jdText: string): ATSScore {
  const semanticScore = calculateSemanticSimilarity(resumeText, jdText);
  const keywordData = calculateKeywordCoverage(resumeText, jdText);
  const formatScore = calculateFormatReadiness(resumeText);
  const skillsData = calculateSkillsMatch(resumeText, jdText);

  const overallScore = Math.round(
    semanticScore * 0.25 +   
    keywordData.score * 0.35 +  
    formatScore * 0.20 +         
    skillsData.score * 0.20      
  );

  return {
    overallScore: Math.min(overallScore, 100),
    semanticSimilarity: Math.round(semanticScore),
    keywordCoverage: Math.round(keywordData.score),
    formatReadiness: Math.round(formatScore),
    skillsMatch: Math.round(skillsData.score),
    breakdown: {
      jdKeywords: keywordData.matched,
      matchedKeywords: keywordData.matched,
      missingKeywords: keywordData.missing
    }
  };
}

export function calculateResumeHealthScore(resumeText: string): {
  score: number;
  metrics: number;
  sections: number;
  formatting: number;
  content: number;
} {
  let sectionScore = 0;
  let metricsScore = 0;
  let contentScore = 0;

  const hasExperience = /experience|work/i.test(resumeText);
  const hasEducation = /education|degree|university/i.test(resumeText);
  const hasSkills = /skills|technical/i.test(resumeText);
  const hasSummary = /summary|professional|about/i.test(resumeText);

  sectionScore = [hasExperience, hasEducation, hasSkills, hasSummary]
    .filter(Boolean).length * 15;

  const metricCount = (resumeText.match(/\d+%|improved|reduced|optimized|achieved|accelerated/gi) || []).length;
  metricsScore = Math.min(metricCount * 3, 25);

  const lines = resumeText.split('\n').filter(l => l.trim()).length;
  const wordCount = resumeText.split(/\s+/).length;
  
  if (lines >= 20 && wordCount >= 200) contentScore += 15;
  if (metricCount >= 3) contentScore += 10;
  if (/https?:\/\/|linkedin|github|portfolio/i.test(resumeText)) contentScore += 10;

  const totalScore = Math.min(sectionScore + metricsScore + contentScore, 100);

  return {
    score: totalScore,
    metrics: metricsScore,
    sections: sectionScore,
    formatting: 20,
    content: contentScore
  };
}