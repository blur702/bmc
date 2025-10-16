// Content Script - Monitors BMC Helix pages and extracts ticket data

console.log('🚀 BMC Helix Monitor: Content script loaded');

let currentUser = null;
let isDetailPage = false;
let isListPage = false;
let observerActive = false;

// Initialize
(async function init() {
  await detectCurrentUser();
  detectPageType();
  
  if (isListPage) {
    console.log('📋 Detected ticket list page');
    startMonitoring();
  } else if (isDetailPage) {
    console.log('📄 Detected ticket detail page');
    await scrapeDetailPage();
  }
})();

// Detect current logged-in user
async function detectCurrentUser() {
  const userNameElement = document.querySelector('.user-settings__group_item-name');
  
  if (userNameElement) {
    currentUser = userNameElement.textContent.trim();
    console.log('👤 Current user:', currentUser);
    
    // Save to storage
    await chrome.storage.local.set({ currentUser });
  } else {
    console.warn('⚠️ Could not detect current user');
  }
}

// Detect what type of page we're on
function detectPageType() {
  const url = window.location.href;
  
  if (url.includes('/ticket-consoleStudio') || url.includes('/ticket-console')) {
    isListPage = true;
  } else if (url.includes('/incidentPV/') || url.includes('/workorderPV/')) {
    isDetailPage = true;
  }
}

// Start monitoring the ticket list
function startMonitoring() {
  // Initial scan
  scanTicketTable();
  
  // Setup MutationObserver
  const targetNode = document.querySelector('.ui-table-tbody') || document.body;
  
  const observer = new MutationObserver((mutations) => {
    // Debounce: only scan once per batch of mutations
    if (!observerActive) {
      observerActive = true;
      setTimeout(() => {
        scanTicketTable();
        observerActive = false;
      }, 500);
    }
  });
  
  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });
  
  console.log('👀 MutationObserver active, watching for ticket changes');
}

// Scan the ticket table for unassigned tickets or tickets assigned to user
async function scanTicketTable() {
  const rows = document.querySelectorAll('tr.at-data-row');
  console.log(`🔍 Scanning ${rows.length} ticket rows`);
  
  if (rows.length === 0) return;
  
  const tickets = {};
  
  for (const row of rows) {
    try {
      const ticket = extractTicketFromRow(row);
      
      if (ticket) {
        // Only track unassigned or tickets assigned to current user
        const isUnassigned = !ticket.assignee || ticket.assignee === 'Unassigned' || ticket.assignee.trim() === '';
        const isMyTicket = ticket.assignee === currentUser;
        
        if (isUnassigned || isMyTicket) {
          tickets[ticket.displayId] = ticket;
          console.log(`✅ Tracked: ${ticket.displayId} - Assignee: ${ticket.assignee || 'Unassigned'}`);
        }
      }
    } catch (error) {
      console.error('❌ Error extracting ticket from row:', error);
    }
  }
  
  // Update storage with tracked tickets
  await updateTicketStorage(tickets);
}

