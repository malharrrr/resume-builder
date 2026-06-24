export interface ATSScore {
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

const SKILL_ALIASES: Record<string, string[]> = {
  'react': ['react.js', 'reactjs', 'react js'],
  'node': ['node.js', 'nodejs', 'node js'],
  'typescript': ['ts'],
  'javascript': ['js'],
  'python': ['py'],
  'golang': ['go lang', 'go programming', 'go'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo'],
  'kubernetes': ['k8s'],
  'elasticsearch': ['elastic search', 'opensearch'],
  'cicd': ['ci/cd', 'ci cd', 'continuous integration', 'continuous deployment'],
  'graphql': ['graph ql'],
  'nextjs': ['next.js', 'next js'],
  'fastapi': ['fast api'],
  'langchain': ['lang chain'],
  'langgraph': ['lang graph'],
  'tensorflow': ['tensor flow'],
  'pytorch': ['torch'],
  'scikit': ['sklearn', 'scikit-learn', 'scikit learn'],
  'dynamodb': ['dynamo db', 'dynamo'],
  'gcp': ['google cloud', 'google cloud platform'],
  'aws': ['amazon web services', 'amazon aws'],
  'azure': ['microsoft azure'],
  'restapi': ['rest api', 'rest apis', 'restful', 'rest'],
  'microservices': ['micro services', 'micro-services'],
};

const ALIAS_TO_CANONICAL: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_TO_CANONICAL[alias] = canonical;
  }
}

function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().trim();
  return ALIAS_TO_CANONICAL[lower] ?? lower;
}

