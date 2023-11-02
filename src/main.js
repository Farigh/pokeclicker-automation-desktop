'use strict';

/* eslint-disable no-console */

const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, dialog } = require('electron');
const url = require('url');
const DiscordRPC = require('discord-rpc');
const https = require('https');
const fs = require('fs');
const XMLHttpRequest = require("w3c-xmlhttprequest").XMLHttpRequest;
const Zip = require('adm-zip');
const electron = require('electron');
const clientVersion = app.getVersion();

const dataDir =  (electron.app || electron.remote.app).getPath('userData');

/***********************************\
 *   PokeclickerAutomation stuff   *|
\***********************************/

class PokeclickerAutomationUpdater
{
    static automationDir = `pokeclicker-automation-master`;
    static automationFullPath = `${dataDir}/${this.automationDir}/`;
    static versionPath = `${this.automationFullPath}version.sha1`;
    static latestCommitSha1Url = 'https://api.github.com/repos/Farigh/pokeclicker-automation/commits?sha=master&per_page=1';

    static getCurrentVersion()
    {
        let currentVersionSha1 = "";

        try
        {
            currentVersionSha1 = fs.readFileSync(this.versionPath);
        }
        catch(e)
        {}

        return currentVersionSha1;
    }

    static checkForUpdatesAndRun(userAgent)
    {
        // Create the output dir if it does not exist
        if (!fs.existsSync(this.automationFullPath))
        {
            fs.mkdirSync(this.automationFullPath);
        }

        let newVersionSha1 = "";

        https.get(this.latestCommitSha1Url, { headers: { 'User-Agent' : userAgent } },
            (res) =>
            {
                let jsonData = '';

                res.on('data', d =>
                    {
                        jsonData += d;
                    });

                res.on('end', () =>
                    {
                        try
                        {
                            const data = JSON.parse(jsonData);
                            newVersionSha1 = data[0].sha;

                            if (this.isNewerVersionAvailable(newVersionSha1))
                            {
                                // Download the latest version
                                this.downloadNewUpdate(newVersionSha1);
                            }
                            else
                            {
                                // No update needed, run the automation right away
                                this.runAutomation(mainWindow);
                            }
                        }
                        catch(e)
                        {}
                    });

            }).on('error', (e) =>
            {
                console.warn("Check for pokeclicker automation update failed.");

                if (this.getCurrentVersion() != "")
                {
                    console.info("Running the local version of the automation.");

                    // No update needed, run the automation right away
                    this.runAutomation(mainWindow);
                }
            });
    }

    static runAutomation(windowInstance)
    {
        // Load automation ComponentLoader
        windowInstance.webContents.executeJavaScript(
            fs.readFileSync(`${PokeclickerAutomationUpdater.automationFullPath}src/ComponentLoader.js`).toString()
        ).catch(e=>{});

        // Load automation ScriptManager
        windowInstance.webContents.executeJavaScript(
          fs.readFileSync(`${__dirname}/AutomationScriptManager.js`).toString()
        ).catch(e=>{});

        // Run automation
        const automationBaseUrl = url.pathToFileURL(PokeclickerAutomationUpdater.automationFullPath);
        windowInstance.webContents.executeJavaScript(
            `AutomationScriptManager.run('${automationBaseUrl}');`);
    }

    static downloadNewUpdate(newVersionSha1)
    {
        console.info(`\n\n=== Downloading latest pokeclicker update...\n\n`);

        const zipFilePath = `${dataDir}/automation-update.zip`;
        const file = fs.createWriteStream(zipFilePath);
        https.get('https://codeload.github.com/Farigh/pokeclicker-automation/zip/master',
            async (res) =>
            {
                res.pipe(file).on('finish',
                    async () =>
                    {
                        const zip = new Zip(zipFilePath);

                        const extracted = zip.extractEntryTo(`${this.automationDir}/`, `${dataDir}`, true, true);

                        fs.unlinkSync(zipFilePath);

                        if (extracted)
                        {
                            // Save current version sha1
                            fs.writeFileSync(this.versionPath, newVersionSha1);
                        }

                        // Run the automation as soon at it's been updated
                        this.runAutomation(mainWindow);
                    });
            });
    }

    static isNewerVersionAvailable(latestSha1)
    {
        console.info(`\n\nCurrent sha1: ${this.getCurrentVersion()}\nLatest sha1: ${latestSha1}\n\n`);
        return (latestSha1 != "") && (this.getCurrentVersion() != latestSha1);
    }
}

/***********************************\
 *        Pokéclicker stuff        *|
\***********************************/

console.info('Data directory:', dataDir);

let checkForUpdatesInterval;
let newVersion = '0.0.0';
let currentVersion = '0.0.0';
let windowClosed = false;

let mainWindow;