// Extract ticket data from a table row
function extractTicketFromRow(row) {
  const cells = row.querySelectorAll('td.at-data-cell');
  
  if (cells.length < 10) {
    console.warn('⚠️ Row has fewer cells than expected');
    return null;
  }
  
  // Column indices based on your HTML structure
  // 0: Needs Attention (flag icon)
  // 1: Priority
  // 2: Display ID (link)
  // 3: Target Date
  // 4: SLM Status
  // 5: Customer Company
  // 6: Customer Full Name
  // 7: Assignee Name
  // 8: Summary
  // 9: Status
  // 10: Last Modified Date
  
  const displayIdLink = cells[2].querySelector('a');
  const displayId = displayIdLink ? displayIdLink.textContent.trim() : null;
  
  if (!displayId) {
    console.warn('⚠️ No display ID found in row');
    return null;
  }
  
  const url = displayIdLink ? displayIdLink.href : null;
  
  // Extract priority badge
  const priorityBadge = cells[1].querySelector('.badge, .rx-custom-cell span');
  const priority = priorityBadge ? priorityBadge.textContent.trim() : 'Unknown';
  
  // Extract assignee
  const assigneeCell = cells[7].querySelector('.rx-custom-cell span');
  const assignee = assigneeCell ? assigneeCell.textContent.trim() : '';
  
  // Extract other fields
  const customerCompany = cells[5].querySelector('.rx-custom-cell span')?.textContent.trim() || '';
  const customerFullName = cells[6].querySelector('.rx-custom-cell span')?.textContent.trim() || '';
  const summary = cells[8].querySelector('.rx-custom-cell span')?.textContent.trim() || '';
  const status = cells[9].querySelector('.rx-custom-cell span')?.textContent.trim() || '';
  const lastModified = cells[10].querySelector('.rx-custom-cell span')?.textContent.trim() || '';
  
  // Check for "Needs Attention" flag
  const needsAttention = cells[0].querySelector('.d-icon-flag_adapt') !== null;
  
  return {
    displayId,
    url,
    priority,
    assignee,
    customerCompany,
    customerFullName,
    summary,
    status,
    lastModified,
    needsAttention,
    detectedAt: Date.now(),
    scrapedDetails: false
  };
}

// Update ticket storage, merging with existing data
async function updateTicketStorage(newTickets) {
  try {
    const result = await chrome.storage.local.get(['tickets']);
    const existingTickets = result.tickets || {};
    
    // Merge: keep scraped details if they exist
    const mergedTickets = { ...existingTickets };
    
    for (const [incNumber, newTicket] of Object.entries(newTickets)) {
      if (existingTickets[incNumber]) {
        // Keep scraped details if they exist
        mergedTickets[incNumber] = {
          ...existingTickets[incNumber],
          ...newTicket,
          scrapedDetails: existingTickets[incNumber].scrapedDetails || false,
          submitter: existingTickets[incNumber].submitter || null,
          detailedData: existingTickets[incNumber].detailedData || null
        };
      } else {
        // New ticket
        mergedTickets[incNumber] = newTicket;
      }
    }
    
    // Remove tickets that are no longer unassigned or assigned to user
    const validIncNumbers = Object.keys(newTickets);
    for (const incNumber of Object.keys(mergedTickets)) {
      if (!validIncNumbers.includes(incNumber)) {
        console.log(`🗑️ Removing ticket ${incNumber} (no longer tracked)`);
        delete mergedTickets[incNumber];
      }
    }
    
    await chrome.storage.local.set({ tickets: mergedTickets });
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'TICKETS_UPDATED',
      tickets: mergedTickets
    });
    
    console.log('💾 Storage updated with tickets:', Object.keys(mergedTickets));
    
  } catch (error) {
    console.error('❌ Error updating ticket storage:', error);
  }
}

// Scrape detail page when user visits a ticket
async function scrapeDetailPage() {
  // Wait for page to load
  await waitForElement('.app__content-frame');
  
  // Extract ticket ID from URL
  const urlMatch = window.location.href.match(/\/(incident|workorder)PV\/([A-Z0-9]+)/);
  if (!urlMatch) {
    console.warn('⚠️ Could not extract ticket ID from URL');
    return;
  }
  
  const ticketId = urlMatch[2];
  console.log('🔍 Scraping detail page for ticket:', ticketId);
  
  // Check if this ticket is assigned to current user
  const result = await chrome.storage.local.get(['tickets']);
  const tickets = result.tickets || {};
  
  const ticket = Object.values(tickets).find(t => t.url && t.url.includes(ticketId));
  
  if (!ticket) {
    console.log('ℹ️ Ticket not being tracked, skipping scrape');
    return;
  }
  
  if (ticket.assignee !== currentUser) {
    console.log('ℹ️ Ticket not assigned to current user, skipping scrape');
    return;
  }
  
  // Wait a bit for Angular to render
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Extract detailed information
  const detailedData = await extractDetailPageData();
  
  if (detailedData) {
    // Update storage with detailed data
    tickets[ticket.displayId] = {
      ...ticket,
      ...detailedData,
      scrapedDetails: true,
      scrapedAt: Date.now()
    };
    
    await chrome.storage.local.set({ tickets });
    
    console.log('✅ Detail page data saved for:', ticket.displayId);
    
    // Notify background
    chrome.runtime.sendMessage({
      type: 'TICKET_DETAILS_SCRAPED',
      ticket: tickets[ticket.displayId]
    });
  }
}

