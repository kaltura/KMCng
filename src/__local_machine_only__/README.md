# External App Integration & Testing
The KMC application hosts (embed) several external standalone applications such as Studio, Live Dashboard, Usage Dashboard, KEdit, and more. To support standalone application:
- KMC holds a bridge component that is responsible for the interactions with the standalone application, providing API required by the application.
- The `server-config` file holds configuration required by the standalone applications to function correctly.
-  Handles memory cleanups when navigating away from the standalone application.

## About "__local_machine_only__" folder
This folder is used to test standalone applications integration with the KMC during development and exists on the development machine only.

**NOTE:** this technique should not be used on production, it was added to test integration locally during development.

## Things to be aware of
- Most of the applications are not using post messages to communicate with the KMC shell, which means they must be deployed to the same domain on the production server in order to avoid cross-domain issues.
- The sample code below contains a list of supported external applications with their tested version. if you choose to integrate other versions you might need to adjust the bridge component to make it work correctly.
- Each application can be enabled/disabled at runtime by using the `enabled` attribute.
- At runtime, an extra verification is executed to disable applications that didn't pass the configuration test (see file `src/configuration/server-config-utils.ts`). A console warning will be added to help you diagnose problems with integrations.

## Test external applications integration
Follow these instructions to test external apps integration:

1. unzip the content of `__local_machine_only__/samples-for-tests-only.zip`. make sure you extract the content directly into `__local_machine_only__` folder.

2. update file `server-config.json`, copy the following into `externalApps` element. Make sure you don't commit it into the git repository.

```
  "studio": {
      "enabled": true,
      "uri": "__local_machine_only__/studio_v2_2_1/index.html",
      "version": "v2.2.1",
      "uiConfId": "39700052",
      "html5_version":"v2.57.2",
      "html5lib":"http://cdnapi.kaltura.com/html5/html5lib/v2.57.2/mwEmbedLoader.php"
    },
    "liveDashboard": {
      "enabled": true,
      "uri": "__local_machine_only__/live-dashboard_v1_4_1/index.html",
      "version": "v1.4.1"
    },
    "kava": {
      "enabled": false,
      "version": "",
      "uri": ""
    },
     "liveAnalytics": {
        "enabled": true,
        "uri": "__local_machine_only__/live-analytics-front-end-future_version_above_v2_6/index.html",
        "uiConfId": 36060752,
        "version": "future_version_above_v2_6"
    },
    "usageDashboard": {
      "enabled": true,
      "version": "v0.11.2",
      "uri": "__local_machine_only__/usage-dashboard-v0_11_2/index.html",
      "uiConfId": 36060752,
      "map_urls": [
        "cf1.kaltura.com/content/static/maps/v1",
        "cf2.kaltura.com/content/static/maps/v1",
        "cf3.kaltura.com/content/static/maps/v1"
      ],
      "map_zoom_levels": "12"
    },
    "clipAndTrim": {
      "enabled": true,
      "uri": "__local_machine_only__/kedit-v2_21_1/index.html",
      "uiConfId": "36060752"
    },
    "advertisements": {
      "enabled": true,
      "uri": "__local_machine_only__/kedit-v2_21_1/index.html",
      "uiConfId": "36060752"
    }
```
