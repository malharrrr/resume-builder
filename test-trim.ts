function trimJD(jd: string): string {
  const CHAR_LIMIT = 4000;

  const boilerplateMarkers = [
    "equal opportunity",
    "eeo statement",
    "benefits",
    "what we offer",
    "perks and benefits",
    "about us",
    "who we are",
    "our story",
    "compensation",
    "salary range",
    "401k",
    "health insurance",
    "dental",
    "vision",
    "pto",
    "paid time off",
    "remote work policy",
    "diversity",
    "inclusion",
  ];

  let trimmed = jd;
  const lower = trimmed.toLowerCase();

  let cutAt = trimmed.length;
  for (const marker of boilerplateMarkers) {
    const idx = lower.indexOf(marker);
    if (idx > 200 && idx < cutAt) {
      const lineStart = trimmed.lastIndexOf("\n", idx);
      cutAt = lineStart > 0 ? lineStart : idx;
    }
  }
  trimmed = trimmed.substring(0, cutAt);

  trimmed = trimmed
    .split('\n')
    .map(line => line.trim())
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
    .trim();

  if (trimmed.length > CHAR_LIMIT) {
    const slice = trimmed.substring(0, CHAR_LIMIT);
    const lastSentenceEnd = Math.max(
      slice.lastIndexOf('. '),
      slice.lastIndexOf('.\n'),
      slice.lastIndexOf('! '),
      slice.lastIndexOf('? '),
    );
    trimmed = lastSentenceEnd > CHAR_LIMIT * 0.5
      ? trimmed.substring(0, lastSentenceEnd + 1).trim()
      : slice.trim();
  }

  return trimmed;
}

// ─── Test Helpers ────────────────────────────────────────────────────────────

const DIVIDER = '─'.repeat(80);
const SECTION = '═'.repeat(80);

function printResult(label: string, input: string, output: string) {
  console.log(`\n${SECTION}`);
  console.log(`TEST: ${label}`);
  console.log(DIVIDER);
  console.log(`INPUT LENGTH  : ${input.length} chars`);
  console.log(`OUTPUT LENGTH : ${output.length} chars`);
  console.log(`CHARS REMOVED : ${input.length - output.length}`);
  console.log(DIVIDER);
  console.log('WHAT GETS SENT TO API:');
  console.log(DIVIDER);
  console.log(output);
  console.log(SECTION);
}

// 1. Clean JD with no boilerplate — should pass through unchanged
const cleanJD = `
Senior Backend Engineer

We are looking for a Senior Backend Engineer to join our platform team.

Responsibilities:
- Design and build scalable microservices using Python and FastAPI
- Own the full lifecycle of backend services from design to deployment
- Write clean, well-tested code with 80%+ test coverage
- Collaborate with frontend engineers and product managers
- Optimize database queries and improve system performance
- Participate in on-call rotations

Requirements:
- 4+ years of backend engineering experience
- Strong proficiency in Python or Go
- Experience with PostgreSQL, Redis, and message queues (Kafka or RabbitMQ)
- Familiarity with Docker and Kubernetes
- Experience with AWS or GCP
- Strong understanding of REST API design principles

Nice to Have:
- Experience with gRPC
- Contributions to open source projects
- Prior startup experience
`.trim();

printResult('1. Clean JD (no boilerplate)', cleanJD, trimJD(cleanJD));

// 2. JD with benefits/about us section appended — should cut cleanly
const jdWithBoilerplate = `
Software Engineer - Full Stack

You will be working on our core product, building features end to end.

What You'll Do:
- Build and maintain React frontend components
- Develop Node.js APIs and integrations
- Write unit and integration tests
- Review pull requests and mentor junior engineers

What We're Looking For:
- 3+ years of full-stack experience
- Proficient in React, TypeScript, and Node.js
- Experience with PostgreSQL and MongoDB
- Familiarity with CI/CD pipelines

About Us
We are a fast-growing startup based in San Francisco, founded in 2019. Our mission is to make software development more accessible to everyone. We have raised $50M in Series B funding and are backed by top-tier investors.

Benefits
- Competitive salary ($150k - $200k)
- Health insurance, dental, and vision
- 401k with 4% match
- Unlimited PTO
- Remote work policy: fully remote
- $1,000 home office stipend
- Annual team retreat

Equal Opportunity
We are an equal opportunity employer and value diversity at our company.
`.trim();

