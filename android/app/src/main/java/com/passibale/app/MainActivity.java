package com.passibale.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Register the Kiosk Plugin
        registerPlugin(KioskPlugin.class);
        
        // Ensure WebView settings are optimized for responsiveness
        if (this.bridge != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptEnabled(true);
        }
    }

    @CapacitorPlugin(name = "KioskMode")
    public static class KioskPlugin extends Plugin {
        @PluginMethod
        public void enable(PluginCall call) {
            MainActivity activity = (MainActivity) getActivity();
            activity.enableKioskMode();
            call.resolve();
        }

        @PluginMethod
        public void disable(PluginCall call) {
            MainActivity activity = (MainActivity) getActivity();
            activity.disableKioskMode();
            call.resolve();
        }
    }

    public void enableKioskMode() {
        runOnUiThread(() -> {
            // Immersive Full Screen
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            try {
                startLockTask();
            } catch (Exception ignored) {}
        });
    }

    public void disableKioskMode() {
        runOnUiThread(() -> {
            try {
                stopLockTask();
            } catch (Exception ignored) {}
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        });
    }
}