const STOP_WORDS = new Set([
  'the','and','for','with','that','this','from','are','you','all','can',
  'her','was','one','our','out','day','get','has','him','his','how','its',
  'may','new','now','old','see','two','way','who','boy','did','let','put',
  'say','she','too','use','will','have','been','they','them','their','what',
  'when','your','than','but','not','also','into','more','over','such','some',
  'each','work','well','just','like','make','must','need','only','than','then',
  'very','would','about','after','other','which','these','those','there',
  'role','ability','strong','plus','years','experience','hands','fundamentals',
  'packages','contributions','conferences','proficiency','familiarity','ability',
  'monitor','hardware','targets','knowledge','series','tech','stack','senior',
  'junior','mid','lead','engineer','engineering','developer','development',
  'building','products','delivery','frameworks','architect','build','maintain',
  'design','write','implement','integrate','deploy','contribute','publish',
  'servers','services','sources','tooling','research','publications','patterns',
  'using','based','driven','open','source','event','models','embedding',
  'contribute','chunking','ranking','harnesses','measuring','rates','output',
  'quality','workloads','modules','systems',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\/\+\#\.]/g, ' ')
    .split(/\s+/)
    .map(t => t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function extractNgrams(text: string, maxN = 3): string[] {
  const words = tokenize(text);
  const ngrams: string[] = [...words];

  for (let n = 2; n <= maxN; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
  }
  return ngrams;
}

function computeTermFrequency(terms: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of terms) {
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return freq;
}

function tfidfWeight(count: number, totalTerms: number): number {
  const tf = count / totalTerms;
  return 1 + Math.log(1 + tf * 100);
}

function calculateKeywordCoverage(resumeText: string, jdText: string): {
  score: number;
  matched: string[];
  missing: string[];
  allJdKeywords: string[];
} {
  const jdNgrams = extractNgrams(jdText);
  const jdFreq  = computeTermFrequency(jdNgrams);
  const jdUnigrams: string[] = [];
  const jdPhrases:  string[] = [];

  for (const [term] of jdFreq) {
    if (term.length <= 2 || STOP_WORDS.has(term)) continue;
    if (term.includes(' ')) {
      jdPhrases.push(term);
    } else {
      jdUnigrams.push(term);
    }
  }

  const totalJdNgramCount = jdNgrams.length;

  const resumeNgrams = new Set(extractNgrams(resumeText).map(normalizeSkill));

  let uniTotalW = 0, uniMatchedW = 0;
  const matchedTerms: string[] = [];
  const missingTerms: string[] = [];

  for (const term of jdUnigrams) {
    const normalized = normalizeSkill(term);
    const w = tfidfWeight(jdFreq.get(term) ?? 1, totalJdNgramCount);
    uniTotalW += w;

    if (resumeNgrams.has(normalized)) {
      uniMatchedW += w;
      matchedTerms.push(term);
    } else {
      missingTerms.push(term);
    }
  }

  const uniScore = uniTotalW > 0 ? (uniMatchedW / uniTotalW) * 100 : 50;

  let phTotalW = 0, phMatchedW = 0;
  const matchedPhrases: string[] = [];
  const missingPhrases: string[] = [];

  for (const phrase of jdPhrases) {
    const normalized = normalizeSkill(phrase);
    const w = tfidfWeight(jdFreq.get(phrase) ?? 1, totalJdNgramCount);
    phTotalW += w;

    if (resumeNgrams.has(normalized)) {
      phMatchedW += w;
      matchedPhrases.push(phrase);
    } else {
      missingPhrases.push(phrase);
    }
  }

  const phraseScore = phTotalW > 0 ? (phMatchedW / phTotalW) * 100 : 50;
  const phraseBonus = Math.min(
    (phMatchedW / Math.max(phTotalW, 1)) * 15,
    15
  );
  const blendedScore = Math.min(uniScore + phraseBonus, 100);

  const allMissing = [...missingTerms, ...missingPhrases]
    .sort((a, b) => (jdFreq.get(b) ?? 0) - (jdFreq.get(a) ?? 0));

  const allMatched = [...matchedTerms, ...matchedPhrases]
    .filter(t => t.length > 3 || t.includes(' '));

  const allJdKeywords = [...jdUnigrams, ...jdPhrases]
    .filter(t => t.length > 3 || t.includes(' '));

  return {
    score: Math.min(Math.round(blendedScore), 100),
    matched: allMatched.slice(0, 20),
    missing: allMissing.slice(0, 10),
    allJdKeywords: allJdKeywords.slice(0, 40),
  };
}

const KNOWN_SKILL_PATTERNS = [
  // Languages
  /\b(python|javascript|typescript|java|golang|go|rust|c\+\+|csharp|ruby|scala|swift|kotlin|php|bash|r\b|matlab|solidity)\b/gi,
  // Frameworks & libraries
  /\b(react|vue|angular|svelte|next\.?js|nuxt|express|fastapi|flask|django|rails|spring|laravel|nest\.?js|fiber|gin|echo)\b/gi,
  // AI/ML
  /\b(langchain|langgraph|llamaindex|openai|anthropic|gemini|hugging\s*face|tensorflow|pytorch|keras|scikit[\s-]learn|pandas|numpy|transformers|rag|llm|embedding|vector|pinecone|weaviate|qdrant|chroma|faiss|mcp|mastra)\b/gi,
  // Databases
  /\b(postgresql|postgres|mysql|mongodb|redis|elasticsearch|cassandra|dynamodb|sqlite|cockroachdb|supabase|firebase|timescaledb|neo4j|planetscale|neon|prisma|drizzle|sqlalchemy)\b/gi,
  // Cloud & infra
  /\b(aws|azure|gcp|docker|kubernetes|k8s|terraform|ansible|pulumi|jenkins|github\s*actions|gitlab\s*ci|ci\/cd|nginx|linux|vercel|render|railway|fly\.io)\b/gi,
  // Protocols & patterns
  /\b(rest(?:ful)?|graphql|grpc|websocket|protobuf|kafka|rabbitmq|celery|microservices|event[\s-]driven|serverless)\b/gi,
  // Frontend tooling
  /\b(tailwind|tailwindcss|shadcn|radix|chakra|mui|styled[\s-]components|webpack|vite|esbuild|bun)\b/gi,
];

function extractSkillsFromText(text: string): Set<string> {
  const skills = new Set<string>();
  for (const pattern of KNOWN_SKILL_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
    for (const m of matches) {
      skills.add(normalizeSkill(m[0]));
    }
  }
  return skills;
}

function calculateSkillsMatch(resumeText: string, jdText: string): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const jdSkills = extractSkillsFromText(jdText);
  const resumeSkills = extractSkillsFromText(resumeText);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of jdSkills) {
    if (resumeSkills.has(skill)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const score = jdSkills.size > 0
    ? (matched.length / jdSkills.size) * 100
    : 50;

  return {
    score: Math.min(score, 100),
    matchedSkills: matched,
    missingSkills: missing.slice(0, 8),
  };
}

function calculateSemanticSimilarity(resumeText: string, jdText: string): number {
  const resumeTerms = new Set(extractNgrams(resumeText, 2).map(normalizeSkill));
  const jdTerms = new Set(extractNgrams(jdText, 2).map(normalizeSkill));

  const intersection = [...resumeTerms].filter(t => jdTerms.has(t));
  const union = new Set([...resumeTerms, ...jdTerms]);

  const jaccard = union.size > 0 ? (intersection.length / union.size) * 100 : 0;
  const jdSkills = extractSkillsFromText(jdText);
  const resumeSkills = extractSkillsFromText(resumeText);
  const sharedSkills = [...jdSkills].filter(s => resumeSkills.has(s));
  const domainBoost = Math.min(sharedSkills.length * 3, 25);

  return Math.min(jaccard + domainBoost, 100);
}

function calculateFormatReadiness(resumeText: string): number {
  let score = 0;

  if (/@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText)) score += 5;     
  if (/(\+?\d[\d\s\-().]{7,}\d)/.test(resumeText)) score += 5;
  if (/linkedin\.com\/in\//i.test(resumeText)) score += 5; 

  const sectionPatterns = [
    /^[\s]*professional experience[\s]*$/im,
    /^[\s]*experience[\s]*$/im,
    /^[\s]*work experience[\s]*$/im,
    /^[\s]*education[\s]*$/im,
    /^[\s]*academic background[\s]*$/im,
    /^[\s]*skills[\s]*$/im,
    /^[\s]*technical skills[\s]*$/im,
    /^[\s]*projects[\s]*$/im,
    /^[\s]*personal projects[\s]*$/im,
  ];
  const groups = [
    sectionPatterns.slice(0, 3),
    sectionPatterns.slice(3, 5),
    sectionPatterns.slice(5, 7),
    sectionPatterns.slice(7),
  ];
  for (const group of groups) {
    if (group.some(p => p.test(resumeText))) score += 5;
  }

  const datePatterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}/i,
    /\b\d{2}\/\d{4}\b/,
    /\b(20\d{2})\s*[-–—]\s*(20\d{2}|present|current)/i,
  ];
  if (datePatterns.some(p => p.test(resumeText))) score += 10;

  const metricMatches = resumeText.match(
    /\b(\d+[\+%x]|\d+\s*(percent|times|users|downloads|ms|seconds|hours|days|weeks))\b/gi
  );
  if (metricMatches && metricMatches.length >= 2) score += 8;
  if (metricMatches && metricMatches.length >= 5) score += 7;

  const actionVerbPattern = /(?:^|[\-–—•*])\s*(built|developed|designed|architected|implemented|created|engineered|deployed|managed|led|mentored|optimized|improved|reduced|increased|automated|integrated|launched|shipped|delivered|scaled|migrated)\b/im;
  if (actionVerbPattern.test(resumeText)) score += 10;

  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 200 && wordCount <= 800) score += 10;

  if (/github\.com|portfolio|vercel\.app|netlify\.app/i.test(resumeText)) score += 5;
  if (/^(summary|profile|about|objective|professional summary)/im.test(resumeText)) score += 5;

  return Math.min(score, 100);
}

