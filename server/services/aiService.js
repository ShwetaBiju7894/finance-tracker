const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── ANALYZE SPENDING ─────────────────────────────────────────────────────────
const analyzeSpending = async ({ transactions, summary, categories, goals }) => {
  const prompt = `
    You are a friendly personal finance advisor. Analyze this user's financial data 
    and give practical, specific insights. Be conversational and encouraging, not robotic.

    MONTHLY SUMMARY:
    - Total Income:   $${summary.total_income}
    - Total Expenses: $${summary.total_expenses}
    - Net Savings:    $${summary.net_savings}

    TOP SPENDING CATEGORIES:
    ${categories.map(c => `- ${c.name}: $${c.total} (${c.percentage}%)`).join('\n')}

    RECENT TRANSACTIONS (last 10):
    ${transactions.slice(0, 10).map(t =>
      `- ${t.type === 'expense' ? '-' : '+'}$${t.amount} | ${t.category_name || 'Uncategorized'} | ${t.note || 'No note'} | ${t.date}`
    ).join('\n')}

    SAVINGS GOALS:
    ${goals.map(g => `- ${g.title}: $${g.current_amount} of $${g.target_amount} (${g.percentage}%)`).join('\n')}

    Please provide exactly 4 insights in this JSON format. Return ONLY the JSON, no other text:
    {
      "insights": [
        {
          "type": "positive" | "warning" | "tip" | "goal",
          "title": "short title max 6 words",
          "message": "specific actionable insight 1-2 sentences"
        }
      ]
    }
  `;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages:   [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();

  // Safely parse JSON response
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

// ─── MONTHLY SUMMARY ──────────────────────────────────────────────────────────
const getMonthlySummary = async ({ summary, topCategory, previousSummary }) => {
  const prompt = `
    You are a personal finance advisor. Write a short, friendly monthly summary 
    for this user's finances. Be specific with numbers. Max 3 sentences.

    This month:  Income $${summary.total_income} | Expenses $${summary.total_expenses} | Savings $${summary.net_savings}
    Last month:  Income $${previousSummary.income} | Expenses $${previousSummary.expenses} | Savings $${previousSummary.savings}
    Top category: ${topCategory?.name} at $${topCategory?.total}

    Return ONLY a JSON object, no other text:
    { "summary": "your 3 sentence summary here" }
  `;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 256,
    messages:   [{ role: 'user', content: prompt }],
  });

  const text  = response.content[0].text.trim();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

// ─── BUDGET ADVICE ────────────────────────────────────────────────────────────
const getBudgetAdvice = async ({ income, expenses, goals }) => {
  const prompt = `
    You are a personal finance advisor. Based on this user's income and spending,
    suggest a simple monthly budget. Use the 50/30/20 rule as a starting point
    but adjust based on their actual situation.

    Monthly income:   $${income}
    Current expenses: $${expenses}
    Goals: ${goals.map(g => g.title).join(', ')}

    Return ONLY a JSON object, no other text:
    {
      "advice": "2 sentence personalized advice",
      "suggested_budget": {
        "needs":   { "amount": number, "percentage": number },
        "wants":   { "amount": number, "percentage": number },
        "savings": { "amount": number, "percentage": number }
      }
    }
  `;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages:   [{ role: 'user', content: prompt }],
  });

  const text  = response.content[0].text.trim();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

module.exports = { analyzeSpending, getMonthlySummary, getBudgetAdvice };