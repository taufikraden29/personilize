// Daily quotes functionality
const Quotes = {
    quotes: [
        { text: "Kesuksesan adalah kemampuan untuk pergi dari kegagalan ke kegagalan tanpa kehilangan semangat.", author: "Winston Churchill" },
        { text: "Cara terbaik untuk memprediksi masa depan adalah dengan menciptakannya.", author: "Peter Drucker" },
        { text: "Jangan menunggu. Waktu tidak akan pernah tepat.", author: "Napoleon Hill" },
        { text: "Satu-satunya cara untuk melakukan pekerjaan besar adalah dengan mencintai yang Anda lakukan.", author: "Steve Jobs" },
        { text: "Masa depan取决于你今天做什么.", author: "Mahatma Gandhi" },
        { text: "Kesuksesan bukanlah kunci kebahagiaan. Kebahagiaan adalah kunci kesuksesan.", author: "Albert Schweitzer" },
        { text: "Satu-satunya batasan kita adalah yang kita buat sendiri.", author: "Unknown" },
        { text: "Jangan takut gagal. Takutlah tidak mencoba.", author: "Unknown" },
        { text: "Setiap hari adalah kesempatan baru untuk menjadi lebih baik.", author: "Unknown" },
        { text: "Fokus pada kemajuan, bukan kesempurnaan.", author: "Unknown" },
        { text: "Kedisiplinan adalah jembatan antara tujuan dan pencapaian.", author: "Jim Rohn" },
        { text: "Cara untuk memulai adalah berhenti berbicara dan mulai melakukan.", author: "Walt Disney" },
        { text: "Jangan hitung hari, buat hari yang berharga.", author: "Unknown" },
        { text: "Kesuksesan dimulai dengan tindakan.", author: "Unknown" },
        { text: "Pikiran positif menghasilkan kehidupan positif.", author: "Unknown" }
    ],

    init() {
        this.loadDailyQuote();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Add refresh button for quotes
        const quoteSection = document.querySelector('.bg-gradient-to-r.from-purple-500');
        if (quoteSection) {
            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'absolute top-4 right-4 text-white hover:text-gray-200 transition';
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            refreshBtn.addEventListener('click', () => {
                this.loadRandomQuote();
            });
            quoteSection.style.position = 'relative';
            quoteSection.appendChild(refreshBtn);
        }
    },

    loadDailyQuote() {
        const today = new Date().toISOString().split('T')[0];
        const savedQuote = Storage.get('dailyQuote');

        if (savedQuote && savedQuote.date === today) {
            this.renderQuote(savedQuote.quote);
        } else {
            this.loadRandomQuote(today);
        }
    },

    loadRandomQuote(saveDate = null) {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        const quote = this.quotes[randomIndex];

        this.renderQuote(quote);

        if (saveDate) {
            Storage.set('dailyQuote', {
                date: saveDate || new Date().toISOString().split('T')[0],
                quote: quote
            });
        }
    },

    renderQuote(quote) {
        const quoteEl = document.getElementById('daily-quote');
        const authorEl = document.getElementById('quote-author');

        if (quoteEl) quoteEl.textContent = quote.text;
        if (authorEl) authorEl.textContent = `- ${quote.author}`;
    }
};