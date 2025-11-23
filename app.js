let csvData = [];
let allFoodItems = [];

// Load and parse CSV file
async function loadCSV() {
    try {
        const response = await fetch('oxalates.csv');
        const text = await response.text();
        const lines = text.split('\n');
        
        // Skip header row and parse data
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse CSV line (handling quoted values)
            const row = parseCSVLine(line);
            if (row.length >= 7) {
                csvData.push({
                    primaryCategory: row[0],
                    secondaryCategory: row[1],
                    foodItem: row[2],
                    servingSize: row[3],
                    servingSizeValue: row[4],
                    oxalateCategory: row[5],
                    oxalateValue: row[6]
                });
                allFoodItems.push(row[2]);
            }
        }
    } catch (error) {
        console.error('Error loading CSV:', error);
    }
}

// Parse CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Search function - case-insensitive partial match
function searchFoodItems(query) {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    return csvData.filter(item => 
        item.foodItem.toLowerCase().includes(lowerQuery)
    );
}

// Display autocomplete suggestions
function showAutocomplete(query) {
    const dropdown = document.getElementById('autocompleteDropdown');
    
    if (!query || query.length < 1) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
        document.getElementById('resultsContainer').innerHTML = '';
        // Show browse section when search is cleared
        const browseContainer = document.querySelector('.browse-container');
        if (browseContainer) {
            browseContainer.style.display = 'block';
        }
        return;
    }
    
    const matches = searchFoodItems(query);
    
    if (matches.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-item">No results found</div>';
        dropdown.style.display = 'block';
        return;
    }
    
    dropdown.innerHTML = matches
        .slice(0, 10) // Limit to 10 suggestions
        .map(item => 
            `<div class="autocomplete-item" data-food="${item.foodItem}">${item.foodItem}</div>`
        )
        .join('');
    
    dropdown.style.display = 'block';
    
    // Add click handlers to autocomplete items
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const foodName = item.getAttribute('data-food');
            document.getElementById('searchInput').value = foodName;
            dropdown.style.display = 'none';
            displayResults(foodName);
        });
    });
}

// Get CSS class for oxalate category
function getOxalateCategoryClass(category) {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'very high' || lowerCategory === 'high') {
        return 'oxalate-high';
    } else if (lowerCategory === 'moderate') {
        return 'oxalate-moderate';
    } else if (lowerCategory === 'low' || lowerCategory === 'very low' || lowerCategory === 'little or none') {
        return 'oxalate-low';
    }
    return '';
}

// Display search results as a simple list
function displayResults(query) {
    const container = document.getElementById('resultsContainer');
    const browseContainer = document.querySelector('.browse-container');
    const matches = searchFoodItems(query);
    
    // Hide browse section when showing search results
    if (browseContainer) {
        browseContainer.style.display = 'none';
    }
    
    if (matches.length === 0) {
        container.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }
    
    // Sort matches alphabetically by food item name
    const sortedMatches = matches.sort((a, b) => 
        a.foodItem.localeCompare(b.foodItem)
    );
    
    container.innerHTML = sortedMatches.map((item) => {
        const servingInfo = `${item.servingSize} ${item.servingSizeValue} = ${item.oxalateValue}`;
        const categoryClass = getOxalateCategoryClass(item.oxalateCategory);
        return `
            <div class="result-item ${categoryClass}">
                <div class="food-name">${item.foodItem}</div>
                <div class="serving-info">${servingInfo}</div>
                <div class="oxalate-category">${item.oxalateCategory}</div>
            </div>
        `;
    }).join('');
}

// Populate primary categories dropdown
function populatePrimaryCategories() {
    const primarySelect = document.getElementById('primaryCategory');
    const primaryCategories = [...new Set(csvData.map(item => item.primaryCategory))].sort();
    
    primaryCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        primarySelect.appendChild(option);
    });
}

// Populate secondary categories based on primary category
function populateSecondaryCategories(primaryCategory) {
    const secondarySelect = document.getElementById('secondaryCategory');
    secondarySelect.innerHTML = '<option value="">-- Select Secondary Category --</option>';
    
    if (!primaryCategory) {
        secondarySelect.disabled = true;
        return;
    }
    
    const secondaryCategories = [...new Set(
        csvData
            .filter(item => item.primaryCategory === primaryCategory)
            .map(item => item.secondaryCategory)
    )].sort();
    
    secondaryCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        secondarySelect.appendChild(option);
    });
    
    secondarySelect.disabled = false;
}

