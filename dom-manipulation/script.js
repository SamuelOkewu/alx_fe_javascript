// Default quotes used only if local storage is empty
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Work" },
    { text: "Strive not to be a success, but rather to be of value.", category: "Life" },
    { text: "The mind is everything. What you think you become.", category: "Wisdom" },
    { text: "Simplicity is the ultimate sophistication.", category: "Design" },
    { text: "Believe you can and you're halfway there.", category: "Motivation" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" },
];

let quotes = []; // This array will hold the current application state (loaded from local storage)
const SERVER_STORAGE_KEY = 'fetchQuotesFromServer';
let syncIntervalId;

// --- DOM Elements ---
const quoteTextElement = document.getElementById('current-quote');
const quoteMetaElement = document.getElementById('quote-meta');
const categoryFilter = document.getElementById('category-filter');
const quoteListContainer = document.getElementById('quote-list');
const newQuoteText = document.getElementById('new-quote-text');
const newQuoteCategory = document.getElementById('new-quote-category');
const quoteCount = document.getElementById('quote-count');
const addQuoteFormContainer = document.getElementById(["createAddQuoteForm"]);
const feedbackMessage = document.getElementById('feedback-message');
const importExportFeedback = document.getElementById('import-export-feedback');


// --- STORAGE HANDLERS ---

/**
 * Loads quotes from Local Storage or falls back to default quotes.
 */
function loadQuotes() {
    const storedQuotes = localStorage.getItem('dynamicQuotes');
    if (storedQuotes) {
        try {
            quotes = JSON.parse(storedQuotes);
        } catch (e) {
            console.error("Error parsing quotes from Local Storage. Falling back to defaults.", e);
            quotes = defaultQuotes;
        }
    } else {
        quotes = defaultQuotes;
    }
}

// --- EXTERNAL API & SYNC HANDLERS ---

const API_URL = 'https://jsonplaceholder.typicode.com/posts';

/**
 * Fetches data from the external mock API (JSONPlaceholder /posts).
 * Maps API response (body -> text, "API Post" -> category) to quote structure.
 * @returns {Promise<Array<{text: string, category: string}>>}
 */
async function fetchServerQuotes() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();
        
        // Map the API data structure (post.body -> text) to our quote structure
        return posts.map(post => ({
            // The 'body' field contains the longer text we want to use as the quote
            text: post.body.trim(),
            category: "API Post" 
        }));
    } catch (e) {
        console.error("Failed to fetch server quotes:", e);
        // On failure, return an empty array to prevent app crash
        return [];
    }
}

/**
 * Loads the last viewed quote from Session Storage.
 */
function loadLastViewedQuote() {
    const lastQuote = sessionStorage.getItem('lastViewedQuote');
    const lastCategory = sessionStorage.getItem('lastViewedCategory');
    if (lastQuote) {
        quoteTextElement.textContent = lastQuote;
        quoteMetaElement.textContent = lastCategory ? `— Last Session: ${lastCategory}` : `— Last Session Quote`;
        return true;  
    }
    return false;
}

// --- UI & CORE LOGIC ---

/**
 * Refreshes all dynamic UI elements after a data change.
 */
function refreshUI() {
    populateCategoryFilter();
    renderQuoteList();
    quoteCount.textContent = quotes.length;
    // Persist the changes
    saveQuotes();
}

/**
 * Fills the category filter dropdown with unique categories.
 */
function populateCategoryFilter() {
    // Ensure categories are strings and trim whitespace
    const categoryNames = quotes.map(q => q.category ? q.category.trim() : 'Uncategorized');

    // Use Set to get unique categories, then sort
    const uniqueCategories = ['all', ...new Set(categoryNames)].sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return a.localeCompare(b);
    });

    // Clear existing options and re-add
    categoryFilter.innerHTML = '';
    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        // Create a URL-safe value for the filter
        option.value = category.toLowerCase().replace(/\s/g, '-'); 
        option.textContent = category === 'all' ? 'All Categories' : category;
        categoryFilter.appendChild(option);
    });
}

