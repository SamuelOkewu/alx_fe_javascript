// Initial Array of Quote Objects
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Work" },
    { text: "Strive not to be a success, but rather to be of value.", category: "Value" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "The mind is everything. What you think you become.", category: "Mindfulness" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", category: "Action" }
];

// DOM elements (These must be available after the DOM is fully loaded)
const quoteDisplay = document.getElementById('quote-display');
const showQuoteBtn = document.getElementById('show-quote-btn');
const addQuoteFormBtn = document.getElementById('add-quote-form-btn');
const formContainer = document.getElementById('add-quote-form-container');
const categoryFilter = document.getElementById('category-filter');

let categories = []; // Holds unique categories for the filter
let isFormVisible = false; // Tracks the state of the form

/**
 * Populates the category filter dropdown with unique categories from the quotes array.
 */
function updateCategoryFilter() {
    // Find all unique categories
    categories = [...new Set(quotes.map(q => q.category))].sort();

    // Clear existing options (except 'All')
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';

    // Add new options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

/**
 * Displays a random quote in the quote-display area based on the selected category filter.
 */
function showRandomQuote() {
    // 1. Determine the active category filter
    const selectedCategory = categoryFilter.value;

    // 2. Filter the quotes based on the selected category
    const filteredQuotes = selectedCategory === 'all'
        ? quotes
        : quotes.filter(q => q.category === selectedCategory);

    // Handle case where no quotes match the filter
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = '<p class="text-center text-red-500 font-medium">No quotes found for this category.</p>';
        return;
    }

    // 3. Select a random quote from the filtered list
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];

    // 4. Update the DOM
    quoteDisplay.innerHTML = `
        <p class="quote-text mb-2">"${quote.text}"</p>
        <span class="category-pill self-end text-white bg-blue-500">
            Category: ${quote.category}
        </span>
    `;
}

/**
 * Toggles the visibility of the dynamic "Add Quote" form.
 */
function toggleAddQuoteForm() {
    isFormVisible = !isFormVisible;
    if (isFormVisible) {
        createAddQuoteForm();
        addQuoteFormBtn.textContent = 'Hide Form';
    } else {
        formContainer.innerHTML = '';
        addQuoteFormBtn.textContent = 'Add Quote';
    }
}

/**
 * Creates and inserts the "Add Quote" form dynamically into the DOM.
 */
function createAddQuoteForm() {
    // Re-run filter update to ensure the latest categories are in the form dropdown
    updateCategoryFilter();
    
    // Use innerHTML for simple form creation
    formContainer.innerHTML = `
        <div class="form-container border p-4 rounded-lg bg-gray-50">
            <h3 class="text-xl font-semibold mb-4 text-gray-700">Submit a New Quote</h3>
            <form id="new-quote-form">

                <label for="quote-text-input" class="block font-medium text-gray-700">Quote Text:</label>
                <input type="text" id="quote-text-input" name="quoteText" required placeholder="Enter the quote text" />

                <label for="quote-category-select" class="block font-medium text-gray-700">Category:</label>
                <select id="quote-category-select" name="quoteCategory" required>
                    <option value="" disabled selected>Select or type a new category</option>
                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    <option value="new_category">-- Create New Category --</option>
                </select>

                <div id="new-category-input" style="display:none;">
                    <label for="new-category-name" class="block font-medium text-gray-700 mt-2">New Category Name:</label>
                    <input type="text" id="new-category-name" name="newCategoryName" placeholder="Enter new category name" />
                </div>

                <button type="submit" class="button-primary mt-4">Add Quote to List</button>
            </form>
        </div>
    `;

    // Attach event listeners to the newly created elements
    const form = document.getElementById('new-quote-form');
    form.addEventListener('submit', handleNewQuoteSubmit);

    const categorySelect = document.getElementById('quote-category-select');
    categorySelect.addEventListener('change', handleCategoryChange);
}

/**
 * Handles the change event for the category dropdown in the new quote form.
 * Shows a text input if 'Create New Category' is selected.
 */
function handleCategoryChange(event) {
    const newCategoryInputDiv = document.getElementById('new-category-input');
    const newCategoryInput = document.getElementById('new-category-name');

    if (event.target.value === 'new_category') {
        newCategoryInputDiv.style.display = 'block';
        newCategoryInput.setAttribute('required', 'required');
    } else {
        newCategoryInputDiv.style.display = 'none';
        newCategoryInput.removeAttribute('required');
    }
}

/**
 * Handles the submission of the dynamic "Add Quote" form.
 * @param {Event} event - The form submission event.
 */
function handleNewQuoteSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const quoteText = form['quoteText'].value.trim();
    let quoteCategory = form['quoteCategory'].value;

    // Check if a new category was created
    if (quoteCategory === 'new_category') {
        const newCategoryName = form['newCategoryName'].value.trim();
        if (newCategoryName) {
            quoteCategory = newCategoryName;
        } else {
            console.error("ERROR: Please enter a name for the new category.");
            return;
        }
    }

    if (quoteText && quoteCategory) {
        // 1. Update the quotes data array
        quotes.push({ text: quoteText, category: quoteCategory });

        // 2. Clear the form and hide it
        form.reset();
        toggleAddQuoteForm();

        // 3. Update filter and display the newly added quote
        updateCategoryFilter();
        showRandomQuote();

        console.log("New quote added:", { text: quoteText, category: quoteCategory });
    } else {
        console.error("ERROR: Please fill in both the quote text and the category.");
    }
}

// --- Initialization and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the category filter on load
    updateCategoryFilter();

    // Event listener for the primary quote button
    showQuoteBtn.addEventListener('click', showRandomQuote);

    // Event listener for the filter dropdown
    categoryFilter.addEventListener('change', showRandomQuote);

    // Event listener for the Add Quote button
    addQuoteFormBtn.addEventListener('click', toggleAddQuoteForm);

    // Display an initial quote
    showRandomQuote();
});