// Extract data from detail page
async function extractDetailPageData() {
  // =================================================================================
  // SELECTORS FOR BMC HELIX DETAIL PAGE
  //
  // These selectors were found using the find-selectors.js script.
  // They are based on the actual rendered DOM of BMC Helix detail pages.
  // =================================================================================

  const selectors = {
    // Ticket Number - using ID pattern that contains incident data
    // Falls back to searching for INC pattern in text
    ticketNumber: [
      '[id*="ar1000000161_data"]',  // Primary: field with incident number
      '[id*="incident"]',             // Fallback: any ID containing "incident"
    ],

    // Assignee - using aria-label
    assignee: '[aria-label="Assigned to"]',

    // Customer Company - using aria-label
    customerCompany: '[aria-label="Customer"]',

    // Status - using aria-label
    status: '[aria-label="Status"]',

    // Submitter - try multiple possible labels
    submitter: [
      '[aria-label*="Submitter"]',
      '[aria-label*="Requester"]',
      '[aria-label*="Submitted"]'
    ],

    // Priority - using aria-label (trim whitespace)
    priority: '[aria-label*="Priority"]',

    // Description/Summary
    description: '[aria-label*="Description"], [aria-label*="Summary"]'
  };
  
  const data = {
    ticketNumber: null,
    assignee: null,
    customerCompany: null,
    status: null,
    submitter: null,
    priority: null,
    description: null
  };

  // Helper function to safely query and get text content
  // Supports both single selectors and arrays of selectors (tries each in order)
  const getText = (selector) => {
    // If selector is an array, try each one
    if (Array.isArray(selector)) {
      for (const sel of selector) {
        const element = document.querySelector(sel);
        if (element) {
          const text = element.textContent.trim();
          if (text) return text;
        }
      }
      return null;
    }

    // Single selector
    const element = document.querySelector(selector);
    return element ? element.textContent.trim() : null;
  };

  // Extract data using the defined selectors
  data.ticketNumber = getText(selectors.ticketNumber);
  data.assignee = getText(selectors.assignee);
  data.customerCompany = getText(selectors.customerCompany);
  data.status = getText(selectors.status);
  data.submitter = getText(selectors.submitter);
  data.priority = getText(selectors.priority);
  data.description = getText(selectors.description);

  // If ticket number wasn't found via selector, try to extract from page text
  if (!data.ticketNumber) {
    const incPattern = /INC0\d+/;
    const bodyText = document.body.textContent;
    const match = bodyText.match(incPattern);
    if (match) {
      data.ticketNumber = match[0];
      console.log('📋 Found ticket number via text search:', data.ticketNumber);
    }
  }

  console.log('📝 Extracted detail data:', data);

  // Return only the data that was successfully found
  const foundData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== null && value !== '')
  );

  return Object.keys(foundData).length > 0 ? foundData : null;
}

// Utility: Wait for element to appear
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations) => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_TICKET_DETAILS') {
    // Background wants us to fetch details for a specific ticket
    fetchTicketDetailsInBackground(message.ticketUrl).then(sendResponse);
    return true; // Keep channel open for async response
  }
});

// Fetch ticket details in background (called by background script)
async function fetchTicketDetailsInBackground(ticketUrl) {
  console.log('🌐 Fetching ticket details from:', ticketUrl);
  
  try {
    const response = await fetch(ticketUrl);
    const html = await response.text();
    
    // Parse HTML and extract data
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract data from parsed document
    // This is a placeholder - need real selectors
    const data = {
      submitter: doc.querySelector('[aria-label*="Submitter"]')?.textContent.trim() || null
    };
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error fetching ticket details:', error);
    return { success: false, error: error.message };
  }
}
