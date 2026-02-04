// Supabase Configuration
const SUPABASE_URL = 'https://lyvxwhrcxujtqkcqrmdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dnh3aHJjeHVqdHFrY3FybWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5NDEsImV4cCI6MjA4NTc1Mzk0MX0.sU08xaTQfWNhqvzcoFioTkNeC_BDocPmdEB7UdgDjfg';

// Initialize Supabase Client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Load leads from Supabase
async function loadLeads() {
    try {
        const { data, error } = await supabaseClient
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const leadsList = document.getElementById('leads-list');
        
        if (!data || data.length === 0) {
            leadsList.innerHTML = '<p>Inga leads än. Fyll i kontaktformuläret!</p>';
            return;
        }

        leadsList.innerHTML = data.map(lead => `
            <div class="lead-card">
                <h3>${lead.name}</h3>
                <p><strong>Email:</strong> ${lead.email}</p>
                <p><strong>Kommun:</strong> ${lead.kommun || 'Ej angiven'}</p>
                <p><strong>Meddelande:</strong> ${lead.meddelande || 'Inget meddelande'}</p>
                <p><small>Skapat: ${new Date(lead.created_at).toLocaleDateString('sv-SE')}</small></p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading leads:', error);
        document.getElementById('leads-list').innerHTML = '<p>Kunde inte ladda data. Försök igen senare.</p>';
    }
}

// Handle Contact Form Submission
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    try {
        // Insert into Supabase
        const { data, error } = await supabaseClient
            .from('leads')
            .insert([
                {
                    name: name,
                    email: email,
                    meddelande: message,
                    kommun: 'Inte angiven' // You can modify this later
                }
            ])
            .select();

        if (error) throw error;

        // Show success message
        const statusEl = document.getElementById('form-status');
        statusEl.textContent = '✓ Meddelandet skickades! Tack!';
        statusEl.className = 'success';

        // Reset form
        document.getElementById('contact-form').reset();

        // Reload leads
        setTimeout(() => {
            loadLeads();
            statusEl.textContent = '';
        }, 2000);
    } catch (error) {
        console.error('Error submitting form:', error);
        const statusEl = document.getElementById('form-status');
        statusEl.textContent = '✗ Ett fel uppstod. Försök igen.';
        statusEl.className = 'error';
    }
});

// Load Supabase client library and then load leads
function loadSupabaseLibrary() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/dist/umd/supabase.js';
    script.onload = () => {
        console.log('Supabase library loaded');
        loadLeads();
    };
    document.head.appendChild(script);
}

// Load on page load
window.addEventListener('load', loadSupabaseLibrary);
