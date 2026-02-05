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

// Google Sheets Integration
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/d/YOUR_GOOGLE_APPS_SCRIPT_ID/usercallback'; // Replace with your Google Apps Script deployment URL

// Handle Contact Form Submission
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const kommune = document.getElementById('kommune').value;
    const propertyType = document.getElementById('property-type').value;
    const propertyCondition = document.getElementById('property-condition').value;
    const message = document.getElementById('message').value;
    const mäklarKontakt = document.getElementById('mäklarkontakt').checked;

    try {
        // Save to Supabase
        const { data, error } = await supabaseClient
            .from('leads')
            .insert([
                {
                    name: name,
                    email: email,
                    kommun: kommune,
                    meddelande: `Adress: ${address}\nBostadstyp: ${propertyType}\nSkick: ${propertyCondition}\nMäklarkontakt: ${mäklarKontakt ? 'Ja' : 'Nej'}\n\n${message}`
                }
            ])
            .select();

        if (error) throw error;

        // Save to Google Sheets (optional - implement Google Apps Script)
        // await sendToGoogleSheets({
        //     name, email, address, kommune, propertyType, propertyCondition, message, mäklarKontakt
        // });

        // Show success message
        const statusEl = document.getElementById('form-status');
        statusEl.innerHTML = '<strong>✓ Värdering genomförd!</strong><p>Vi kontaktar dig snart med resultat och mäklare i ditt område.</p>';
        statusEl.className = 'form-status success';

        // Reset form
        document.getElementById('contact-form').reset();

        // Reload leads
        setTimeout(() => {
            loadLeads();
            statusEl.textContent = '';
            statusEl.className = 'form-status';
        }, 4000);
    } catch (error) {
        console.error('Error submitting form:', error);
        const statusEl = document.getElementById('form-status');
        statusEl.textContent = '✗ Ett fel uppstod. Försök igen senare.';
        statusEl.className = 'form-status error';
    }
});

// Optional: Send to Google Sheets
// async function sendToGoogleSheets(data) {
//     try {
//         const response = await fetch(GOOGLE_SHEETS_URL, {
//             method: 'POST',
//             body: JSON.stringify(data)
//         });
//         return response.json();
//     } catch (error) {
//         console.log('Google Sheets integration pending - save works to Supabase');
//     }
// }

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