printResult('2. JD with boilerplate sections', jdWithBoilerplate, trimJD(jdWithBoilerplate));

// 3. JD that mentions "benefits" early in requirements — 200-char buffer should protect it
const jdWithEarlyBenefitsMention = `
Product Manager - Growth

We are hiring a Product Manager who understands the full benefits of data-driven decision making.

Responsibilities:
- Define product roadmap and prioritize features based on customer impact
- Work closely with engineering to scope and deliver features
- Analyze product metrics and run A/B tests
- Conduct user research and synthesize findings into requirements

Requirements:
- 3+ years of product management experience
- Strong analytical skills and experience with SQL
- Experience working in agile environments
- Excellent communication and stakeholder management skills
- Experience with tools like Amplitude, Mixpanel, or similar

Benefits and Compensation
- Salary: $130k - $160k
- Full benefits package
- Equity

About Us
We are a product-led growth company with 200+ enterprise customers.
`.trim();

printResult('3. JD with early "benefits" mention in requirements (buffer test)', jdWithEarlyBenefitsMention, trimJD(jdWithEarlyBenefitsMention));

// 4. Very long JD that exceeds 4000 chars — should cut at sentence boundary
const longJDBase = `
Staff Software Engineer - Infrastructure

We are looking for a Staff Software Engineer to join our Infrastructure team. You will be responsible for building and maintaining the systems that power our platform at scale.

Responsibilities:
- Lead the design and implementation of distributed systems that handle millions of requests per day.
- Drive technical strategy for infrastructure across the engineering org.
- Build internal developer tooling to improve engineering velocity.
- Define SLOs and SLAs for critical infrastructure components.
- Mentor senior engineers and conduct technical interviews.
- Partner with security to ensure compliance with SOC2 and ISO27001 standards.
- Own the incident response process and drive post-mortems.
- Collaborate with platform teams to define APIs and service contracts.
- Evaluate and adopt new technologies to improve reliability and performance.
- Write thorough technical documentation and architecture decision records.

Requirements:
- 8+ years of software engineering experience.
- 3+ years of experience with infrastructure or platform engineering.
- Deep expertise in distributed systems design (consensus algorithms, eventual consistency, CAP theorem).
- Strong proficiency in Go or Rust.
- Extensive experience with Kubernetes, Terraform, and cloud platforms (AWS preferred).
- Experience with observability stacks: Prometheus, Grafana, OpenTelemetry.
- Strong understanding of networking fundamentals (TCP/IP, DNS, load balancing, TLS).
- Experience with service mesh technologies (Istio, Linkerd).
- Track record of leading large technical projects with cross-functional stakeholders.
- Excellent written and verbal communication skills.

Nice to Have:
- Experience with eBPF or kernel-level programming.
- Contributions to open source infrastructure projects (CNCF ecosystem preferred).
- Experience with WebAssembly for edge computing.
- Prior experience at a high-scale internet company (10M+ DAU).
- Experience with chaos engineering practices.
- Familiarity with hardware architecture and performance profiling.
- Experience building multi-region, active-active deployments.
- Published papers or talks at major conferences (KubeCon, re:Invent, etc.).
`;

// Repeat to exceed 4000 chars
const longJD = (longJDBase + longJDBase.substring(0, 800)).trim();

printResult('4. Long JD exceeding 4000 chars (sentence boundary test)', longJD, trimJD(longJD));

// 5. JD with excessive blank lines and messy whitespace
const messyJD = `
Frontend Engineer


We are hiring a Frontend Engineer.



Responsibilities:


- Build React components
- Write CSS and Tailwind styles


- Collaborate with designers



Requirements:


- 2+ years React experience


- TypeScript proficiency


- CSS expertise


Benefits
- Health, dental, vision
- Unlimited PTO
`.trim();