// Populate oxalate categories based on primary category
function populateOxalateCategories(primaryCategory) {
    const oxalateSelect = document.getElementById('oxalateCategory');
    oxalateSelect.innerHTML = '<option value="">-- Select Oxalate Category --</option>';
    
    if (!primaryCategory) {
        oxalateSelect.disabled = true;
        return;
    }
    
    const oxalateCategories = [...new Set(
        csvData
            .filter(item => item.primaryCategory === primaryCategory)
            .map(item => item.oxalateCategory)
    )].sort();
    
    oxalateCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        oxalateSelect.appendChild(option);
    });
    
    oxalateSelect.disabled = false;
}

// Filter results based on browse selections
function filterByBrowse() {
    const primaryCategory = document.getElementById('primaryCategory').value;
    const secondaryCategory = document.getElementById('secondaryCategory').value;
    const oxalateCategory = document.getElementById('oxalateCategory').value;
    
    if (!primaryCategory) {
        return [];
    }
    
    let filtered = csvData.filter(item => item.primaryCategory === primaryCategory);
    
    if (secondaryCategory) {
        filtered = filtered.filter(item => item.secondaryCategory === secondaryCategory);
    }
    
    if (oxalateCategory) {
        filtered = filtered.filter(item => item.oxalateCategory === oxalateCategory);
    }
    
    return filtered;
}

// Display browse results
function displayBrowseResults() {
    const container = document.getElementById('resultsContainer');
    const browseContainer = document.querySelector('.browse-container');
    const matches = filterByBrowse();
    
    // Keep browse section visible when showing browse results
    if (browseContainer) {
        browseContainer.style.display = 'block';
    }
    
    if (matches.length === 0) {
        container.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }
    
    // Sort matches alphabetically by food item name
    const sortedMatches = matches.sort((a, b) => 
        a.foodItem.localeCompare(b.foodItem)
    );
    
    container.innerHTML = sortedMatches.map((item) => {
        const servingInfo = `${item.servingSize} ${item.servingSizeValue} = ${item.oxalateValue}`;
        const categoryClass = getOxalateCategoryClass(item.oxalateCategory);
        return `
            <div class="result-item ${categoryClass}">
                <div class="food-name">${item.foodItem}</div>
                <div class="serving-info">${servingInfo}</div>
                <div class="oxalate-category">${item.oxalateCategory}</div>
            </div>
        `;
    }).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadCSV();
    
    // Populate primary categories
    populatePrimaryCategories();
    
    const searchInput = document.getElementById('searchInput');
    const autocompleteDropdown = document.getElementById('autocompleteDropdown');
    const primarySelect = document.getElementById('primaryCategory');
    const secondarySelect = document.getElementById('secondaryCategory');
    const oxalateSelect = document.getElementById('oxalateCategory');
    const browseSearchBtn = document.getElementById('browseSearchBtn');
    
    // Handle input changes
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        showAutocomplete(query);
    });
    
    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value;
            autocompleteDropdown.style.display = 'none';
            displayResults(query);
        }
    });
    
    // Handle primary category change
    primarySelect.addEventListener('change', (e) => {
        const primaryCategory = e.target.value;
        populateSecondaryCategories(primaryCategory);
        populateOxalateCategories(primaryCategory);
        browseSearchBtn.disabled = !primaryCategory;
        
        // Clear results when primary category changes
        if (!primaryCategory) {
            document.getElementById('resultsContainer').innerHTML = '';
        }
    });
    
    // Handle secondary category change
    secondarySelect.addEventListener('change', () => {
        // Optional: could auto-search or just enable search button
    });
    
    // Handle oxalate category change
    oxalateSelect.addEventListener('change', () => {
        // Optional: could auto-search or just enable search button
    });
    
    // Handle browse search button
    browseSearchBtn.addEventListener('click', () => {
        displayBrowseResults();
    });
    
    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
            autocompleteDropdown.style.display = 'none';
        }
    });
});

