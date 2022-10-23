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
        this.__internal__buildMenu();

        this.__internal__loadScripts();
    }

    /******************************\
    |***    Internal members    ***|
    \******************************/

    static __internal__storageKeyPrefix = "Pokeclicker-Scripts-";
    static __internal__defaultScriptKeyPrefix = `${this.__internal__storageKeyPrefix}Farigh-Automation-`;
    static __internal__defaultScriptEnabledKey = `${this.__internal__defaultScriptKeyPrefix}Enabled`;
    static __internal__defaultScriptDisableFeatureKey = `${this.__internal__defaultScriptKeyPrefix}FeatureDisabledByDefault`;
    static __internal__defaultScriptDisableSettingsKey = `${this.__internal__defaultScriptKeyPrefix}SettingsDisabledByDefault`;

    static __internal__scriptListContainer = null;

    /**
     * @brief Builds the script menu
     */
    static __internal__buildMenu()
    {
        const scriptMenuContainer = document.createElement("div");
        scriptMenuContainer.classList.add("pokeWithScript-menu-container");

        // Menu button div
        const menuButtonDiv = document.createElement("div");
        menuButtonDiv.classList.add("pokeWithScript-main-button");
        scriptMenuContainer.appendChild(menuButtonDiv);

        // Button label
        const menuButtonLabelcontainer = document.createElement("span");
        menuButtonLabelcontainer.classList.add("pokeWithScript-button-label");
        const activeScriptCount = localStorage.getItem((this.__internal__defaultScriptEnabledKey) == "true") ? 1 : 0;
        const totalScriptCount = 1;
        const menuButtonLabel = document.createTextNode(`${activeScriptCount} / ${totalScriptCount}  script  active`);
        menuButtonLabelcontainer.appendChild(menuButtonLabel);
        menuButtonDiv.appendChild(menuButtonLabelcontainer);

        // Add the script list
        this.__internal__buildScriptList(scriptMenuContainer);

        menuButtonDiv.onclick = function()
            {
                this.__internal__scriptListContainer.classList.toggle('visible');
            }.bind(this);

        // Add the menu to the document
        document.body.appendChild(scriptMenuContainer);
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

        const defaultScriptElem = this.__internal__addScriptElement("Pokeclicker automation", this.__internal__defaultScriptEnabledKey);
        defaultScriptContainer.appendChild(defaultScriptElem);
        const defaultScriptDisableFeaturesElem =
            this.__internal__addScriptElement("Disable all features by default", this.__internal__defaultScriptDisableFeatureKey);
        defaultScriptDisableFeaturesElem.style.marginLeft = "42px";
        defaultScriptContainer.appendChild(defaultScriptDisableFeaturesElem);
        const defaultScriptDisableSettingsElem =
            this.__internal__addScriptElement("Disable all settings by default", this.__internal__defaultScriptDisableSettingsKey);
        defaultScriptDisableSettingsElem.style.marginLeft = "42px";
        defaultScriptContainer.appendChild(defaultScriptDisableSettingsElem);

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
            AutomationComponentLoader.loadFromUrl(this.__internal__automationBaseUrl,
                                                  localStorage.getItem(this.__internal__defaultScriptDisableFeatureKey) == "true",
                                                  localStorage.getItem(this.__internal__defaultScriptDisableSettingsKey) == "true");
        }
    }

    /**
     * @brief Adds a script toogle button with its label
     *
     * @param {string} label
     * @param {string} storageKey
     */
    static __internal__addScriptElement(label, storageKey)
    {
        const container = document.createElement("div");

        const defaultScriptEnableButton = this.__internal__addLocalStorageBoundToggleButton(storageKey);
        container.appendChild(defaultScriptEnableButton);
        const defaultScriptLabel = document.createTextNode(label);
        container.appendChild(defaultScriptLabel);

        return container;
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
            };

        return buttonElem;
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
            .pokeWithScript-menu-container
            {
                all: initial;
            }
            .pokeWithScript-menu-container > *
            {
                z-index: 999; /* Put it on top of everything else, so it's visible on the save selection screen  */
            }
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
                color: #eeeeee;
                white-space: pre;
                line-height: 24px;
                font-family: "Source Sans Pro", "Arial", sans-serif;
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
            }`;
        document.head.append(style);
    }
}
