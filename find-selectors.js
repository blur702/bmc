// =================================================================================
// SELECTOR FINDER SCRIPT FOR BMC HELIX DETAIL PAGES
// =================================================================================
//
// HOW TO USE:
// 1. Open a ticket detail page in BMC Helix (e.g., an incident you're assigned to)
// 2. Press F12 to open browser Developer Tools
// 3. Go to the "Console" tab
// 4. Copy and paste this entire script into the console
// 5. Press Enter to run it
// 6. The script will output the selectors it found
//
// =================================================================================

console.log('%c🔍 BMC Helix Selector Finder', 'font-size: 16px; font-weight: bold; color: #4CAF50');
console.log('Searching for field selectors on this page...\n');

const results = {
    ticketNumber: [],
    assignee: [],
    customerCompany: [],
    status: [],
    submitter: [],
    priority: [],
    description: []
};

// =================================================================================
// 1. FIND TICKET NUMBER / DISPLAY ID
// =================================================================================
console.log('%c📋 Looking for Ticket Number...', 'font-weight: bold; color: #2196F3');

// Strategy 1: Look for INC0 followed by digits
const incPattern = /INC0\d+/;
document.querySelectorAll('*').forEach(el => {
    const text = el.textContent?.trim();
    if (text && incPattern.test(text) && text.length < 50) {
        const selector = getUniqueSelector(el);
        if (selector) {
            results.ticketNumber.push({
                selector: selector,
                value: text.match(incPattern)[0],
                element: el
            });
        }
    }
});

// Strategy 2: Look for elements with ux-id containing "incident" or "display"
document.querySelectorAll('[ux-id*="incident"], [ux-id*="display"], [ux-id*="number"]').forEach(el => {
    const text = el.textContent?.trim();
    if (text && incPattern.test(text)) {
        results.ticketNumber.push({
            selector: `[ux-id="${el.getAttribute('ux-id')}"]`,
            value: text.match(incPattern)[0],
            element: el
        });
    }
});

console.log(`Found ${results.ticketNumber.length} potential ticket number selectors`);
results.ticketNumber.slice(0, 3).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.selector} → "${r.value}"`);
});

// =================================================================================
// 2. FIND ASSIGNEE
// =================================================================================
console.log('%c👤 Looking for Assignee...', 'font-weight: bold; color: #FF9800');

// Strategy 1: Look for elements with aria-label containing "assign"
document.querySelectorAll('[aria-label*="Assign" i], [aria-label*="assignee" i]').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && text.length < 100) {
        results.assignee.push({
            selector: `[aria-label="${el.getAttribute('aria-label')}"]`,
            value: text,
            element: el
        });
    }
});

// Strategy 2: Look for ux-id containing "assign"
document.querySelectorAll('[ux-id*="assign" i]').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && text.length < 100 && !text.includes('\n')) {
        results.assignee.push({
            selector: `[ux-id="${el.getAttribute('ux-id')}"]`,
            value: text,
            element: el
        });
    }
});

// Strategy 3: Look for field labels with "Assigned" text, then find adjacent values
document.querySelectorAll('label, .field-label, .form-label').forEach(label => {
    if (/assign/i.test(label.textContent)) {
        // Look for sibling or nearby value element
        const valueEl = label.nextElementSibling?.querySelector('span, div, input') ||
                       label.parentElement?.querySelector('.field-value, .rx-custom-cell');
        if (valueEl) {
            const text = valueEl.textContent?.trim();
            if (text && text.length > 2 && text.length < 100) {
                results.assignee.push({
                    selector: getUniqueSelector(valueEl),
                    value: text,
                    element: valueEl
                });
            }
        }
    }
});

console.log(`Found ${results.assignee.length} potential assignee selectors`);
results.assignee.slice(0, 3).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.selector} → "${r.value}"`);
});

// =================================================================================
// 3. FIND CUSTOMER COMPANY
// =================================================================================
console.log('%c🏢 Looking for Customer Company...', 'font-weight: bold; color: #9C27B0');

// Strategy 1: Look for aria-label containing "customer" or "company"
document.querySelectorAll('[aria-label*="Customer" i], [aria-label*="Company" i]').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && text.length < 100 && !text.includes('\n')) {
        results.customerCompany.push({
            selector: `[aria-label="${el.getAttribute('aria-label')}"]`,
            value: text,
            element: el
        });
    }
});

// Strategy 2: Look for ux-id containing "customer" or "company"
document.querySelectorAll('[ux-id*="customer" i], [ux-id*="company" i]').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && text.length < 100 && !text.includes('\n')) {
        results.customerCompany.push({
            selector: `[ux-id="${el.getAttribute('ux-id')}"]`,
            value: text,
            element: el
        });
    }
});

