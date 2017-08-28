// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  "shell": {
    "defaultRoute": "/content/entries",
    "browser": {
      "storageNamespace": "kmc-ng"
    }
  },
  "core": {
    "kaltura": {
      "apiUrl" : "https://www.kaltura.com/api_v3/index.php",
      "cdnUrl": "http://cdnapi.kaltura.com",
      "kmcUrl": "kmc.kaltura.com",
      "expiry": "86400",
      "privileges": "disableentitlement",
      "previewUIConf": "38524931",
      "liveAnalyticsVersion": "v2.6",
      "contactsalesforce": "https://www.kaltura.com/index.php/partnerservices2/contactsalesforce"
    },
    "menuConfig": [
      {
        "routePath": "content",
        "titleToken": "Content",
        "showSubMenu": true,
        "enabled": true,
        "children": [
          {
            "routePath": "content/entries",
            "titleToken": "Entries",
            "enabled": true
          },
          {
            "routePath": "content/moderation",
            "titleToken": "Moderation",
            "enabled": false
          },
          {
            "routePath": "content/playlists",
            "titleToken": "Playlists",
            "enabled": true
          },
          {
            "routePath": "content/syndication",
            "titleToken": "Syndication",
            "enabled": false
          },
          {
            "routePath": "content/categories",
            "titleToken": "Categories",
            "enabled": true
          }
        ]
      },
      {
        "routePath": "studio",
        "titleToken": "Studio",
        "showSubMenu": false,
        "enabled": false
      },
      {
        "routePath": "analytics",
        "titleToken": "Analytics",
        "showSubMenu": false,
        "enabled": false
      },
      {
        "routePath": "settings",
        "titleToken": "",
        "showSubMenu": true,
        "enabled": true,
        "children": [
          {
            "routePath": "settings/accountSettings",
            "titleToken": "Account Settings",
            "enabled": true
          },
          {
            "routePath": "settings/accountUpgrade",
            "titleToken": "Account Upgrade",
            "enabled": true
          }
        ]
      },
      {
        "routePath": "administration",
        "titleToken": "",
        "showSubMenu": true,
        "enabled": true,
        "children": [
          {
            "routePath": "administration/users",
            "titleToken": "Users",
            "enabled": true
          },
          {
            "routePath": "administration/roles",
            "titleToken": "Roles",
            "enabled": true
          }
        ]
      }
    ],
    "diagnostic" : {
      "debugging": true
    },
    "externalLinks": {
      "USER_MANUAL": "https://kmc.kaltura.com/content/docs/pdf/KMC_User_Manual.pdf",
      "SUPPORT": "http://kmc.kaltura.com/index.php/kmc/support",
      "SIGNUP": "https://corp.kaltura.com/free-trial",
      "CONTACT_US": "https://corp.kaltura.com/company/contact-us"
    },
    "locales": [
      {
        "id": "en",
        "label": "English",
        "source": "i18n/en.json"
      },
      {
        "id": "de",
        "label": "Deutsch",
        "source": "i18n/de.json"
      },
      {
        "id": "es",
        "label": "Español",
        "source": "i18n/es.json"
      },
      {
        "id": "fr",
        "label": "Français",
        "source": "i18n/fr.json"
      },
      {
        "id": "ja",
        "label": "日本語",
        "source": "i18n/ja.json"
      }
    ]
  },
  "modules": {
    "studio_universal": {
      "apiUrl": "http://www.kaltura.com"
    },
    "contentEntries" : {
      "createdAtDateRange" : "2005:2030",
      "bulkActionsLimit": 50
    },
    "contentPlaylists" : {
      "createdAtDateRange" : "2005:2030",
      "bulkActionsLimit": 2
    }
  },
  "entriesShared": {
    "MAX_ENTRIES": 10000,
    "categoriesFilters": {
      "maxChildrenToShow": 500
    }
  },
  "categoriesShared": {
    "MAX_CATEGORIES": 10000,
    "categoriesFilters": {
      "maxChildrenToShow": 500
    }
  }
}
