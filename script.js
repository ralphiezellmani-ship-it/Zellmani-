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

// Generate mock valuation based on property data
function generateMockValuation(address, propertyType, kvm, floor, rooms) {
    const baseValues = {
        'villa': 4500000,
        'brf': 2500000
    };

    let baseValue = baseValues[propertyType] || 2500000;
    
    // Adjust for BRF details if provided
    if (propertyType === 'brf' && kvm) {
        // Price per sqm estimation
        const pricePerSqm = 45000; // 45k per sqm average in Sweden
        baseValue = parseInt(kvm) * pricePerSqm;
        
        // Adjust for floor
        if (floor && parseInt(floor) > 5) {
            baseValue *= 1.1; // Higher floors = higher value
        }
        if (floor && parseInt(floor) === 0) {
            baseValue *= 0.95; // Ground floor discount
        }
    }
    
    // Add randomness (±8%)
    let variance = Math.random() * 0.16 - 0.08;
    baseValue = Math.round(baseValue * (1 + variance) / 50000) * 50000;
    
    return baseValue;
}

// Get valuation
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
    getBtn.textContent = '⏳ Analyserar...';
    getBtn.disabled = true;

    try {
        // Simulate API delay (realistic UX)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get BRF details if applicable
        let kvm = null, floor = null, rooms = null;
        if (selectedPropertyType === 'brf') {
            kvm = document.getElementById('brf-kvm').value;
            floor = document.getElementById('brf-floor').value;
            rooms = document.getElementById('brf-rooms').value;
        }

        // Generate valuation
        const valuation = generateMockValuation(
            address, 
            selectedPropertyType, 
            kvm, 
            floor, 
            rooms
        );

        // Format
        const formatted = new Intl.NumberFormat('sv-SE', { 
            style: 'currency', 
            currency: 'SEK',
            minimumFractionDigits: 0 
        }).format(valuation);

        displayValuation(address, formatted, valuation);

    } catch (error) {
        console.error('Error:', error);
        alert('Fel vid värdering. Försök igen.');
    } finally {
        getBtn.textContent = 'Få Värdering →';
        getBtn.disabled = false;
    }
}

function displayValuation(address, formatted, valuationAmount) {
    document.getElementById('result-value').textContent = formatted;
    document.getElementById('result-address').textContent = address;
    document.getElementById('valuation-result').style.display = 'block';
    
    // Scroll to result
    document.getElementById('valuation-result').scrollIntoView({ behavior: 'smooth' });
    
    // Optionally save to Supabase (for leads tracking)
    saveValuationToSupabase(address, formatted, valuationAmount);
}

// Save valuation to Supabase
async function saveValuationToSupabase(address, formatted, valuationAmount) {
    try {
        await supabaseClient
            .from('leads')
            .insert([{
                name: 'Anonym Värdering',
                email: 'valuation@example.com',
                kommun: address,
                meddelande: `Adress: ${address}\nVärdering: ${formatted}`
            }]);
    } catch (error) {
        console.log('Supabase save skipped:', error);
    }
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