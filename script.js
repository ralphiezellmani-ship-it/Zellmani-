// Supabase Configuration
const SUPABASE_URL = 'https://lyvxwhrcxujtqkcqrmdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dnh3aHJjeHVqdHFrY3FybWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc5NDEsImV4cCI6MjA4NTc1Mzk0MX0.sU08xaTQfWNhqvzcoFioTkNeC_BDocPmdEB7UdgDjfg';

// Initialize Supabase Client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API Integration (backend handles OpenAI API key securely)
const VALUATION_API = '/api/valuation';
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwDBzjKdl1fdmGVYHKwQuFZln5lFbgQb_I9Qlh84mG9IlUfqdfE5HPZVfJ7Zcei9RnssQ/usercallback';

// Quick Valuation Variables
let selectedPropertyType = null;

// Load leads on page load
document.addEventListener('DOMContentLoaded', function() {
    loadLeads();
    setupQuickValuation();
});

// Setup quick valuation form
function setupQuickValuation() {
    const villaBtn = document.getElementById('villa-btn');
    const brfBtn = document.getElementById('brf-btn');
    const getValuationBtn = document.getElementById('get-valuation-btn');

    if (villaBtn) {
        villaBtn.addEventListener('click', function() {
            selectedPropertyType = 'villa';
            villaBtn.classList.add('active');
            brfBtn.classList.remove('active');
            document.getElementById('brf-details').style.display = 'none';
        });
    }

    if (brfBtn) {
        brfBtn.addEventListener('click', function() {
            selectedPropertyType = 'brf';
            brfBtn.classList.add('active');
            villaBtn.classList.remove('active');
            document.getElementById('brf-details').style.display = 'grid';
        });
    }

    if (getValuationBtn) {
        getValuationBtn.addEventListener('click', getValuation);
    }
}

// Get valuation from OpenAI
async function getValuation() {
    const address = document.getElementById('quick-address').value.trim();
    const getBtn = document.getElementById('get-valuation-btn');
    
    if (!address) {
        alert('Vänligen ange en adress');
        return;
    }
    
    if (!selectedPropertyType) {
        alert('Vänligen välj Villa eller Bostadsrätt');
        return;
    }

    // Show loading
    getBtn.textContent = '⏳ Söker värdering...';
    getBtn.disabled = true;

    try {
        let prompt = `Du är en erfaren fastighetsvärderare i Sverige. Ge en realistisk marknadsvärdering för denna bostad baserat på aktuella marknadsdata:

Adress: ${address}
Bostadstyp: ${selectedPropertyType === 'villa' ? 'Villa' : 'Bostadsrätt'}`;

        if (selectedPropertyType === 'brf') {
            const kvm = document.getElementById('brf-kvm').value;
            const floor = document.getElementById('brf-floor').value;
            const rooms = document.getElementById('brf-rooms').value;
            if (kvm) prompt += `\nArea: ${kvm} kvm`;
            if (floor) prompt += `\nVåning: ${floor}`;
            if (rooms) prompt += `\nRum: ${rooms}`;
        }

        prompt += `\n\nSvar MED ENDAST ett nummer utan text, valuta eller punkter (t.ex: 2500000)`;

        // Call backend API (which securely calls OpenAI)
        const response = await fetch(VALUATION_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        let valuationStr = data.choices[0].message.content.trim();
        let valuation = parseInt(valuationStr.replace(/[^0-9]/g, ''));

        if (isNaN(valuation) || valuation < 100000) {
            valuation = 2500000; // Fallback
        }

        // Format and display
        const formatted = new Intl.NumberFormat('sv-SE', { 
            style: 'currency', 
            currency: 'SEK',
            minimumFractionDigits: 0 
        }).format(valuation);

        displayValuation(address, formatted);

    } catch (error) {
        console.error('Error:', error);
        alert('Fel vid värdering: ' + error.message);
    } finally {
        getBtn.textContent = 'Få Värdering →';
        getBtn.disabled = false;
    }
}

function displayValuation(address, formatted) {
    document.getElementById('result-value').textContent = formatted;
    document.getElementById('result-address').textContent = address;
    document.getElementById('valuation-result').style.display = 'block';
    
    // Scroll to result
    document.getElementById('valuation-result').scrollIntoView({ behavior: 'smooth' });
}

// Load leads from Supabase
async function loadLeads() {
    try {
        const { data, error } = await supabaseClient
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const leadsList = document.getElementById('leads-list');
        if (!leadsList) return;

        if (!data || data.length === 0) {
            return;
        }

        // Show first 3 as testimonials
        leadsList.innerHTML = data.slice(0, 3).map(lead => `
            <div class="testimonial">
                <p>"${lead.meddelande.substring(0, 100)}..." — ${lead.name}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading leads:', error);
    }
}

// Handle full contact form submission (for those who want broker contact)
if (document.getElementById('contact-form')) {
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
                        name: name || 'Anonym',
                        email: email || 'inte-angiven@example.com',
                        kommun: kommune,
                        meddelande: `Adress: ${address}\nBostadstyp: ${propertyType}\nSkick: ${propertyCondition}\nMäklarkontakt: ${mäklarKontakt ? 'Ja' : 'Nej'}\n\n${message}`
                    }
                ])
                .select();

            if (error) throw error;

            // Send to Google Sheets
            try {
                await fetch(GOOGLE_SHEETS_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        name: name || 'Anonym',
                        email: email || 'inte-angiven@example.com',
                        address: address,
                        kommune: kommune,
                        propertyType: propertyType,
                        propertyCondition: propertyCondition,
                        message: message,
                        mäklarKontakt: mäklarKontakt
                    })
                });
            } catch (e) {
                console.log('Google Sheets update skipped');
            }

            // Show success message
            const statusEl = document.getElementById('form-status');
            statusEl.innerHTML = '<strong>✓ Tack för din anmälan!</strong><p>Vi kontaktar dig snart.</p>';
            statusEl.className = 'form-status success';

            // Reset form
            document.getElementById('contact-form').reset();

            // Reload leads
            setTimeout(() => {
                loadLeads();
                statusEl.textContent = '';
                statusEl.className = 'form-status';
            }, 3000);
        } catch (error) {
            console.error('Error submitting form:', error);
            const statusEl = document.getElementById('form-status');
            statusEl.textContent = '✗ Ett fel uppstod. Försök igen senare.';
            statusEl.className = 'form-status error';
        }
    });
}