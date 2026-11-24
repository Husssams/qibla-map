
package com.husssams.qibla;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Macht unser Icon-Plugin für TypeScript erreichbar.
        registerPlugin(SeasonalIconPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
