
import type { CapacitorConfig } from '@capacitor/cli'

/*
 * Native Konfiguration unserer Qibla-App.
 *
 * React und Vite bleiben unverändert.
 * Capacitor verwendet den fertigen Web-Build.
 */
const config: CapacitorConfig = {
  // Eindeutige Kennung unserer Android-Anwendung.
  appId: 'com.husssams.qibla',

  // Name, der unter dem App-Icon angezeigt wird.
  appName: 'Qibla',

  // Vite speichert die fertige Anwendung in dist/.
  webDir: 'dist',
}

export default config
