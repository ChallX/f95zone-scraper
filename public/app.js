// F95Zone Scraper Frontend Application
class F95Scraper {
    constructor() {
        this.statusCheckInterval = null;
        this.init();
    }

    async init() {
        await this.checkStatus();
        await this.loadGames();        this.setupEventListeners();
        this.startStatusPolling();
    }

    setupEventListeners() {
        const form = document.getElementById('scrapeForm');
        form.addEventListener('submit', (e) => this.handleScrape(e));

        // Add event listeners for refresh buttons
        const refreshHeaderBtn = document.getElementById('refreshHeaderBtn');
        const refreshAfterScrapeBtn = document.getElementById('refreshAfterScrapeBtn');
        
        if (refreshHeaderBtn) {
            refreshHeaderBtn.addEventListener('click', () => this.loadGames());
        }
        
        if (refreshAfterScrapeBtn) {
            refreshAfterScrapeBtn.addEventListener('click', () => this.loadGames());
        }

        // Add manual status refresh functionality
        this.addStatusRefreshButton();
    }

    addStatusRefreshButton() {
        const statusPanel = document.getElementById('statusPanel');
        const parentCard = statusPanel.closest('.card');
        if (parentCard) {
            const cardTitle = parentCard.querySelector('.card-title');
            if (cardTitle && !cardTitle.querySelector('.refresh-status-btn')) {
                cardTitle.innerHTML += `
                    <button class="btn btn-sm btn-outline-secondary ms-2 refresh-status-btn" type="button" title="Refresh Status">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                `;
                
                const refreshBtn = cardTitle.querySelector('.refresh-status-btn');
                refreshBtn.addEventListener('click', () => this.refreshStatus());
            }
        }
    }

    async refreshStatus() {
        const refreshBtn = document.querySelector('.refresh-status-btn');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            refreshBtn.disabled = true;
        }
        
