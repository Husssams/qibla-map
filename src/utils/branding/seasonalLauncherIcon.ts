
import { registerPlugin } from '@capacitor/core'

type SeasonalIconPlugin = {
  setIcon(options: { ramadan: boolean }): Promise<void>
}

// Verbindet TypeScript mit unserem nativen Android-Plugin.
export const SeasonalLauncherIcon =
  registerPlugin<SeasonalIconPlugin>('SeasonalIcon')