/**
 * Renders the list of all available quotes.
 */
function renderQuoteList() {
    quoteListContainer.innerHTML = '';

    if (quotes.length === 0) {
        quoteListContainer.innerHTML = '<p class="text-gray-400 italic">No quotes added yet. Add one above or import from JSON.</p>';
        return;
    }

    quotes.forEach((quote, index) => {
        const quoteItem = document.createElement('div');
        quoteItem.className = 'p-3 bg-gray-100 rounded-lg flex justify-between items-start text-sm hover:bg-gray-200 transition duration-100';
        quoteItem.innerHTML = `
            <div class="flex-1 min-w-0 pr-3">
                <p class="font-medium text-gray-800 truncate">${quote.text}</p>
                <p class="text-xs text-emerald-600 font-semibold uppercase mt-1">${quote.category}</p>
            </div>
            <button data-index="${index}" class="text-red-400 hover:text-red-600 text-xs font-bold p-1 rounded-full bg-red-100 transition duration-150" onclick="deleteQuote(event)">
                &times;
            </button>
        `;
        quoteListContainer.appendChild(quoteItem);
    });
}

/**
 * Displays a random quote filtered by the currently selected category.
 */
function showRandomQuote() {
    const selectedCategoryValue = categoryFilter.value;

    // 1. Filter Quotes
    const filteredQuotes = quotes.filter(q => {
        if (selectedCategoryValue === 'all') {
            return true;
        }
        return q.category.toLowerCase().replace(/\s/g, '-') === selectedCategoryValue;
    });

    if (filteredQuotes.length === 0) {
        const selectedCategoryText = categoryFilter.options[categoryFilter.selectedIndex].textContent;
        quoteTextElement.textContent = "No quotes available for this category.";
        quoteMetaElement.textContent = `— Filter: ${selectedCategoryText}`;
        sessionStorage.removeItem('lastViewedQuote'); 
        sessionStorage.removeItem('lastViewedCategory');
        return;
    }

    // 2. Select Random Quote
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];

    // 3. Update DOM
    quoteTextElement.textContent = randomQuote.text;
    quoteMetaElement.textContent = `— Category: ${randomQuote.category}`;

    // 4. Use Session Storage for temporary persistence
    sessionStorage.setItem('lastViewedQuote', randomQuote.text);
    sessionStorage.setItem('lastViewedCategory', randomQuote.category);

    // Add animation class for visual feedback
    quoteTextElement.classList.add('opacity-0', 'scale-90', 'transition', 'duration-300');
    setTimeout(() => {
         quoteTextElement.classList.remove('opacity-0', 'scale-90');
    }, 10);
}

/**
 * Handles the dynamic addition of a new quote via the form.
 */
function handleAddQuote() {
    const text = newQuoteText.value.trim();
    let category = newQuoteCategory.value.trim();

    if (!text || !category) {
        quoteDisplay(feedbackMessage, "Quote text and category cannot be empty!", 'text-red-500');
        return;
    }

    // Normalize category capitalization
    category = category.charAt(0).toUpperCase() + category.slice(1);

    quotes.push({ text, category });

    newQuoteText.value = '';
    newQuoteCategory.value = '';

    refreshUI();
    quoteDisplay(feedbackMessage, "Quote successfully added and saved!", 'text-emerald-600');
}

/**
 * Deletes a quote by index.
 * @param {Event} event - The click event object.
 */
function deleteQuote(event) {
    const indexToDelete = event.currentTarget.getAttribute('data-index');

    quotes.splice(indexToDelete, 1);

    refreshUI();

    quoteDisplay(feedbackMessage, "Quote deleted and saved!", 'text-red-500');
}

/**
 * Toggles the visibility of the Add Quote form.
 */
function toggleAddForm() {
    const isHidden = addQuoteFormContainer.classList.toggle('hidden');
    document.getElementById('toggle-add-form').textContent = isHidden ? 'Show Form' : 'Hide Form';
}

/**
 * Displays a temporary feedback message in the specified element.
 * @param {HTMLElement} element - The DOM element to display feedback in.
 * @param {string} message - The message to display.
 * @param {string} colorClass - Tailwind class for color (e.g., 'text-red-500').
 */
