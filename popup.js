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
                addCustomLink(link.name, link.url, false);
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
            autoSaveButton.classList.add('auto-save-enabled');
            autoSaveButton.classList.remove('auto-save-disabled');
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
            return {
                name: linkContainer.querySelector('.custom-link-name').textContent,
                url: linkContainer.querySelector('.custom-link-url').value
            };
        });
        
        if (autoSaveButton.classList.contains('auto-save-enabled')) {
            chrome.storage.sync.set({ github, linkedin, portfolio, customLinks }, () => {
                showSnackbar('Links saved!');
            });
        }
    }

    // Modify existing save button click event
    document.getElementById('save').addEventListener('click', saveAllLinks);

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
            showSnackbar('copied to clipboard!');
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

    function addCustomLink(name = '', url = '', isNew = true) {
        const newLinkContainer = document.createElement('div');
        newLinkContainer.className = 'input-container custom-link';

        const newNameLabel = document.createElement('img');
        newNameLabel.className = 'icon';
        newNameLabel.src = 'utils/duck.png';
        newLinkContainer.appendChild(newNameLabel);

        const newNameSpan = document.createElement('span');
        newNameSpan.className = 'custom-link-name';
        newNameSpan.textContent = name;
        if (isNew) {
            newNameSpan.contentEditable = true;
            newNameSpan.dataset.placeholder = 'Custom Link';
            if (!name) {
                newNameSpan.classList.add('empty');
            }
        }
        newLinkContainer.appendChild(newNameSpan);

        const newLinkInput = document.createElement('input');
        newLinkInput.type = 'text';
        newLinkInput.value = url;
        newLinkInput.className = 'custom-link-url';
        newLinkInput.placeholder = 'Enter URL';
        newLinkContainer.appendChild(newLinkInput);

        const editIcon = document.createElement('img');
        editIcon.src = 'utils/edit-icon.png';
        editIcon.className = 'edit-icon';
        editIcon.alt = 'Edit';
        editIcon.style.display = 'none';
        editIcon.addEventListener('click', () => editCustomLink(newLinkContainer));
        newLinkContainer.appendChild(editIcon);

        const deleteIcon = document.createElement('img');
        deleteIcon.src = 'utils/delete-icon.png';
        deleteIcon.className = 'delete-icon';
        deleteIcon.alt = 'Delete';
        deleteIcon.style.display = 'none';
        deleteIcon.addEventListener('click', () => removeCustomLink(newLinkContainer));
        newLinkContainer.appendChild(deleteIcon);

        const newCopyIcon = document.createElement('img');
        newCopyIcon.src = 'utils/copy-icon.png';
        newCopyIcon.className = 'copy-icon';
        newCopyIcon.alt = 'Copy';
        newCopyIcon.addEventListener('click', () => {
            copyToClipboard(newLinkInput.value);
        });
        newLinkContainer.appendChild(newCopyIcon);

        customLinksContainer.appendChild(newLinkContainer);

        if (isNew) {
            // Make the name field editable initially for new links
            newNameSpan.focus();
        }

        // Add input event listeners for auto-save
        newNameSpan.addEventListener('input', () => {
            if (newNameSpan.textContent.trim() !== '') {
                newNameSpan.classList.remove('empty');
            } else {
                newNameSpan.classList.add('empty');
            }
            if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
        });
        newLinkInput.addEventListener('input', () => {
            if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
        });

        if (autoSaveButton.classList.contains('auto-save-enabled') && isNew) saveAllLinks();
    }

    function editCustomLink(linkContainer) {
        const nameSpan = linkContainer.querySelector('.custom-link-name');
        const editIcon = linkContainer.querySelector('.edit-icon');

        // console.log('Current edit icon src:', editIcon.src);

        if (nameSpan.contentEditable === 'true') {
            // Save changes
            nameSpan.contentEditable = 'false';
            editIcon.src = 'utils/edit-icon.png';
            // console.log('Set to edit icon:', editIcon.src);
            if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
        } else {
            // Enter edit mode
            nameSpan.contentEditable = 'true';
            nameSpan.focus();
            editIcon.src = 'utils/save-icon.png';
            // console.log('Set to save icon:', editIcon.src);
        }
    }

    function removeCustomLink(linkContainer) {
        if (confirm('Are you sure you want to remove this custom link?')) {
            linkContainer.remove();
            if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
        }
    }

    // Add event listener for window unload
    window.addEventListener('unload', () => {
        if (autoSaveButton.classList.contains('auto-save-enabled')) saveAllLinks();
    });

    const settingsButton = document.getElementById('settingsButton');
    let isEditMode = false;

    settingsButton.addEventListener('click', toggleEditMode);

    function toggleEditMode() {
        isEditMode = !isEditMode;
        settingsButton.textContent = isEditMode ? 'Done' : 'Edit';
        const customLinks = document.querySelectorAll('.custom-link');
        customLinks.forEach(link => {
            const editIcon = link.querySelector('.edit-icon');
            const deleteIcon = link.querySelector('.delete-icon');
            if (isEditMode) {
                editIcon.style.display = 'inline';
                deleteIcon.style.display = 'inline';
            } else {
                editIcon.style.display = 'none';
                deleteIcon.style.display = 'none';
            }
        });
    }
});