        try {
            await this.checkStatus();
        } finally {
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                icon.classList.remove('fa-spin');
                refreshBtn.disabled = false;
            }        }
    }

    startStatusPolling() {
        // Check status every 30 seconds
        this.statusCheckInterval = setInterval(() => {
            this.checkStatus();
        }, 30000);

        // Stop polling when page is unloaded
        window.addEventListener('beforeunload', () => {
            this.stopStatusPolling();
        });
    }

    stopStatusPolling() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }

    async checkStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            this.displayStatus(data);
        } catch (error) {
            this.displayStatus({ status: 'ERROR', error: error.message });        }
    }

    displayStatus(status) {
        const statusPanel = document.getElementById('statusPanel');
        
        // Check if F95Zone auth status has changed
        const currentAuthStatus = this.lastAuthStatus;
        let newAuthStatus = null;
        if (status.status === 'OK' && status.services.f95zone_auth) {
            newAuthStatus = status.services.f95zone_auth.status;
        }
        
        if (status.status === 'OK') {
            // Determine F95Zone auth status display
            let authIcon = 'fas fa-lock';
            let authColor = 'text-secondary';
            let authText = 'Not Configured';
            
            if (status.services.f95zone_auth) {
                switch (status.services.f95zone_auth.status) {
                    case 'authenticated':
                        authIcon = 'fas fa-unlock';
                        authColor = 'text-success';
                        authText = 'Authenticated';
                        break;
                    case 'not_configured':
                        authIcon = 'fas fa-lock';
                        authColor = 'text-secondary';
                        authText = 'Not Configured';
                        break;
                    case 'not_authenticated':
                        authIcon = 'fas fa-key';
                        authColor = 'text-warning';
                        authText = 'Ready to Login';
                        break;
                    case 'session_expired':
                        authIcon = 'fas fa-clock';
                        authColor = 'text-warning';
                        authText = 'Session Expired';
                        break;
                    case 'error':
                        authIcon = 'fas fa-exclamation-triangle';
                        authColor = 'text-danger';
                        authText = 'Error';
                        break;
                }
            }
            
            statusPanel.innerHTML = `
                <div class="row text-center">
                    <div class="col-md-3">
                        <div class="status-item">
                            <i class="fas fa-spider fa-2x ${status.services.scraper === 'operational' ? 'text-success' : 'text-danger'}"></i>
                            <h6 class="mt-2">Scraper</h6>
                            <small class="text-muted">${status.services.scraper}</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="status-item">
                            <i class="${authIcon} fa-2x ${authColor}"></i>
                            <h6 class="mt-2">F95Zone Auth</h6>
                            <small class="text-muted">${authText}</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="status-item">
                            <i class="fas fa-brain fa-2x ${status.services.ai === 'operational' ? 'text-success' : 'text-warning'}"></i>
                            <h6 class="mt-2">AI Service</h6>
                            <small class="text-muted">${status.services.ai}</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="status-item">
                            <i class="fas fa-table fa-2x ${status.services.sheets === 'operational' ? 'text-success' : 'text-warning'}"></i>
                            <h6 class="mt-2">Google Sheets</h6>
                            <small class="text-muted">${status.services.sheets}</small>
                        </div>
                    </div>
                </div>
            `;

            // Show warnings if services need configuration
            const needsConfig = [];
            if (status.services.ai !== 'operational') needsConfig.push('AI Service');
            if (status.services.sheets !== 'operational') needsConfig.push('Google Sheets');
            if (status.services.f95zone_auth && status.services.f95zone_auth.status === 'not_configured') {
                needsConfig.push('F95Zone Authentication');
            }
            
            if (needsConfig.length > 0) {
                statusPanel.innerHTML += `
                    <div class="alert alert-warning mt-3">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Some services need configuration: ${needsConfig.join(', ')}. Check the setup instructions below.
                    </div>
                `;
            }
              // Show F95Zone auth info if configured but not authenticated
            if (status.services.f95zone_auth && 
                (status.services.f95zone_auth.status === 'not_authenticated' || 
                 status.services.f95zone_auth.status === 'session_expired')) {
                statusPanel.innerHTML += `
                    <div class="alert alert-info mt-3">
                        <i class="fas fa-info-circle me-2"></i>
                        F95Zone authentication will be attempted automatically when scraping protected content.
                    </div>
                `;
            }

            // Show notification if auth status changed
            if (currentAuthStatus && newAuthStatus && currentAuthStatus !== newAuthStatus) {
                this.showAuthStatusChangeNotification(currentAuthStatus, newAuthStatus);
            }

            // Store current auth status for next comparison
            this.lastAuthStatus = newAuthStatus;
        } else {
            statusPanel.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    System Error: ${status.error || 'Unknown error'}
                </div>
            `;
        }
    }

    showAuthStatusChangeNotification(oldStatus, newStatus) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        
        const statusText = {
            'not_authenticated': 'Ready to Login',
            'authenticated': 'Authenticated',
            'session_expired': 'Session Expired',
            'error': 'Error'
        };

        notification.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            F95Zone status changed: ${statusText[oldStatus] || oldStatus} → ${statusText[newStatus] || newStatus}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    async handleScrape(e) {
        e.preventDefault();

        const url = document.getElementById('gameUrl').value;
        const scrapeBtn = document.getElementById('scrapeBtn');
        const progressContainer = document.getElementById('progressContainer');
        const resultContainer = document.getElementById('resultContainer');
        const errorContainer = document.getElementById('errorContainer');
        
        // Generate unique session ID
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        let eventSource = null;
        let isCompleted = false;
        
        // Helper function to safely close EventSource
        const closeEventSource = () => {
            if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
                eventSource.close();
            }
        };
        
        // Reset UI
        resultContainer.classList.add('hidden');
        resultContainer.classList.remove('show');
        errorContainer.classList.add('hidden');
        errorContainer.classList.remove('show');
        progressContainer.classList.remove('hidden');
        progressContainer.classList.add('show');

        // Disable button
        scrapeBtn.disabled = true;
        scrapeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';

        try {
            // Set up Server-Sent Events for real-time progress
            eventSource = new EventSource(`/api/progress/${sessionId}`);
            
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.status === 'connected') {
                        this.updateProgress(0, 'Connecting to server...');
                    } else if (data.status === 'progress') {
                        this.updateProgress(data.progress, data.message);                    } else if (data.status === 'completed') {
                        isCompleted = true;
                        this.updateProgress(100, 'Extraction complete!');
                        setTimeout(() => {
                            this.displayResult(data.data);
                            progressContainer.classList.add('hidden');
                            progressContainer.classList.remove('show');
                            closeEventSource();
                        }, 1000);
                    } else if (data.status === 'error') {
                        isCompleted = true;
                        this.displayError(data.message);
                        progressContainer.classList.add('hidden');
                        progressContainer.classList.remove('show');
                        closeEventSource();
                    }
                    
                    // Refresh status if authentication-related messages are detected
                    if (data.message && (
                        data.message.toLowerCase().includes('authentication') ||
                        data.message.toLowerCase().includes('login') ||
                        data.message.toLowerCase().includes('authenticating')
                    )) {
                        this.checkStatus();
                    }
                } catch (parseError) {
                    console.error('Error parsing SSE data:', parseError);
                }
            };

            eventSource.onerror = (error) => {
                // Only log error if we haven't completed successfully
                if (!isCompleted) {
                    console.error('SSE connection error:', error);
                }
                closeEventSource();
            };

            // Start the scraping process with the session ID
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, sessionId })
            });            const data = await response.json();

            // Handle immediate errors (before SSE processing)
            if (!data.success) {
                // Handle errors
                isCompleted = true;
                closeEventSource();
                throw new Error(data.error || 'Unknown error occurred');
            }
            // If successful, SSE will handle the completion
        } catch (error) {
            console.error('Scrape error:', error);
            isCompleted = true;
            closeEventSource();
            this.displayError(error.message);
            progressContainer.classList.add('hidden');
            progressContainer.classList.remove('show');
        } finally {
            // Re-enable button
            scrapeBtn.disabled = false;
            scrapeBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Extract Game Data';        }
    }

    updateProgress(percent, text) {
        const progressBar = document.querySelector('.progress-bar');
        const progressContainer = document.querySelector('.progress[role="progressbar"]');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            // Remove initial class when progress starts
            if (percent > 0) {
                progressBar.classList.remove('progress-bar-initial');
            }
        }
        if (progressContainer) {
            progressContainer.setAttribute('aria-valuenow', percent);
        }
        if (progressText) {
            progressText.textContent = text;        }
    }

    displayResult(data) {
        const resultContainer = document.getElementById('resultContainer');
        const resultContent = document.getElementById('resultContent');
        // const downloadBtn = document.getElementById('downloadBtn');
        
        // Update the alert heading based on whether it was an update or new game
        const alertHeading = resultContainer.querySelector('.alert-heading');
        if (alertHeading) {
            alertHeading.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>
                ${data.isUpdate ? 'Game Updated!' : 'Extraction Complete!'}
            `;
        }
          resultContent.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                ${data.data.cover_image ? 
                        `<img src="${data.data.cover_image}" alt="Game Cover" class="cover-image img-fluid">` :
                        '<div class="cover-placeholder bg-light d-flex align-items-center justify-content-center"><i class="fas fa-image fa-2x text-muted"></i></div>'
                    }
                </div>
                <div class="col-md-9">
                    <h5 class="text-primary">${data.data.game_name}</h5>
                    <p><strong>Version:</strong> ${data.data.version}</p>
                    <p><strong>Developer:</strong> ${data.data.developer}</p>
                    <p><strong>Total Size:</strong> ${data.data.total_size_gb} GB</p>
                    <p><strong>Game Number:</strong> #${data.gameNumber} ${data.isUpdate ? '<span class="badge bg-info">Updated</span>' : '<span class="badge bg-success">New</span>'}</p>
                    ${data.data.tags && data.data.tags.length > 0 ? 
                        `<div class="mb-2">${data.data.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''
                    }
                    <p class="text-muted small mb-0">${data.data.description}</p>
                </div>
            </div>
        `;        // if (data.downloadUrl) {
        //     downloadBtn.href = data.downloadUrl;
        // }

        resultContainer.classList.remove('hidden');
        resultContainer.classList.add('show');
        
        // Refresh games list and status after successful scrape
        setTimeout(() => {
            this.loadGames();
            this.checkStatus(); // Refresh status to show any authentication changes
        }, 1000);
    }

    displayError(error) {
        const errorContainer = document.getElementById('errorContainer');
        const errorContent = document.getElementById('errorContent');
        
        errorContent.innerHTML = `
            <p><strong>Error:</strong> ${error}</p>
            <p class="mb-0">Please check the URL and try again. Make sure the F95Zone link is valid and accessible.</p>
        `;
        
        errorContainer.classList.remove('hidden');
        errorContainer.classList.add('show');
    }

    async loadGames() {
        const gamesContainer = document.getElementById('gamesContainer');
        
        try {
            gamesContainer.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading games...</span>
                    </div>
                </div>
            `;
            
            const response = await fetch('/api/games');
            const data = await response.json();
            
            if (data.success && data.games.length > 0) {
                this.displayGames(data.games);
            } else {
                gamesContainer.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="fas fa-database fa-3x mb-3"></i>
                        <h5>No games in database yet</h5>
                        <p>Start by scraping your first F95Zone game above!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading games:', error);
            gamesContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading games: ${error.message}
                </div>
            `;
        }
    }

    displayGames(games) {
        const gamesContainer = document.getElementById('gamesContainer');
        
        // Sort games by game number (newest first)
        games.sort((a, b) => (b.game_number || 0) - (a.game_number || 0));
        
        const gamesHtml = games.map(game => `
            <div class="game-card">
                <div class="card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-auto">
                                ${game.cover_image ? 
                                    `<img src="${game.cover_image}" alt="${game.game_name}" class="cover-image">` :
                                    '<div class="cover-placeholder bg-light d-flex align-items-center justify-content-center" style="width: 100px; height: 140px; border-radius: 8px;"><i class="fas fa-image fa-2x text-muted"></i></div>'
                                }
                            </div>
                            <div class="col">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="card-title text-primary mb-1">
                                            #${game.game_number || 'N/A'} - ${game.game_name || 'Unknown Game'}
                                        </h6>
                                        <p class="card-text small text-muted mb-2">
                                            <strong>Version:</strong> ${game.version || 'Unknown'} | 
                                            <strong>Developer:</strong> ${game.developer || 'Unknown'} | 
                                            <strong>Size:</strong> ${game.total_size_gb || '0.00'} GB
                                        </p>
                                        ${game.tags && game.tags.length > 0 ? 
                                            `<div class="mb-2">${game.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''
                                        }
                                        <p class="card-text small">${(game.description || '').substring(0, 150)}${game.description && game.description.length > 150 ? '...' : ''}</p>
                                    </div>
                                    <div class="text-end">
                                        <a href="${game.original_url || '#'}" target="_blank" class="btn btn-outline-primary btn-sm mb-2">
                                            <i class="fas fa-external-link-alt me-1"></i>
                                            View
                                        </a>
                                        ${game.download_links && game.download_links.length > 0 ? 
                                            `<div class="dropdown">
                                                <button class="btn btn-success btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                    <i class="fas fa-download me-1"></i>
                                                    Downloads
                                                </button>
                                                <ul class="dropdown-menu">
                                                    ${game.download_links.map(link => 
                                                        `<li><a class="dropdown-item" href="${link.url}" target="_blank">
                                                            <i class="fas fa-cloud-download-alt me-2"></i>
                                                            ${link.provider} (${link.platform})
                                                        </a></li>`
                                                    ).join('')}
                                                </ul>
                                            </div>` : ''
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        gamesContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">Total Games: ${games.length}</h6>
                <a id="download-sheet" href="/api/download" class="btn btn-success btn-sm">
                    <i class="fas fa-file-excel me-1"></i>
                    Download Excel
                </a>
            </div>
            ${gamesHtml}
        `;

        const downloadSheetBtn = document.getElementById('download-sheet');

        const downloadLink = async() => {
            const response = await fetch('/api/download');
            let data = "";

            if (response.ok) {
                const json = await response.json();
                data = json.downloadUrl.toString();
            }
            return data;
        }

        downloadLink().then(url => {
            downloadSheetBtn.href = url;
        });
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.scraper = new F95Scraper();
});
