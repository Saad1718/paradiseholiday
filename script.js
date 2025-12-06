/* script.js - site UI behavior (no back-end) */

// small helpers
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// initial setup
document.getElementById('year').textContent = new Date().getFullYear();
document.querySelector(".menu-btn").onclick = () => {
    document.getElementById("menu").classList.toggle("show");
};

// WhatsApp link - replace number with your own in international format (no +)
const WHATSAPP_NUMBER = "919876543210";
$('#whatsappBtn').href = `https://wa.me/${WHATSAPP_NUMBER}`;

// Booking modal controls
const bookingModal = $('#bookingModal');
const openBookingBtns = $$('.book-btn');
const openBookingMain = $('#bookNowBtn');
const openBookingMain2 = $('#bookNowBtn2') || null;
const closeBooking = $('#closeBooking');
const bookingForm = $('#bookingForm');
const packageSelect = $('#packageSelect');
const priceInput = $('#priceInput');

function openBooking(initialPackage, initialPrice) {
    packageSelect.value = initialPackage || '';
    priceInput.value = initialPrice || '';
    bookingModal.setAttribute('aria-hidden', 'false');
}
function closeBookingFn() {
    bookingModal.setAttribute('aria-hidden', 'true');
}
openBookingBtns.forEach(b => {
    b.addEventListener('click', e => {
        openBooking(b.dataset.package, b.dataset.price);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
openBookingMain.addEventListener('click', () => openBooking());
if (openBookingMain2) openBookingMain2.addEventListener('click', () => openBooking());
closeBooking.addEventListener('click', closeBookingFn);
bookingModal.addEventListener('click', e => { if (e.target === bookingModal) closeBookingFn(); });

// Save booking to localStorage (simple local DB)
function getBookings() { return JSON.parse(localStorage.getItem('kh_bookings') || '[]'); }
function saveBooking(obj) {
    const arr = getBookings(); arr.unshift(obj); localStorage.setItem('kh_bookings', JSON.stringify(arr));
}

// On booking form submit
bookingForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(bookingForm);
    const booking = Object.fromEntries(fd.entries());
    booking.created = new Date().toISOString();
    // persist locally (for demo). In production, POST to server.
    saveBooking(booking);
    alert('Booking saved locally. (For production, connect to server.)');
    bookingForm.reset();
    closeBookingFn();
});

// Contact form (simple demo)
$('#contactForm').addEventListener('submit', e => {
    e.preventDefault();
    alert('Thanks for your inquiry! We will contact you soon.');
    e.target.reset();
});

// Gallery lightbox (simple)
$$('.glight').forEach(img => {
    img.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:2000';
        const big = document.createElement('img'); big.src = img.src; big.style.maxWidth = '90%'; big.style.maxHeight = '90%'; big.style.borderRadius = '8px';
        overlay.appendChild(big);
        overlay.addEventListener('click', () => document.body.removeChild(overlay));
        document.body.appendChild(overlay);
    });
});

// ADMIN modal (simple local auth)
const adminModal = $('#adminModal');
const openAdminBtn = $('#openAdminBtn');
const closeAdmin = $('#closeAdmin');
const adminLogin = $('#adminLogin');
const adminDashboard = $('#adminDashboard');
const bookingsList = $('#bookingsList');
const clearBookings = $('#clearBookings');

openAdminBtn.addEventListener('click', () => adminModal.setAttribute('aria-hidden', 'false'));
closeAdmin.addEventListener('click', () => adminModal.setAttribute('aria-hidden', 'true'));
adminModal.addEventListener('click', e => { if (e.target === adminModal) adminModal.setAttribute('aria-hidden', 'true') });

function renderBookings() {
    const arr = getBookings();
    if (arr.length === 0) { bookingsList.innerHTML = '<p class="muted">No bookings yet.</p>'; return; }
    bookingsList.innerHTML = arr.map(b => {
        return `<div style="padding:8px;border-bottom:1px solid #eef7f7">
      <strong>${escapeHtml(b.name || '—')}</strong> • ${escapeHtml(b.phone || '—')} • ${escapeHtml(b.package || '—')}
      <div class="muted" style="font-size:0.85rem">${new Date(b.created).toLocaleString()}</div>
    </div>`;
    }).join('');
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

adminLogin.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(adminLogin);
    const user = fd.get('user'), pass = fd.get('pass');
    // local password: admin123 (demo only) - replace with server auth for production
    if (user === 'admin' && pass === 'admin123') {
        adminLogin.style.display = 'none';
        adminDashboard.style.display = 'block';
        renderBookings();
    } else {
        alert('Invalid credentials (demo). Use admin/admin123');
    }
});
clearBookings.addEventListener('click', () => {
    if (confirm('Clear all bookings? This cannot be undone (demo).')) {
        localStorage.removeItem('kh_bookings');
        renderBookings();
    }
});

// PAY with Razorpay (client-side demo)
const RAZORPAY_KEY_ID = "rzp_test_xxxxxxxxxxxxx"; // <-- replace with your Razorpay KEY ID for testing
$('#payBtn').addEventListener('click', async () => {
    const amount = Math.max(1, Number($('#payAmount').value || 0));
    if (!amount) { alert('Enter amount'); return; }
    openRazorpayCheckout(amount * 100, `Payment for ${amount} INR`);
});

// pay from booking modal
$('#payNow').addEventListener('click', () => {
    const amount = Number(priceInput.value || 0);
    if (!amount || amount < 1) { alert('Enter price in booking modal'); return; }
    openRazorpayCheckout(amount * 100, `Booking Payment for ${amount} INR`);
});

// OPEN checkout
function openRazorpayCheckout(amountPaise, description) {
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.includes('xxxxxxxx')) {
        alert('Razorpay key is placeholder. Replace RAZORPAY_KEY_ID in script.js with your key.');
        return;
    }
    const options = {
        key: RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: "INR",
        name: "Kerala Holiday Tours",
        description: description,
        handler: function (response) {
            alert('Payment success (demo). Razorpay payment_id: ' + response.razorpay_payment_id);
            // In production: send response.razorpay_payment_id to server to verify payment signature
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: "#008080" }
    };
    const rzp = new Razorpay(options);
    rzp.open();
}

// small accessibility: set focus to first input on modal open
[bookingModal, adminModal].forEach(mod => {
    mod.addEventListener('transitionend', () => {
        const first = mod.querySelector('input,select,button,textarea');
        if (first) first.focus();
    });
});
