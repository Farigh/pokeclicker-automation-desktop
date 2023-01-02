class AutomationScriptManager
{
    static run(automationBaseUrl)
    {
        this.__internal__automationBaseUrl = automationBaseUrl;

        // Set the automation script settings default values
        this.__internal__setDefaultLocalStorageValue(this.__internal__defaultScriptEnabledKey, true);
        this.__internal__setDefaultLocalStorageValue(this.__internal__defaultScriptDisableFeatureKey, false);
        this.__internal__setDefaultLocalStorageValue(this.__internal__defaultScriptDisableSettingsKey, false);

        this.__internal__injectCss();
        this.__internal__initCustomData();
        this.__internal__buildMenu();
        this.__internal__buildScriptEditModal();

        this.__internal__loadScripts();
    }

    /******************************\
    |***    Internal members    ***|
    \******************************/

    static __internal__storageKeyPrefix = "Pokeclicker-Scripts-";
    static __internal__defaultScriptErrors = null;
    static __internal__defaultScriptErrorsLabel = null;
    static __internal__defaultScriptKeyPrefix = `${this.__internal__storageKeyPrefix}Farigh-Automation-`;
    static __internal__defaultScriptEnabledKey = `${this.__internal__defaultScriptKeyPrefix}Enabled`;
    static __internal__defaultScriptDisableFeatureKey = `${this.__internal__defaultScriptKeyPrefix}FeatureDisabledByDefault`;
    static __internal__defaultScriptDisableSettingsKey = `${this.__internal__defaultScriptKeyPrefix}SettingsDisabledByDefault`;

    static __internal__scriptMenuButtonLabel = null;
    static __internal__scriptMenuButtonErrorLabel = null;
    static __internal__scriptListContainer = null;
    static __internal__scriptEditPanel = {};

    static __internal__customScriptDataKey = `${this.__internal__storageKeyPrefix}Custom-Scripts-Data`;
    static __internal__customScriptList = [];
    static __internal__customScriptListContainer = null;
    static __internal__customScriptStorageKeys = new Set();

    /**
     * @brief Loads custom script data from the local storage
     */
    static __internal__initCustomData()
    {
        const currentData = localStorage.getItem(this.__internal__customScriptDataKey);

        // No data to restore
        if (!currentData)
        {
            return;
        }

        this.__internal__customScriptList = JSON.parse(currentData);

        // Restore storage keys
        for (const script of this.__internal__customScriptList)
        {
            this.__internal__customScriptStorageKeys.add(script.storageKey);
        }
    }

    /**
     * @brief Builds the script menu
     */
    static __internal__buildMenu()
    {
        // Add the script list
        const scriptMenuContainer = document.createElement("div");
        scriptMenuContainer.classList.add("pokeWithScript-menu-container");

        // Menu button div
        const menuButtonDiv = document.createElement("div");
        menuButtonDiv.classList.add("pokeWithScript-main-button");
        scriptMenuContainer.appendChild(menuButtonDiv);

        menuButtonDiv.onclick = function()
            {
                this.__internal__scriptListContainer.classList.toggle('visible');
            }.bind(this);

        // Button label
        const scriptMenuButtonLabelContainer = document.createElement("span");
        scriptMenuButtonLabelContainer.classList.add("pokeWithScript-button-label");
        menuButtonDiv.appendChild(scriptMenuButtonLabelContainer);
        this.__internal__scriptMenuButtonLabel = document.createElement("span");
        this.__internal__scriptMenuButtonLabel.textContent = this.__internal__getActiveScriptText();
        scriptMenuButtonLabelContainer.appendChild(this.__internal__scriptMenuButtonLabel);

        // Error label
        this.__internal__scriptMenuButtonErrorLabel = document.createElement("span");
        this.__internal__scriptMenuButtonErrorLabel.classList.add("pokeWithScript-button-error-label");
        scriptMenuButtonLabelContainer.appendChild(this.__internal__scriptMenuButtonErrorLabel);

        // Add the script list
        this.__internal__buildScriptList(scriptMenuContainer);

        // Add the menu to the document
        document.body.appendChild(scriptMenuContainer);
    }

    /**
     * @brief Builds the script edit modal
     */
    static __internal__buildScriptEditModal()
    {
        // Add the container
        this.__internal__scriptEditPanel.container = document.createElement("div");
        this.__internal__scriptEditPanel.container.hidden = true;
        this.__internal__scriptEditPanel.container.classList.add("pokeWithScript-edit-container");

        // Add the title
        this.__internal__scriptEditPanel.tabTitle = document.createElement("div");
        this.__internal__scriptEditPanel.tabTitle.classList.add("pokeWithScript-edit-title");
        this.__internal__scriptEditPanel.container.appendChild(this.__internal__scriptEditPanel.tabTitle);

        // Add the tab container
        const tabContainer = document.createElement("div");
        tabContainer.classList.add("pokeWithScript-edit-tab");
        this.__internal__scriptEditPanel.container.appendChild(tabContainer);

        // Script name input
        const editNameContainer = document.createElement("div");
        editNameContainer.appendChild(document.createTextNode("Script name: "));
        this.__internal__scriptEditPanel.scriptTitle = document.createElement("div");
        this.__internal__scriptEditPanel.scriptTitle.contentEditable = true;
        this.__internal__scriptEditPanel.scriptTitle.spellcheck = false;
        this.__internal__scriptEditPanel.scriptTitle.classList.add("pokeWithScript-edit-input");
        editNameContainer.appendChild(this.__internal__scriptEditPanel.scriptTitle);
        tabContainer.appendChild(editNameContainer);

        // Script content input label
        const editContentLabelContainer = document.createElement("div");
        editContentLabelContainer.appendChild(document.createTextNode("Script content: "));
        editContentLabelContainer.style.marginTop= "20px";
        tabContainer.appendChild(editContentLabelContainer);

        // Script content input
        this.__internal__scriptEditPanel.scriptContent = document.createElement("div");
        this.__internal__scriptEditPanel.scriptContent.contentEditable = true;
        this.__internal__scriptEditPanel.scriptContent.spellcheck = false;
        this.__internal__scriptEditPanel.scriptContent.ariaMultiline = true;
        this.__internal__scriptEditPanel.scriptContent.classList.add("pokeWithScript-edit-script-area");
        tabContainer.appendChild(this.__internal__scriptEditPanel.scriptContent);

        // Save button
        this.__internal__scriptEditPanel.saveButton = document.createElement("div");
        this.__internal__scriptEditPanel.saveButton.classList.add("pokeWithScript-edit-save-button");
        tabContainer.appendChild(this.__internal__scriptEditPanel.saveButton);
        this.__internal__scriptEditPanel.saveButton.onclick = this.__internal__saveScriptChanges.bind(this);

        // Add the modal to the document
        document.body.appendChild(this.__internal__scriptEditPanel.container);
    }

    /**
     * @brief Builds the script list
     *
     * @param parent: The parent div to add the list to
     */
    static __internal__buildScriptList(parent)
    {
        // Add the scripts container
        this.__internal__scriptListContainer = document.createElement("div");
        this.__internal__scriptListContainer.classList.add("pokeWithScript-menu-list");
        parent.appendChild(this.__internal__scriptListContainer);

        // Add list content container
        const contentContainer = document.createElement("div");
        contentContainer.classList.add("pokeWithScript-menu-list-content");
        this.__internal__scriptListContainer.appendChild(contentContainer);

        // Add pokeclicker automation to the list
        const defaultScriptContainer = document.createElement("div");

        const defaultScriptElem = this.__internal__addScriptElement(
            { name: "Pokeclicker automation", storageKey: this.__internal__defaultScriptEnabledKey }, false);
        defaultScriptContainer.appendChild(defaultScriptElem);

        this.__internal__defaultScriptErrorsLabel = document.createElement("span");
        this.__internal__defaultScriptErrorsLabel.style.color = "#FF7E7E";
        defaultScriptElem.appendChild(this.__internal__defaultScriptErrorsLabel);

        const defaultScriptDisableFeaturesElem = this.__internal__addScriptElement(
            { name: "Disable all features by default", storageKey: this.__internal__defaultScriptDisableFeatureKey }, false);
        defaultScriptDisableFeaturesElem.style.marginLeft = "42px";
        defaultScriptContainer.appendChild(defaultScriptDisableFeaturesElem);
        const defaultScriptDisableSettingsElem = this.__internal__addScriptElement(
            { name: "Disable all settings by default", storageKey: this.__internal__defaultScriptDisableSettingsKey }, false);
        defaultScriptDisableSettingsElem.style.marginLeft = "42px";
        defaultScriptContainer.appendChild(defaultScriptDisableSettingsElem);

        this.__internal__customScriptListContainer = document.createElement("div");
        this.__internal__customScriptListContainer.style.minWidth = "340px";
        this.__internal__updateCustomScriptList();
        defaultScriptContainer.appendChild(this.__internal__customScriptListContainer);

        // Add new script button
        defaultScriptContainer.appendChild(this.__internal__createAddScriptButton());

        // Add the reload button
        this.__internalReloadButtonContainer = document.createElement("div");
        this.__internalReloadButtonContainer.hidden = true;
        this.__internalReloadButtonContainer.style.color = "#eb963f";
        this.__internalReloadButtonContainer.appendChild(document.createTextNode("Changes will only be applied after reloading"));
        const reloadButton = document.createElement("div");
        reloadButton.classList.add("pokeWithScript-reload-button");
        reloadButton.textContent = "Reload";
        reloadButton.onclick = function() { location.reload(); };
        this.__internalReloadButtonContainer.appendChild(reloadButton);

        defaultScriptContainer.appendChild(this.__internalReloadButtonContainer);

        contentContainer.appendChild(defaultScriptContainer);
    }

    /**
     * @brief Loads enabled scripts
     */
    static __internal__loadScripts()
    {
        // Load the default script, if enabled
        if (localStorage.getItem(this.__internal__defaultScriptEnabledKey) == "true")
        {
            try
            {
                AutomationComponentLoader.loadFromUrl(this.__internal__automationBaseUrl,
                                                      localStorage.getItem(this.__internal__defaultScriptDisableFeatureKey) == "true",
                                                      localStorage.getItem(this.__internal__defaultScriptDisableSettingsKey) == "true");
            }
            catch(error)
            {
                this.__internal__defaultScriptErrorsLabel.textContent = "⚠️ Error occured";
                this.__internal__defaultScriptErrorsLabel.style.marginLeft = "5px";
                this.__internal__defaultScriptErrors = error;
            }
        }

        // Load custom scripts
        let customScriptsErrorCount = 0;
        for (const script of this.__internal__customScriptList)
        {
            if (localStorage.getItem(script.storageKey) != "true")
            {
                // Don't run disabled scripts
                continue;
            }

            try
            {
                eval(script.content);
            }
            catch(error)
            {
                script.errors = error;
                customScriptsErrorCount++;
            }
        }

        if (customScriptsErrorCount > 0)
        {
            this.__internal__updateCustomScriptList();
        }

        // Update the menu button label
        if ((customScriptsErrorCount > 0) || (this.__internal__defaultScriptErrors != null))
        {
            const failedScripts = (this.__internal__defaultScriptErrors ? 1 : 0) + customScriptsErrorCount;
            this.__internal__scriptMenuButtonErrorLabel.appendChild(document.createTextNode(",  "));
            const errorLabel = document.createElement("span");
            errorLabel.style.color = "#FF7E7E";
            errorLabel.textContent = `${failedScripts}  error${failedScripts > 1 ? "s" : ""}`;
            this.__internal__scriptMenuButtonErrorLabel.appendChild(errorLabel);
        }

        // Rethrow the error if any occured in the default script
        if (this.__internal__defaultScriptErrors)
        {
            throw this.__internal__defaultScriptErrors;
        }
    }

    /**
     * @brief Adds a script toogle button with its label
     *
     * @param script: The script data
     * @param canEdit: True if the user can edit or delete this script, false otherwise
     */
    static __internal__addScriptElement(script, canEdit)
    {
        const container = document.createElement("div");
        container.style.height = "32px";

        // Add the enable button
        const defaultScriptEnableButton = this.__internal__addLocalStorageBoundToggleButton(script.storageKey);
        container.appendChild(defaultScriptEnableButton);

        // Add the script name
        const scriptLabel = document.createElement("span");
        scriptLabel.textContent = script.name;
        container.appendChild(scriptLabel);

        if (canEdit)
        {
            // Add edit button
            const editButton = this.__internal__createEditButton();
            container.appendChild(editButton);

            editButton.onclick = function()
                {
                    this.__internal__scriptEditPanel.storageKey = script.storageKey;
                    this.__internal__scriptEditPanel.tabTitle.textContent = "Edit script";
                    this.__internal__scriptEditPanel.scriptTitle.textContent = script.name;
                    this.__internal__scriptEditPanel.scriptContent.textContent = script.content;
                    this.__internal__scriptEditPanel.saveButton.textContent = "Save changes";
                    this.__internal__scriptEditPanel.container.hidden = false;
                }.bind(this);

            // Add the delete button
            const deleteButton = this.__internal__createDeleteButton();
            container.appendChild(deleteButton);

            const deleteConfirmationContainer = document.createElement("span");
            deleteConfirmationContainer.classList.add("pokeWithScript-confirmation-container");
            container.appendChild(deleteConfirmationContainer);

            deleteConfirmationContainer.appendChild(document.createTextNode("Are you sure ?"));

            const noButton = document.createElement("div");
            noButton.classList.add("pokeWithScript-no-button");
            noButton.textContent = "No";
            deleteConfirmationContainer.appendChild(noButton);

            const yesButton = document.createElement("div");
            yesButton.classList.add("pokeWithScript-yes-button");
            yesButton.textContent = "Yes";
            deleteConfirmationContainer.appendChild(yesButton);

            noButton.onclick = function()
                {
                    deleteConfirmationContainer.classList.remove("visible");
                    editButton.hidden = false;
                    deleteButton.hidden = false;
                };
            yesButton.onclick = function()
                {
                    deleteConfirmationContainer.classList.remove("visible");

                    // Remove the storage key
                    this.__internal__customScriptStorageKeys.delete(script.storageKey);
                    localStorage.removeItem(script.storageKey);

                    // Remove the script
                    const scriptIndex = this.__internal__customScriptList.findIndex(p => p.storageKey == script.storageKey);
                    this.__internal__customScriptList.splice(scriptIndex, 1);
                    this.__internal__saveScriptData();
                    this.__internal__updateCustomScriptList();
                }.bind(this);

            deleteButton.onclick = function()
                {
                    deleteConfirmationContainer.classList.add("visible");
                    editButton.hidden = true;
                    deleteButton.hidden = true;
                };
        }

        if (script.errors)
        {
            const errorLabel = document.createElement("span");
            errorLabel.style.color = "#FF7E7E";
            errorLabel.style.marginLeft = "5px";
            errorLabel.textContent = "⚠️ Error occured";
            container.appendChild(errorLabel);
        }

        return container;
    }

    /**
     * @brief Creates a delete button
     *
     * @returns The created button
     */
    static __internal__createDeleteButton()
    {
        const deleteButtonContainer = document.createElement("div");
        deleteButtonContainer.classList.add("pokeWithScript-trash-container");

        const deleteButtonTrashLid = document.createElement("div");
        deleteButtonTrashLid.classList.add("pokeWithScript-trash-lid");
        deleteButtonContainer.appendChild(deleteButtonTrashLid);

        const deleteButtonTrashCan = document.createElement("div");
        deleteButtonTrashCan.classList.add("pokeWithScript-trash-can");
        deleteButtonContainer.appendChild(deleteButtonTrashCan);

        const deleteButtonTooltip = document.createElement("div");
        deleteButtonTooltip.classList.add("pokeWithScript-trash-tooltip");
        deleteButtonContainer.appendChild(deleteButtonTooltip);

        deleteButtonTooltip.textContent = "Delete";

        return deleteButtonContainer;
    }

    /**
     * @brief Creates an edit button
     *
     * @returns The created button
     */
    static __internal__createEditButton()
    {
        const editButtonContainer = document.createElement("div");
        editButtonContainer.classList.add("pokeWithScript-edit-button-container");

        const editButtonImage = document.createElement("div");
        editButtonImage.classList.add("pokeWithScript-edit-button-image");
        editButtonImage.textContent = "📝";
        editButtonContainer.appendChild(editButtonImage);

        const editButtonTooltip = document.createElement("div");
        editButtonTooltip.classList.add("pokeWithScript-edit-button-tooltip");
        editButtonContainer.appendChild(editButtonTooltip);

        editButtonTooltip.textContent = "Edit";

        return editButtonContainer;
    }

    /**
     * @brief Creates the button to add new scripts
     *
     * @returns The created button
     */
    static __internal__createAddScriptButton()
    {
        const buttonContainer = document.createElement("div");
        buttonContainer.style.height = "35px";
        buttonContainer.style.marginTop = "5px";
        const button = document.createElement("div");
        button.classList.add("pokeWithScript-add-script-button");
        buttonContainer.appendChild(button);

        button.onclick = function()
            {
                this.__internal__scriptEditPanel.storageKey = undefined;
                this.__internal__scriptEditPanel.tabTitle.textContent = "Add a new script";
                this.__internal__scriptEditPanel.scriptTitle.textContent = "New script";
                this.__internal__scriptEditPanel.scriptContent.textContent = "/* Input your javascript here */";
                this.__internal__scriptEditPanel.saveButton.textContent = "Save script";
                this.__internal__scriptEditPanel.container.hidden = false;
            }.bind(this);

        const buttonLabel = document.createElement("span");
        buttonLabel.textContent = "Add a new script";
        buttonLabel.style.position = "relative";
        buttonLabel.style.bottom = "9px";
        buttonContainer.appendChild(buttonLabel);

        return buttonContainer;
    }

    /**
     * @brief Creates a simple toggle element bound to the local storage associated to the @p id
     *
     * @param {string} id: The button's id (that will be used for the corresponding local storage item id as well)
     *
     * @returns The button element
     */
    static __internal__addLocalStorageBoundToggleButton(id)
    {
        const buttonElem = document.createElement("span");
        buttonElem.id = id;
        buttonElem.classList.add("pokeWithScript-toggle-button");;

        // Set the current state
        const isFeatureEnabled = (localStorage.getItem(id) === "true");
        buttonElem.setAttribute("checked", isFeatureEnabled ? "true" : "false");

        // Register the onclick event callback
        buttonElem.onclick = function()
            {
                const wasChecked = buttonElem.getAttribute("checked") == "true";
                buttonElem.setAttribute("checked", wasChecked ? "false" : "true");
                localStorage.setItem(id, !wasChecked);
                this.__internal__scriptMenuButtonLabel.textContent = this.__internal__getActiveScriptText();

                // Inform the user that the game needs to be reloaded for the changes to work
                this.__internalReloadButtonContainer.hidden = false;
            }.bind(this);

        return buttonElem;
    }

    /**
     * @brief Save the currently edited script changes and updates the script list
     */
    static __internal__saveScriptChanges()
    {
        const scriptName = this.__internal__scriptEditPanel.scriptTitle.textContent;
        const scriptLines = this.__internal__getMultiLineTextContent(this.__internal__scriptEditPanel.scriptContent.childNodes);

        // New script
        if (this.__internal__scriptEditPanel.storageKey === undefined)
        {
            const storageKey = this.__internal__generateScriptStorageKey();

            // Enable the script by default
            this.__internal__setDefaultLocalStorageValue(storageKey, true);

            this.__internal__customScriptList.push({ name: scriptName, content: scriptLines, storageKey });
        }
        // Script edit
        else
        {
            // Update the script data
            const existingScript = this.__internal__customScriptList.findLast(s => s.storageKey === this.__internal__scriptEditPanel.storageKey);
            existingScript.name = scriptName;
            existingScript.content = scriptLines;
        }

        // Save to the changes to the local storage
        this.__internal__saveScriptData();

        // Update the script list and menu button
        this.__internal__updateCustomScriptList();
        this.__internal__scriptMenuButtonLabel.textContent = this.__internal__getActiveScriptText();

        // Inform the user that the game needs to be reloaded for the changes to work
        this.__internalReloadButtonContainer.hidden = false;

        // Hide the edit modal
        this.__internal__scriptEditPanel.container.hidden = true;
    }

    /**
     * @brief Saves the script data in the local storage
     */
    static __internal__saveScriptData()
    {
        const scriptJsonData = JSON.stringify(this.__internal__customScriptList, function(key, value)
            {
                // Don't serialize errors
                if (key == "errors") return undefined;
                else return value;
            });
        localStorage.setItem(this.__internal__customScriptDataKey, scriptJsonData);
    }

    static __internal__updateCustomScriptList()
    {
        // Clear the div content
        this.__internal__customScriptListContainer.innerHTML = "";

        for (const script of this.__internal__customScriptList)
        {
            const scriptLine = this.__internal__addScriptElement(script, true);
            this.__internal__customScriptListContainer.appendChild(scriptLine);
        }
    }

    /**
     * @brief Generates a new unique storage key
     *
     * @returns The new key
     */
    static __internal__generateScriptStorageKey()
    {
        let keyIndex = 1;
        while (true)
        {
            const newKey = `${this.__internal__storageKeyPrefix}Custom-${keyIndex}`
            if (this.__internal__customScriptStorageKeys.has(newKey))
            {
                keyIndex++;
                continue;
            }

            this.__internal__customScriptStorageKeys.add(newKey);
            return newKey;
        }
    }

    /**
     * @brief Computes the script menu info (active / total scripts)
     *
     * @returns The text to display
     */
    static __internal__getActiveScriptText()
    {
        const activeCustomScript = this.__internal__customScriptList.reduce(
            (result, data) => result + ((localStorage.getItem(data.storageKey) == "true") ? 1 : 0), 0);
        const activeScriptCount = ((localStorage.getItem(this.__internal__defaultScriptEnabledKey) == "true") ? 1 : 0)
                                + activeCustomScript;
        const totalScriptCount = 1 + this.__internal__customScriptList.length;
        return `${activeScriptCount} / ${totalScriptCount}  script  active`;
    }

    /**
     * @brief Parses the input text content and preserves line-breaks
     *
     * @param childNodes: The list of childs to process
     */
    static __internal__getMultiLineTextContent(childNodes)
    {
        let result = '';

        for (const childNode of childNodes)
        {
            // Divs imples a new line
            if (childNode.nodeName === 'DIV')
            {
                // Divs create new lines for themselves if they aren't already on one
                result += '\n';
            }

            // Add the text content if it's a text node
            if ((childNode.nodeType === Node.TEXT_NODE) && childNode.textContent)
            {
                result += childNode.textContent;
            }

            // If this node has childrens, process them
            if (childNode.childNodes.length > 0)
            {
                result += this.__internal__getMultiLineTextContent(childNode.childNodes);
            }
        }

        return result;
    }

    /**
     * @brief Sets the value associated to @p key to @p defaultValue from the local storage,
     *        if it was never set before.
     *
     * @param {string} key: The key to set the default value of
     * @param {any} defaultValue: The default value
     */
    static __internal__setDefaultLocalStorageValue(key, defaultValue)
    {
        if (localStorage.getItem(key) === null)
        {
            localStorage.setItem(key, defaultValue);
        }
    }

    /**
     * @brief Injects the automation menu css to the document heading
     */
    static __internal__injectCss()
    {
        const style = document.createElement('style');
        style.textContent = `
            /* Reset any style to avoid theme related issues */
            .pokeWithScript-menu-container,
            .pokeWithScript-edit-container
            {
                all: initial;
                font-family: "Source Sans Pro", "Arial", sans-serif;
                color: #eeeeee;
                white-space: pre;
            }
            .pokeWithScript-menu-container > *
            {
                z-index: 90000; /* Put it on top of everything else, so it's visible on the save selection screen  */
            }

            /*************************\
            |*   Script edit modal   *|
            \*************************/

            .pokeWithScript-confirmation-container
            {
                background-color: #666666;
                border-radius: 4px;
                padding: 3px;
                display: none;
                padding-left: 5px;
                padding-right: 5px;
                margin-left: 5px;
            }
            .pokeWithScript-confirmation-container.visible
            {
                display: inline-block;
            }
            .pokeWithScript-edit-container, .pokeWithScript-edit-container > *
            {
                z-index: 90001; /* Put it on top of the menu container */
            }
            .pokeWithScript-edit-container
            {
                position: fixed;
                top: 0;
                background-color: #333333;
                border: 1px solid #555555;
                border-radius: 5px;
                height: calc(100% - 20px);
                width: calc(100% - 20px);
                margin: 10px;
            }
            .pokeWithScript-edit-title,
            .pokeWithScript-edit-tab
            {
                background-color: #444444;
                border: 1px solid #666666;
                border-radius: 5px;
                margin: 10px;
                padding: 10px;
            }
            .pokeWithScript-edit-title
            {
                top: 1px;
                position: relative;
                border-bottom-left-radius: 0px;
                border-bottom-right-radius: 0px;
                border-bottom: 0px;
                width: fit-content;
                padding: 10px;
                margin-bottom: 0px;
            }
            .pokeWithScript-edit-tab
            {
                height: calc(100% - 60px);
                margin-top: 0px;
                border-top-left-radius: 0px;
            }

            .pokeWithScript-edit-input,
            .pokeWithScript-edit-script-area
            {
                color: #000000;
                background-color: #aaaaaa;
                user-select: text !important;
                border-bottom: solid 1px #e9e9e9;
                border-radius: 5px;
                padding-top: 5px;
                padding-bottom: 3px;
                padding-right: 8px;
                padding-left: 8px;
                transition: color 1s;
            }
            .pokeWithScript-edit-input:focus,
            .pokeWithScript-edit-script-area:focus
            {
                outline: none;
                border-radius: 5px;
            }
            .pokeWithScript-edit-input
            {
                display: inline-block;
                min-width: 20px;
                margin: 0px 5px;
            }
            .pokeWithScript-edit-script-area
            {
                display: grid; /* Let it take the the whole width */
                max-height: calc(100% - 104px);
                overflow: auto;
                font-family: monospace;
                line-height: 18px;
                margin-top: 5px;
            }
            .pokeWithScript-edit-save-button,
            .pokeWithScript-reload-button,
            .pokeWithScript-yes-button,
            .pokeWithScript-no-button
            {
                display: inline-block;
                border-radius: 5px;
            }
            .pokeWithScript-yes-button,
            .pokeWithScript-no-button
            {
                margin-left: 5px;
                padding: 0px 3px;
            }
            .pokeWithScript-edit-save-button,
            .pokeWithScript-reload-button
            {
                margin-top: 5px;
                border-radius: 5px;
                padding: 5px 10px;
            }
            .pokeWithScript-no-button
            {
                color: #FFFFFF;
                background-color: #D90000;
            }
            .pokeWithScript-no-button:hover
            {
                cursor: pointer;
                background-color: #df2828;
            }
            .pokeWithScript-edit-save-button,
            .pokeWithScript-yes-button
            {
                color: #063C0A;
                background-color: #11C711;
            }
            .pokeWithScript-edit-save-button:hover,
            .pokeWithScript-yes-button:hover
            {
                background-color: #13EF13;
            }
            .pokeWithScript-reload-button
            {
                background-color: #C78F11;
                color: #1a1300;
                margin-left: 5px;
            }
            .pokeWithScript-reload-button:hover
            {
                background-color: #CF9A25;
            }
            .pokeWithScript-yes-button:hover,
            .pokeWithScript-edit-save-button:hover,
            .pokeWithScript-reload-button:hover,
            .pokeWithScript-yes-button:hover,
            .pokeWithScript-no-button:hover
            {
                cursor: pointer;
            }

            /*******************\
            |*   Script menu   *|
            \*******************/

            .pokeWithScript-main-button
            {
                position: fixed;
                top: 0px;
                right: 0px;
                margin-right: 250px;
                height: 35px;
                font-family: pokemonFont, "Helvetica Neue", sans-serif;
                color: #FFFFFF;
                background-color: #555555;
                padding-top: 5px;
                padding-bottom: 5px;
                padding-left: 16px;
                padding-right: 16px;
                border-radius: .25rem;
                font-weight: 400;
                font-size: .875rem;
                white-space: pre-wrap;
                transition: color .15s ease-in-out, background-color .15s ease-in-out;
            }
            .pokeWithScript-main-button:hover
            {
                cursor: pointer;
                background-color: #424242;
            }
            .pokeWithScript-button-label
            {
                position: relative;
            }
            /* The drop-down arrow */
            .pokeWithScript-button-label::after
            {
                position: relative;
                top: 60%;
                margin-left: 7px;
                vertical-align: .255em;
                content: "";
                border-top: .3em solid;
                border-right: .3em solid transparent;
                border-bottom: 0;
                border-left: .3em solid transparent;
            }
            .pokeWithScript-menu-list
            {
                position: fixed;
                top: 34px;
                right: 0px;
                margin-right: 255px;
                background-color: #333333;
                border: 0px solid #555555;
                max-height: 0px;
                overflow: hidden;
                transition: max-height 0.5s ease-out, border-width 0s ease-out 0.5s;
            }
            .pokeWithScript-menu-list.visible
            {
                border-width: 1px;
                max-height: calc(100vh - 70px);
                transition: max-height 0.5s ease-in;

                /* Delay the overflow change after the entire animation */
                animation: 2s pokeWithScript-delay-overflow forwards;
            }
            .pokeWithScript-menu-list-content
            {
                padding: 10px;
                line-height: 24px;
                font-size: 0.875rem;
                font-weight: 400;
                text-align: left;
            }

            @keyframes pokeWithScript-delay-overflow
            {
                to
                {
                    overflow: auto;
                }
            }

            .pokeWithScript-delete-button
            {
                width: 30px;
                height: 30px;
                border-radius: 4px;
                background-color: #EE0000;
                color: #111111;
            }
            .pokeWithScript-delete-button:hover
            {
                cursor: pointer;
                background-color: #FF0000;
            }

            /*********************\
            |*   Delete button   *|
            \*********************/

            .pokeWithScript-trash-container
            {
                position: relative;
                cursor: pointer;
                display: inline-block;
                top: 4px;
                margin-left: 7px;
            }
            .pokeWithScript-trash-lid
            {
                position: relative;
                top: 2px;
                width: 18px;
                height: 6px;
                background: white;
                border: solid 2px #8b1b1b;
                border-radius: 2px;

                transition: all .2s ease-in-out;
                transform-origin: left;
                transform: rotate(0deg) translateY(0px);
            }
            .pokeWithScript-trash-lid::before
            {
                content: '';
                position: absolute;
                width: 8px;
                height: 4px;
                top: -5px;
                left: 3px;
                background: white;
                border: 2px solid #8b1b1b;
                border-bottom: 0px;
                border-top-left-radius: 2px;
                border-top-right-radius: 2px;
            }
            .pokeWithScript-trash-can
            {
                position: relative;
                left: 2px;
                width: 14px;
                height: 14px;
                background: white;
                border: solid 2px #8b1b1b;
                border-radius: 0 0 3px 3px;
            }
            .pokeWithScript-trash-can::before
            {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 6px;
                height: 8px;
                border-right: 2px solid #8b1b1b;
                border-left: 2px solid #8b1b1b;
            }
            .pokeWithScript-trash-tooltip
            {
                position: absolute;
                background: #777777;
                color: white;
                font-size: 10px;
                line-height: 15px;
                padding: 2px 4px;
                border-radius: 2px;
                left: -10px;
                bottom: 0px;
                opacity: 0;
                z-index: 99999;
                pointer-events: none;

                transition: all .4s ease .4s;
            }
            .pokeWithScript-trash-container:hover .pokeWithScript-trash-lid
            {
                transform: rotate(-30deg) translateY(-2px);
            }
            .pokeWithScript-trash-container:hover .pokeWithScript-trash-tooltip
            {
                bottom: -22px;
                opacity: 1;
            }

            /*********************\
            |*    Edit button    *|
            \*********************/

            .pokeWithScript-edit-button-container
            {
                position: relative;
                cursor: pointer;
                display: inline-block;
                top: 4px;
                margin-left: 4px;
            }
            .pokeWithScript-edit-button-image
            {
                position: relative;
                bottom: 3px;
                width: 22px;
                height: 20px;
                font-size: 18px;
            }
            .pokeWithScript-edit-button-tooltip
            {
                position: absolute;
                background: #777777;
                color: white;
                font-size: 10px;
                line-height: 15px;
                padding: 2px 4px;
                border-radius: 2px;
                bottom: 0px;
                opacity: 0;
                z-index: 99999;
                pointer-events: none;

                transition: all .4s ease .4s;
            }
            .pokeWithScript-edit-button-container:hover .pokeWithScript-edit-button-tooltip
            {
                bottom: -20px;
                opacity: 1;
            }

            /*********************\
            |*   Toogle button   *|
            \*********************/

            .pokeWithScript-toggle-button
            {
                box-sizing: border-box;
                cursor: pointer;
                top: 4px;
                height: 18px;
                width: 32px;
                border-radius: 16px;
                display: inline-block;
                position: relative;
                border: 2px solid #474755;
                background-color: #070C31;
                transition: all 0.2s cubic-bezier(0.5, 0.1, 0.75, 1.35);
                margin-right: 10px;
            }
            .pokeWithScript-toggle-button::before
            {
                content: "";
                position: absolute;
                bottom: calc(50% - 1px);
                left: 4px;
                width: calc(100% - 10px);
                height: 0px;
                border: solid 1px #999999;
                border-radius: 50%;
                transition: border-color 500ms;
            }
            .pokeWithScript-toggle-button::after
            {
                content: "";
                position: absolute;
                top: 2px;
                left: 2px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: #999999;
                box-shadow: inset -1px -1px 2px #111111;
                transition: all 0.2s cubic-bezier(0.5, 0.1, 0.75, 1.35);
            }
            .pokeWithScript-toggle-button[checked=true]
            {
                border-color: #86d02c;
            }
            .pokeWithScript-toggle-button[checked=true]::before
            {
                border-color: #467546;
                transition: border-color 500ms;
            }
            .pokeWithScript-toggle-button[checked=true]::after
            {
                transform: translateX(14px);
                background-color: #8bff00;
            }
            .pokeWithScript-toggle-button[disabled=true]
            {
                pointer-events: none;
                border-color: #467546;
                transition: all 500ms;
                border-color: #950606;
            }
            .pokeWithScript-toggle-button[disabled=true]::before, .pokeWithScript-toggle-button[disabled=true]::after
            {
                width: 24px;
                height: 2px;
                background-color: #FF0000;
                border-radius: 2px;
            }
            .pokeWithScript-toggle-button[disabled=true]::before
            {
                border-width: 0px;
                box-shadow: inset -1px -1px 2px #111111;
                transform: rotate(20deg);
                left: 2px;
            }
            .pokeWithScript-toggle-button[disabled=true]::after
            {
                border-width: 0px;
                box-shadow: inset -1px -1px 2px #111111;
                transform: rotate(-20deg);
                right: 2px;
                top: 6px;
            }

            /*************************\
            |*   Add script button   *|
            \*************************/

            .pokeWithScript-add-script-button
            {
                position: relative;
                width:28px;
                height:28px;
                border-radius: 50%;
                background-color: #11c711;
                margin-top: 5px;
                display: inline-block;
                margin-right: 12px;
                margin-left: 2px;
            }
            .pokeWithScript-add-script-button:hover
            {
                cursor: pointer;
                background-color: #13EF13;
            }
            .pokeWithScript-add-script-button::before,
            .pokeWithScript-add-script-button::after
            {
                position: absolute;
                content: "";
                background-color: #063C0A;
            }
            .pokeWithScript-add-script-button::before
            {
                left: 50%;
                top: 7px;
                bottom: 7px;
                width: 2px;
                transform: translateX(-50%);
            }
            .pokeWithScript-add-script-button::after
            {
                top: 50%;
                left: 7px;
                right: 7px;
                height: 2px;
                transform: translateY(-50%);
            }`;
        document.head.append(style);
    }
}
