const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Disables Android 13+ predictive back so hardware back goes through
 * React Navigation / Expo Router instead of closing the app.
 */
module.exports = function withDisablePredictiveBack(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$["android:enableOnBackInvokedCallback"] = "false";
    }
    return config;
  });
};
