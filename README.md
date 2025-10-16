# 🎫 BMC Helix Ticket Monitor

A Chrome extension that monitors BMC Helix for unassigned tickets and automatically tracks tickets assigned to you with real-time updates and detailed information scraping.

## ✨ Features

- **Real-time Monitoring**: Watches the ticket console for new unassigned tickets
- **Dual View Sidebar**: 
  - "My Tickets" section for tickets assigned to you
  - "Unassigned Tickets" section for available tickets
- **Smart Filtering**: 
  - Automatically removes tickets assigned to others
  - Keeps and tracks tickets assigned to you
- **Auto-scraping**: When you're assigned a ticket, the extension automatically fetches and stores detailed information
- **Badge Counter**: Shows the number of unassigned tickets on the extension icon
- **Desktop Notifications**: Get notified when new unassigned tickets appear
- **Beautiful UI**: Modern, dark-themed sidebar with smooth animations

## 📦 Installation

### Method 1: Load Unpacked (Development)

1. **Download/Clone this repository**
   ```bash
   git clone <repo-url>
   cd bmc-helix-monitor
   ```

2. **Add placeholder icons**
   - Create an `icons` folder in the project root
   - Add icon files: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
   - (Or use any PNG images as placeholders)

3. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `bmc-helix-monitor` folder

5. **Done!** The extension icon should appear in your toolbar

### Method 2: Create Icons Programmatically

If you don't have icons, you can create simple colored squares:

```bash
# Create icons folder
mkdir icons

# Create placeholder PNGs (requires ImageMagick)
convert -size 16x16 xc:#667eea icons/icon16.png
convert -size 32x32 xc:#667eea icons/icon32.png
convert -size 48x48 xc:#667eea icons/icon48.png
convert -size 128x128 xc:#667eea icons/icon128.png
```

## 🚀 Usage

1. **Login to BMC Helix**
   - Navigate to `https://house-smartit.fed.onbmc.com/smartit/app/`
   - Ensure you're logged in via SSO

2. **Open Ticket Console**
   - Go to the ticket console: `#/ticket-consoleStudio`
   - The extension will automatically start monitoring

3. **Open the Sidebar**
   - Click the extension icon in your toolbar
   - The sidebar will open showing tracked tickets

4. **Track Tickets**
   - Unassigned tickets appear in the "Unassigned Tickets" section
   - When you assign a ticket to yourself, it moves to "My Tickets"
   - Click any ticket to open it in BMC Helix
   - The extension auto-scrapes details when you visit tickets assigned to you

5. **Badge Counter**
   - The extension icon shows the number of unassigned tickets
   - Updates in real-time as tickets are assigned/unassigned

## 📊 How It Works

### Ticket List Monitoring
- Uses MutationObserver to detect DOM changes
- Scans table rows for ticket data
- Filters for unassigned or user-assigned tickets
- Updates storage and sidebar in real-time

### Detail Page Scraping
- Detects when you visit a ticket detail page
- If the ticket is assigned to you, extracts additional data
- Stores submitter, detailed status, and other fields
- Auto-fetches details in background for newly assigned tickets

### Storage Structure
```javascript
{
  "currentUser": "Kevin Althaus",
  "tickets": {
    "INC000002900782": {
      "displayId": "INC000002900782",
      "url": "https://...",
      "priority": "Low",
      "assignee": "Kevin Althaus",
      "customerCompany": "Hamadeh, Abe",
      "summary": "Web Add or Edit Page Content",
      "status": "Assigned",
      "lastModified": "Oct 16, 2025, 12:51:03 PM",
      "detectedAt": 1729094400000,
      "scrapedDetails": true,
      "submitter": "Lori Hunnicutt",
      "scrapedAt": 1729094500000
    }
  }
}
```

## 🎨 UI Components

### Sidebar Sections
1. **Header**: Shows last update time
2. **My Tickets**: Tickets assigned to you with full details
3. **Unassigned Tickets**: Available tickets waiting to be claimed

### Ticket Card
- Ticket ID (clickable link)
- Priority badge (color-coded)
- Summary/Description
- Customer Company
- Status
- Last Modified timestamp
- "NEW" badge for recent tickets (< 5 min)

## 🔧 Technical Details

### Permissions Required
- `storage`: Store ticket data locally
- `notifications`: Desktop notifications for new tickets
- `sidePanel`: Display sidebar UI
- `tabs`: Open tickets in new tabs
- `activeTab`: Read data from active tab
- Host permissions for `house-smartit.fed.onbmc.com`

### Files
- `manifest.json`: Extension configuration
- `background.js`: Service worker (badge, notifications, auto-fetch)
- `content-script.js`: Page monitor and data extractor
- `sidebar.html/css/js`: Sidebar UI
- `icons/`: Extension icons

### Browser Compatibility
- Chrome 121+ (Manifest V3)
- Edge 121+ (Chromium-based)

## 🐛 Troubleshooting

### Extension not loading
- Check Chrome version (must be 121+)
- Ensure Developer Mode is enabled
- Check console for errors: `chrome://extensions/` → Details → Inspect views: background page

### No tickets appearing
- Ensure you're on the ticket console page
- Check browser console (F12) for errors
- Verify you're logged in to BMC Helix

### Detail scraping not working
- The detail page selectors may need updating
- Check browser console on detail page for errors
- Angular rendering may take longer - try increasing wait time

### Badge not updating
- Check background service worker console
- Verify storage is being updated: `chrome://extensions/` → Storage

## 🚧 Known Limitations

1. **Detail Page Selectors**: The current detail page scraper uses placeholder selectors. You'll need to inspect the actual rendered detail page and update the selectors in `content-script.js` → `extractDetailPageData()` function.

2. **Angular Timing**: BMC Helix uses Angular, which renders dynamically. If scraping fails, try increasing wait times.

3. **SSO Session**: The extension assumes you're logged in. If your session expires, you'll need to refresh and login again.

## 🔮 Future Enhancements

- [ ] Custom notification sounds
- [ ] Ticket filters (priority, customer, status)
- [ ] Export ticket data to CSV
- [ ] Ticket assignment from sidebar
- [ ] Dark/Light theme toggle
- [ ] Keyboard shortcuts

## 📝 Notes

- This extension only works with the specific BMC Helix instance at `house-smartit.fed.onbmc.com`
- Data is stored locally in your browser only
- No data is sent to external servers

## 🤝 Contributing

Found a bug? Have a feature request? Want to improve the detail page scraper?

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a PR

## 📄 License

MIT License - do whatever the fuck you want with this code.

---

**Built with ❤️ and a lot of cursing by someone who's tired of manually checking for unassigned tickets.**
