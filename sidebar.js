// Sidebar JavaScript - Manages UI updates and ticket display

let myTickets = [];
let unassignedTickets = [];
let currentUser = null;

// Initialize sidebar when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎫 Sidebar loaded');
  await loadTickets();
  setupStorageListener();
  updateUI();
});

// Load tickets from storage
async function loadTickets() {
  try {
    const result = await chrome.storage.local.get(['tickets', 'currentUser']);
    
    currentUser = result.currentUser || null;
    const allTickets = result.tickets || {};
    
    // Separate tickets into categories
    myTickets = [];
    unassignedTickets = [];
    
    for (const [incNumber, ticket] of Object.entries(allTickets)) {
      if (ticket.assignee === currentUser) {
        myTickets.push(ticket);
      } else if (!ticket.assignee || ticket.assignee === 'Unassigned' || ticket.assignee.trim() === '') {
        unassignedTickets.push(ticket);
      }
    }
    
    // Sort by last modified (newest first)
    myTickets.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    unassignedTickets.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    console.log('📊 Loaded tickets:', {
      myTickets: myTickets.length,
      unassigned: unassignedTickets.length,
      currentUser
    });
    
  } catch (error) {
    console.error('❌ Error loading tickets:', error);
  }
}

// Setup listener for storage changes
function setupStorageListener() {
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && (changes.tickets || changes.currentUser)) {
      console.log('🔄 Storage changed, reloading tickets');
      await loadTickets();
      updateUI();
    }
  });
}

// Update the entire UI
function updateUI() {
  updateLastUpdateTime();
  renderMyTickets();
  renderUnassignedTickets();
}

// Update last update timestamp
function updateLastUpdateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  document.getElementById('lastUpdate').textContent = `Last update: ${timeString}`;
}

// Render "My Tickets" section
function renderMyTickets() {
  const container = document.getElementById('myTicketList');
  const countBadge = document.getElementById('myTicketCount');
  
  countBadge.textContent = myTickets.length;
  
  if (myTickets.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No tickets assigned to you yet</p></div>';
    return;
  }
  
  container.innerHTML = myTickets.map(ticket => createTicketCard(ticket, true)).join('');
  
  // Add click listeners
  container.querySelectorAll('.ticket-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      openTicketInHelix(myTickets[index].displayId);
    });
  });
}

// Render "Unassigned Tickets" section
function renderUnassignedTickets() {
  const container = document.getElementById('unassignedTicketList');
  const countBadge = document.getElementById('unassignedTicketCount');
  
  countBadge.textContent = unassignedTickets.length;
  
  if (unassignedTickets.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No unassigned tickets detected</p></div>';
    return;
  }
  
  container.innerHTML = unassignedTickets.map(ticket => createTicketCard(ticket, false)).join('');
  
  // Add click listeners
  container.querySelectorAll('.ticket-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      openTicketInHelix(unassignedTickets[index].displayId);
    });
  });
}

// Create HTML for a ticket card
function createTicketCard(ticket, isMyTicket) {
  const priorityClass = `priority-${(ticket.priority || 'low').toLowerCase()}`;
  const statusClass = `status-${(ticket.status || '').toLowerCase().replace(/\s+/g, '-')}`;
  
  // Check if ticket is new (within last 5 minutes)
  const isNew = ticket.detectedAt && (Date.now() - ticket.detectedAt < 5 * 60 * 1000);
  
  return `
    <div class="ticket-card">
      <div class="ticket-header">
        <a href="#" class="ticket-id" data-inc="${ticket.displayId}">${ticket.displayId}</a>
        <span class="ticket-priority ${priorityClass}">${ticket.priority || 'N/A'}</span>
      </div>
      
      <div class="ticket-summary">${escapeHtml(ticket.summary || 'No summary available')}</div>
      
      <div class="ticket-meta">
        ${ticket.customerCompany ? `
          <div class="meta-item">
            <span class="meta-label">Customer:</span>
            <span class="meta-value">${escapeHtml(ticket.customerCompany)}</span>
          </div>
        ` : ''}
        
        ${ticket.status ? `
          <div class="meta-item">
            <span class="ticket-status ${statusClass}">${ticket.status}</span>
          </div>
        ` : ''}
        
        ${isNew ? '<span class="new-badge">NEW</span>' : ''}
      </div>
      
      ${ticket.lastModified ? `
        <div class="ticket-timestamp">Modified: ${formatTimestamp(ticket.lastModified)}</div>
      ` : ''}
      
      ${isMyTicket && ticket.submitter ? `
        <div class="ticket-meta" style="margin-top: 8px;">
          <div class="meta-item">
            <span class="meta-label">Submitter:</span>
            <span class="meta-value">${escapeHtml(ticket.submitter)}</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Open ticket in BMC Helix (main tab)
function openTicketInHelix(displayId) {
  // Find the ticket to get its ID
  const ticket = [...myTickets, ...unassignedTickets].find(t => t.displayId === displayId);
  
  if (ticket && ticket.url) {
    chrome.tabs.create({ url: ticket.url });
  } else {
    console.warn('⚠️ No URL found for ticket:', displayId);
  }
}

// Format timestamp to readable format
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return timestamp;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Refresh data every 10 seconds
setInterval(async () => {
  await loadTickets();
  updateUI();
}, 10000);
