document.addEventListener('DOMContentLoaded', () => {
    const githubInput = document.getElementById('github');
    const linkedinInput = document.getElementById('linkedin');
    const portfolioInput = document.getElementById('portfolio');
    const customLinksContainer = document.getElementById('custom-links');
    const autoSaveButton = document.getElementById('autoSave');
    const autoSaveDisabledString = 'auto-save-disabled';
    const autoSaveEnabledString = 'auto-save-enabled';

    // Check if auto-save is enabled
    function isAutoSaveEnabled() {
        return autoSaveButton.classList.contains(autoSaveEnabledString);
    }

    // Conditional saving
    function conditionalSave() {
        console.log("Auto-save condition checked.");
        if (isAutoSaveEnabled()) saveAllLinks();
    }

    // Initialize auto-save functionality on inputs
    function initializeAutoSave(inputElement) {
        inputElement.addEventListener('input', () => {
            conditionalSave();
        });
    }

    // Load saved links from Chrome storage
    chrome.storage.sync.get(['github', 'linkedin', 'portfolio', 'customLinks'], (result) => {
        if (result.github) githubInput.value = result.github;
        if (result.linkedin) linkedinInput.value = result.linkedin;
        if (result.portfolio) portfolioInput.value = result.portfolio;

        // Load custom links if available
        if (result.customLinks) {
            result.customLinks.forEach(link => {
                addCustomLink(link.name, link.url);
            });
        }
    });

    // Load auto-save preference
    chrome.storage.sync.get(['autoSave'], (result) => {
        const isAutoSaveEnabled = result.autoSave !== undefined ? result.autoSave : true;
        updateAutoSaveButton(isAutoSaveEnabled);
    });

    autoSaveButton.addEventListener('click', toggleAutoSave);

    function toggleAutoSave() {
        const isCurrentlyEnabled = isAutoSaveEnabled();
        const newAutoSaveState = !isCurrentlyEnabled;
        chrome.storage.sync.set({ autoSave: newAutoSaveState });
        updateAutoSaveButton(newAutoSaveState);
    }

    // Handle auto-save toggle
    function updateAutoSaveButton(isEnabled) {
        if (isEnabled) {
            autoSaveButton.classList.remove('auto-save-disabled');
            autoSaveButton.classList.add('auto-save-enabled');
        } else {
            autoSaveButton.classList.remove('auto-save-enabled');
            autoSaveButton.classList.add('auto-save-disabled');
        }
    }
    // Set up auto-save for main inputs
    [githubInput, linkedinInput, portfolioInput].forEach(initializeAutoSave);

    // Function to save all links
    function saveAllLinks() {
        console.log("Saving all links...");

        const github = githubInput.value;
        const linkedin = linkedinInput.value;
        const portfolio = portfolioInput.value;

        const customLinks = Array.from(customLinksContainer.children).map(linkContainer => {
            const inputs = linkContainer.querySelectorAll('input');
            return {
                name: inputs[0].value,  // Link Name
                url: inputs[1].value    // Link URL
            };
        });

        chrome.storage.sync.set({ github, linkedin, portfolio, customLinks })
        .then(() => {
            console.log("Links saved successfully.");
            if (!isAutoSaveEnabled()) {
                showSnackbar('Saved!');
            } else {
                showSnackbar('Auto-saved!');
            }
        })
        .catch(error => {
            showSnackbar('Error saving links');
            console.error("Error saving links:", error);
        });
    }

    // Modify existing save button click event
    document.getElementById('save').addEventListener('click', () => {
        saveAllLinks()
    });

    // Copy GitHub link
    document.getElementById('copyGithub').addEventListener('click', () => {
        copyToClipboard(githubInput.value);
    });

    // Copy LinkedIn link
    document.getElementById('copyLinkedin').addEventListener('click', () => {
        copyToClipboard(linkedinInput.value);
    });

    // Copy Portfolio link
    document.getElementById('copyPortfolio').addEventListener('click', () => {
        copyToClipboard(portfolioInput.value);
    });

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showSnackbar('Copied to clipboard!');
        });
    }

    document.getElementById('addLink').addEventListener('click', () => {
        addCustomLink(); // Call with no arguments for new empty fields
    });

    function showSnackbar(message) {
        const snackbar = document.getElementById('snackbar');
        snackbar.textContent = message;
        snackbar.style.visibility = 'visible';
        snackbar.style.animation = 'fadein 0.5s, fadeout 0.5s 2.5s';
        setTimeout(() => {
            snackbar.style.visibility = 'hidden';
        }, 3000);
    }

    /**
     * Fetches the favicon (website icon) for a specified URL.
     *
     * This function constructs a URL for the favicon using Google’s favicon service 
     * and attempts to load it as an image. If successful, it returns the favicon URL;
     * if unsuccessful, it returns null and logs an error message.
     */
    async function getFavicon(url) {
        try {
            // Construct the favicon URL using Google's favicon service
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${url}`;
            
            const img = new Image();
            img.src = faviconUrl;

            return new Promise((resolve, reject) => {
                img.onload = () => resolve(faviconUrl); // Resolve with the favicon URL
                img.onerror = () => {
                    img.src = 'utils/duck.png'; // Default icon
                    reject(new Error('Favicon not found'));
                } // Reject if not found
            });
        } catch (error) {
            console.error('Error fetching favicon:', error);
            return null;
        }
    }

    /**
     * Adds a custom link with an associated icon, name, and URL input fields to the UI.
     *
     * This function creates a container for a new link entry, which includes:
     * - An icon representing the link (fetched from the provided URL if available)
     * - Input fields for the site name and URL
     * - A delete button to remove the link entry from the UI
     * - A copy icon for copying the URL to the clipboard
     */
    async function addCustomLink(name = '', url = '') {
        const newLinkContainer = document.createElement('div');
        newLinkContainer.className = 'input-container custom-link';

        const newNameLabel = document.createElement('img');
        newNameLabel.className = 'icon';
        newNameLabel.src = 'utils/duck.png'; // Default icon
        newLinkContainer.appendChild(newNameLabel);

        const newNameInput = document.createElement('input');
        newNameInput.className = 'custom-name';
        newNameInput.type = 'text';
        newNameInput.placeholder = 'site';
        newNameInput.value = name; // Pre-fill if provided
        newLinkContainer.appendChild(newNameInput);

        const newLinkInput = document.createElement('input');
        newLinkInput.type = 'text';
        newLinkInput.value = url;
        newLinkInput.className = 'custom-link-url';
        newLinkInput.placeholder = 'Enter URL';
        newLinkContainer.appendChild(newLinkInput);

        // Create and add delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'x';
        deleteButton.title = 'Delete field';
        deleteButton.className = 'button-35 delete-button';
        deleteButton.addEventListener('click', () => {
            newLinkContainer.remove(); // Remove the custom link container
            conditionalSave();
        });
        newLinkContainer.appendChild(deleteButton);

        const newCopyIcon = document.createElement('img');
        newCopyIcon.src = 'utils/copy-icon.png';
        newCopyIcon.className = 'copy-icon';
        newCopyIcon.alt = 'Copy';
        newCopyIcon.addEventListener('click', () => {
            copyToClipboard(newLinkInput.value); // Copy the link URL to the clipboard
        });
        newLinkContainer.appendChild(newCopyIcon);

        customLinksContainer.appendChild(newLinkContainer);

        // Attach auto-save to each custom input
        initializeAutoSave(newNameInput);
        initializeAutoSave(newLinkInput);

        conditionalSave();

        // Fetch favicon asynchronously and update the icon if found
        // if (url) {
        //     updateFavicon(newNameLabel, url);
        // }
    }

    /**
     * Updates the favicon for a specified icon element using the URL provided.
     */
    async function updateFavicon(iconElement, url) {
        try {
            const favicon = await getFavicon(new URL(url).hostname);
            if (favicon) {
                iconElement.src = favicon;
            }
        } catch (error) {
            console.error('Error fetching favicon:', error);
        }
    }
    
    // Add event listener for window unload
    window.addEventListener('unload', () => {
        conditionalSave();
    });
});
