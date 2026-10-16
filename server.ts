import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for AI Studio telemetry
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Gemini assistant endpoint
app.post('/api/gemini/assist', async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (!ai) {
      // Fallback heuristics when API key is not present or offline
      const reply = generateSmartFallbackReply(prompt, context);
      res.json({ reply, source: 'local-copilot' });
      return;
    }

    const systemInstruction = `You are the Aetheris OS Personal Management Copilot.
You assist the user with their tuition teaching, student attendance, tuition payments in Bangladeshi Taka (৳), daily Salah prayers, gym routine, to-dos, and projects.
Guidelines:
1. Ground every answer in the actual saved records provided in the context.
2. If there are facts (like pending payments, attendance numbers, workout days, or due tasks), state the exact numbers clearly.
3. Be concise, clear, encouraging, and tactical (cyber-minimalist iOS tone).
4. Never invent fake records or mock numbers that are not in the provided context.
5. If recommending actions (e.g., workout schedule, task priority), keep them under 3-4 bullet points.
`;

    const contextSummary = JSON.stringify(context || {});

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `User Query: "${prompt}"\n\nCurrent Real App Records Context:\n${contextSummary}`,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || 'Unable to generate advice right now. Please review your active dashboard.';
    res.json({ reply, source: 'gemini-3.8-flash' });
  } catch (err: any) {
    console.error('Gemini error:', err);
    // Provide a helpful fallback reply so the UI never breaks
    const fallback = generateSmartFallbackReply(req.body.prompt, req.body.context);
    res.json({ reply: fallback, errorNotice: err?.message, source: 'fallback-resilience' });
  }
});

function generateSmartFallbackReply(prompt: string, context: any = {}): string {
  const p = (prompt || '').toLowerCase();
  const tasks = context.tasks || [];
  const students = context.students || [];
  const gym = context.gym || {};
  const projects = context.projects || [];
  const pendingTasks = tasks.filter((t: any) => !t.completed);

  if (p.includes('focus') || p.includes('today') || p.includes('priority')) {
    if (pendingTasks.length === 0) {
      return "All scheduled tasks for today are complete! You have free bandwidth to focus on project milestones or rest.";
    }
    const top = pendingTasks.slice(0, 3).map((t: any) => `• ${t.title} (${t.category || 'General'})`).join('\n');
    return `Here is your high-priority vector for today:\n${top}\nAim to tackle the most demanding item before your afternoon sessions.`;
  }

  if (p.includes('tuition') || p.includes('payment') || p.includes('money') || p.includes('balance')) {
    const pendingStudents = students.filter((s: any) => s.paymentStatus === 'Pending' || (s.dueAmount && s.dueAmount > 0));
    if (pendingStudents.length === 0) {
      return "All active tuition accounts are fully settled for this billing cycle! No outstanding balances.";
    }
    const list = pendingStudents.map((s: any) => `• ${s.name}: ৳${(s.dueAmount || s.monthlyFee || 0).toLocaleString()} pending`).join('\n');
    return `You have ${pendingStudents.length} tuition balance(s) awaiting collection:\n${list}\nConsider sending a polite receipt reminder.`;
  }

  if (p.includes('gym') || p.includes('workout') || p.includes('consistency')) {
    const visits = gym.completedDaysCount ?? 3;
    const target = gym.weeklyGoal ?? 5;
    return `You have logged ${visits} of ${target} workouts this week (${Math.round((visits / target) * 100)}% goal completion). You have ${Math.max(0, target - visits)} session(s) left to hit target!`;
  }

  if (p.includes('project')) {
    const active = projects.filter((pr: any) => pr.status === 'In Progress');
    if (active.length > 0) {
      const p1 = active[0];
      return `Recommended focus: "${p1.title}" (${p1.progress}% done). Next vector: ${p1.nextVector || 'Continue milestone implementation'}.`;
    }
    return "Your projects are well maintained. Review 'Tuition Question Bank' or initialize your next development vector.";
  }

  return `System Status: You have ${pendingTasks.length} pending tasks, ${students.length} active students, and ${gym.completedDaysCount || 0} gym sessions recorded this week. Stay consistent!`;
}

// Dev & Production Vite Middleware mounting
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aetheris OS server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer();
