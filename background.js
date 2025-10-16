// Background Service Worker - Manages notifications, badge, and background fetching

console.log('🎯 BMC Helix Monitor: Background script loaded');

let lastUnassignedCount = 0;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message.type);
  
  switch (message.type) {
    case 'TICKETS_UPDATED':
      handleTicketsUpdated(message.tickets);
      break;
      
    case 'TICKET_DETAILS_SCRAPED':
      handleTicketDetailsScraped(message.ticket);
      break;
      
    default:
      console.warn('⚠️ Unknown message type:', message.type);
  }
});

// Handle tickets updated from content script
async function handleTicketsUpdated(tickets) {
  console.log('🔄 Tickets updated, processing...');
  
  const result = await chrome.storage.local.get(['currentUser']);
  const currentUser = result.currentUser;
  
  if (!currentUser) {
    console.warn('⚠️ No current user set');
    return;
  }
  
  // Count unassigned tickets
  const unassignedTickets = Object.values(tickets).filter(ticket => {
    return !ticket.assignee || ticket.assignee === 'Unassigned' || ticket.assignee.trim() === '';
  });
  
  const unassignedCount = unassignedTickets.length;
  
  // Update badge
  updateBadge(unassignedCount);
  
  // Check for new unassigned tickets
  if (unassignedCount > lastUnassignedCount) {
    const newCount = unassignedCount - lastUnassignedCount;
    console.log(`🆕 ${newCount} new unassigned ticket(s) detected`);
    
    // Show notification for new tickets
    showNotification(
      'New Unassigned Ticket(s)',
      `${newCount} new ticket(s) need attention!`
    );
  }
  
  lastUnassignedCount = unassignedCount;
  
  // Check for tickets assigned to user that need details scraped
  const myTicketsNeedingScrape = Object.values(tickets).filter(ticket => {
    return ticket.assignee === currentUser && !ticket.scrapedDetails;
  });
  
  if (myTicketsNeedingScrape.length > 0) {
    console.log(`📥 ${myTicketsNeedingScrape.length} ticket(s) assigned to user need details scraped`);
    
    // Auto-fetch details for these tickets
    for (const ticket of myTicketsNeedingScrape) {
      await autoFetchTicketDetails(ticket);
    }
  }
}

// Handle ticket details scraped notification
function handleTicketDetailsScraped(ticket) {
  console.log('✅ Ticket details scraped:', ticket.displayId);
  
  // Could show a notification here if desired
  // showNotification('Ticket Details Loaded', `Details for ${ticket.displayId} have been saved`);
}

// Update badge on extension icon
function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#f56565' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Show desktop notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  });
}

// Auto-fetch ticket details in background
async function autoFetchTicketDetails(ticket) {
  if (!ticket.url) {
    console.warn('⚠️ No URL for ticket:', ticket.displayId);
    return;
  }
  
  console.log('🌐 Auto-fetching details for:', ticket.displayId);
  
  try {
    // Open the ticket page in a hidden/background way
    // We'll create a tab, let content script scrape it, then close it
    const tab = await chrome.tabs.create({ url: ticket.url, active: false });
    
    // Wait for content script to scrape (give it 5 seconds)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Close the tab
    await chrome.tabs.remove(tab.id);
    
    console.log('✅ Auto-fetch completed for:', ticket.displayId);
    
  } catch (error) {
    console.error('❌ Error auto-fetching ticket details:', error);
  }
}

// Handle extension icon click - open sidebar
chrome.action.onClicked.addListener(async (tab) => {
  // Open the side panel
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// Initialize badge on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('🚀 Extension started');
  
  const result = await chrome.storage.local.get(['tickets', 'currentUser']);
  const tickets = result.tickets || {};
  const currentUser = result.currentUser;
  
  if (!currentUser) return;
  
  const unassignedCount = Object.values(tickets).filter(ticket => {
    return !ticket.assignee || ticket.assignee === 'Unassigned' || ticket.assignee.trim() === '';
  }).length;
  
  updateBadge(unassignedCount);
  lastUnassignedCount = unassignedCount;
});

// Also initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('🎉 Extension installed');
  
  // Initialize storage
  chrome.storage.local.set({
    tickets: {},
    currentUser: null
  });
  
  updateBadge(0);
});

// Keep service worker alive
setInterval(() => {
  console.log('💓 Service worker heartbeat');
}, 20000);
