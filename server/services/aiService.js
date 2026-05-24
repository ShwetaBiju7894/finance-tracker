const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Helper ───────────────────────────────────────────────────────
const ask = async (prompt) => {
  const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ─── ANALYZE SPENDING ─────────────────────────────────────────────
const analyzeSpending = async ({ transactions, summary, categories, goals }) => {
  const prompt = `
    You are a friendly personal finance advisor. Analyze this user's financial data
    and give practical, specific insights. Be conversational and encouraging.

    MONTHLY SUMMARY:
    - Total Income:   $${summary.total_income}
    - Total Expenses: $${summary.total_expenses}
    - Net Savings:    $${summary.net_savings}

    TOP SPENDING CATEGORIES:
    ${categories.map(c => `- ${c.name}: $${c.total} (${c.percentage}%)`).join('\n')}

    RECENT TRANSACTIONS:
    ${transactions.slice(0, 10).map(t =>
      `- ${t.type === 'expense' ? '-' : '+'}$${t.amount} | ${t.category_name || 'Uncategorized'} | ${t.note || ''}`
    ).join('\n')}

    SAVINGS GOALS:
    ${goals.map(g => `- ${g.title}: $${g.current_amount} of $${g.target_amount} (${g.percentage}%)`).join('\n')}

    Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Just JSON:
    {"insights":[{"type":"positive","title":"short title max 6 words","message":"specific insight 1-2 sentences"},{"type":"warning","title":"short title","message":"specific insight"},{"type":"tip","title":"short title","message":"specific insight"},{"type":"goal","title":"short title","message":"specific insight"}]}
  `;

  const text  = await ask(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

// ─── MONTHLY SUMMARY ──────────────────────────────────────────────
const getMonthlySummary = async ({ summary, topCategory, previousSummary }) => {
  const prompt = `
    You are a personal finance advisor. Write a short friendly monthly summary in max 3 sentences.

    This month:  Income $${summary.total_income} | Expenses $${summary.total_expenses} | Savings $${summary.net_savings}
    Last month:  Income $${previousSummary.income} | Expenses $${previousSummary.expenses} | Savings $${previousSummary.savings}
    Top spending category: ${topCategory?.name} at $${topCategory?.total}

    Return ONLY a raw JSON object. No markdown. No backticks:
    {"summary":"your 3 sentence summary here"}
  `;

  const text  = await ask(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

// ─── BUDGET ADVICE ────────────────────────────────────────────────
const getBudgetAdvice = async ({ income, expenses, goals }) => {
  const prompt = `
    You are a personal finance advisor. Suggest a monthly budget using 50/30/20 rule.

    Monthly income:   $${income}
    Current expenses: $${expenses}
    Goals: ${goals.map(g => g.title).join(', ')}

    Return ONLY a raw JSON object. No markdown. No backticks:
    {"advice":"2 sentence personalized advice","suggested_budget":{"needs":{"amount":0,"percentage":50},"wants":{"amount":0,"percentage":30},"savings":{"amount":0,"percentage":20}}}
  `;

  const text  = await ask(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

module.exports = { analyzeSpending, getMonthlySummary, getBudgetAdvice };