
package com.husssams.qibla;

import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;

@CapacitorPlugin(name = "SeasonalIcon")
public class SeasonalIconPlugin extends Plugin {

    @PluginMethod
    public void setIcon(PluginCall call) {
        Boolean ramadan = call.getBoolean("ramadan");

        if (ramadan == null) {
            call.reject("Missing Ramadan status");
            return;
        }

        PackageManager manager = getContext().getPackageManager();
        String packageName = getContext().getPackageName();

        ComponentName normalIcon = new ComponentName(
            packageName,
            packageName + ".DefaultLauncherAlias"
        );

        ComponentName ramadanIcon = new ComponentName(
            packageName,
            packageName + ".RamadanLauncherAlias"
        );

        int normalState = manager.getComponentEnabledSetting(normalIcon);
        int ramadanState = manager.getComponentEnabledSetting(ramadanIcon);

        // DEFAULT entspricht den Einstellungen im AndroidManifest.
        boolean normalActive =
            normalState == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT ||
            normalState == PackageManager.COMPONENT_ENABLED_STATE_ENABLED;

        boolean ramadanActive =
            ramadanState == PackageManager.COMPONENT_ENABLED_STATE_ENABLED;

        // Nichts ändern, wenn bereits das richtige Icon aktiv ist.
        if (normalActive == !ramadan && ramadanActive == ramadan) {
            call.resolve();
            return;
        }

        int enabled = PackageManager.COMPONENT_ENABLED_STATE_ENABLED;
        int disabled = PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
        int flags = PackageManager.DONT_KILL_APP;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Ab Android 13 beide Icons gleichzeitig umschalten.
                manager.setComponentEnabledSettings(Arrays.asList(
                    new PackageManager.ComponentEnabledSetting(
                        normalIcon,
                        ramadan ? disabled : enabled,
                        flags
                    ),
                    new PackageManager.ComponentEnabledSetting(
                        ramadanIcon,
                        ramadan ? enabled : disabled,
                        flags
                    )
                ));
            } else {
                // Auf älteren Geräten zuerst das neue Icon aktivieren.
                ComponentName newIcon = ramadan ? ramadanIcon : normalIcon;
                ComponentName oldIcon = ramadan ? normalIcon : ramadanIcon;

                manager.setComponentEnabledSetting(newIcon, enabled, flags);
                manager.setComponentEnabledSetting(oldIcon, disabled, flags);
            }

            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to change launcher icon", error);
        }
    }
}