// Strategy 3: Look for field labels
document.querySelectorAll('label, .field-label, .form-label').forEach(label => {
    if (/customer.*company|company/i.test(label.textContent)) {
        const valueEl = label.nextElementSibling?.querySelector('span, div, input') ||
                       label.parentElement?.querySelector('.field-value, .rx-custom-cell');
        if (valueEl) {
            const text = valueEl.textContent?.trim();
            if (text && text.length > 2 && text.length < 100) {
                results.customerCompany.push({
                    selector: getUniqueSelector(valueEl),
                    value: text,
                    element: valueEl
                });
            }
        }
    }
});

console.log(`Found ${results.customerCompany.length} potential customer company selectors`);
results.customerCompany.slice(0, 3).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.selector} → "${r.value}"`);
});

// =================================================================================
// 4. FIND STATUS
// =================================================================================
console.log('%c📊 Looking for Status...', 'font-weight: bold; color: #00BCD4');

document.querySelectorAll('[aria-label*="Status" i], [ux-id*="status" i]').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && text.length < 50 && !text.includes('\n')) {
        const selector = el.getAttribute('aria-label')
            ? `[aria-label="${el.getAttribute('aria-label')}"]`
            : `[ux-id="${el.getAttribute('ux-id')}"]`;
        results.status.push({
            selector: selector,
            value: text,
            element: el
        });
    }
});

console.log(`Found ${results.status.length} potential status selectors`);
results.status.slice(0, 3).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.selector} → "${r.value}"`);
});

// =================================================================================
// 5. FIND SUBMITTER
// =================================================================================
console.log('%c📝 Looking for Submitter...', 'font-weight: bold; color: #E91E63');

document.querySelectorAll('[aria-label*="Submit" i], [aria-label*="Requester" i], [ux-id*="submit" i]').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && text.length < 100 && !text.includes('\n')) {
        const selector = el.getAttribute('aria-label')
            ? `[aria-label="${el.getAttribute('aria-label')}"]`
            : `[ux-id="${el.getAttribute('ux-id')}"]`;
        results.submitter.push({
            selector: selector,
            value: text,
            element: el
        });
    }
});

console.log(`Found ${results.submitter.length} potential submitter selectors`);
results.submitter.slice(0, 3).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.selector} → "${r.value}"`);
});

// =================================================================================
// 6. FIND PRIORITY
// =================================================================================
console.log('%c⚠️ Looking for Priority...', 'font-weight: bold; color: #F44336');

document.querySelectorAll('[aria-label*="Priority" i], [ux-id*="priority" i]').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && text.length < 50) {
        const selector = el.getAttribute('aria-label')
            ? `[aria-label="${el.getAttribute('aria-label')}"]`
            : `[ux-id="${el.getAttribute('ux-id')}"]`;
        results.priority.push({
            selector: selector,
            value: text,
            element: el
        });
    }
});

console.log(`Found ${results.priority.length} potential priority selectors`);
results.priority.slice(0, 3).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.selector} → "${r.value}"`);
});

// =================================================================================
// HELPER FUNCTIONS
// =================================================================================

function getUniqueSelector(element) {
    // Try to build a unique selector for the element
    if (element.id) {
        return `#${element.id}`;
    }

    if (element.getAttribute('ux-id')) {
        return `[ux-id="${element.getAttribute('ux-id')}"]`;
    }

    if (element.getAttribute('aria-label')) {
        return `[aria-label="${element.getAttribute('aria-label')}"]`;
    }

    // Try class-based selector
    if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ').filter(c => c && !c.match(/ng-/));
        if (classes.length > 0) {
            return `.${classes[0]}`;
        }
    }

    return null;
}

// =================================================================================
// OUTPUT SUMMARY
// =================================================================================
console.log('\n%c📋 SUMMARY - Copy these selectors into content-script.js', 'font-size: 14px; font-weight: bold; color: #4CAF50; background: #E8F5E9; padding: 8px');

console.log('\n// Paste these into the selectors object in extractDetailPageData():');
console.log('const selectors = {');

if (results.ticketNumber.length > 0) {
    console.log(`  ticketNumber: '${results.ticketNumber[0].selector}',`);
}

if (results.assignee.length > 0) {
    console.log(`  assignee: '${results.assignee[0].selector}',`);
}

if (results.customerCompany.length > 0) {
    console.log(`  customerCompany: '${results.customerCompany[0].selector}',`);
}

if (results.status.length > 0) {
    console.log(`  status: '${results.status[0].selector}',`);
}

if (results.submitter.length > 0) {
    console.log(`  submitter: '${results.submitter[0].selector}',`);
}

if (results.priority.length > 0) {
    console.log(`  priority: '${results.priority[0].selector}',`);
}

console.log('};');

// Store results globally so you can inspect them
window.selectorFinderResults = results;

console.log('\n%c💡 TIP: Results are stored in window.selectorFinderResults', 'color: #666');
console.log('You can inspect individual elements by running:');
console.log('  window.selectorFinderResults.assignee[0].element');
console.log('  window.selectorFinderResults.customerCompany[0].element');
console.log('\nTo highlight an element on the page, run:');
console.log('  window.selectorFinderResults.assignee[0].element.style.border = "3px solid red"');
