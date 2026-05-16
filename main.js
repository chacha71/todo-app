const { app, BrowserWindow, Tray, Menu, screen, nativeImage, globalShortcut, ipcMain } = require('electron');
const path = require('path');

const WIN_WIDTH = 420;
const WIN_HEIGHT = 580;

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();

  mainWindow = new BrowserWindow({
    width: WIN_WIDTH,
    height: WIN_HEIGHT,
    x: workArea.x + workArea.width - WIN_WIDTH - 20,
    y: workArea.y + 60,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    backgroundColor: '#0c0c10',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('maximize', () => mainWindow.webContents.send('window-maximize-change', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximize-change', false));

  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch (_) {
    icon = nativeImage.createEmpty();
  }
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow.isVisible()) { mainWindow.hide(); }
        else { mainWindow.show(); mainWindow.focus(); }
      },
    },
    {
      label: '始终置顶',
      type: 'checkbox',
      checked: true,
      click: (item) => mainWindow.setAlwaysOnTop(item.checked),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => { isQuitting = true; app.quit(); },
    },
  ]);

  tray.setToolTip('待办事项 (Ctrl+Shift+T)');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) { mainWindow.hide(); }
    else { mainWindow.show(); mainWindow.focus(); }
  });
}

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-toggle-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window-close', () => mainWindow?.close());

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
});
