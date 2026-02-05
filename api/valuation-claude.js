// Vercel Function - Claude Haiku Valuation Proxy
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { address, propertyType, kvm, floor, rooms } = req.body;

    if (!address || !propertyType) {
        return res.status(400).json({ error: 'Missing address or propertyType' });
    }

    const claudeKey = process.env.CLAUDE_API_KEY;
    if (!claudeKey) {
        console.error('Missing CLAUDE_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Build detailed prompt for Claude
        let prompt = `Du är en erfaren fastighetsvärderare i Sverige med tillgång till aktuell marknadsdata. Ge en realistisk marknadsvärdering för denna bostad:

Adress: ${address}
Bostadstyp: ${propertyType === 'villa' ? 'Villa' : 'Bostadsrätt'}`;

        if (propertyType === 'brf') {
            if (kvm) prompt += `\nArea: ${kvm} kvm`;
            if (floor) prompt += `\nVåning: ${floor}`;
            if (rooms) prompt += `\nAntal rum: ${rooms}`;
        }

        prompt += `\n\nGe en realistisk värdering baserad på:
- Lokala slutpriser för liknande fastigheter
- Aktuella marknadsförhållanden i regionen
- Bostadstyp och storlek

Svar ENDAST som ett nummer i SEK utan text, valuta eller kommatecken (t.ex: 3500000)`;

        // Call Claude API via Anthropic
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': claudeKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 100,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Claude API error:', error);
            throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const valuation = data.content[0].text.trim();

        return res.status(200).json({
            ok: true,
            valuation: valuation
        });

    } catch (error) {
        console.error('Valuation error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to get valuation'
        });
    }
}