function createWindow() {
  // Set the Application for Desktop notifications (windows only)
  try {
    app.setAppUserModelId('PokéClicker');
  } catch (e) {}

  mainWindow = new BrowserWindow({
    icon: __dirname + '/icon.png',
    minWidth: 300,
    minHeight: 200,
    webPreferences: {
      webSecurity: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(
      `(() => { DiscordRichPresence.clientVersion = '${clientVersion}' })()`
    ).catch(e=>{});

    // Update automation if needed
    PokeclickerAutomationUpdater.checkForUpdatesAndRun(mainWindow.webContents.session.getUserAgent());
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setTitle('PokéClicker with Scripts');

  // Check if we've already downloaded the data, otherwise load our loading screen
  if (fs.existsSync(`${dataDir}/pokeclicker-master/docs/index.html`)) {
    mainWindow.loadURL(`file://${dataDir}/pokeclicker-master/docs/index.html`);
  } else {
    mainWindow.loadURL(`file://${__dirname}/pokeclicker-master/docs/index.html`);
  }

  mainWindow.on('close', (event) => {
    windowClosed = true
  })
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.on('page-title-updated', function(e) {
    e.preventDefault()
  });
}

function createSecondaryWindow() {
  let newWindow = new BrowserWindow({
    icon: __dirname + '/icon.png',
    minWidth: 300,
    minHeight: 200,
    webPreferences: {
      webSecurity: false,
      backgroundThrottling: false,
    },
  });

  newWindow.setMenuBarVisibility(false);
  newWindow.setTitle('PokéClicker with Scripts (alternate)');

  newWindow.webContents.on('did-finish-load', () => {
    // Run the automation
    PokeclickerAutomationUpdater.runAutomation(newWindow);
  });

  // Check if we've already downloaded the data, otherwise load our loading screen
  if (fs.existsSync(`${dataDir}/pokeclicker-master/docs/index.html`)) {
    newWindow.loadURL(`file://${dataDir}/pokeclicker-master/docs/index.html`);
  } else {
    newWindow.loadURL(`file://${__dirname}/pokeclicker-master/docs/index.html`);
  }

  newWindow.on('close', (event) => {
    newWindow = true
  })
  newWindow.on('closed', () => {
    newWindow = null;
  });
  newWindow.on('page-title-updated', function(e) {
    e.preventDefault()
  });
  return newWindow;
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/*
DISCORD STUFF
*/

const isMainInstance = app.requestSingleInstanceLock()

if (!isMainInstance) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    createSecondaryWindow();
  })

  // Set this to your Client ID.
  const clientId = '733927271726841887';

  // Only needed if you want to use spectate, join, or ask to join
  DiscordRPC.register(clientId);

  const rpc = new DiscordRPC.Client({ transport: 'ipc' });

  async function setActivity() {
    if (!rpc || !mainWindow) {
      return;
    }

    let discordData = {};

    try {
      discordData = await mainWindow.webContents.executeJavaScript('DiscordRichPresence.getRichPresenceData()');
    } catch (e) {
      console.warn('Something went wrong, could not gather discord RP data');
    }

    if (!discordData.enabled) {
      return rpc.clearActivity();
    }

    // You'll need to have image assets uploaded to
    // https://discord.com/developers/applications/<application_id>/rich-presence/assets
    const activity = {
      instance: true,
    };
    activity.details = discordData.line1?.length <= 1 ? '--' : discordData.line1.substr(0, 128);
    activity.state = discordData.line2?.length <= 1 ? '--' : discordData.line2.substr(0, 128);
    if (discordData.startTimestamp) activity.startTimestamp = discordData.startTimestamp;
    if (discordData.largeImageKey) activity.largeImageKey = discordData.largeImageKey;
    if (discordData.largeImageKey && discordData.largeImageText) activity.largeImageText = discordData.largeImageText.substr(0, 128);
    if (discordData.smallImageKey) activity.smallImageKey = discordData.smallImageKey;
    if (discordData.smallImageKey && discordData.smallImageText) activity.smallImageText = discordData.smallImageText.substr(0, 128);

    rpc.setActivity(activity);
  }

  rpc.on('ready', () => {
    setActivity();

    // activity can only be set every 15 seconds
    setInterval(() => {
      setActivity();
    }, 15e3);
  });

  rpc.login({ clientId }).catch(console.error);

  /*
  UPDATE STUFF
  */
  const isNewerVersion = (version) => {
    return version.localeCompare(currentVersion, undefined, { numeric: true }) === 1;
  }

  const downloadUpdate = async (initial = false) => {
    const zipFilePath = `${dataDir}/update.zip`;
    const file = fs.createWriteStream(zipFilePath);
    https.get('https://codeload.github.com/pokeclicker/pokeclicker/zip/master', async res => {
      let cur = 0;
      try {
        if (!initial) await mainWindow.webContents.executeJavaScript(`Notifier.notify({ title: '[UPDATER] v${newVersion}', message: 'Downloading Files...<br/><span id="update-message-progress">Please Wait...</span>', timeout: 1e6 })`);
      }catch(e){}

      res.on('data', async chunk => {
          cur += chunk.length;
          try {
            if (initial) await mainWindow.webContents.executeJavaScript(`setStatus("Downloading Files...<br/>${(cur / 1048576).toFixed(2)} mb")`);
            else await mainWindow.webContents.executeJavaScript(`document.getElementById('update-message-progress').innerText = "${(cur / 1048576).toFixed(2)} mb"`);
          }catch(e){}
      });

      res.pipe(file).on('finish', async () => {
        try {
          if (initial) await mainWindow.webContents.executeJavaScript('setStatus("Files Downloaded!<br/>Extracting Files...")');
          else await mainWindow.webContents.executeJavaScript(`Notifier.notify({ title: '[UPDATER] v${newVersion}', message: 'Files Downloaded!<br/>Extracting Files...', timeout: 2e4 })`);
        }catch(e){}

        const zip = new Zip(zipFilePath);

        const extracted = zip.extractEntryTo('pokeclicker-master/docs/', `${dataDir}`, true, true);

        fs.unlinkSync(zipFilePath);

        if (!extracted) {
          return downloadUpdateFailed();
        }

        currentVersion = newVersion;
        startUpdateCheckInterval();

        // If this is the initial download, don't ask the user about refreshing the page
        if (initial) {
          mainWindow.loadURL(`file://${dataDir}/pokeclicker-master/docs/index.html`);
          return;
        }

        const userResponse = dialog.showMessageBoxSync(mainWindow, {
          title: 'PokeClicker - Update success!',
          message: `Successfully updated,\nwould you like to reload the page now?`,
          icon: `${__dirname}/icon.png`,
          buttons: ['Yes', 'No'],
          noLink: true,
        });

        if (userResponse == 0){
          mainWindow.loadURL(`file://${dataDir}/pokeclicker-master/docs/index.html`);
        }
      });
    }).on('error', (e) => {
      return downloadUpdateFailed();
    });
  }

  const downloadUpdateFailed = () => {
    // If client exe updating, return
    if (windowClosed) return;

    const userResponse = dialog.showMessageBoxSync(mainWindow, {
      type: 'error',
      title: 'PokeClicker - Update failed!',
      message: `Failed to download or extract the update,\nWould you like to retry?`,
      icon: `${__dirname}/icon.png`,
      buttons: ['Yes', 'No'],
      noLink: true,
    });

    if (userResponse == 0) {
      downloadUpdate();
    }
  }

  const checkForUpdates = () => {
    const request = https.get('https://raw.githubusercontent.com/pokeclicker/pokeclicker/master/package.json', res => {
      let body = '';

      res.on('data', d => {
        body += d;
      });

      res.on('end', () => {
        let data = {version:'0.0.0'};
        try {
          data = JSON.parse(body);
          newVersion = data.version;
          const newVersionAvailable = isNewerVersion(data.version);

          if (newVersionAvailable) {
            // Stop checking for updates
            clearInterval(checkForUpdatesInterval);
            // Check if user want's to update now
            shouldUpdateNowCheck();
          }
        }catch(e) {}
      });

    }).on('error', (e) => {
      // TODO: Update download failed
      console.warn('Couldn\'t check for updated version, might be offline..');
    });
  }

  const shouldUpdateNowCheck = () => {
    const userResponse = dialog.showMessageBoxSync(mainWindow, {
      title: 'PokeClicker - Update available!',
      message: `There is a new update available (v${newVersion}),\nWould you like to download it now?\n\n`,
      icon: `${__dirname}/icon.png`,
      buttons: ['Update Now', 'Remind Me', 'No (disable check)'],
      noLink: true,
    });

    switch (userResponse) {
      case 0:
        downloadUpdate();
        break;
      case 1:
        // Check again in 1 hour
        setTimeout(shouldUpdateNowCheck, 36e5)
        break;
      case 2:
        console.info('Update check disabled, stop checking for updates');
        break;
    }
  }

  const startUpdateCheckInterval = (run_now = false) => {
    // Check for updates every hour
    checkForUpdatesInterval = setInterval(checkForUpdates, 36e5)
    if (run_now) checkForUpdates();
  }


  try {
    // If we can get our current version, start checking for updates once the game starts
    currentVersion = JSON.parse(fs.readFileSync(`${dataDir}/pokeclicker-master/docs/package.json`).toString()).version;
    if (currentVersion == '0.0.0') throw Error('Must re-download updated version');
    setTimeout(() => {
      startUpdateCheckInterval(true);
    }, 1e4)
  } catch (e) {
    // Game not downloaded yet
    downloadUpdate(true);
    console.log('downloading...');
  }

  try {
    autoUpdater.on('update-downloaded', () => {
      const userResponse = dialog.showMessageBoxSync(mainWindow, {
        title: 'PokeClicker with Scripts - Client Update Available!',
        message: `There is a new client update available,\nWould you like to install it now?\n\n`,
        icon: `${__dirname}/icon.png`,
        buttons: ['Restart App Now', 'Later'],
        noLink: true,
      });

      switch (userResponse) {
        case 0:
          windowClosed = true;
          autoUpdater.quitAndInstall(true, true);
          break;
      }
    });
    autoUpdater.checkForUpdatesAndNotify()
  } catch (e) {}
}