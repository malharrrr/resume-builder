import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const uniqueId = crypto.randomUUID();
  const tempDir = path.join(process.cwd(), 'tmp');
  const texPath = path.join(tempDir, `resume_${uniqueId}.tex`);
  const pdfPath = path.join(tempDir, `resume_${uniqueId}.pdf`);
  const logPath = path.join(tempDir, `resume_${uniqueId}.log`);
  const auxPath = path.join(tempDir, `resume_${uniqueId}.aux`);

  try {
    const formData = await req.formData();
    const resumeFile = formData.get('resume') as Blob;
    const jobDescription = formData.get('jobDescription') as string;

    if (!resumeFile || !jobDescription) {
      return NextResponse.json({ error: 'Missing resume or JD' }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), 'base_template.tex');
    const baseTemplate = await fs.readFile(templatePath, 'utf-8');

    const fileBuffer = await resumeFile.arrayBuffer();
    const fileUint8 = new Uint8Array(fileBuffer);

    const { text: generatedLatex } = await generateText({
      model: google('gemini-3.1-flash-lite'),
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: `You are an expert ATS resume writer and LaTeX engineer. 
              TASK:
              1. Extract the candidate's core skills and experience from the attached resume.
              2. Tailor their achievements to perfectly match the provided Job Description.
              3. Inject this into the provided LaTeX Template.
              4. Return ONLY valid, compilable LaTeX code. Do not include markdown formatting.
              5. CRITICAL: Remove the 'biblatex' package and '\\begin{refsection}'.
              6. CRITICAL ESCAPING: You MUST escape special LaTeX characters. Ampersands (&) must become \\&. Percentages (%) must become \\%. Underscores (_) must become \\_.
              
              JOB DESCRIPTION:
              ${jobDescription}
              
              LATEX TEMPLATE TO MODIFY:
              ${baseTemplate}` 
            },
            { type: 'file', data: fileUint8, mediaType: resumeFile.type }
          ]
        }
      ]
    });

    const cleanLatex = generatedLatex.replace(/^```latex\n/, '').replace(/\n```$/, '');

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(texPath, cleanLatex);

    await execAsync(`pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texPath}`);

    const pdfBuffer = await fs.readFile(pdfPath);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="tailored_resume.pdf"`,
      },
    });

  } catch (error) {
    console.error(`Generation Error [${uniqueId}]:`, error);
    return NextResponse.json({ error: 'Failed to process resume' }, { status: 500 });
  } finally {
    const cleanUp = async (filePath: string) => {
      try { await fs.rm(filePath); } catch (e) { /* Ignore missing files */ }
    };
    await Promise.all([cleanUp(texPath), cleanUp(pdfPath), cleanUp(logPath), cleanUp(auxPath)]);
  }
}