function quoteDisplay(element, message, colorClass) {
    element.textContent = message;
    element.className = `text-sm text-center pt-2 h-6 font-semibold ${colorClass}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'text-sm text-center pt-2 h-6';
    }, 3000);
}

// --- JSON IMPORT/EXPORT ---

/**
 * Exports the current quotes array as a downloadable JSON file.
 */
function exportQuotes() {
    if (quotes.length === 0) {
        quoteDisplay(importExportFeedback, "Cannot export an empty list!", 'text-red-500');
        return;
    }

    const dataStr = JSON.stringify(quotes, null, 2); // Use null, 2 for pretty printing
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    // Create a temporary link element
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-quotes-export.json';

    // Programmatically click the link to trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    URL.revokeObjectURL(url);

    quoteDisplay(importExportFeedback, "Quotes exported successfully!", 'text-blue-600');
}
//**
 //* Implements the filtering logic for the quote list display.
 //* Also persists the selected filter to Local Storage.
 //*/
function filterQuotes() {
    const selectedFilter = categoryFilter.value;
    
    // 1. Save filter preference to Local Storage
    localStorage.setItem('lastSelectedFilter', selectedFilter);

    // 2. Re-render the list using the new filter
    renderQuoteList(selectedFilter);
}

/**
 * Renders the list of all available quotes, filtered by the selected category.
 * @param {string | null} filterValue - The category value to filter by. Defaults to current select value.
 */

// --- FILTERING & UI LOGIC ---

/**
…    newQuoteText.value = '';
    newQuoteCategory.value = '';

    // refreshUI calls populateCategories, which updates the dropdown
    refreshUI(); 
    quoteDisplay(feedbackMessage, "Quote successfully added and saved!", 'text-emerald-600');
}

/**
 * Imports quotes from a JSON file uploaded by the user.
 * @param {Event} event - The file input change event.
 */
function importQuotes(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();

    fileReader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);

            // Basic validation
            if (!Array.isArray(importedQuotes) || !importedQuotes.every(q => q.text && q.category)) {
                 quoteDisplay(importExportFeedback, "Invalid JSON format. Expected array of {text, category}.", 'text-red-500');
                 return;
            }

            // Simple deduplication based on quote text
            const existingQuotesText = new Set(quotes.map(q => q.text));
            const newUniqueQuotes = importedQuotes.filter(q => !existingQuotesText.has(q.text));

            quotes.push(...newUniqueQuotes);

            // Update UI and save to Local Storage
            refreshUI();

            const message = `Successfully imported ${newUniqueQuotes.length} unique quotes! Total quotes: ${quotes.length}`;
            quoteDisplay(importExportFeedback, message, 'text-purple-600');

        } catch (error) {
            console.error("Error during JSON import:", error);
            quoteDisplay(importExportFeedback, "Error reading or parsing JSON file.", 'text-red-500');
        } finally {
            // Reset file input so the same file can be imported again
            event.target.value = null;
        }
    };

    fileReader.onerror = function() {
        quoteDisplay(importExportFeedback, "Error reading file.", 'text-red-500');
    };

    fileReader.readAsText(file);
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load data from Local Storage
    loadQuotes();

    // 2. Load last quote from Session Storage, otherwise show a random quote
    const hasSessionQuote = loadLastViewedQuote();

    // 3. Refresh UI elements (categories, list, count)
    refreshUI();

    // 4. If no session quote, show a random quote from the persistent data
    if (!hasSessionQuote && quotes.length > 0) {
         showRandomQuote();
    } else if (quotes.length === 0) {
        quoteTextElement.textContent = "No quotes available. Add some or import data!";
        quoteMetaElement.textContent = "— Action Required";
    }
     // 5. Set up periodic data sync (every 30 seconds)
    syncIntervalId = setInterval(() => syncData(), 30000);
    setSyncStatus('Automatic sync active (30s).', 'bg-gray-100 text-gray-500 border border-gray-300');
});
