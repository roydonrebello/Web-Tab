class TabManager {
    constructor(maxTabs) {
        this.tabs = [];
        this.maxTabs = maxTabs;
    }

    async openTab(url) {
        const existingTab = this.tabs.find(tab => tab.url === url);
        const now = new Date();

        if (existingTab) {
            existingTab.accessedAt = now;
            this.setActiveTab(url);
            console.log(`Tab ${url} was accessed.`);
        } else {
            if (this.tabs.length === this.maxTabs) {
                const removedTab = this.tabs.sort((a, b) => a.accessedAt - b.accessedAt).shift();
                this.removeTabElement(removedTab.url);
            }
            this.tabs.push({ url, accessedAt: now });
            this.setActiveTab(url);
        }
        this.displayTabs();

        // Fetch and display the content of the new tab
        await this.fetchAndDisplayContent(url);
    }

    displayTabs() {
        const tabDisplay = document.getElementById('tabDisplay');
        tabDisplay.innerHTML = '';
        this.tabs.forEach(tab => {
            const tabButton = document.createElement('div');
            tabButton.className = 'tab-button';
            tabButton.innerHTML = `
                ${tab.url}
                <button class="close-btn" onclick="event.stopPropagation(); tabManager.closeTab('${tab.url}');">x</button>
            `;
            tabButton.onclick = () => this.handleTabClick(tab.url);
            tabDisplay.appendChild(tabButton);

            // Trigger reflow to apply entering animation
            tabButton.offsetWidth; // Trigger reflow
        });
    }

    handleTabClick(url) {
        this.setActiveTab(url);
        this.fetchAndDisplayContent(url);
    }

    setActiveTab(url) {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            if (button.innerText.includes(url)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update the accessed time for the clicked tab
        const tab = this.tabs.find(tab => tab.url === url);
        if (tab) {
            tab.accessedAt = new Date();
        }
    }

    async fetchAndDisplayContent(url) {
        const tabContentDisplay = document.getElementById('tabContentDisplay');
        tabContentDisplay.innerHTML = ''; // Clear previous content

        try {
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const fetchUrl = proxyUrl + encodeURIComponent(url);

            const response = await fetch(fetchUrl);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
            }

            const data = await response.json();
            tabContentDisplay.innerHTML = `<iframe src="data:text/html;charset=utf-8,${encodeURIComponent(data.contents)}" style="width: 100%; height: 100%; border: none;"></iframe>`;
            tabContentDisplay.classList.add('show');
        } catch (error) {
            tabContentDisplay.innerHTML = `<p>Error fetching content: ${error.message}</p>`;
        }
    }

    removeTabElement(url) {
        const tabButton = [...document.querySelectorAll('.tab-button')].find(button => button.innerText.includes(url));
        if (tabButton) {
            tabButton.classList.add('fade-out');
            setTimeout(() => tabButton.remove(), 300); // Remove after fade-out animation
        }
    }

    closeTab(url) {
        this.tabs = this.tabs.filter(tab => tab.url !== url);
        this.removeTabElement(url);

        // Hide content if the closed tab was active
        const tabContentDisplay = document.getElementById('tabContentDisplay');
        const activeTab = this.tabs.find(tab => tab.accessedAt && tab.accessedAt.getTime() === Math.max(...this.tabs.map(tab => tab.accessedAt.getTime())));
        if (activeTab && activeTab.url === url) {
            tabContentDisplay.innerHTML = '';
            tabContentDisplay.classList.remove('show');
        }

        this.displayTabs();
    }
}

const tabManager = new TabManager(5); // Maximum 5 tabs

function addTab() {
    const tabInput = document.getElementById('tabInput').value;
    if (tabInput) {
        tabManager.openTab(tabInput);
        document.getElementById('tabInput').value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    tabManager.displayTabs();
});
