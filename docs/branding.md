
# Qibla Branding

## App Identity

- App name: Qibla
- Primary colors: Emerald green and gold
- Supported themes: Light and dark

## Logo Assets

- Standard logo: `public/images/logo.png`
- Ramadan logo: `public/images/logoRamadan.png`

## Seasonal Logo

The application automatically selects the Ramadan logo
during the ninth month of the Islamic calendar.

The selection works locally without external API requests.

Calendar dates may differ slightly from regional moon sightings.

## Android Launcher Icon

The installed Android launcher icon is separate from the
in-app logo.

Android supports alternative launcher icons through native
activity-alias components and PackageManager.

The native Android project has not yet been created.

During Capacitor integration, both logo variants will be
prepared as Android launcher icons.

Automatic switching may occur when the app starts or resumes.
The launcher may take additional time to refresh the icon.

Until native integration is completed, the default installed
icon will use the standard Qibla logo.