export function calculateATSScore(resumeText: string, jdText: string): ATSScore {
  const keywordData = calculateKeywordCoverage(resumeText, jdText);
  const skillsData = calculateSkillsMatch(resumeText, jdText);
  const semanticScore = calculateSemanticSimilarity(resumeText, jdText);
  const formatScore = calculateFormatReadiness(resumeText);

  const overallScore = Math.round(
    keywordData.score  * 0.35 +
    skillsData.score   * 0.30 +
    semanticScore      * 0.20 +
    formatScore        * 0.15
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
      missingKeywords: keywordData.missing,
    },
  };
}

export function calculateResumeHealthScore(resumeText: string): {
  score: number;
  metrics: number;
  sections: number;
  formatting: number;
  content: number;
} {
  const hasExperience = /^(experience|professional experience|work experience)/im.test(resumeText);
  const hasEducation  = /^(education|academic)/im.test(resumeText);
  const hasSkills     = /^(skills|technical skills)/im.test(resumeText);
  const hasSummary    = /^(summary|profile|about|objective)/im.test(resumeText);
  const hasProjects   = /^(projects|personal projects)/im.test(resumeText);

  const sectionScore = [hasExperience, hasEducation, hasSkills, hasSummary, hasProjects]
    .filter(Boolean).length * 12;

  const metricMatches = resumeText.match(
    /\b(\d+[\+%x]|\d+\s*(percent|times|users|downloads|ms|seconds))\b/gi
  ) || [];
  const metricsScore = Math.min(metricMatches.length * 4, 25);

  let contentScore = 0;
  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 200) contentScore += 8;
  if (metricMatches.length >= 3) contentScore += 7;
  if (/github\.com|portfolio|vercel\.app/i.test(resumeText)) contentScore += 5;
  if (/linkedin\.com\/in\//i.test(resumeText)) contentScore += 5;

  const totalScore = Math.min(sectionScore + metricsScore + contentScore, 100);

  return {
    score: totalScore,
    metrics: metricsScore,
    sections: Math.min(sectionScore, 60),
    formatting: 20,
    content: contentScore,
  };
}