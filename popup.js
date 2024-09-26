document.addEventListener('DOMContentLoaded', () => {
    const githubInput = document.getElementById('github');
    const linkedinInput = document.getElementById('linkedin');
    const portfolioInput = document.getElementById('portfolio');
    const customLinksContainer = document.getElementById('custom-links');

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

    // Save links
    document.getElementById('save').addEventListener('click', () => {
        const github = githubInput.value;
        const linkedin = linkedinInput.value;
        const portfolio = portfolioInput.value;

        // Collect custom links
        const customLinks = Array.from(customLinksContainer.children).map(linkContainer => {
            const inputs = linkContainer.querySelectorAll('input');
            return {
                name: inputs[0].value,  // Link Name
                url: inputs[1].value    // Link URL
            };
        });

        // Save all links
        chrome.storage.sync.set({ github, linkedin, portfolio, customLinks }, () => {
            showSnackbar('Links saved!');
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

    function addCustomLink(name = '', url = '') {
        const newLinkContainer = document.createElement('div');
        newLinkContainer.className = 'input-container';
    
        const newNameLabel = document.createElement('label');
        newNameLabel.className = 'label';
        newNameLabel.textContent = 'Site';
        newLinkContainer.appendChild(newNameLabel);
    
        const newNameInput = document.createElement('input');
        newNameInput.type = 'text';
        newNameInput.placeholder = 'Site';
        newNameInput.value = name; // Pre-fill if provided
        newNameInput.className = 'short-input'; // Apply the short input class
        newLinkContainer.appendChild(newNameInput);
    
        const newLinkLabel = document.createElement('label');
        newLinkLabel.className = 'label';
        newLinkLabel.textContent = 'URL';
        newLinkContainer.appendChild(newLinkLabel);
    
        const newLinkInput = document.createElement('input');
        newLinkInput.type = 'text';
        newLinkInput.placeholder = 'URL';
        newLinkInput.value = url; // Pre-fill if provided
        newLinkContainer.appendChild(newLinkInput);
    
        const newCopyIcon = document.createElement('img');
        newCopyIcon.src = 'utils/copy-icon.png';
        newCopyIcon.className = 'copy-icon';
        newCopyIcon.alt = 'Copy';
        newCopyIcon.addEventListener('click', () => {
            copyToClipboard(newLinkInput.value);
        });
        newLinkContainer.appendChild(newCopyIcon);
    
        // Create and add delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'x';
        deleteButton.className = 'delete-button'; // Add class for styling if needed
        deleteButton.addEventListener('click', () => {
            newLinkContainer.remove(); // Remove the custom link container
        });
        newLinkContainer.appendChild(deleteButton);
    
        customLinksContainer.appendChild(newLinkContainer);
    }    
});
