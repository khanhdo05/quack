document.addEventListener('DOMContentLoaded', () => {
    const githubInput = document.getElementById('github');
    const linkedinInput = document.getElementById('linkedin');
    const portfolioInput = document.getElementById('portfolio');
    const customLinksContainer = document.getElementById('custom-links');
    const autoSaveButton = document.getElementById('autoSave');

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
        const isCurrentlyEnabled = autoSaveButton.classList.contains('auto-save-enabled');
        const newAutoSaveState = !isCurrentlyEnabled;
        chrome.storage.sync.set({ autoSave: newAutoSaveState });
        updateAutoSaveButton(newAutoSaveState);
    }

    function updateAutoSaveButton(isEnabled) {
        if (isEnabled) {
            autoSaveButton.classList.remove('auto-save-disabled');
            autoSaveButton.classList.add('auto-save-enabled');
        } else {
            autoSaveButton.classList.remove('auto-save-enabled');
            autoSaveButton.classList.add('auto-save-disabled');
        }
    }

    // Function to save all links
    function saveAllLinks() {
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

        chrome.storage.sync.set({ github, linkedin, portfolio, customLinks }).then(() => showSnackbar('Saved!'));
    }

    // Modify existing save button click event
    document.getElementById('save').addEventListener('click', () => {
        saveAllLinks()
    });

    // Add input event listeners for auto-save
    [githubInput, linkedinInput, portfolioInput].forEach(input => {
        input.addEventListener('input', () => {
            if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
        });
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
            img.onerror = () => reject(new Error('Favicon not found')); // Reject if not found
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

    // Fetch favicon and update the icon if found
    if (url) {
        const favicon = await getFavicon(new URL(url).hostname);
        if (favicon) {
            newNameLabel.src = favicon; // Update icon if favicon is found
        }
    }

    // Add input event listeners for auto-save functionality
    newNameInput.addEventListener('input', () => {
        if (newNameInput.value.trim() !== '') {
            newNameInput.classList.remove('empty');
        } else {
            newNameInput.classList.add('empty');
        }
        if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
    });

    newLinkInput.addEventListener('input', () => {
        if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
    });

    deleteButton.addEventListener('click', () => {
        if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
    });

    if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
}

    
    // Add event listener for window unload
    window.addEventListener('unload', () => {
        if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
    });
});
