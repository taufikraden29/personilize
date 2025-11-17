// Finance Manager for Personal Assistant App

class FinanceManager {
    constructor() {
        this.transactions = Storage.get('finance').transactions || [];
        this.categories = Storage.get('finance').categories;
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        // Set up event listeners
        this.setupEventListeners();

        // Render transactions
        this.renderTransactions();

        // Update summary
        this.updateSummary();
    }

    setupEventListeners() {
        // Add transaction button
        document.getElementById('add-transaction-btn').addEventListener('click', () => {
            this.showTransactionModal();
        });

        // Transaction form submission
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Cancel transaction button
        document.getElementById('cancel-transaction-btn').addEventListener('click', () => {
            this.hideTransactionModal();
        });

        // Transaction type buttons
        document.querySelectorAll('.transaction-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update button styles
                document.querySelectorAll('.transaction-type-btn').forEach(b => {
                    b.classList.remove('bg-green-500', 'text-white');
                    b.classList.add('bg-gray-200', 'dark:bg-gray-700');
                });

                const type = btn.getAttribute('data-type');
                if (type === 'income') {
                    btn.classList.remove('bg-gray-200', 'dark:bg-gray-700');
                    btn.classList.add('bg-green-500', 'text-white');
                }

                // Update form
                document.getElementById('transaction-form').setAttribute('data-type', type);
            });
        });

        // Set default type
        document.getElementById('transaction-form').setAttribute('data-type', 'income');

        // Filter tabs
        document.querySelectorAll('.transaction-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.setFilter(tab.getAttribute('data-type'));

                // Update active tab styling
                document.querySelectorAll('.transaction-tab').forEach(t => {
                    t.classList.remove('bg-blue-500', 'text-white');
                    t.classList.add('bg-gray-200', 'dark:bg-gray-700');
                });

                tab.classList.remove('bg-gray-200', 'dark:bg-gray-700');
                tab.classList.add('bg-blue-500', 'text-white');
            });
        });
    }

    renderTransactions() {
        const transactionsList = document.getElementById('transactions-list');
        const filteredTransactions = this.getFilteredTransactions();

        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-wallet text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                    <p class="text-gray-500 dark:text-gray-400">Tidak ada transaksi</p>
                    <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg" onclick="window.financeManager.showTransactionModal()">
                        <i class="fas fa-plus mr-2"></i>Tambah Transaksi Baru
                    </button>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = filteredTransactions.map(transaction => {
            const isIncome = transaction.type === 'income';
            const categoryIcon = this.getCategoryIcon(transaction.category);
            const dateStr = new Date(transaction.date).toLocaleDateString('id-ID');
            const amountStr = new Intl.NumberFormat('id-ID').format(transaction.amount);

            return `
                <div class="transaction-item bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md ${isIncome ? 'transaction-income' : 'transaction-expense'}" data-id="${transaction.id}">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full ${isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} flex items-center justify-center mr-3">
                                <i class="fas ${categoryIcon} ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}"></i>
                            </div>
                            <div>
                                <h4 class="font-medium">${transaction.description || this.getCategoryLabel(transaction.category)}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${dateStr}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-bold ${isIncome ? 'text-green-500' : 'text-red-500'}">
                                ${isIncome ? '+' : '-'}Rp ${amountStr}
                            </p>
                            <button class="delete-transaction-btn text-gray-400 hover:text-red-500 text-sm" data-id="${transaction.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        this.attachTransactionEventListeners();
    }

    attachTransactionEventListeners() {
        document.querySelectorAll('.delete-transaction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.deleteTransaction(id);
            });
        });
    }

    getFilteredTransactions() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        return this.transactions
            .filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate.getMonth() === currentMonth &&
                    transactionDate.getFullYear() === currentYear;
            })
            .filter(transaction => {
                if (this.currentFilter === 'all') return true;
                return transaction.type === this.currentFilter;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.renderTransactions();
    }

    showTransactionModal() {
        const modal = document.getElementById('transaction-modal');

        // Reset form
        document.getElementById('transaction-form').reset();

        // Set today's date
        document.getElementById('transaction-date').valueAsDate = new Date();

        // Set default type to income
        document.querySelector('.transaction-type-btn[data-type="income"]').click();

        modal.classList.remove('hidden');
    }

    hideTransactionModal() {
        document.getElementById('transaction-modal').classList.add('hidden');
    }

    saveTransaction() {
        const form = document.getElementById('transaction-form');
        const type = form.getAttribute('data-type');

        const transactionData = {
            type: type,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            category: document.getElementById('transaction-category').value,
            description: document.getElementById('transaction-description').value,
            date: document.getElementById('transaction-date').value
        };

        transactionData.id = this.generateId();
        transactionData.createdAt = new Date().toISOString();

        this.transactions.push(transactionData);

        // Save to storage
        Storage.set('finance', { ...Storage.get('finance'), transactions: this.transactions });

        // Update UI
        this.renderTransactions();
        this.updateSummary();
        this.hideTransactionModal();

        // Show notification
        App.showNotification('Transaksi ditambahkan', 'success');
    }

    deleteTransaction(id) {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            Storage.set('finance', { ...Storage.get('finance'), transactions: this.transactions });
            this.renderTransactions();
            this.updateSummary();
            App.showNotification('Transaksi dihapus', 'info');
        }
    }

    updateSummary() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const monthlyTransactions = this.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear;
        });

        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expense;

        document.getElementById('monthly-income').textContent = new Intl.NumberFormat('id-ID').format(income);
        document.getElementById('monthly-expense').textContent = new Intl.NumberFormat('id-ID').format(expense);
        document.getElementById('monthly-balance').textContent = new Intl.NumberFormat('id-ID').format(balance);
    }

    getCategoryIcon(category) {
        const iconMap = {
            food: 'fa-utensils',
            transport: 'fa-car',
            shopping: 'fa-shopping-bag',
            entertainment: 'fa-film',
            bills: 'fa-file-invoice',
            salary: 'fa-money-bill-wave',
            other: 'fa-ellipsis-h'
        };
        return iconMap[category] || 'fa-ellipsis-h';
    }

    getCategoryLabel(category) {
        const labelMap = {
            food: 'Makanan',
            transport: 'Transportasi',
            shopping: 'Belanja',
            entertainment: 'Hiburan',
            bills: 'Tagihan',
            salary: 'Gaji',
            other: 'Lainnya'
        };
        return labelMap[category] || 'Lainnya';
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}