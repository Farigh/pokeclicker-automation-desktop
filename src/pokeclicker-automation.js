// By default, the script is set to take the latest version available
// It could be preferable to set this to a label or a commit instead,
// if you want to fix a set version of the script
var releaseLabel = "master";

var pokeclickerAutomationReleaseUrl = "https://raw.githubusercontent.com/Farigh/pokeclicker-automation/" + releaseLabel + "/";

// Github only serves plain-text so we can't load it as a script object directly
let xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function()
    {
        if ((xmlhttp.readyState == 4) && (xmlhttp.status == 200))
        {
            // Store the content into a script div
            var script = document.createElement('script');
            script.innerHTML = xmlhttp.responseText;
            script.id = "pokeclicker-automation-component-loader";
            document.head.appendChild(script);

            AutomationComponentLoader.loadFromUrl(pokeclickerAutomationReleaseUrl);
        }
    }

// Download the content
xmlhttp.open("GET", pokeclickerAutomationReleaseUrl + "src/ComponentLoader.js", true);
xmlhttp.send();
