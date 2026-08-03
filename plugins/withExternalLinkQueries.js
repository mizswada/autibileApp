const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Android 11+ hides other apps unless they are declared here, which makes
 * `Linking.canOpenURL` return false for schemes that iOS resolves through
 * `LSApplicationQueriesSchemes`. Keeps both platforms answering the same.
 */
const QUERY_INTENTS = [
  { action: "android.intent.action.VIEW", scheme: "http", browsable: true },
  { action: "android.intent.action.VIEW", scheme: "https", browsable: true },
  { action: "android.intent.action.DIAL", scheme: "tel" },
  { action: "android.intent.action.SENDTO", scheme: "mailto" },
  { action: "android.intent.action.SENDTO", scheme: "smsto" },
];

function buildIntent({ action, scheme, browsable }) {
  const intent = {
    action: [{ $: { "android:name": action } }],
    data: [{ $: { "android:scheme": scheme } }],
  };
  if (browsable) {
    intent.category = [
      { $: { "android:name": "android.intent.category.BROWSABLE" } },
    ];
  }
  return intent;
}

function hasIntent(intents, { action, scheme }) {
  return intents.some(
    (intent) =>
      intent?.action?.[0]?.$?.["android:name"] === action &&
      intent?.data?.[0]?.$?.["android:scheme"] === scheme,
  );
}

module.exports = function withExternalLinkQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.queries = manifest.queries ?? [{}];
    const queries = manifest.queries[0];
    queries.intent = queries.intent ?? [];

    for (const descriptor of QUERY_INTENTS) {
      if (!hasIntent(queries.intent, descriptor)) {
        queries.intent.push(buildIntent(descriptor));
      }
    }

    return config;
  });
};
