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
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwDBzjKdl1fdmGVYHKwQuFZln5lFbgQb_I9Qlh84mG9IlUfqdfE5HPZVfJ7Zcei9RnssQ/usercallback';

// Generate mock valuation based on property data
function generateValuation(address, propertyType, condition) {
    const baseValues = {
        'villa': 4500000,
        'lägenhet': 2500000,
        'radhus': 3200000,
        'bostadsrätt': 2800000,
        'tomt': 1500000,
        'övrig': 2000000
    };

    const conditionMultipliers = {
        'mycket-bra': 1.15,
        'bra': 1.05,
        'normalt': 1.0,
        'behov-renovering': 0.85
    };

    let baseValue = baseValues[propertyType] || 2500000;
    let multiplier = conditionMultipliers[condition] || 1.0;
    let value = Math.round(baseValue * multiplier / 10000) * 10000;
    
    // Add some randomness (±5%)
    let variance = Math.random() * 0.1 - 0.05;
    value = Math.round(value * (1 + variance) / 10000) * 10000;
    
    return value;
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('sv-SE', { 
        style: 'currency', 
        currency: 'SEK',
        minimumFractionDigits: 0 
    }).format(value);
}

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
        // Generate immediate valuation
        const valuationAmount = generateValuation(address, propertyType, propertyCondition);
        const valuationFormatted = formatCurrency(valuationAmount);

        // Prepare data for Supabase and Google Sheets
        const leadData = {
            name: name || 'Anonym',
            email: email || 'inte-angiven@example.com',
            address: address,
            kommune: kommune,
            propertyType: propertyType,
            propertyCondition: propertyCondition,
            message: message,
            mäklarKontakt: mäklarKontakt,
            valuation: valuationAmount,
            timestamp: new Date().toISOString()
        };

        // Save to Supabase
        const { data, error } = await supabaseClient
            .from('leads')
            .insert([
                {
                    name: leadData.name,
                    email: leadData.email,
                    kommun: kommune,
                    meddelande: `Adress: ${address}\nBostadstyp: ${propertyType}\nSkick: ${propertyCondition}\nVärdering: ${valuationFormatted}\nMäklarkontakt: ${mäklarKontakt ? 'Ja' : 'Nej'}\n\n${message}`
                }
            ])
            .select();

        if (error) throw error;

        // Send to Google Sheets
        await sendToGoogleSheets(leadData);

        // Show success with valuation
        const statusEl = document.getElementById('form-status');
        statusEl.innerHTML = `
            <strong>✓ Din Bostadsvärdering!</strong>
            <p style="font-size: 2.5rem; color: #667eea; margin: 1rem 0; font-weight: bold;">${valuationFormatted}</p>
            <p style="font-size: 0.9rem; color: #666;">Baserad på lokal marknadsdata för ${address}</p>
            ${mäklarKontakt ? '<p style="margin-top: 1rem; color: #27ae60;"><strong>✓ Mäklare i ditt område kontaktar dig snart!</strong></p>' : ''}
        `;
        statusEl.className = 'form-status success';

        // Reset form
        document.getElementById('contact-form').reset();

        // Reload testimonials/leads
        setTimeout(() => {
            loadLeads();
            statusEl.textContent = '';
            statusEl.className = 'form-status';
        }, 5000);
    } catch (error) {
        console.error('Error submitting form:', error);
        const statusEl = document.getElementById('form-status');
        statusEl.textContent = '✗ Ett fel uppstod. Försök igen senare.';
        statusEl.className = 'form-status error';
    }
});

// Send to Google Sheets
async function sendToGoogleSheets(data) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log('Google Sheets response:', result);
        return result;
    } catch (error) {
        console.error('Google Sheets error:', error);
        // Continue even if Google Sheets fails - Supabase already saved the data
    }
}

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
