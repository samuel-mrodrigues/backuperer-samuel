import { contextBridge, dialog, ipcRenderer, app} from "electron"

console.log(contextBridge);
console.log(dialog);
console.log(ipcRenderer);
console.log(app);

console.log(`Executando preload...`);
contextBridge.exposeInMainWorld('PRELOAD_UTILS', {
    dialogos: () => dialog.showMessageBox
})
