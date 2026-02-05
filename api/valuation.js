// Vercel Function - Secure OpenAI Proxy
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        console.error('Missing OPENAI_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 50,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const valuation = data.choices[0].message.content.trim();

        return res.status(200).json({
            ok: true,
            choices: [{
                message: {
                    content: valuation
                }
            }]
        });

    } catch (error) {
        console.error('Valuation error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to get valuation'
        });
    }
}
