class AutomationScriptManager
{
    static Run(automationBaseUrl)
    {
        // Run the automation script suite
        AutomationComponentLoader.loadFromUrl(automationBaseUrl);
    }
}