printResult('5. JD with excessive blank lines (whitespace normalisation test)', messyJD, trimJD(messyJD));

// 6. Edge case: boilerplate appears within first 200 chars — buffer should preserve it
const jdWithVeryEarlyBoilerplate = `About us: We build tools for developers.

Software Engineer

We need an engineer who can build APIs, handle databases, and ship fast.

Requirements:
- Python, FastAPI
- PostgreSQL
- Docker
`.trim();

printResult('6. Boilerplate within first 200 chars (edge case)', jdWithVeryEarlyBoilerplate, trimJD(jdWithVeryEarlyBoilerplate));

// 7. Real-world style JD — messy, long, boilerplate at the end
const realWorldJD = `
Job Title: Senior Data Engineer
Location: Remote (US only)
Employment Type: Full-time

About the Role:
We're looking for a Senior Data Engineer to join our growing data platform team. You'll be responsible for building and maintaining robust data pipelines that power our analytics and ML infrastructure.

Day-to-day responsibilities:
- Design, build, and maintain scalable ETL/ELT pipelines using Apache Spark and dbt
- Manage our data warehouse (Snowflake) and ensure data quality
- Work closely with data scientists to productionize ML models
- Build real-time streaming pipelines using Kafka and Flink
- Develop and maintain data contracts between producers and consumers
- Implement data governance policies and data lineage tracking
- Optimize query performance and reduce compute costs

Must Haves:
- 5+ years of data engineering experience
- Expert-level SQL and Python
- Strong experience with Spark (PySpark preferred)
- Experience with dbt, Airflow, or similar orchestration tools
- Hands-on experience with cloud data warehouses (Snowflake, BigQuery, or Redshift)
- Experience with streaming technologies (Kafka, Kinesis, or Flink)
- Strong understanding of data modeling (star schema, data vault)

Good to Have:
- Experience with Databricks or similar lakehouse platforms
- Familiarity with data mesh architecture
- Exposure to ML pipelines and feature stores
- Knowledge of data quality frameworks (Great Expectations, Soda)

Interview Process:
1. 30-min recruiter screen
2. Technical phone screen (SQL + Python)
3. Take-home data engineering case study (3-4 hours)
4. Final virtual onsite (4 rounds, full day)

Compensation:
Salary range: $160,000 - $210,000 depending on experience
Equity: 0.1% - 0.3% options
Bonus: up to 15% annual performance bonus

What We Offer:
- Health insurance (medical, dental, vision) - 100% covered for employee
- 401k with 6% company match
- Unlimited PTO with 15-day minimum
- $2,000 annual learning budget
- Home office stipend: $1,500 one-time + $100/month
- Paid parental leave: 16 weeks

Diversity and Inclusion:
We are committed to building a diverse team and strongly encourage applications from underrepresented groups. We are an equal opportunity employer.

About Us:
Founded in 2017, we are a Series C company with $120M raised. Our data platform processes over 50 billion events per day for Fortune 500 customers. We are headquartered in New York with offices in London and Singapore.
`.trim();

printResult('7. Real-world JD (full integration test)', realWorldJD, trimJD(realWorldJD));

console.log(`\n${SECTION}`);
console.log('SUMMARY');
console.log(DIVIDER);

const tests = [
  { name: 'Clean JD', input: cleanJD },
  { name: 'JD with boilerplate', input: jdWithBoilerplate },
  { name: 'Early benefits mention', input: jdWithEarlyBenefitsMention },
  { name: 'Long JD (4000+ chars)', input: longJD },
  { name: 'Messy whitespace', input: messyJD },
  { name: 'Very early boilerplate', input: jdWithVeryEarlyBoilerplate },
  { name: 'Real-world JD', input: realWorldJD },
];

tests.forEach(({ name, input }) => {
  const output = trimJD(input);
  const pct = Math.round((1 - output.length / input.length) * 100);
  console.log(`${name.padEnd(30)} ${String(input.length).padStart(5)} → ${String(output.length).padStart(4)} chars  (${pct}% reduction)`);
});

console.log(SECTION);