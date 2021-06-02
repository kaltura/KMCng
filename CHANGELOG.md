<a name="6.5.4"></a>
## [6.5.4](https://github.com/kaltura/kmc-ng/compare/v6.5.3...v6.5.4) (2021-06-06)


### Bug Fixes

* **Live:** Ignore empty secondaryRtspBroadcastingUrl


<a name="6.5.3"></a>
## [6.5.3](https://github.com/kaltura/kmc-ng/compare/v6.5.2...v6.5.3) (2021-04-05)


### Bug Fixes

* **studio:** support beta player versions map and conf vars KMCNG-2310 ([77bf525](https://github.com/kaltura/kmc-ng/commit/77bf525))



<a name="6.5.2"></a>
## [6.5.2](https://github.com/kaltura/kmc-ng/compare/v6.5.1...v6.5.2) (2021-03-18)


### Bug Fixes

* **administation/user:** update role description when a new role is selected KMCNG-2305 ([050128b](https://github.com/kaltura/kmc-ng/commit/050128b))
* **analytics:** Prevent loading jQuery with Analytics KMCNG-2307 ([6890d9d](https://github.com/kaltura/kmc-ng/commit/6890d9d))
* **share-and-embed:** V7 iFrame embed - support encrypted-media SUP-26849 ([48f5a93](https://github.com/kaltura/kmc-ng/commit/48f5a93))
* **upload:** fill additional entry fields upon upload KMCNG-2308 ([33acb00](https://github.com/kaltura/kmc-ng/commit/33acb00))



<a name="6.5.1"></a>
## [6.5.1](https://github.com/kaltura/kmc-ng/compare/v6.5.0...v6.5.1) (2021-02-17)


### Bug Fixes

* **studio:** Add playerConfVars to studio configuration



<a name="6.5.0"></a>
# [6.5.0](https://github.com/kaltura/kmc-ng/compare/v6.4.0...v6.5.0) (2021-02-07)


### Bug Fixes

* **entry/live:** remove "Export XML for FMLE" button and ""Live Content Detailed Report" link (KMCNG-2292) ([ef0d844](https://github.com/kaltura/kmc-ng/commit/ef0d844))


### Features

* **content/entries:** add "Played Until" filter to entries list ([#926](https://github.com/kaltura/kmc-ng/issues/926)) ([9db8108](https://github.com/kaltura/kmc-ng/commit/9db8108))



<a name="6.4.0"></a>
# [6.4.0](https://github.com/kaltura/kmc-ng/compare/v6.3.2...v6.4.0) (2021-01-24)


### Bug Fixes

* **entry/captions:** support captions editor for WebVTT ([#925](https://github.com/kaltura/kmc-ng/issues/925)) ([26283af](https://github.com/kaltura/kmc-ng/commit/26283af))


### Features

* **settings/reach:** add captions label suffix field ([b1fe1ca](https://github.com/kaltura/kmc-ng/commit/b1fe1ca))



<a name="6.3.2"></a>
## [6.3.2](https://github.com/kaltura/kmc-ng/compare/v6.3.1...v6.3.2) (2021-01-04)


### Bug Fixes

* **playlist/rule-based:** Support eSearch free text field in playlist execution and save filter status SUP-24606 ([#921](https://github.com/kaltura/kmc-ng/issues/921)) ([26cf75c](https://github.com/kaltura/kmc-ng/commit/26cf75c))



<a name="6.3.1"></a>
## [6.3.1](https://github.com/kaltura/kmc-ng/compare/v6.3.0...v6.3.1) (2020-12-13)


### Bug Fixes

* **entries/list:** Webcast entries - display link to Realtime Analytics in entries table actions menu ([096111a](https://github.com/kaltura/kmc-ng/commit/096111a))
* **entry/permissions:** Handle advertising and category / playlist permissions on bulk actions ([#920](https://github.com/kaltura/kmc-ng/issues/920)) ([efc7742](https://github.com/kaltura/kmc-ng/commit/efc7742))
* **entry/upload:** Support m2v video file format ([820810c](https://github.com/kaltura/kmc-ng/commit/820810c))
* **login:** support 2FA login where the KS is passed via configuration instead of URL parameters ([f702963](https://github.com/kaltura/kmc-ng/commit/f702963))
* **localization:** support Portuguese language ([#923](https://github.com/kaltura/kmc-ng/issues/923)) ([b86cd65](https://github.com/kaltura/kmc-ng/commit/b86cd65))


<a name="6.3.0"></a>
# [6.3.0](https://github.com/kaltura/kmc-ng/compare/v6.2.3...v6.3.0) (2020-09-06)


### Bug Fixes

* **logout:** call session.end with KS ([3c0f3c8](https://github.com/kaltura/kmc-ng/commit/3c0f3c8))
* **logout:** redirect to partner logoutUrl (if defined) upon logout ([744d89a](https://github.com/kaltura/kmc-ng/commit/744d89a))


### Features

* **entry/captions:** Edit specific caption in Captions Editor ([5d08474](https://github.com/kaltura/kmc-ng/commit/5d08474))
* **entry/analytics:** Support Webcast Analytics



<a name="6.2.3"></a>
## [6.2.3](https://github.com/kaltura/kmc-ng/compare/v6.2.2...v6.2.3) (2020-08-02)


### Bug Fixes

* **entry/captions:** Add Caption Editor option to caption actions menu ([d82d45c](https://github.com/kaltura/kmc-ng/commit/d82d45c))
* **login:** security enhancement - add autocomplete="off" to all login form inputs ([dd9bf8e](https://github.com/kaltura/kmc-ng/commit/dd9bf8e))



<a name="6.2.2"></a>
## [6.2.2](https://github.com/kaltura/kmc-ng/compare/v6.2.1...v6.2.2) (2020-07-12)


### Bug Fixes

* **content:** style fixes for search field and filter icons ([874227a](https://github.com/kaltura/kmc-ng/commit/874227a))



<a name="6.2.1"></a>
## [6.2.1](https://github.com/kaltura/kmc-ng/compare/v6.2.0...v6.2.1) (2020-07-06)


### Bug Fixes

* **content/entry:** Allow downloading flavors when using access control restrictions ([be5fa44](https://github.com/kaltura/kmc-ng/commit/be5fa44))



<a name="6.2.0"></a>
# [6.2.0](https://github.com/kaltura/kmc-ng/compare/v6.1.0...v6.2.0) (2020-06-22)


### Features

* **content/entries:** Support entries description field in free text advanced search options ([f45dc03](https://github.com/kaltura/kmc-ng/commit/f45dc03))
* **content/entries:** Filter for entries without captions ([b858417](https://github.com/kaltura/kmc-ng/commit/b858417))



<a name="6.1.0"></a>
# [6.1.0](https://github.com/kaltura/kmc-ng/compare/v6.0.0...v6.1.0) (2020-06-08)


### Bug Fixes

* **content/entry:** prevent infinite spinner when replacing media (SUP-22420) ([d670118](https://github.com/kaltura/kmc-ng/commit/d670118))
* **playlists:** Support Path Analytics ([44c8281](https://github.com/kaltura/kmc-ng/commit/44c8281))


### Features

* **content/entries:** Advanced Search Options ([#909](https://github.com/kaltura/kmc-ng/issues/909)) ([a2f83a3](https://github.com/kaltura/kmc-ng/commit/a2f83a3))



<a name="6.0.0"></a>
# [6.0.0](https://github.com/kaltura/kmc-ng/compare/v5.27.0...v6.0.0) (2020-05-20)

### Bug Fixes

* **content/bulk-log:** Updated filter to list only relevant bulk log types


### Features

* upgrade libraries to Angular 9 ([#905](https://github.com/kaltura/kmc-ng/issues/905)) ([7caac21](https://github.com/kaltura/kmc-ng/commit/7caac21))



<a name="5.27.0"></a>
# [5.27.0](https://github.com/kaltura/kmc-ng/compare/v5.26.2...v5.27.0) (2020-05-11)


### Features

* **settings/integration-settings:** Add Youtube distribution profiles management ([#904](https://github.com/kaltura/kmc-ng/issues/904)) ([dab5c01](https://github.com/kaltura/kmc-ng/commit/dab5c01))



<a name="5.26.2"></a>
## [5.26.2](https://github.com/kaltura/kmc-ng/compare/v5.26.1...v5.26.2) (2020-05-04)

### Bug Fixes

* **content/playlists:** Handle path interactive videos in playlist list and edit views
* **entry/captions:** Enable "Display On player" for default captions when its set to false
* **entry/download:** Open flavours selector for audio entries download


<a name="5.26.1"></a>
## [5.26.1](https://github.com/kaltura/kmc-ng/compare/v5.26.0...v5.26.1) (2020-04-22)


### Bug Fixes

* **analytics:** fix history navigation using the browser back button ([13ab682](https://github.com/kaltura/kmc-ng/commit/13ab682))
* **entry/captions:** set showShortTurnaroundTimeAlert in reach configuration according to entry duration ([104b8f1](https://github.com/kaltura/kmc-ng/commit/104b8f1))
* **entry/distribution:** fix stying for Youtube compliance ([3b3f57d](https://github.com/kaltura/kmc-ng/commit/3b3f57d))



<a name="5.26.0"></a>
# [5.26.0](https://github.com/kaltura/kmc-ng/compare/v5.25.0...v5.26.0) (2020-03-31)


### Bug Fixes

* **category/analytics:** Update Analytics queryParams upon switching IDs in the same route ([#897](https://github.com/kaltura/kmc-ng/issues/897)) ([c774054](https://github.com/kaltura/kmc-ng/commit/c774054))
* **settings/reach:** mark section as invalid when caption max characters is empty ([640b045](https://github.com/kaltura/kmc-ng/commit/640b045))
* **upload:** Add support for .flac audio type ([dbdbbce](https://github.com/kaltura/kmc-ng/commit/dbdbbce))
* **content/entry:** track accuracy changes made to old captions with no accuracy


### Features

* **content/playlists:** Add Interactive Video filter ([#899](https://github.com/kaltura/kmc-ng/issues/899)) ([6541a42](https://github.com/kaltura/kmc-ng/commit/6541a42))



<a name="5.25.0"></a>
# [5.25.0](https://github.com/kaltura/kmc-ng/compare/v5.24.1...v5.25.0) (2020-03-17)


### Bug Fixes

* **content/entries:** style and position of Youtube and Quiz icons in entries list ([c82b280](https://github.com/kaltura/kmc-ng/commit/c82b280))


### Features

* **content/category:** add category Analytics ([#893](https://github.com/kaltura/kmc-ng/issues/893)) ([6d1a79a](https://github.com/kaltura/kmc-ng/commit/6d1a79a))



<a name="5.24.1"></a>
# [5.24.1](https://github.com/kaltura/kmc-ng/compare/v5.24.0...v5.24.1) (2020-03-08)

### Bug Fixes

* **content/playlist:** Fixed rule-based playlist entries count calculation


<a name="5.24.0"></a>
# [5.24.0](https://github.com/kaltura/kmc-ng/compare/v5.22.1...v5.24.0) (2020-02-18)


### Bug Fixes

* **settings/custom-data:** Add support to complexType choice attribute ([#892](https://github.com/kaltura/kmc-ng/issues/892)) ([da12caf](https://github.com/kaltura/kmc-ng/commit/da12caf))


### Features

* **entry/captions:** Display / add / edit captions accuracy ([#888](https://github.com/kaltura/kmc-ng/issues/888)) ([40a93b0](https://github.com/kaltura/kmc-ng/commit/40a93b0))
* **settings/reach:** List Reach services: Alignment, Audio Description, Chaptering ([d475cea](https://github.com/kaltura/kmc-ng/commit/d475cea))
* **content/entries:** Filter by captions


<a name="5.23.0"></a>
# [5.23.0](https://github.com/kaltura/kmc-ng/compare/v5.22.0...v5.23.0) (2020-02-03)

### Bug Fixes

* **settings/custom-metadata:** Allow using the '+' character in text select list values

### Features

* **settings/reach:** View and edit Reach profiles ([#887](https://github.com/kaltura/kmc-ng/issues/887)) ([73c379a](https://github.com/kaltura/kmc-ng/commit/73c379a))
* **settings/reach:** Reach services ([#890](https://github.com/kaltura/kmc-ng/issues/890)) ([5ec8783](https://github.com/kaltura/kmc-ng/commit/5ec8783))



<a name="5.22.0"></a>
# [5.22.0](https://github.com/kaltura/kmc-ng/compare/v5.21.1...v5.22.0) (2020-01-22)


### Bug Fixes

* **content/playlist:** fix entries list filters alignment in IE11 ([807d296](https://github.com/kaltura/kmc-ng/commit/807d296))


### Features

* Support Analytics localization ([#883](https://github.com/kaltura/kmc-ng/issues/883)) ([709834d](https://github.com/kaltura/kmc-ng/commit/709834d))



<a name="5.21.1"></a>
## [5.21.1](https://github.com/kaltura/kmc-ng/compare/v5.21.0...v5.21.1) (2020-01-09)


### Bug Fixes

* **content/entries:** Display Real-time Analytics in live entry actions for Akamai live entries ([d74a690](https://github.com/kaltura/kmc-ng/commit/d74a690))
* **content/entry:** navigate to correct Analytics screen in Akamai live sources ([1c96107](https://github.com/kaltura/kmc-ng/commit/1c96107))
* **contextual-help:** Fix contextual help for category metadata section ([08e04f7](https://github.com/kaltura/kmc-ng/commit/08e04f7))



<a name="5.21.0"></a>
# [5.21.0](https://github.com/kaltura/kmc-ng/compare/v5.20.0...v5.21.0) (2019-12-25)


### Bug Fixes

* **admin/roles:** Alert message when trying to delete a role that is assigned - should not include a 'Retry' button ([f28afe1](https://github.com/kaltura/kmc-ng/commit/f28afe1))
* **admin/roles:** Fix permissions for bulk end user upload ([c603724](https://github.com/kaltura/kmc-ng/commit/c603724))


### Features

* **settings/metadata:** Add User Entry metadata fields ([#881](https://github.com/kaltura/kmc-ng/issues/881)) ([b80f5c6](https://github.com/kaltura/kmc-ng/commit/b80f5c6))



<a name="5.20.0"></a>
# [5.20.0](https://github.com/kaltura/kmc-ng/compare/v5.19.2...v5.20.0) (2019-12-12)


### Bug Fixes

* **KMCNG-2201:** selected entries bucket style ([#871](https://github.com/kaltura/kmc-ng/issues/871)) ([06c0e5b](https://github.com/kaltura/kmc-ng/commit/06c0e5b))


### Features

* **content/playlists:** support Interactive Video entries (rapt playlists) ([#880](https://github.com/kaltura/kmc-ng/issues/880)) ([e6778ee](https://github.com/kaltura/kmc-ng/commit/e6778ee))



<a name="5.19.2"></a>
## [5.19.2](https://github.com/kaltura/kmc-ng/compare/v5.19.1...v5.19.2) (2019-11-21)



<a name="5.19.1"></a>
## [5.19.1](https://github.com/kaltura/kmc-ng/compare/v5.19.0...v5.19.1) (2019-11-11)



<a name="5.19.0"></a>
# [5.19.0](https://github.com/kaltura/kmc-ng/compare/v5.18.0...v5.19.0) (2019-11-04)


### Bug Fixes

* **SUP-19722:** load max 500 dropfolders at once ([#868](https://github.com/kaltura/kmc-ng/issues/868)) ([023c0c7](https://github.com/kaltura/kmc-ng/commit/023c0c7))


### Features

* **entries/refine-filter:** Filter for entries with Quiz ([#745](https://github.com/kaltura/kmc-ng/issues/745)) ([be22f06](https://github.com/kaltura/kmc-ng/commit/be22f06))
* **entries/refine-filter:** Filter for YouTube entries ([#874](https://github.com/kaltura/kmc-ng/issues/874)) ([6620ffe](https://github.com/kaltura/kmc-ng/commit/6620ffe))



<a name="5.18.0"></a>
# [5.18.0](https://github.com/kaltura/kmc-ng/compare/v5.17.0...v5.18.0) (2019-10-07)


### Bug Fixes

* **content/entry:** open live analytics for manual live entries ([614c63e](https://github.com/kaltura/kmc-ng/commit/614c63e))


### Features

* Upgrade to Angular 8 ([#853](https://github.com/kaltura/kmc-ng/issues/853)) ([82e506c](https://github.com/kaltura/kmc-ng/commit/82e506c))
* Add the ability to toggle captions ([#869](https://github.com/kaltura/kmc-ng/issues/869)) ([6319b3d](https://github.com/kaltura/kmc-ng/commit/6319b3d))



<a name="5.17.0"></a>
# [5.17.0](https://github.com/kaltura/kmc-ng/compare/v5.16.1...v5.17.0) (2019-09-19)


### Bug Fixes

* **login:** direct users to login with SSO page ([22e9505](https://github.com/kaltura/kmc-ng/commit/22e9505))


### Features

* **administration/users:** add user analytics drill-down action ([#862](https://github.com/kaltura/kmc-ng/issues/862)) ([035e7e1](https://github.com/kaltura/kmc-ng/commit/035e7e1))


<a name="5.16.1"></a>
## [5.16.1](https://github.com/kaltura/kmc-ng/compare/v5.16.0...v5.16.1) (2019-09-15)


### Bug Fixes

* **content/syndication:** select default English language for iTunes syndication feeds ([b9b36a7](https://github.com/kaltura/kmc-ng/commit/b9b36a7))
* **settings/transcoding:** make flavors checkboxes selectable ([#867](https://github.com/kaltura/kmc-ng/issues/867)) ([bf08b6e](https://github.com/kaltura/kmc-ng/commit/bf08b6e))



<a name="5.16.0"></a>
# [5.16.0](https://github.com/kaltura/kmc-ng/compare/v5.15.0...v5.16.0) (2019-09-08)


### Bug Fixes

* analytics navigation approach ([#864](https://github.com/kaltura/kmc-ng/issues/864)) ([d2baea7](https://github.com/kaltura/kmc-ng/commit/d2baea7))


### Features

* Support SSO login ([#866](https://github.com/kaltura/kmc-ng/issues/866)) ([51156ee](https://github.com/kaltura/kmc-ng/commit/51156ee))



<a name="5.15.0"></a>
# [5.15.0](https://github.com/kaltura/kmc-ng/compare/v5.14.0...v5.15.0) (2019-09-01)


### Bug Fixes

* Multi account menu style fixes ([#861](https://github.com/kaltura/kmc-ng/issues/861)) ([d6b823b](https://github.com/kaltura/kmc-ng/commit/d6b823b))


### Features

* **content/drop-folders:** Add drop folders filter by folder name ([#863](https://github.com/kaltura/kmc-ng/issues/863)) ([fffa4c4](https://github.com/kaltura/kmc-ng/commit/fffa4c4))



<a name="5.14.0"></a>
# [5.14.0](https://github.com/kaltura/kmc-ng/compare/v5.13.1...v5.14.0) (2019-08-25)


### Bug Fixes

* **content/entry:** In scheduling tab: display entry end date even if entry start date is not specified ([45985ea](https://github.com/kaltura/kmc-ng/commit/45985ea))
* **entries/filters:** fix refine filter custom scheduling date picker behavior ([d231b8e](https://github.com/kaltura/kmc-ng/commit/d231b8e))
* **content/entries:** Load thumbnails restricted by KS


### Features

* **analytics:** Add multi-account analytics ([#860](https://github.com/kaltura/kmc-ng/issues/860)) ([5def1a0](https://github.com/kaltura/kmc-ng/commit/5def1a0))



<a name="5.13.1"></a>
## [5.13.1](https://github.com/kaltura/kmc-ng/compare/v5.13.0...v5.13.1) (2019-08-01)


### Bug Fixes

* **entries/metadata:** Fix custom metadata search in refine filter ([#858](https://github.com/kaltura/kmc-ng/issues/858)) ([8f16be3](https://github.com/kaltura/kmc-ng/commit/8f16be3))



<a name="5.13.0"></a>
# [5.13.0](https://github.com/kaltura/kmc-ng/compare/v5.12.1...v5.13.0) (2019-07-28)


### Features

* **entry-live:** add SIP user support for entry drill-down live tab ([#857](https://github.com/kaltura/kmc-ng/issues/857)) ([a2ff592](https://github.com/kaltura/kmc-ng/commit/a2ff592))



<a name="5.12.1"></a>
## [5.12.1](https://github.com/kaltura/kmc-ng/compare/v5.12.0...v5.12.1) (2019-07-23)


### Bug Fixes

* **entry/preview:** pass admin ks to player ([0cc2566](https://github.com/kaltura/kmc-ng/commit/0cc2566))
* **settings/transcoding-profiles:** allow saving new profiles ([b813909](https://github.com/kaltura/kmc-ng/commit/b813909))



<a name="5.12.0"></a>
# [5.12.0](https://github.com/kaltura/kmc-ng/compare/v5.11.0...v5.12.0) (2019-07-11)


### Bug Fixes

* **analytics:** allow real-time analytics player to toggle full screen ([fc2483e](https://github.com/kaltura/kmc-ng/commit/fc2483e))
* Fix caption request not working on Mac Safari ([b4c4461](https://github.com/kaltura/kmc-ng/commit/b4c4461))
* **entries/bulk-actions:** prevent app crash on bulk edit ([#852](https://github.com/kaltura/kmc-ng/issues/852)) ([67c3172](https://github.com/kaltura/kmc-ng/commit/67c3172))
* **entry/details:** hide old analytics link if not available ([#849](https://github.com/kaltura/kmc-ng/issues/849)) ([b4d77bb](https://github.com/kaltura/kmc-ng/commit/b4d77bb))
* **entry/live:** update go live button status upon polling ([#850](https://github.com/kaltura/kmc-ng/issues/850)) ([2ce5741](https://github.com/kaltura/kmc-ng/commit/2ce5741))
* **login:** Clear error message after restoring password fails ([bfee611](https://github.com/kaltura/kmc-ng/commit/bfee611))
* **preview:** support DRM playback in all KMC preview players ([e3d1dcc](https://github.com/kaltura/kmc-ng/commit/e3d1dcc))
* **settings/my-user-settings:** remove email edit option ([a7bd6a1](https://github.com/kaltura/kmc-ng/commit/a7bd6a1))
* **settings/transcoding-settings:** prevent removal of default flavorParamId when saving profile flavors list ([27ac9b8](https://github.com/kaltura/kmc-ng/commit/27ac9b8))
* **share & embed:** Refresh player when switching embed types to properly render thumbnail embed ([#847](https://github.com/kaltura/kmc-ng/issues/847)) ([e0a0a0c](https://github.com/kaltura/kmc-ng/commit/e0a0a0c))
* **upload:** update client lib to support minimumChunkSize specification when creating a new uploadToken ([537526e](https://github.com/kaltura/kmc-ng/commit/537526e))


### Features

* **analytics:** provide date format in analytics config ([#854](https://github.com/kaltura/kmc-ng/issues/854)) ([82d31f4](https://github.com/kaltura/kmc-ng/commit/82d31f4))
* **entry(captions):** Support SCC caption type



<a name="5.11.0"></a>
# [5.11.0](https://github.com/kaltura/kmc-ng/compare/v5.10.0...v5.11.0) (2019-06-13)


### Bug Fixes

* **login:** fix update password to work when the user is not logged in ([03bc2ee](https://github.com/kaltura/kmc-ng/commit/03bc2ee))


### Features

* Real-time analytics ([#845](https://github.com/kaltura/kmc-ng/issues/845)) ([e9708e4](https://github.com/kaltura/kmc-ng/commit/e9708e4)), closes [#843](https://github.com/kaltura/kmc-ng/issues/843) [#842](https://github.com/kaltura/kmc-ng/issues/842)
* Two factor authentication support ([#844](https://github.com/kaltura/kmc-ng/issues/844)) ([4b809f4](https://github.com/kaltura/kmc-ng/commit/4b809f4))



<a name="5.10.0"></a>
# [5.10.0](https://github.com/kaltura/kmc-ng/compare/v5.9.1...v5.10.0) (2019-05-29)


### Bug Fixes

* **administration/multi-account:** allow only active accounts to be used as templates ([3107050](https://github.com/kaltura/kmc-ng/commit/3107050))
* **administration/multi-account:** disable "Create" button until data loads ([24e9d2e](https://github.com/kaltura/kmc-ng/commit/24e9d2e))
* **administration/multi-account:** disregard removed templates for new account creation ([542a01c](https://github.com/kaltura/kmc-ng/commit/542a01c))


### Features

* **content/entries:** bulk add/remove of co-viewers ([4e24b9b](https://github.com/kaltura/kmc-ng/commit/4e24b9b))



<a name="5.9.1"></a>
## [5.9.1](https://github.com/kaltura/kmc-ng/compare/v5.9.0...v5.9.1) (2019-05-21)


### Bug Fixes

* prevent passwords auto filling  ([#831](https://github.com/kaltura/kmc-ng/issues/831)) ([d853051](https://github.com/kaltura/kmc-ng/commit/d853051))
* **administration/multi-account:** disable create button on error state ([462881c](https://github.com/kaltura/kmc-ng/commit/462881c))
* **administration/multi-account:** fix adding website info when creating new account ([cfbb7d4](https://github.com/kaltura/kmc-ng/commit/cfbb7d4))
* **administration/multi-account:** fix available accounts calculation ([f270218](https://github.com/kaltura/kmc-ng/commit/f270218))
* **entry/captions:** support Luxembourgish captions ([9cae1a9](https://github.com/kaltura/kmc-ng/commit/9cae1a9))



<a name="5.9.0"></a>
# [5.9.0](https://github.com/kaltura/kmc-ng/compare/v5.8.0...v5.9.0) (2019-05-15)


### Bug Fixes

* **users/edit:** select the correct user role in the roles drop-down when editing an existing user ([30e532d](https://github.com/kaltura/kmc-ng/commit/30e532d))


### Features

* Multi account management ([#832](https://github.com/kaltura/kmc-ng/issues/832)) ([ea325e0](https://github.com/kaltura/kmc-ng/commit/ea325e0))
* upgrade kea editor to version 2.28.12 which include hotspots ([#822](https://github.com/kaltura/kmc-ng/issues/822)) ([31bae91](https://github.com/kaltura/kmc-ng/commit/31bae91))
* Display thumbnail tags in the entry thumbnails table



<a name="5.8.0"></a>
# [5.8.0](https://github.com/kaltura/kmc-ng/compare/v5.7.1...v5.8.0) (2019-04-18)


### Bug Fixes

* Server poll invalid KS handling ([#827](https://github.com/kaltura/kmc-ng/issues/827)) ([6215876](https://github.com/kaltura/kmc-ng/commit/6215876))
* **content/category:** Allow editing entitlements of categories which owner was deleted ([72219ae](https://github.com/kaltura/kmc-ng/commit/72219ae))
* **content/syndication:** Handle Syndication feeds which use a playlist which is not loaded in the first 500 playlists ([#826](https://github.com/kaltura/kmc-ng/issues/826)) ([21a1bcc](https://github.com/kaltura/kmc-ng/commit/21a1bcc))


### Features

* **entry/users:** Add co-viewers form field ([#828](https://github.com/kaltura/kmc-ng/issues/828)) ([d4222fd](https://github.com/kaltura/kmc-ng/commit/d4222fd))
* let user choose date format ([#829](https://github.com/kaltura/kmc-ng/issues/829)) ([a163026](https://github.com/kaltura/kmc-ng/commit/a163026))



<a name="5.7.1"></a>
## [5.7.1](https://github.com/kaltura/kmc-ng/compare/v5.7.0...v5.7.1) (2019-04-04)

### Features

* Content interactions dashboard in the analytics dashboards
* Export to csv functionality in the analytics dashboard


<a name="5.7.0"></a>
# [5.7.0](https://github.com/kaltura/kmc-ng/compare/v5.6.5...v5.7.0) (2019-03-31)


### Bug Fixes

* **entry/contribution:** Fix entry size calculation ([eb82ba2](https://github.com/kaltura/kmc-ng/commit/eb82ba2))
* **entry/preview:** Support Youtube entries playback in mini-preview ([9c18060](https://github.com/kaltura/kmc-ng/commit/9c18060))


### Features

* New Analytics ([6609893](https://github.com/kaltura/kmc-ng/commit/6609893))



<a name="5.6.5"></a>
## [5.6.5](https://github.com/kaltura/kmc-ng/compare/v5.6.4...v5.6.5) (2019-03-10)


### Bug Fixes

* **categories:** Show up to 100 sub-categories in the category details panel ([2bb1467](https://github.com/kaltura/kmc-ng/commit/2bb1467))
* **login:** fix password expiration message ([56517e1](https://github.com/kaltura/kmc-ng/commit/56517e1))



<a name="5.6.4"></a>
## [5.6.4](https://github.com/kaltura/kmc-ng/compare/v5.6.3...v5.6.4) (2019-02-07)


### Bug Fixes

* **entry/captions:** Support ordering captions for Youtube entries ([701dd3f](https://github.com/kaltura/kmc-ng/commit/701dd3f))
* **entry/related:** Add support to JSON files in entry related files ([bcc05f6](https://github.com/kaltura/kmc-ng/commit/bcc05f6))
* **syndication:** Encode '&' symbol when creating feeds with categories containing ampersand ([b738b46](https://github.com/kaltura/kmc-ng/commit/b738b46))



<a name="5.6.3"></a>
## [5.6.3](https://github.com/kaltura/kmc-ng/compare/v5.6.2...v5.6.3) (2019-01-29)


### Bug Fixes

* **entry/distribution:** fix errors mapping ([7e4419f](https://github.com/kaltura/kmc-ng/commit/7e4419f))



<a name="5.6.2"></a>
## [5.6.2](https://github.com/kaltura/kmc-ng/compare/v5.6.1...v5.6.2) (2019-01-13)


### Bug Fixes

* **advertisements:** Enable advertisements for entries without Source flavor ([e9e29d0](https://github.com/kaltura/kmc-ng/commit/e9e29d0))
* **analytics:** Fix cdn_host parameter passed to Live-Analytics ([c290579](https://github.com/kaltura/kmc-ng/commit/c290579))
* **syndication:** Syndication feeds are not created for some playlists



<a name="5.6.1"></a>
## [5.6.1](https://github.com/kaltura/kmc-ng/compare/v5.6.0...v5.6.1) (2018-12-26)


### Bug Fixes

* **analytics:** fix layout ([a95905f](https://github.com/kaltura/kmc-ng/commit/a95905f))



<a name="5.6.0"></a>
# [5.6.0](https://github.com/kaltura/kmc-ng/compare/v5.5.2...v5.6.0) (2018-12-25)


### Bug Fixes

* **content/entry:** fix distribution delete message layout + support passing accept and reject button labels to confirm box ([2d6303d](https://github.com/kaltura/kmc-ng/commit/2d6303d))
* **content/entry:** support additional video formats when updating flavour or replacing video ([ba5b7ee](https://github.com/kaltura/kmc-ng/commit/ba5b7ee))
* **live-analytics:** fix cdn_host for secured protocol ([5f8511b](https://github.com/kaltura/kmc-ng/commit/5f8511b))


### Features

* Add support for Sami languages when uploading captions to KMC
* Custom metadata - display field system name



<a name="5.5.2"></a>
## [5.5.2](https://github.com/kaltura/kmc-ng/compare/v5.5.1...v5.5.2) (2018-11-07)


### Bug Fixes

* **content/entry:** fix position of upload settings window on MS Edge when replacing video ([e952515](https://github.com/kaltura/kmc-ng/commit/e952515))



<a name="5.5.1"></a>
## [5.5.1](https://github.com/kaltura/kmc-ng/compare/v5.5.0...v5.5.1) (2018-11-04)


### Bug Fixes

* **upload:** fix position of upload settings window on MS Edge ([f5e2453](https://github.com/kaltura/kmc-ng/commit/f5e2453))
* fix create menu icons width in all languages ([ebe3262](https://github.com/kaltura/kmc-ng/commit/ebe3262))
* fix Yahoo and iTunes category tags translation in German ([4411d2e](https://github.com/kaltura/kmc-ng/commit/4411d2e))



<a name="5.5.0"></a>
# [5.5.0](https://github.com/kaltura/kmc-ng/compare/v5.4.2...v5.5.0) (2018-10-25)


### Bug Fixes

* **administration/users:** enable KMC access to existing KMS users when creating a new user using a KMS user ID ([d57ef34](https://github.com/kaltura/kmc-ng/commit/d57ef34))
* **content/category:** update entitlements options labels ([e4c9fe1](https://github.com/kaltura/kmc-ng/commit/e4c9fe1))
* **content/playlist:** remove the "Plays" field from the playlist details info ([52d043c](https://github.com/kaltura/kmc-ng/commit/52d043c))
* **contextual-help:** update broken links in contextual help system ([9b5ee24](https://github.com/kaltura/kmc-ng/commit/9b5ee24))


### Features

* **content/syndication:** support the latest version of the Kaltura player in Syndication ([41f4912](https://github.com/kaltura/kmc-ng/commit/41f4912))



<a name="5.4.2"></a>
## [5.4.2](https://github.com/kaltura/kmc-ng/compare/v5.4.1...v5.4.2) (2018-10-07)


### Bug Fixes

* **content/category:** fix "Move Category" panel height to support other languages ([211ba28](https://github.com/kaltura/kmc-ng/commit/211ba28))
* **content/entry:** fix entry actions button width on Firefox ([058bb95](https://github.com/kaltura/kmc-ng/commit/058bb95))
* **help:** add missing help links to settings/account information section ([7b75185](https://github.com/kaltura/kmc-ng/commit/7b75185))
* hide OTT players from VOD Share & Embed players list ([561d159](https://github.com/kaltura/kmc-ng/commit/561d159))
* **settings/account-info:** fix form sending error ([6affdc3](https://github.com/kaltura/kmc-ng/commit/6affdc3))



<a name="5.4.1"></a>
## [5.4.1](https://github.com/kaltura/kmc-ng/compare/v5.4.0...v5.4.1) (2018-10-03)


### Bug Fixes

* style fixes for updated multi-select component ([2b9bdfd](https://github.com/kaltura/kmc-ng/commit/2b9bdfd))
* update v2 and v7 player icons ([c340f20](https://github.com/kaltura/kmc-ng/commit/c340f20))



<a name="5.4.0"></a>
# [5.4.0](https://github.com/kaltura/kmc-ng/compare/v5.3.2...v5.4.0) (2018-09-27)


### Bug Fixes

* **content/entry:** handle captions with no label or default state definitions ([9f62334](https://github.com/kaltura/kmc-ng/commit/9f62334))
* **share-and-embed:** List all V2 players in the partner account ([#800](https://github.com/kaltura/kmc-ng/issues/800)) ([9a10094](https://github.com/kaltura/kmc-ng/commit/9a10094))
* **upload:** fix "Create from URL" table styling ([888cdda](https://github.com/kaltura/kmc-ng/commit/888cdda))


### Features

* **content/playlist:** support "move to top" and "move to bottom" for manual playlist single entries ([5d91b0b](https://github.com/kaltura/kmc-ng/commit/5d91b0b))
* support contextual help ([92d898e](https://github.com/kaltura/kmc-ng/commit/92d898e))
* support language selection ([a83cbae](https://github.com/kaltura/kmc-ng/commit/a83cbae))
* support languages: English, French, Spanish, German, Japanese ([b67704f](https://github.com/kaltura/kmc-ng/commit/b67704f))
* Support for the latest version of the Kaltura player ([#801](https://github.com/kaltura/kmc-ng/issues/801)) ([293abf1](https://github.com/kaltura/kmc-ng/commit/293abf1))



<a name="5.3.2"></a>
## [5.3.2](https://github.com/kaltura/kmc-ng/compare/v5.3.1...v5.3.2) (2018-08-22)


### Bug Fixes

* **content/entries:** adjust position of the Youtube icon on entry thumbnails ([825d2f3](https://github.com/kaltura/kmc-ng/commit/825d2f3))
* **content/entry:** disable entry download if user doesn't have the required permissions ([872799b](https://github.com/kaltura/kmc-ng/commit/872799b))
* **upload:** fix "Create from URL" upload button label ([3439b78](https://github.com/kaltura/kmc-ng/commit/3439b78))
* **upload:** set entry name and format for entries created from URL ([#798](https://github.com/kaltura/kmc-ng/issues/798)) ([b7d3621](https://github.com/kaltura/kmc-ng/commit/b7d3621))



<a name="5.3.1"></a>
## [5.3.1](https://github.com/kaltura/kmc-ng/compare/v5.3.0...v5.3.1) (2018-08-19)


### Bug Fixes

* **content/entries:** load original thumb instead of minified version to prevent cache issue ([f07c0a0](https://github.com/kaltura/kmc-ng/commit/f07c0a0))
* **content/entry:** disable download action if entry is not ready ([1fbc19d](https://github.com/kaltura/kmc-ng/commit/1fbc19d))
* **content/entry:** fix trimming permissions ([665460e](https://github.com/kaltura/kmc-ng/commit/665460e))
* **content/playlist:** show Quiz icon on playlist content load ([80bd93f](https://github.com/kaltura/kmc-ng/commit/80bd93f))
* fix bulk end users permissions ([9afce8d](https://github.com/kaltura/kmc-ng/commit/9afce8d))
* fix Youtube icon layout in entries list ([e944d9b](https://github.com/kaltura/kmc-ng/commit/e944d9b))
* hide Reach iframe border on Firefox ([1567815](https://github.com/kaltura/kmc-ng/commit/1567815))



<a name="5.3.0"></a>
# [5.3.0](https://github.com/kaltura/kmc-ng/compare/v5.2.0...v5.3.0) (2018-08-15)


### Bug Fixes

* **administration/roles:** show friendly validation message if trying to save unsafe value ([#770](https://github.com/kaltura/kmc-ng/issues/770)) KMCNG-1843 ([d9091ed](https://github.com/kaltura/kmc-ng/commit/d9091ed))
* **administration/user:** mark invalid form fields ([25ba449](https://github.com/kaltura/kmc-ng/commit/25ba449))
* **content/categories:** check for "content manage > edit category" and "content manage > modify caption" permissions when enabling Reach ([#788](https://github.com/kaltura/kmc-ng/issues/788)) ([2722b3d](https://github.com/kaltura/kmc-ng/commit/2722b3d))
* **content/categories:** handle bulk categories deletion correctly if trying to delete a category and its sub categories  ([#767](https://github.com/kaltura/kmc-ng/issues/767)) KMCNG-1892 ([cf2b3a4](https://github.com/kaltura/kmc-ng/commit/cf2b3a4))
* **content/categories:** navigate to metadata section once deleting all sub-categories  ([#741](https://github.com/kaltura/kmc-ng/issues/741)) KMCNG-1920 ([7f55869](https://github.com/kaltura/kmc-ng/commit/7f55869))
* **content/categories:** rebuild category tree when user reorder sub categories of a category ([#754](https://github.com/kaltura/kmc-ng/issues/754)) KMCNG-1821 ([1a75ae6](https://github.com/kaltura/kmc-ng/commit/1a75ae6))
* **content/categories:** show relevant error message if trying to perform bulk operation on a category that was deleted ([#756](https://github.com/kaltura/kmc-ng/issues/756)) KMCNG-1931 ([3aaf6c2](https://github.com/kaltura/kmc-ng/commit/3aaf6c2))
* **content/category:** enable navigating to another category after data change if the user confirms discarding changes ([4445388](https://github.com/kaltura/kmc-ng/commit/4445388))
* **content/entries:** close refine time scheduled filter calendars on blur ([#747](https://github.com/kaltura/kmc-ng/issues/747)) KMCNG-906 ([164d532](https://github.com/kaltura/kmc-ng/commit/164d532))
* **content/entries:** fix style of media type column (align icon to center) ([ff1250a](https://github.com/kaltura/kmc-ng/commit/ff1250a))
* **content/playlist:** prevent unwanted sort event firing ([549e865](https://github.com/kaltura/kmc-ng/commit/549e865))
* **settings/transcoding-profile:** clear transcoding profiles cache once a new profile created ([#751](https://github.com/kaltura/kmc-ng/issues/751)) KMCNG-1945 ([ec9e954](https://github.com/kaltura/kmc-ng/commit/ec9e954))
* **settings/access-control:** word wrap description in list ([#764](https://github.com/kaltura/kmc-ng/issues/764)) KMCNG-1901 ([215123d](https://github.com/kaltura/kmc-ng/commit/215123d))
* **editor:** open editor  with correct clip and trim permissions ([#775](https://github.com/kaltura/kmc-ng/issues/775)) KMCNG-1968 ([9b690f5](https://github.com/kaltura/kmc-ng/commit/9b690f5))
* custom metadata text with multiple lines and values escaping issues ([2d50d93](https://github.com/kaltura/kmc-ng/commit/2d50d93))
* fix style of required error on new playlist name field ([3df514c](https://github.com/kaltura/kmc-ng/commit/3df514c))
* fix kea permissions logic ([d0042b7](https://github.com/kaltura/kmc-ng/commit/d0042b7))
* fix style of help menu and user settings menu ([3114fe0](https://github.com/kaltura/kmc-ng/commit/3114fe0))
* handle entries in which the entry creator was deleted from the system ([1524002](https://github.com/kaltura/kmc-ng/commit/1524002))
* hide bulk upload menu item if none of bulk upload types permitted  ([#771](https://github.com/kaltura/kmc-ng/issues/771)) KMCNG-1958 ([fcc74b6](https://github.com/kaltura/kmc-ng/commit/fcc74b6))
* send partner ID and CDN Url to Reach application to support external editor ([ede2822](https://github.com/kaltura/kmc-ng/commit/ede2822))
* show user name in upper menu correctly for long names ([#757](https://github.com/kaltura/kmc-ng/issues/757)) KMCNG-1685 ([66fafb5](https://github.com/kaltura/kmc-ng/commit/66fafb5))
* update support text and link ([#791](https://github.com/kaltura/kmc-ng/issues/791)) ([b50b205](https://github.com/kaltura/kmc-ng/commit/b50b205))
* update user settings design ([3b811aa](https://github.com/kaltura/kmc-ng/commit/3b811aa))


### Features

* **content/categories:** navigate user back to entries when user cancel category creation from bulk actions ([d403f51](https://github.com/kaltura/kmc-ng/commit/d403f51)), closes [#759](https://github.com/kaltura/kmc-ng/issues/759)
* **content/entries:** allow downloading and deleting an entry directly from entry page ([#725](https://github.com/kaltura/kmc-ng/issues/725)) KMCNG-1784, KMCNG-1822, KMCNG-1823 ([f88887a](https://github.com/kaltura/kmc-ng/commit/f88887a))
* **content/entries:** show quiz icon for relevant entries ([#744](https://github.com/kaltura/kmc-ng/issues/744)) KMCNG-1804 ([28bb917](https://github.com/kaltura/kmc-ng/commit/28bb917))
* **content/playlists:** display tags in playlist's name tooltip ([#726](https://github.com/kaltura/kmc-ng/issues/726)) KMCNG-1200 ([845ab6e](https://github.com/kaltura/kmc-ng/commit/845ab6e))
* **create:** prompt to delete draft entry if user tries to leave without changing the entry ([#683](https://github.com/kaltura/kmc-ng/issues/683)) KMCNG-1136 ([1f1595c](https://github.com/kaltura/kmc-ng/commit/1f1595c))
* Add services dashboard ([00cdfe9](https://github.com/kaltura/kmc-ng/commit/00cdfe9))
* Create entry from URL ([#750](https://github.com/kaltura/kmc-ng/issues/750)) KMCNG-1891 ([53e7562](https://github.com/kaltura/kmc-ng/commit/53e7562))
* Show Youtube icon on entries of type Youtube  ([#748](https://github.com/kaltura/kmc-ng/issues/748)) KMCNG-1808 ([3a08bc0](https://github.com/kaltura/kmc-ng/commit/3a08bc0))



<a name="5.2.0"></a>
# [5.2.0](https://github.com/kaltura/kmc-ng/compare/v5.1.0...v5.2.0) (2018-07-24)


### Bug Fixes

* **content/entries:** optimize entries list thumbnail loading ([a98303d](https://github.com/kaltura/kmc-ng/commit/a98303d))
* **content/entry:** fix entry caption language selection upon caption editing ([#781](https://github.com/kaltura/kmc-ng/issues/781)) ([ee8c492](https://github.com/kaltura/kmc-ng/commit/ee8c492))
* **content/upload:** fix resizeable data table configuration and style ([9cd401e](https://github.com/kaltura/kmc-ng/commit/9cd401e))
* ignore invalid metadata profiles while parsing ([a705fd3](https://github.com/kaltura/kmc-ng/commit/a705fd3))


### Features

* Reach integration ([306961e](https://github.com/kaltura/kmc-ng/commit/306961e))



<a name="5.1.0"></a>
# [5.1.0](https://github.com/kaltura/kmc-ng/compare/v5.0.0...v5.1.0) (2018-07-19)


### Bug Fixes

* fix link to legacy KMC ([d043cc1](https://github.com/kaltura/kmc-ng/commit/d043cc1))
* **content/entry:** fix noex format assigned to uploaded files ([07fb2e3](https://github.com/kaltura/kmc-ng/commit/07fb2e3))
* **settings/custom-data:** fix custom data field table styling ([0c7c115](https://github.com/kaltura/kmc-ng/commit/0c7c115))
* log into kmc using ks ([#774](https://github.com/kaltura/kmc-ng/issues/774)) KMCNG-1942 ([04d6191](https://github.com/kaltura/kmc-ng/commit/04d6191))
* set heaight for sections to support Safari 10.1 ([c33b222](https://github.com/kaltura/kmc-ng/commit/c33b222))
* style fixes ([#779](https://github.com/kaltura/kmc-ng/issues/779)) ([ab24843](https://github.com/kaltura/kmc-ng/commit/ab24843))


### Features

* set link to legacy KMC from Live Analitics message ([8795f12](https://github.com/kaltura/kmc-ng/commit/8795f12))
* support table columns resize with persist state ([#749](https://github.com/kaltura/kmc-ng/issues/749)) KMCNG-1797 ([369cc9e](https://github.com/kaltura/kmc-ng/commit/369cc9e))
* **content/moderation:** make the moderation default filters (pending review ; flagged for review) as mandatory  ([#728](https://github.com/kaltura/kmc-ng/issues/728)) KMCNG-1903 ([e1ebf91](https://github.com/kaltura/kmc-ng/commit/e1ebf91))



<a name="5.0.0"></a>
# [5.0.0](https://github.com/kaltura/kmc-ng/compare/v4.8.2...v5.0.0) (2018-07-11)


### Bug Fixes

* **administration/role:** fix role description style ([eae995f](https://github.com/kaltura/kmc-ng/commit/eae995f))
* **content/bulk-upload:** add missing action id for "Delete" action ([ab16b7a](https://github.com/kaltura/kmc-ng/commit/ab16b7a))
* **content/categories:** show relevant tooltip when bulk changing categories owner  ([#685](https://github.com/kaltura/kmc-ng/issues/685)) KMCNG-1406 ([412bcc7](https://github.com/kaltura/kmc-ng/commit/412bcc7))
* **content/entries:** allow access to editor advertisement external app regardless to permission ([#701](https://github.com/kaltura/kmc-ng/issues/701)) KMCNG-1735 ([2dfc4b6](https://github.com/kaltura/kmc-ng/commit/2dfc4b6))
* **content/entries:** clear selection once deleting an entry ([#677](https://github.com/kaltura/kmc-ng/issues/677)) KMCNG-752 ([46a1a61](https://github.com/kaltura/kmc-ng/commit/46a1a61))
* **content/entries:** fix warning message when bulk adding invalid entries to manual playlist ([4246902](https://github.com/kaltura/kmc-ng/commit/4246902))
* **content/entries:** remove video mix filter ([1f2cbf2](https://github.com/kaltura/kmc-ng/commit/1f2cbf2))
* **content/entries:** show tooltip for custom metadata fields ([#684](https://github.com/kaltura/kmc-ng/issues/684)) KMCNG-1481 ([c51ed02](https://github.com/kaltura/kmc-ng/commit/c51ed02))
* **content/entries:** show tooltip on entry name column only if text is truncated and in ellipsis mode ([f84f293](https://github.com/kaltura/kmc-ng/commit/f84f293))
* **content/entries:** style issues in entry flavor section ([#707](https://github.com/kaltura/kmc-ng/issues/707)) KMCNG-1873 ([7f86842](https://github.com/kaltura/kmc-ng/commit/7f86842))
* **content/entry:** display owner id instead of creator in entry details ([f2336f6](https://github.com/kaltura/kmc-ng/commit/f2336f6))
* **content/entry:** fix bulk access control dropdown width ([0d51396](https://github.com/kaltura/kmc-ng/commit/0d51396))
* **content/entry:** fix ui issues in flavors replace video popup ([3c6e807](https://github.com/kaltura/kmc-ng/commit/3c6e807))
* **content/entry:** hide caption actions until caption is ready and saved ([883f09b](https://github.com/kaltura/kmc-ng/commit/883f09b))
* **content/entry:** reset flavors on profile change ([b1287b1](https://github.com/kaltura/kmc-ng/commit/b1287b1))
* **content/entry:** return to default view if entries list is not available ([d1ee623](https://github.com/kaltura/kmc-ng/commit/d1ee623))
* **content/entry:** revert previewMode value according to the legacy ([4d4754e](https://github.com/kaltura/kmc-ng/commit/4d4754e))
* **content/entry:** Share & Embed: hide players list settings popup on resize ([6093ac9](https://github.com/kaltura/kmc-ng/commit/6093ac9))
* **content/playlist:** fix refine dates filter ([751e599](https://github.com/kaltura/kmc-ng/commit/751e599))
* **content/playlists:** fix rule-based playlists table height for Safari 10.1 compatibility ([1fbf8a2](https://github.com/kaltura/kmc-ng/commit/1fbf8a2))
* **content/playlists:** hide thumb column in manual playlist entries table ([#713](https://github.com/kaltura/kmc-ng/issues/713)) KMCNG-1886 ([bb3f061](https://github.com/kaltura/kmc-ng/commit/bb3f061))
* **settings/account settings:** fix runtime error when navigating directly to the view without relevant permissions ([#708](https://github.com/kaltura/kmc-ng/issues/708)) KMCNG-1876 ([ef6e6b7](https://github.com/kaltura/kmc-ng/commit/ef6e6b7))
* **settings/custom data:** show label yes/no next to switch input ([#712](https://github.com/kaltura/kmc-ng/issues/712)) KMCNG-1890 ([9b23463](https://github.com/kaltura/kmc-ng/commit/9b23463))
* **settings/custom-data:** fix translation typo ([58719b6](https://github.com/kaltura/kmc-ng/commit/58719b6))
* upload menu ui ([#717](https://github.com/kaltura/kmc-ng/issues/717)) KMCNG-916, SUP-14611 ([e458ff8](https://github.com/kaltura/kmc-ng/commit/e458ff8))
* **settings/my-user-settings:** fix translation typo ([b4bdc55](https://github.com/kaltura/kmc-ng/commit/b4bdc55))
* **upload:** remove selected file extension from the entry's name ([e119076](https://github.com/kaltura/kmc-ng/commit/e119076))


### Features

* **content/entries:** replace entry flavor from drop folder ([#705](https://github.com/kaltura/kmc-ng/issues/705)) KMCNG-1864 ([f0b36c9](https://github.com/kaltura/kmc-ng/commit/f0b36c9))
* **content/entries:** support caption format vtt ([#686](https://github.com/kaltura/kmc-ng/issues/686)) KMCNG-1605 ([c859bdb](https://github.com/kaltura/kmc-ng/commit/c859bdb))
* **content/entry:** add copy-to-clipboard button for stream name ([71d14b3](https://github.com/kaltura/kmc-ng/commit/71d14b3))
* add breaking change commit ([103d56e](https://github.com/kaltura/kmc-ng/commit/103d56e))
* add breaking change commit ([3e9a974](https://github.com/kaltura/kmc-ng/commit/3e9a974))
* add column resize for bulk -log view, categories view, drop folders view, entry flavors view, playlists view, entries view and syndications view ([#695](https://github.com/kaltura/kmc-ng/issues/695)) KMCNG-1797 ([f45e31e](https://github.com/kaltura/kmc-ng/commit/f45e31e))
* navigate the user to the page he navigated to after successful login ([#729](https://github.com/kaltura/kmc-ng/issues/729)) KMCNG-1870 ([dabfdf6](https://github.com/kaltura/kmc-ng/commit/dabfdf6))
* use client protocol to execute kaltura server api requests ([9649b0e](https://github.com/kaltura/kmc-ng/commit/9649b0e))


### BREAKING CHANGES

* upgrade Angular stack to v6



<a name="5.1.0"></a>
# [5.1.0](https://github.com/kaltura/kmc-ng/compare/v5.0.0...v5.1.0) (2018-07-19)


### Bug Fixes

* **content/entry:** fix noex format assigned to uploaded files ([07fb2e3](https://github.com/kaltura/kmc-ng/commit/07fb2e3))
* **settings/custom-data:** fix custom data field table styling ([0c7c115](https://github.com/kaltura/kmc-ng/commit/0c7c115))
* fix link to legacy KMC ([d043cc1](https://github.com/kaltura/kmc-ng/commit/d043cc1))
* log into kmc using ks ([#774](https://github.com/kaltura/kmc-ng/issues/774)) KMCNG-1942 ([04d6191](https://github.com/kaltura/kmc-ng/commit/04d6191))
* set heaight for sections to support Safari 10.1 ([c33b222](https://github.com/kaltura/kmc-ng/commit/c33b222))
* style fixes ([#779](https://github.com/kaltura/kmc-ng/issues/779)) ([ab24843](https://github.com/kaltura/kmc-ng/commit/ab24843))


### Features

* **content/moderation:** make the moderation default filters as mandatory  ([#728](https://github.com/kaltura/kmc-ng/issues/728)) KMCNG-1903 ([e1ebf91](https://github.com/kaltura/kmc-ng/commit/e1ebf91))
* set link to legacy KMC from Live Analitics message ([8795f12](https://github.com/kaltura/kmc-ng/commit/8795f12))
* support table columns resize with persist state ([#749](https://github.com/kaltura/kmc-ng/issues/749)) KMCNG-1797 ([369cc9e](https://github.com/kaltura/kmc-ng/commit/369cc9e))


<a name="5.0.0"></a>
# [5.0.0](https://github.com/kaltura/kmc-ng/compare/v4.8.2...v5.0.0) (2018-07-11)


### Bug Fixes

* **administration/role:** fix role description style ([eae995f](https://github.com/kaltura/kmc-ng/commit/eae995f))
* **content/bulk-upload:** add missing action id for "Delete" action ([ab16b7a](https://github.com/kaltura/kmc-ng/commit/ab16b7a))
* **content/categories:** show relevant tooltip when bulk changing categories owner  ([#685](https://github.com/kaltura/kmc-ng/issues/685)) KMCNG-1406 ([412bcc7](https://github.com/kaltura/kmc-ng/commit/412bcc7))
* **content/entries:** allow access to editor advertisement external app regardless to permission ([#701](https://github.com/kaltura/kmc-ng/issues/701)) KMCNG-1735 ([2dfc4b6](https://github.com/kaltura/kmc-ng/commit/2dfc4b6))
* **content/entries:** clear selection once deleting an entry ([#677](https://github.com/kaltura/kmc-ng/issues/677)) KMCNG-752 ([46a1a61](https://github.com/kaltura/kmc-ng/commit/46a1a61))
* **content/entries:** fix warning message when bulk adding invalid entries to manual playlist ([4246902](https://github.com/kaltura/kmc-ng/commit/4246902))
* **content/entries:** remove video mix filter ([1f2cbf2](https://github.com/kaltura/kmc-ng/commit/1f2cbf2))
* **content/entries:** show tooltip for custom metadata fields ([#684](https://github.com/kaltura/kmc-ng/issues/684)) KMCNG-1481 ([c51ed02](https://github.com/kaltura/kmc-ng/commit/c51ed02))
* **content/entries:** show tooltip on entry name column only if text is truncated and in ellipsis mode ([f84f293](https://github.com/kaltura/kmc-ng/commit/f84f293))
* **content/entries:** style issues in entry flavor section ([#707](https://github.com/kaltura/kmc-ng/issues/707)) KMCNG-1873 ([7f86842](https://github.com/kaltura/kmc-ng/commit/7f86842))
* **content/entry:** display owner id instead of creator in entry details ([f2336f6](https://github.com/kaltura/kmc-ng/commit/f2336f6))
* **content/entry:** fix bulk access control dropdown width ([0d51396](https://github.com/kaltura/kmc-ng/commit/0d51396))
* **content/entry:** fix ui issues in flavors replace video popup ([3c6e807](https://github.com/kaltura/kmc-ng/commit/3c6e807))
* **content/entry:** hide caption actions until caption is ready and saved ([883f09b](https://github.com/kaltura/kmc-ng/commit/883f09b))
* **content/entry:** reset flavors on profile change ([b1287b1](https://github.com/kaltura/kmc-ng/commit/b1287b1))
* **content/entry:** return to default view if entries list is not available ([d1ee623](https://github.com/kaltura/kmc-ng/commit/d1ee623))
* **content/entry:** revert previewMode value according to the legacy ([4d4754e](https://github.com/kaltura/kmc-ng/commit/4d4754e))
* **content/entry:** Share & Embed: hide players list settings popup on resize ([6093ac9](https://github.com/kaltura/kmc-ng/commit/6093ac9))
* **content/playlist:** fix refine dates filter ([751e599](https://github.com/kaltura/kmc-ng/commit/751e599))
* **content/playlists:** fix rule-based playlists table height for Safari 10.1 compatibility ([1fbf8a2](https://github.com/kaltura/kmc-ng/commit/1fbf8a2))
* **content/playlists:** hide thumb column in manual playlist entries table ([#713](https://github.com/kaltura/kmc-ng/issues/713)) KMCNG-1886 ([bb3f061](https://github.com/kaltura/kmc-ng/commit/bb3f061))
* **settings/account settings:** fix runtime error when navigating directly to the view without relevant permissions ([#708](https://github.com/kaltura/kmc-ng/issues/708)) KMCNG-1876 ([ef6e6b7](https://github.com/kaltura/kmc-ng/commit/ef6e6b7))
* **settings/custom data:** show label yes/no next to switch input ([#712](https://github.com/kaltura/kmc-ng/issues/712)) KMCNG-1890 ([9b23463](https://github.com/kaltura/kmc-ng/commit/9b23463))
* **settings/custom-data:** fix translation typo ([58719b6](https://github.com/kaltura/kmc-ng/commit/58719b6))
* upload menu ui ([#717](https://github.com/kaltura/kmc-ng/issues/717)) KMCNG-916, SUP-14611 ([e458ff8](https://github.com/kaltura/kmc-ng/commit/e458ff8))
* **settings/my-user-settings:** fix translation typo ([b4bdc55](https://github.com/kaltura/kmc-ng/commit/b4bdc55))
* **upload:** remove selected file extension from the entry's name ([e119076](https://github.com/kaltura/kmc-ng/commit/e119076))


### Features

* **content/entries:** replace entry flavor from drop folder ([#705](https://github.com/kaltura/kmc-ng/issues/705)) KMCNG-1864 ([f0b36c9](https://github.com/kaltura/kmc-ng/commit/f0b36c9))
* **content/entries:** support caption format vtt ([#686](https://github.com/kaltura/kmc-ng/issues/686)) KMCNG-1605 ([c859bdb](https://github.com/kaltura/kmc-ng/commit/c859bdb))
* **content/entry:** add copy-to-clipboard button for stream name ([71d14b3](https://github.com/kaltura/kmc-ng/commit/71d14b3))
* add breaking change commit ([103d56e](https://github.com/kaltura/kmc-ng/commit/103d56e))
* add breaking change commit ([3e9a974](https://github.com/kaltura/kmc-ng/commit/3e9a974))
* add column resize for bulk -log view, categories view, drop folders view, entry flavors view, playlists view, entries view and syndications view ([#695](https://github.com/kaltura/kmc-ng/issues/695)) KMCNG-1797 ([f45e31e](https://github.com/kaltura/kmc-ng/commit/f45e31e))
* navigate the user to the page he navigated to after successful login ([#729](https://github.com/kaltura/kmc-ng/issues/729)) KMCNG-1870 ([dabfdf6](https://github.com/kaltura/kmc-ng/commit/dabfdf6))
* use client protocol to execute kaltura server api requests ([9649b0e](https://github.com/kaltura/kmc-ng/commit/9649b0e))


### BREAKING CHANGES

* upgrade Angular stack to v6

<a name="4.8.3"></a>
## [4.8.3](https://github.com/kaltura/kmc-ng/compare/v4.8.2...v4.8.3) (2018-07-22)


### Bug Fixes

* handle custom schema boolean values correctly ([d734eef](https://github.com/kaltura/kmc-ng/commit/d734eef))
* ignore invalid metadata profiles when parsing ([9d12bfe](https://github.com/kaltura/kmc-ng/commit/9d12bfe))
* **content/entry:** save correct value of caption selected language ([7c9057b](https://github.com/kaltura/kmc-ng/commit/7c9057b))


<a name="4.8.2"></a>
## [4.8.2](https://github.com/kaltura/kmc-ng/compare/v4.8.1...v4.8.2) (2018-07-03)


### Bug Fixes

* **content/entry:** fix loading of flavors section when there's no entry's conversion profile ([c50d89e](https://github.com/kaltura/kmc-ng/commit/c50d89e))



<a name="4.8.1"></a>
## [4.8.1](https://github.com/kaltura/kmc-ng/compare/v4.8.0...v4.8.1) (2018-06-28)


### Bug Fixes

* **content/entries:** fix entries table column style to work on older Safari versions + update changelog ([#738](https://github.com/kaltura/kmc-ng/issues/738)) ([ec7e21e](https://github.com/kaltura/kmc-ng/commit/ec7e21e))



<a name="4.8.0"></a>
# [4.8.0](https://github.com/kaltura/kmc-ng/compare/v4.7.3...v4.8.0) (2018-06-26)


### Features

* add link to legacy KMC in the help menu ([949ab3e](https://github.com/kaltura/kmc-ng/commit/949ab3e))



<a name="4.7.3"></a>
## [4.7.3](https://github.com/kaltura/kmc-ng/compare/v4.7.2...v4.7.3) (2018-06-26)


### Bug Fixes

* **content/moderation:** enable save button for moderators ([#732](https://github.com/kaltura/kmc-ng/issues/732)) KMCNG-1896 ([96598b4](https://github.com/kaltura/kmc-ng/commit/96598b4))
* **content/entry:** use form.getRawValue() instead of form.value to preserve categories data even if the control is disabled due to permissions ([ff36cbd](https://github.com/kaltura/kmc-ng/commit/ff36cbd))



<a name="4.7.2"></a>
## [4.7.2](https://github.com/kaltura/kmc-ng/compare/v4.7.1...v4.7.2) (2018-06-24)


### Bug Fixes

* **content/entries:** allow entry metadata changes for content moderator ([#719](https://github.com/kaltura/kmc-ng/issues/719)) 
* **content/entry:** add missing replacement labels in flavors tab ([0abe6b1](https://github.com/kaltura/kmc-ng/commit/0abe6b1))



<a name="4.7.1"></a>
## [4.7.1](https://github.com/kaltura/kmc-ng/compare/v4.7.0...v4.7.1) (2018-06-21)


### Bug Fixes

* **content/entry:** fix description label in distribution profile details form ([7438fc0](https://github.com/kaltura/kmc-ng/commit/7438fc0))
* **content/entries:** fix bulk access control drop-down width ([4d71695](https://github.com/kaltura/kmc-ng/commit/4d71695))
* **content/entry:** add missing replace buttons label ([5041d20](https://github.com/kaltura/kmc-ng/commit/5041d20))
* **content/entry:** fix capitalization in replace video widget labels ([6649544](https://github.com/kaltura/kmc-ng/commit/6649544))
* **content/entry:** fix permission for link flavor option ([3600417](https://github.com/kaltura/kmc-ng/commit/3600417))
* **content/entry:** fix thumbnail download URL according to current protocol ([0ce468b](https://github.com/kaltura/kmc-ng/commit/0ce468b))
* **content/entry:** hide replacement controls for new entry ([03d4aa5](https://github.com/kaltura/kmc-ng/commit/03d4aa5))
* **content/syndication:** add missing ITunes feed author field ([08e4dd4](https://github.com/kaltura/kmc-ng/commit/08e4dd4))
* **content/syndication:** add prompt text for feed image URL field ([91c81c3](https://github.com/kaltura/kmc-ng/commit/91c81c3))
* **content/syndication:** fix owner email field validation logic ([7eedfe6](https://github.com/kaltura/kmc-ng/commit/7eedfe6))
* **settings/account settings:**  update admin email on changing owner ([#703](https://github.com/kaltura/kmc-ng/issues/703)) 
* changelog notification badge ([#700](https://github.com/kaltura/kmc-ng/issues/700)) ([3bae52e](https://github.com/kaltura/kmc-ng/commit/3bae52e))
* layout glitch of entries selector with multiple filter tags ([#702](https://github.com/kaltura/kmc-ng/issues/702)) 
* prevent loading metadata without proper permission  ([#704](https://github.com/kaltura/kmc-ng/issues/704)) 


<a name="4.7.0"></a>
# [4.7.0](https://github.com/kaltura/kmc-ng/compare/v4.6.0...v4.7.0) (2018-06-11)


### Bug Fixes

* **administration/users:** associate new user to the account KMCNG-1836 ([a7975a1](https://github.com/kaltura/kmc-ng/commit/a7975a1))
* change owner - allow saving not registered username ([1b3f9b4](https://github.com/kaltura/kmc-ng/commit/1b3f9b4))
* changing username update the name shown in the app main menu ([#697](https://github.com/kaltura/kmc-ng/issues/697)) ([1e329fa](https://github.com/kaltura/kmc-ng/commit/1e329fa))
* disable delete action for default thumbnail instead of preview ([c504b43](https://github.com/kaltura/kmc-ng/commit/c504b43))
* fix caption's file name overflow issue, fix upload monitor height issue, fix access control dropdown items ([fc9431c](https://github.com/kaltura/kmc-ng/commit/fc9431c))
* fix Live section UI inconsistency, fix behavior according to legacy ([5357b07](https://github.com/kaltura/kmc-ng/commit/5357b07))
* fix loading remote storage profile ([6630173](https://github.com/kaltura/kmc-ng/commit/6630173))
* fix width of imported caption URL field ([6ae024f](https://github.com/kaltura/kmc-ng/commit/6ae024f))
* hide missing country flags, move flags into access-control and create a relevant scss ([2d06fa9](https://github.com/kaltura/kmc-ng/commit/2d06fa9))
* missing changelog notification badge ([#693](https://github.com/kaltura/kmc-ng/issues/693)) ([ffb8226](https://github.com/kaltura/kmc-ng/commit/ffb8226))
* No indication when trying to add a user with invalid email value ([#566](https://github.com/kaltura/kmc-ng/issues/566)) KMCNG-1420 ([e21e044](https://github.com/kaltura/kmc-ng/commit/e21e044))
* stronger selector for main menu link to force styling in Safari ([297c951](https://github.com/kaltura/kmc-ng/commit/297c951))
* truncate long metadata section names in dropdown ([4974e59](https://github.com/kaltura/kmc-ng/commit/4974e59))


### Features

* **content/entries:** add feature replace video in entry flavors section ([#634](https://github.com/kaltura/kmc-ng/issues/634)) ([e084a43](https://github.com/kaltura/kmc-ng/commit/e084a43))
* **content/entries:** show live analytics of specific entry ([#687](https://github.com/kaltura/kmc-ng/issues/687)) KMCNG-1791 ([4b2656d](https://github.com/kaltura/kmc-ng/commit/4b2656d))
* **analytics:** show coming soon message for analytics  ([#676](https://github.com/kaltura/kmc-ng/issues/676)) KMCNG-1777 ([a62762c](https://github.com/kaltura/kmc-ng/commit/a62762c))
* allow live entry to open clip&trim only if it has recorded entry ([55de56e](https://github.com/kaltura/kmc-ng/commit/55de56e))
* show progress bar when loading a view ([#679](https://github.com/kaltura/kmc-ng/issues/679)) KMCNG-1790 ([d290e57](https://github.com/kaltura/kmc-ng/commit/d290e57))
* support link open a dialog window instead of direct mail invocation ([#669](https://github.com/kaltura/kmc-ng/issues/669)) KMCNG-1766 ([9575768](https://github.com/kaltura/kmc-ng/commit/9575768))
* update browser title when navigating between views ([#691](https://github.com/kaltura/kmc-ng/issues/691)) KMCNG-1812 ([3fc96c0](https://github.com/kaltura/kmc-ng/commit/3fc96c0))
* welcome screen placeholder ([#699](https://github.com/kaltura/kmc-ng/issues/699)) ([924674e](https://github.com/kaltura/kmc-ng/commit/924674e))



<a name="4.6.0"></a>
# [4.6.0](https://github.com/kaltura/kmc-ng/compare/v4.5.1...v4.6.0) (2018-05-30)


### Bug Fixes

* **administration:** fix admin user permissions ([97d8af4](https://github.com/kaltura/kmc-ng/commit/97d8af4))
* **administration/users:** prevent delete and block actions on current user and on account administrator ([c572e35](https://github.com/kaltura/kmc-ng/commit/c572e35))
* **administration/users:** prevent saving user with publisher id filled with spaces only ([#650](https://github.com/kaltura/kmc-ng/issues/650)) KMCNG-1686 ([c5329dd](https://github.com/kaltura/kmc-ng/commit/c5329dd))
* **administration/users:** prevent user from changing hiw own role ([#654](https://github.com/kaltura/kmc-ng/issues/654)) KMCNG-1415 ([4479894](https://github.com/kaltura/kmc-ng/commit/4479894))
* disable upload button if missing upload information  ([#658](https://github.com/kaltura/kmc-ng/issues/658)) KMCNG-1681 ([f4cb378](https://github.com/kaltura/kmc-ng/commit/f4cb378))
* **administration/users:** show mandatory invalid fields when trying to create new user with partial information ([#651](https://github.com/kaltura/kmc-ng/issues/651)) KMCNG-1666 ([12aa5f0](https://github.com/kaltura/kmc-ng/commit/12aa5f0))
* **content/categories:** fix table layout for IE11 ([9375272](https://github.com/kaltura/kmc-ng/commit/9375272))
* **content/category:** end user drop-down layout fixes ([a5ecc49](https://github.com/kaltura/kmc-ng/commit/a5ecc49))
* **content/category:** fix width of "Jump To" menu to fit up to 31 characters menu items ([eaecb77](https://github.com/kaltura/kmc-ng/commit/eaecb77))
* **content/category:** propagate category partnerSortValue value from service ([96779c5](https://github.com/kaltura/kmc-ng/commit/96779c5))
* **content/entries:** block shell when deleting entry thumb ([404477e](https://github.com/kaltura/kmc-ng/commit/404477e))
* **content/entries:** Bulk actions- remove redundant scroll bars ([b16de70](https://github.com/kaltura/kmc-ng/commit/b16de70))
* **content/entries:** clear bulk selections in list when executing a single row action ([#649](https://github.com/kaltura/kmc-ng/issues/649)) KMCNG-1702 ([e4c54c1](https://github.com/kaltura/kmc-ng/commit/e4c54c1))
* **content/entries:** Fix refine filter scheduling calendar ([9f22dc8](https://github.com/kaltura/kmc-ng/commit/9f22dc8))
* **content/entries:** refresh list when failed to execute bulk action ([5c464f9](https://github.com/kaltura/kmc-ng/commit/5c464f9))
* **content/entry:** fix width of "Jump To" menu to fit up to 31 characters menu items ([a6b5d13](https://github.com/kaltura/kmc-ng/commit/a6b5d13))
* **content/entry:** pass SEO uploadDate for share & Embed ([a001e13](https://github.com/kaltura/kmc-ng/commit/a001e13))
* **content/entry:** prevent users from typing invalid dates ([366bb20](https://github.com/kaltura/kmc-ng/commit/366bb20))
* **content/entry:** send admin ks to thumbnail grabber player ([bc6fd38](https://github.com/kaltura/kmc-ng/commit/bc6fd38))
* **content/entry:** updated permissions from advertisements section ([2b80618](https://github.com/kaltura/kmc-ng/commit/2b80618))
* **content/playlists:** show detail page exit verification for new playlist ([#639](https://github.com/kaltura/kmc-ng/issues/639)) KMCNG-1536 ([be36efa](https://github.com/kaltura/kmc-ng/commit/be36efa))
* **content/syndication:** remove error message for missing destination selection ([9a31384](https://github.com/kaltura/kmc-ng/commit/9a31384))
* **content>Bulk Upload Log:** remove a redundant file extension when downloading the original CSV/XML  ([#550](https://github.com/kaltura/kmc-ng/issues/550)) KMCNG-1555 ([56938b8](https://github.com/kaltura/kmc-ng/commit/56938b8))
* **content>entries:** in entry details > captions section fix incorrect status field while uploading a caption ([#569](https://github.com/kaltura/kmc-ng/issues/569)) KMCNG-948, KMCNG-1147 ([3bbf4e9](https://github.com/kaltura/kmc-ng/commit/3bbf4e9))
* **settings/access control:** update ip validation tooltip ([#661](https://github.com/kaltura/kmc-ng/issues/661)) KMCNG-1660 ([71ee411](https://github.com/kaltura/kmc-ng/commit/71ee411))
* **settings/account settings:** save changes of account owner  ([#621](https://github.com/kaltura/kmc-ng/issues/621)) KMCNG-1590 ([7766fa9](https://github.com/kaltura/kmc-ng/commit/7766fa9))
* **settings/custom data:** handle form validations of required fields ([#664](https://github.com/kaltura/kmc-ng/issues/664)) KMCNG-1466,KMCNG-1467, KMCNG-1527 ([fa36c5d](https://github.com/kaltura/kmc-ng/commit/fa36c5d))
* **settings/custom data:** prevent text-list items that start with hyphen ([#652](https://github.com/kaltura/kmc-ng/issues/652)) KMCNG-1533 ([1ab6ad3](https://github.com/kaltura/kmc-ng/commit/1ab6ad3))
* **settings/integration-settings:** fix category name style ([64fe2a5](https://github.com/kaltura/kmc-ng/commit/64fe2a5))
* Add Custom Schema - GUI fixes ([98af464](https://github.com/kaltura/kmc-ng/commit/98af464))
* **settings/transcoding:** allow prev/next navigation after profile was saved ([#640](https://github.com/kaltura/kmc-ng/issues/640)) ([33efce9](https://github.com/kaltura/kmc-ng/commit/33efce9))
* **settings>transcoding profile:** handle profiles with long description ([#571](https://github.com/kaltura/kmc-ng/issues/571)) KMCNG-1625 ([6b71cab](https://github.com/kaltura/kmc-ng/commit/6b71cab))
* **syndication:** add playlist type icon for playlist options menu, update feed delete confirmation message ([9467d33](https://github.com/kaltura/kmc-ng/commit/9467d33))
* add Custom Schema button is available while an error message indicates no connection to the server ([#565](https://github.com/kaltura/kmc-ng/issues/565)) KMCNG-1457 ([d677130](https://github.com/kaltura/kmc-ng/commit/d677130))
* allow custom data schema with values 'False', 'True' in text-list-selector SUP-14470 ([8d889fc](https://github.com/kaltura/kmc-ng/commit/8d889fc))
* allow entry ID link to entry details in moderation report according to permissions ([e6861ea](https://github.com/kaltura/kmc-ng/commit/e6861ea))
* disable "Clear Dates" link in filters when no dates are selected ([338f2e4](https://github.com/kaltura/kmc-ng/commit/338f2e4))
* fix entry selector layout when multiple filters applied ([76266b2](https://github.com/kaltura/kmc-ng/commit/76266b2))
* fix user name style and word breaking logic ([57e3ad9](https://github.com/kaltura/kmc-ng/commit/57e3ad9))
* lables in syndication > yahoo feed ([#547](https://github.com/kaltura/kmc-ng/issues/547)) KMCNG-1576 ([2beb1df](https://github.com/kaltura/kmc-ng/commit/2beb1df))
* prevent searching for empty strings in entries, playlists, categories, drop folders, category user entitlements ([0ba6eae](https://github.com/kaltura/kmc-ng/commit/0ba6eae))
* require value in bulk action change owner ([#436](https://github.com/kaltura/kmc-ng/issues/436)) KMCNG-797, KMCNG-823, KMCNG-1406 ([e8a5236](https://github.com/kaltura/kmc-ng/commit/e8a5236))
* treat disabled (angular) forms as valid across all relevant views ([#648](https://github.com/kaltura/kmc-ng/issues/648)) KMCNG-1734 ([6865c32](https://github.com/kaltura/kmc-ng/commit/6865c32))
* typo fix in delete category warning message ([90974b9](https://github.com/kaltura/kmc-ng/commit/90974b9))
* typo in new role name placeholder ([#655](https://github.com/kaltura/kmc-ng/issues/655)) KMCNG-1753 ([1625609](https://github.com/kaltura/kmc-ng/commit/1625609))
* when loading accounts for "change account" option - fetch all accounts from the server and not just the first 30 accounts ([dfb86a5](https://github.com/kaltura/kmc-ng/commit/dfb86a5))
* wording of error message when trying to create new category (no parent) with same name ([#660](https://github.com/kaltura/kmc-ng/issues/660)) KMCNG-1671 ([2c3a471](https://github.com/kaltura/kmc-ng/commit/2c3a471))


### Features

* **administration/roles:** show a disclaimer to the user after he modify a role ([#583](https://github.com/kaltura/kmc-ng/issues/583)) KMCNG-1738 ([f5ddb42](https://github.com/kaltura/kmc-ng/commit/f5ddb42))
* add confirmation messages aligning (left/ center) compatibility ([#460](https://github.com/kaltura/kmc-ng/issues/460)) ([382bc3f](https://github.com/kaltura/kmc-ng/commit/382bc3f))
* enforce secured protocol when deployed to production ([#610](https://github.com/kaltura/kmc-ng/issues/610)) ([ef42eec](https://github.com/kaltura/kmc-ng/commit/ef42eec))
* navigate user to default page if trying to deep link into error page ([#643](https://github.com/kaltura/kmc-ng/issues/643)) ([ba334b7](https://github.com/kaltura/kmc-ng/commit/ba334b7))
* show filters for refine filter items and categories filter items  ([#458](https://github.com/kaltura/kmc-ng/issues/458)) KMCNG-1192 ([9eca73c](https://github.com/kaltura/kmc-ng/commit/9eca73c))
* **content/entries:** add bulk add/remove publishers & editors action and update bulk tags action layout  ([#507](https://github.com/kaltura/kmc-ng/issues/507)) KMCNG-1761 KMCNG-1764 ([c5af869](https://github.com/kaltura/kmc-ng/commit/c5af869))
* **content/syndication:** add feed of type ITunes ([#480](https://github.com/kaltura/kmc-ng/issues/480)) KMCNG-1121 ([86a76ee](https://github.com/kaltura/kmc-ng/commit/86a76ee))
* **content>entries:**  show relevant error when trying to convert a flavor while Source is missing ([#435](https://github.com/kaltura/kmc-ng/issues/435)) KMCNG-638 ([14e93cf](https://github.com/kaltura/kmc-ng/commit/14e93cf))
* **settings>account info:** failing to extract bandwidth consumption and storage use should show n/a ([#592](https://github.com/kaltura/kmc-ng/issues/592)) KMCNG-1749 ([436a2fa](https://github.com/kaltura/kmc-ng/commit/436a2fa))



<a name="4.5.1"></a>
## [4.5.1](https://github.com/kaltura/kmc-ng/compare/v4.5.0...v4.5.1) (2018-05-21)


### Bug Fixes

* parse correctly custom metadata profiles created by the flash-based KMC and includes ampersand character ([21c7b3a](https://github.com/kaltura/kmc-ng/commit/21c7b3a))



<a name="4.5.0"></a>
# [4.5.0](https://github.com/kaltura/kmc-ng/compare/v4.4.1...v4.5.0) (2018-05-13)


### Bug Fixes

* allow editing role when user doesn't have permission  ([84cbf86](https://github.com/kaltura/kmc-ng/commit/84cbf86)), closes [#631](https://github.com/kaltura/kmc-ng/issues/631)
* close moderation popup upon navigating to entry details ([dd8f1f9](https://github.com/kaltura/kmc-ng/commit/dd8f1f9))
* fix kEdit hoster height ([910eee5](https://github.com/kaltura/kmc-ng/commit/910eee5))
* **administration/users:** allow adding users already listed in the system ([4bfcd41](https://github.com/kaltura/kmc-ng/commit/4bfcd41))
* **administrator/roles:** add missing base permissions at runtime ([#638](https://github.com/kaltura/kmc-ng/issues/638)) KMCNG-1726 ([264ac6c](https://github.com/kaltura/kmc-ng/commit/264ac6c))
* **content/bulk log:** fix table height and remove duplicated delete button ([#628](https://github.com/kaltura/kmc-ng/issues/628)) KMCNG-1688 KMCNG-1691 ([dfaf99b](https://github.com/kaltura/kmc-ng/commit/dfaf99b))
* **content/categories:** allow navigation between categories in category details view ([#626](https://github.com/kaltura/kmc-ng/issues/626)) ([2e24105](https://github.com/kaltura/kmc-ng/commit/2e24105))
* **content/entries:** always allow access to entry details metadata section ([771a62d](https://github.com/kaltura/kmc-ng/commit/771a62d))
* **content/entries:** display entry duration for Youtube entries ([4798fe3](https://github.com/kaltura/kmc-ng/commit/4798fe3))
* **content/entries:** ignore custom schema without fields defined ([30f8f1d](https://github.com/kaltura/kmc-ng/commit/30f8f1d))
* **content/playlists:** save button is enabled for new playlists and trying to leave without saving will prompt the user KMCNG-1534 KMCNG-1536 ([558931d](https://github.com/kaltura/kmc-ng/commit/558931d))
* **settings/access control:** save selected items only ([#535](https://github.com/kaltura/kmc-ng/issues/535)) KMCNG-1505 ([3c12e03](https://github.com/kaltura/kmc-ng/commit/3c12e03))
* **settings/access-control-profiles:** allow empty restrictions array to allow removing restrictions ([6496fe3](https://github.com/kaltura/kmc-ng/commit/6496fe3))
* **settings/custom data:** show fields labels instead of system names in custom schema lists KMCNG-1468 ([911c928](https://github.com/kaltura/kmc-ng/commit/911c928))
* **settings/transcoding profiles:** show the correct number of flavors for profiles with no flavors selected KMCNG-1698 ([afb1263](https://github.com/kaltura/kmc-ng/commit/afb1263))
* **studio:** fix studio permissions ([7965126](https://github.com/kaltura/kmc-ng/commit/7965126))
* **upload-monitor:** replace rotating upload icon with a static icon ([f673729](https://github.com/kaltura/kmc-ng/commit/f673729))
* fix logic when setting default values for access control profile ([4ef1ac5](https://github.com/kaltura/kmc-ng/commit/4ef1ac5))
* fix player server URI link in moderation ([54357e0](https://github.com/kaltura/kmc-ng/commit/54357e0))
* reduce size of asset so it will be shown in production ([20cecf7](https://github.com/kaltura/kmc-ng/commit/20cecf7))
* Remove tags column from thumbnails tab ([#613](https://github.com/kaltura/kmc-ng/issues/613)) ([de8740a](https://github.com/kaltura/kmc-ng/commit/de8740a))
* remove undesired alert when cancelling edit action of kms category ([a7b5807](https://github.com/kaltura/kmc-ng/commit/a7b5807))
* run server polling once the user is logged in ([352b8cc](https://github.com/kaltura/kmc-ng/commit/352b8cc))
* typo fix in live dashboard ([7521fe6](https://github.com/kaltura/kmc-ng/commit/7521fe6))


### Features

* Default app view ([b18ed57](https://github.com/kaltura/kmc-ng/commit/b18ed57))
* disable entry editor for entries with no source fileKMCNG-1656 ([#636](https://github.com/kaltura/kmc-ng/issues/636)) KMCNG-1656 ([fcb9747](https://github.com/kaltura/kmc-ng/commit/fcb9747))
* implement METADATA_PLUGIN_PERMISSION permission ([#630](https://github.com/kaltura/kmc-ng/issues/630)) KMCNG-1701 ([2a8dbc2](https://github.com/kaltura/kmc-ng/commit/2a8dbc2))
* implement permission CONTENT_INGEST_REFERENCE_MODIFY ([#602](https://github.com/kaltura/kmc-ng/issues/602)) KMCNG-1545 ([a4ea615](https://github.com/kaltura/kmc-ng/commit/a4ea615))
* implement permission CONTENT_INGEST_UPLOAD ([#601](https://github.com/kaltura/kmc-ng/issues/601)) KMCNG-1511 ([617f329](https://github.com/kaltura/kmc-ng/commit/617f329))
* implement permission FEATURE_MULTI_FLAVOR_INGESTION ([#603](https://github.com/kaltura/kmc-ng/issues/603)) KMCNG-1571 ([a05ec27](https://github.com/kaltura/kmc-ng/commit/a05ec27))
* implement upload monitor permissions ([b0943a7](https://github.com/kaltura/kmc-ng/commit/b0943a7))
* prompt user to relogin once a ks is expired ([#615](https://github.com/kaltura/kmc-ng/issues/615)) KMCNG-854 KMCNG-1088 KMCNG-394 ([54d1cfb](https://github.com/kaltura/kmc-ng/commit/54d1cfb))
* redirect to default page after user switch partner accounts ([#637](https://github.com/kaltura/kmc-ng/issues/637)) KMCNG-1728 ([4f1da7c](https://github.com/kaltura/kmc-ng/commit/4f1da7c))
* show relevant message to the user when navigating to page that doesn't exists  ([#620](https://github.com/kaltura/kmc-ng/issues/620)) KMCNG-1729 ([fce3f02](https://github.com/kaltura/kmc-ng/commit/fce3f02))
* simplify runtime configuration by allowing optional properties ([#633](https://github.com/kaltura/kmc-ng/issues/633)) ([dd9460d](https://github.com/kaltura/kmc-ng/commit/dd9460d))



<a name="4.4.1"></a>
## [4.4.1](https://github.com/kaltura/kmc-ng/compare/v4.4.0...v4.4.1) (2018-05-03)


### Bug Fixes

* use secured protocol when showing player component ([#625](https://github.com/kaltura/kmc-ng/issues/625)) ([3ac3bc9](https://github.com/kaltura/kmc-ng/commit/3ac3bc9))



<a name="4.4.0"></a>
# [4.4.0](https://github.com/kaltura/kmc-ng/compare/v4.3.0...v4.4.0) (2018-05-02)


### Bug Fixes

* enable prod mode before running application logic ([9c36b4e](https://github.com/kaltura/kmc-ng/commit/9c36b4e))
* fix advertisements permissions logic ([3c3c52e](https://github.com/kaltura/kmc-ng/commit/3c3c52e))
* fix usage dashboard permissions logic ([86c37bf](https://github.com/kaltura/kmc-ng/commit/86c37bf))
* remove undesired message when user cancel navigation back to list when has draft changes ([cff21b8](https://github.com/kaltura/kmc-ng/commit/cff21b8))


### Features

* support CDN configuration provided at runtime ([3090075](https://github.com/kaltura/kmc-ng/commit/3090075))
* **content/syndication:** handle feeds with deleted playlists ([#623](https://github.com/kaltura/kmc-ng/issues/623)) KMCNG-1679 ([b54e3b4](https://github.com/kaltura/kmc-ng/commit/b54e3b4))



<a name="4.3.0"></a>
# [4.3.0](https://github.com/kaltura/kmc-ng/compare/v4.2.0...v4.3.0) (2018-04-30)


### Bug Fixes

* **content/entries:** in entry details metadata section, fix showing entries selector ([12c8ffc](https://github.com/kaltura/kmc-ng/commit/12c8ffc))


### Features

* add whitelist for login ([#589](https://github.com/kaltura/kmc-ng/issues/589)) ([1d1aba5](https://github.com/kaltura/kmc-ng/commit/1d1aba5))
* allow login to the application by providing a valid ks value ([#614](https://github.com/kaltura/kmc-ng/issues/614)) ([611f31d](https://github.com/kaltura/kmc-ng/commit/611f31d))
* allow user login by ks in query params ([#604](https://github.com/kaltura/kmc-ng/issues/604)) ([cf69ddf](https://github.com/kaltura/kmc-ng/commit/cf69ddf))
* extend logs support ([#590](https://github.com/kaltura/kmc-ng/issues/590)) ([fd1a205](https://github.com/kaltura/kmc-ng/commit/fd1a205))
* implement ATTACHMENT_MODIFY permission ([#498](https://github.com/kaltura/kmc-ng/issues/498)) KMCNG-1522 ([2c8ec3a](https://github.com/kaltura/kmc-ng/commit/2c8ec3a))
* implement permission ACCESS_CONTROL_UPDATE ([#489](https://github.com/kaltura/kmc-ng/issues/489)) KMCNG-1508 ([3ecf2c6](https://github.com/kaltura/kmc-ng/commit/3ecf2c6))
* implement permission ACCOUNT_UPDATE_SETTINGS ([#485](https://github.com/kaltura/kmc-ng/issues/485)) KMCNG-1503 ([aa7826b](https://github.com/kaltura/kmc-ng/commit/aa7826b))
* implement permission ADMIN_USER_BULK ([#492](https://github.com/kaltura/kmc-ng/issues/492)) KMCNG-1515 ([89e7c84](https://github.com/kaltura/kmc-ng/commit/89e7c84))
* implement permission ADMIN_USER_UPDATE ([#504](https://github.com/kaltura/kmc-ng/issues/504)) KMCNG-1544 ([df0b7db](https://github.com/kaltura/kmc-ng/commit/df0b7db))
* implement permission ANALYTICS_BASE ([#539](https://github.com/kaltura/kmc-ng/issues/539)) KMCNG-1595 ([471fc1e](https://github.com/kaltura/kmc-ng/commit/471fc1e))
* implement permission CONTENT_INGEST_BULK_UPLOAD ([#493](https://github.com/kaltura/kmc-ng/issues/493)) KMCNG-1516 ([7e42cc4](https://github.com/kaltura/kmc-ng/commit/7e42cc4))
* implement permission CONTENT_INGEST_ORPHAN_VIDEO,  CONTENT_INGEST_ORPHAN_AUDIO and LIVE_STREAM_ADD ([#491](https://github.com/kaltura/kmc-ng/issues/491)) KMCNG-1512 ([9684d71](https://github.com/kaltura/kmc-ng/commit/9684d71))
* implement permission CUSTOM_DATA_PROFILE_DELETE ([#484](https://github.com/kaltura/kmc-ng/issues/484)) KMCNG-1502 ([efc05cb](https://github.com/kaltura/kmc-ng/commit/efc05cb))
* implement permission CUSTOM_DATA_PROFILE_UPDATE and CUSTOM_DATA_PROFILE_ADD ([#490](https://github.com/kaltura/kmc-ng/issues/490)) KMCNG-1510 ([0adf9f1](https://github.com/kaltura/kmc-ng/commit/0adf9f1))
* implement permission FEATURE_DISABLE_KMC_LIST_THUMBNAILS ([#521](https://github.com/kaltura/kmc-ng/issues/521)) KMCNG-1561 ([1dab23b](https://github.com/kaltura/kmc-ng/commit/1dab23b))
* implement permission FEATURE_END_USER_MANAGE ([#522](https://github.com/kaltura/kmc-ng/issues/522)) KMCNG-1562 ([6dd9776](https://github.com/kaltura/kmc-ng/commit/6dd9776))
* implement permission FEATURE_ENTITLEMENT ([#523](https://github.com/kaltura/kmc-ng/issues/523)) KMCNG-1563 ([c9c1c17](https://github.com/kaltura/kmc-ng/commit/c9c1c17))
* implement permission FEATURE_KMC_DRILLDOWN_TAGS_COLUMN ([#526](https://github.com/kaltura/kmc-ng/issues/526)) KMCNG-1567 ([ac83d27](https://github.com/kaltura/kmc-ng/commit/ac83d27))
* implement permission LIVE_STREAM_UPDATE ([#512](https://github.com/kaltura/kmc-ng/issues/512)) KMCNG-1553 ([08af88d](https://github.com/kaltura/kmc-ng/commit/08af88d))
* implement permission PLAYLIST_UPDATE ([#514](https://github.com/kaltura/kmc-ng/issues/514)) KMCNG-1554 ([74c7a26](https://github.com/kaltura/kmc-ng/commit/74c7a26))
* implement permission SYNDICATION_UPDATE ([#516](https://github.com/kaltura/kmc-ng/issues/516)) KMCNG-1556 ([d8bab20](https://github.com/kaltura/kmc-ng/commit/d8bab20))
* implement permission TRANSCODING_ADD ([#487](https://github.com/kaltura/kmc-ng/issues/487)) KMCNG-1506 ([b21f483](https://github.com/kaltura/kmc-ng/commit/b21f483))
* implement permission TRANSCODING_DELETE ([#488](https://github.com/kaltura/kmc-ng/issues/488)) KMCNG-1507 ([e2d8c6e](https://github.com/kaltura/kmc-ng/commit/e2d8c6e))
* implement permission TRANSCODING_UPDATE ([#518](https://github.com/kaltura/kmc-ng/issues/518)) KMCNG-1559 ([5cb8339](https://github.com/kaltura/kmc-ng/commit/5cb8339))
* implement permission WIDEVINE_PLUGIN_PERMISSION ([#542](https://github.com/kaltura/kmc-ng/issues/542)) KMCNG-1598 ([fae35cf](https://github.com/kaltura/kmc-ng/commit/fae35cf))
* implement permissions ADMIN_ROLE_ADD and ADMIN_ROLE_DELETE ([#496](https://github.com/kaltura/kmc-ng/issues/496)) KMCNG-1519 ([d8b0120](https://github.com/kaltura/kmc-ng/commit/d8b0120))
* implement permissions ADMIN_USER_ADD and ADMIN_USER_DELETE ([#497](https://github.com/kaltura/kmc-ng/issues/497)) KMCNG-1521 KMCNG-1520 ([aee4f83](https://github.com/kaltura/kmc-ng/commit/aee4f83))
* implement permissions BULK_LOG_DELETE and BULK_LOG_DOWNLOAD ([#499](https://github.com/kaltura/kmc-ng/issues/499)) KMCNG-1524 KMCNG-1523 ([a768336](https://github.com/kaltura/kmc-ng/commit/a768336))
* implement permissions FEATURE_HIDE_ASPERA_LINK and FEATURE_SHOW_ASPERA_UPLOAD_BUTTON ([#524](https://github.com/kaltura/kmc-ng/issues/524)) KMCNG-1572 KMCNG-1564 ([fa379bb](https://github.com/kaltura/kmc-ng/commit/fa379bb))
* implement permissions FEATURE_KALTURA_LIVE_STREAM and FEATURE_KMC_AKAMAI_UNIVERSAL_LIVE_STREAM_PROVISION ([#525](https://github.com/kaltura/kmc-ng/issues/525)) KMCNG-1566 KMCNG-1565 ([5340f69](https://github.com/kaltura/kmc-ng/commit/5340f69))
* load application configuration into the index.html and fallback to file if not available ([20a21b8](https://github.com/kaltura/kmc-ng/commit/20a21b8))
* modify external application api to use the domain and port of kmcng ([8500bf0](https://github.com/kaltura/kmc-ng/commit/8500bf0))



<a name="4.2.0"></a>
# [4.2.0](https://github.com/kaltura/kmc-ng/compare/v4.1.0...v4.2.0) (2018-04-15)


### Bug Fixes

* **administration/roles:** show required violation indication for description when trying to create new role without a value 
* **administration/users:** fix last login time format 
* **content/category:** fix UI issues in Add Users window 
* **content/entries:** reload entries list after file was uploaded, not prepared 
* **content/entry:** display "copy to clipboard" button for broadcasting URLs in Universal stream 
* **content/entry:** display "Export XML to FMLE" and live dashboard link for Kaltura live entry drill-down 
* **content/entry:** don't display non-supported languages in captions language drop-down 
* **content/entry:** hide "clip & trim" option for live, image and non-ready entries 
* **content/entry:** hide distribution link for live, audio and image entries
* **content/moderation:** close moderation report window before navigating to entry details view 
* **content/playlists:** fix name column header alignment 
* **content/syndication:** typo fix
* **login:** fix reset password condition 
* **settings/access-control:** fix confirmation header 
* **settings/access-control-profile:** display validation message on blur 
* **settings/access-control-profiles:** disable profile name editing for the default profile 
* **content/categories:** handle categories lazy mode when permission DYNAMIC_FLAG_KMC_CHUNKED_CATEGORY_LOAD is provided 
* **content/categories:** perform move of categories  
* **settings/transcoding-profiles:** provide headers for alerts 
* center dialog boxes on screen according to content height
* set "Delete" action to be last in all menus and marked in red
* updated entry metadata and live layouts 


### Features

* ignore metadata profiles with corrupted XSD values
* implement permissions


<a name="4.1.0"></a>
# [4.1.0](https://github.com/kaltura/kmc-ng/compare/v4.0.1...v4.1.0) (2018-04-02)


### Bug Fixes

* **settings/access-control:** domains column header name change ([39c7d95](https://github.com/kaltura/kmc-ng/commit/39c7d95))
* accept server polls service once user is logged ([6dfe526](https://github.com/kaltura/kmc-ng/commit/6dfe526))
* **content/category:** help tip typo fix ([47c14f6](https://github.com/kaltura/kmc-ng/commit/47c14f6))
* **content/entries:** fix entries bulk selection labeling ([a0a7c96](https://github.com/kaltura/kmc-ng/commit/a0a7c96))
* update bulk upload sample file name ([20b6bb2](https://github.com/kaltura/kmc-ng/commit/20b6bb2))
* **content/entry:** fix disabled buttons styling in custom metadata ([005486c](https://github.com/kaltura/kmc-ng/commit/005486c))
* fix menu items visibility logic ([b907fa0](https://github.com/kaltura/kmc-ng/commit/b907fa0))
* implement permission CONTENT_MANAGE_ACCESS_CONTROL merge issue KMCNG-1470 ([44d10c5](https://github.com/kaltura/kmc-ng/commit/44d10c5))
* reposition tooltips above the texts (KMCNG-1461) ([#459](https://github.com/kaltura/kmc-ng/issues/459)) ([5aa1768](https://github.com/kaltura/kmc-ng/commit/5aa1768))
* show actual error in the console when failing to parse server runtime configuration ([fee483f](https://github.com/kaltura/kmc-ng/commit/fee483f))
* **content/syndication:** add permissions to feed delete button in feed details floater ([6e5d42e](https://github.com/kaltura/kmc-ng/commit/6e5d42e))
* **settings/custom-data:** Fix applyTo always set to entries ([bf4cb80](https://github.com/kaltura/kmc-ng/commit/bf4cb80))
* **user-settings:** fix language dropdown no closing on page scroll ([b2e0954](https://github.com/kaltura/kmc-ng/commit/b2e0954))


### Features

* add advertisement and clip applications ([#502](https://github.com/kaltura/kmc-ng/issues/502)) ([ba9ea8c](https://github.com/kaltura/kmc-ng/commit/ba9ea8c))
* add beta logo ([9367220](https://github.com/kaltura/kmc-ng/commit/9367220))
* add clip & trim and advertisements editors ([#429](https://github.com/kaltura/kmc-ng/issues/429)) ([e155ff2](https://github.com/kaltura/kmc-ng/commit/e155ff2))
* add live dashboard for kaltura live entries ([#439](https://github.com/kaltura/kmc-ng/issues/439)) ([3ba7c49](https://github.com/kaltura/kmc-ng/commit/3ba7c49))
* add live real-time dashboard view ([#478](https://github.com/kaltura/kmc-ng/issues/478)) ([e9f63df](https://github.com/kaltura/kmc-ng/commit/e9f63df))
* add permissions base infrastructure ([#464](https://github.com/kaltura/kmc-ng/issues/464)) ([36b9fec](https://github.com/kaltura/kmc-ng/commit/36b9fec))
* add studio v3 integration ([#528](https://github.com/kaltura/kmc-ng/issues/528)) KMCNG-1579 ([aa7bf36](https://github.com/kaltura/kmc-ng/commit/aa7bf36))
* administration > roles: add role permissions tree selector ([#503](https://github.com/kaltura/kmc-ng/issues/503)) KMCNG-1537 KMCNG-1538 KMCNG-1539 KMCNG-1540 KMCNG-1541 KMCNG-1542 KMCNG-1543 ([2fa3fca](https://github.com/kaltura/kmc-ng/commit/2fa3fca))
* content > categories: add category custom metadata support for linked entries ([23e5ed3](https://github.com/kaltura/kmc-ng/commit/23e5ed3))
* content > entries: add custom metadata component that manages linked entries list KMCNG-293 ([9503bed](https://github.com/kaltura/kmc-ng/commit/9503bed))
* new sync animation icon for uploading status ([352deaa](https://github.com/kaltura/kmc-ng/commit/352deaa))
* implement permission CAPTION_MODIFY ([#500](https://github.com/kaltura/kmc-ng/issues/500)) KMCNG-1525 ([4560df2](https://github.com/kaltura/kmc-ng/commit/4560df2))
* implement permission ACCESS_CONTROL_ADD ([#482](https://github.com/kaltura/kmc-ng/issues/482)) KMCNG-1499 ([d9917fe](https://github.com/kaltura/kmc-ng/commit/d9917fe))
* implement permission ACCESS_CONTROL_DELETE ([#481](https://github.com/kaltura/kmc-ng/issues/481)) KMCNG-1500 ([e0fac29](https://github.com/kaltura/kmc-ng/commit/e0fac29))
* implement permission CONTENT_MANAGE_ACCESS_CONTROL ([#519](https://github.com/kaltura/kmc-ng/issues/519)) KMCNG-1470 ([d8e963f](https://github.com/kaltura/kmc-ng/commit/d8e963f))
* implement permission CONTENT_MANAGE_ASSIGN_CATEGORIES ([#505](https://github.com/kaltura/kmc-ng/issues/505)) KMCNG-1546 ([2b392c8](https://github.com/kaltura/kmc-ng/commit/2b392c8))
* implement permission CONTENT_MANAGE_CATEGORY_USERS ([#494](https://github.com/kaltura/kmc-ng/issues/494)) KMCNG-1517 ([b137354](https://github.com/kaltura/kmc-ng/commit/b137354))
* implement permission CONTENT_MANAGE_METADATA ([#515](https://github.com/kaltura/kmc-ng/issues/515)) KMCNG-1549 ([2d864c3](https://github.com/kaltura/kmc-ng/commit/2d864c3))
* implement permission CONTENT_MANAGE_DELETE ([#469](https://github.com/kaltura/kmc-ng/issues/469)) KMCNG-1471 ([1bea895](https://github.com/kaltura/kmc-ng/commit/1bea895))
* implement permission CONTENT_MANAGE_DOWNLOAD ([#468](https://github.com/kaltura/kmc-ng/issues/468)) KMCNG-1472 ([f5f18b9](https://github.com/kaltura/kmc-ng/commit/f5f18b9))
* implement permission CONTENT_MANAGE_ENTRY_USERS ([#506](https://github.com/kaltura/kmc-ng/issues/506)) KMCNG-1547 ([0590023](https://github.com/kaltura/kmc-ng/commit/0590023))
* implement permission CONTENT_MANAGE_RECONVERT ([#508](https://github.com/kaltura/kmc-ng/issues/508)) KMCNG-1550 ([c1fcca9](https://github.com/kaltura/kmc-ng/commit/c1fcca9))
* implement permission CONTENT_MANAGE_SCHEDULE ([#510](https://github.com/kaltura/kmc-ng/issues/510)) KMCNG-1551 ([5f061a4](https://github.com/kaltura/kmc-ng/commit/5f061a4))
* implement permission CONTENT_MANAGE_THUMBNAIL ([#511](https://github.com/kaltura/kmc-ng/issues/511)) KMCNG-1552 ([66fc75f](https://github.com/kaltura/kmc-ng/commit/66fc75f))
* Implement permission CONTENT_MODERATE_APPROVE_REJECT ([#477](https://github.com/kaltura/kmc-ng/issues/477)) KMCNG-1478 ([d5ea4ba](https://github.com/kaltura/kmc-ng/commit/d5ea4ba))
* implement permission INTEGRATION_UPDATE_SETTINGS ([#483](https://github.com/kaltura/kmc-ng/issues/483)) KMCNG-1501 ([ff761ef](https://github.com/kaltura/kmc-ng/commit/ff761ef))
* implement permission PLAYLIST_ADD ([#475](https://github.com/kaltura/kmc-ng/issues/475)) KMCNG-1469 ([9db13ba](https://github.com/kaltura/kmc-ng/commit/9db13ba))
* implement permission PLAYLIST_DELETE ([#473](https://github.com/kaltura/kmc-ng/issues/473)) KMCNG-1476 ([82883c4](https://github.com/kaltura/kmc-ng/commit/82883c4))
* implement permission SYNDICATION_ADD ([#470](https://github.com/kaltura/kmc-ng/issues/470)) KMCNG-1474 ([b46fc9c](https://github.com/kaltura/kmc-ng/commit/b46fc9c))
* implement permission SYNDICATION_DELETE ([#474](https://github.com/kaltura/kmc-ng/issues/474)) KMCNG-1475 ([1f293df](https://github.com/kaltura/kmc-ng/commit/1f293df))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/kaltura/kmc-ng/compare/v4.0.0...v4.0.1) (2018-03-19)


### Bug Fixes

* fix bulk upload table - status column layout ([86636e1](https://github.com/kaltura/kmc-ng/commit/86636e1))
* fix categories table layout - remove fixed column sizes ([efb3b50](https://github.com/kaltura/kmc-ng/commit/efb3b50))
* fix labels for category entitlements > add user screen ([491e497](https://github.com/kaltura/kmc-ng/commit/491e497))
* fix layout for auto-complete component in bulk > add tags ([900599f](https://github.com/kaltura/kmc-ng/commit/900599f))
* KMCNG-1410 - Categories: Wrong order of actions in bulk actions … ([#453](https://github.com/kaltura/kmc-ng/issues/453)) ([7e778ef](https://github.com/kaltura/kmc-ng/commit/7e778ef))
* KMCNG-982 - Related Files- Preview option downloads the file rat… ([#452](https://github.com/kaltura/kmc-ng/issues/452)) ([c8f19c2](https://github.com/kaltura/kmc-ng/commit/c8f19c2))
* **content/entry:** add missing space in owner suggestion dropdown list ([eaec381](https://github.com/kaltura/kmc-ng/commit/eaec381))
* layout fixes for entries selector + clean server-config file from redundant data ([0360570](https://github.com/kaltura/kmc-ng/commit/0360570))
* **administration/users:** remove redundant retry button, highlight wrong field ([d9e2059](https://github.com/kaltura/kmc-ng/commit/d9e2059))
* **bulk-upload:** add tooltips for truncated columns ([9f52d96](https://github.com/kaltura/kmc-ng/commit/9f52d96))
* **content/bulk-upload:** fix error message ([898703a](https://github.com/kaltura/kmc-ng/commit/898703a))
* **content/categories:** Fix categories bulk actions relied on entitlement settings ([082b128](https://github.com/kaltura/kmc-ng/commit/082b128))
* **content/categories:** remove default selection for new and move category action ([6c1d362](https://github.com/kaltura/kmc-ng/commit/6c1d362))
* **content/categories:** typo fix ([b2afcd4](https://github.com/kaltura/kmc-ng/commit/b2afcd4))
* **content/category:** fix end users table layout issues on IE11 ([972a60e](https://github.com/kaltura/kmc-ng/commit/972a60e))
* **content/category:** fix entitlements users table paginator layout ([d819b15](https://github.com/kaltura/kmc-ng/commit/d819b15))
* **content/category:** fix layout and help tips ([de6f287](https://github.com/kaltura/kmc-ng/commit/de6f287))
* **content/drop-folders:** fix filter calendar layout ([09ea1c7](https://github.com/kaltura/kmc-ng/commit/09ea1c7))
* **content/entries:** add confirmation window if changes was made on add to categories ([23ae9cd](https://github.com/kaltura/kmc-ng/commit/23ae9cd))
* **content/entries:** fix bulk download cancel confirmation header ([5fd84cc](https://github.com/kaltura/kmc-ng/commit/5fd84cc))
* **content/entries:** prevent open entryDetails for not ready liveStream entries ([490127e](https://github.com/kaltura/kmc-ng/commit/490127e))
* **content/entries:** reload entries list on file upload ([f6e750b](https://github.com/kaltura/kmc-ng/commit/f6e750b))
* **content/entries:** replace [style] with [ngStyle] in table to support older Safari browsers ([e69488a](https://github.com/kaltura/kmc-ng/commit/e69488a))
* **content/entries:** show relevant error message for bulk download fail ([16fcc23](https://github.com/kaltura/kmc-ng/commit/16fcc23))
* **content/entry:** Allow close without confirmation on apply action ([a79b9b1](https://github.com/kaltura/kmc-ng/commit/a79b9b1))
* **content/entry:** expand categories selector to show selected categories ([3eded0f](https://github.com/kaltura/kmc-ng/commit/3eded0f))
* **content/entry:** fix categories selector confirmation message logic ([31eb2bc](https://github.com/kaltura/kmc-ng/commit/31eb2bc))
* **content/entry:** fix category-tree width overflow issue ([b02cedc](https://github.com/kaltura/kmc-ng/commit/b02cedc))
* **content/entry:** fix Kaltura live tokens regeneration functionality ([36e7740](https://github.com/kaltura/kmc-ng/commit/36e7740))
* **content/entry:** prevent upload progress over 100%, set 100% progress on uploadComplete ([5a53bfd](https://github.com/kaltura/kmc-ng/commit/5a53bfd))
* **content/entry:** Wrong error message when loading flavors fails ([f074612](https://github.com/kaltura/kmc-ng/commit/f074612))
* **content/moderation:** update confirmation message (approve / reject) for more than 10 selected entries ([c7aeb1a](https://github.com/kaltura/kmc-ng/commit/c7aeb1a))
* **content/playlist:** set correct position for confirmation message in playlist and transcoding settings ([b66b8b7](https://github.com/kaltura/kmc-ng/commit/b66b8b7))
* **content/playlist:** set default name for new playlist, mark as dirty ([918095b](https://github.com/kaltura/kmc-ng/commit/918095b))
* **content/playlist:** update name field on input blur ([19a55ee](https://github.com/kaltura/kmc-ng/commit/19a55ee))
* typo fix ([b5dab99](https://github.com/kaltura/kmc-ng/commit/b5dab99))
* **content/playlist:** when creating a new playlist - set focus to name field ([05adb8b](https://github.com/kaltura/kmc-ng/commit/05adb8b))
* **content/playlists:** fix error message ([b88d9fd](https://github.com/kaltura/kmc-ng/commit/b88d9fd))
* **create/live:** shorten confirmation message title ([3dd79ed](https://github.com/kaltura/kmc-ng/commit/3dd79ed))
* set default order to desc for tables ([0c82e22](https://github.com/kaltura/kmc-ng/commit/0c82e22))
* **settings/custom-data:** add area-blocker for entire section to display delete error messages ([24de638](https://github.com/kaltura/kmc-ng/commit/24de638))
* **settings/custom-data:** clear selected schema when opening new schema popup ([22ca291](https://github.com/kaltura/kmc-ng/commit/22ca291))
* **settings/custom-data:** hide move up/down buttons for single field ([7c5a881](https://github.com/kaltura/kmc-ng/commit/7c5a881))
* **settings/custom-data:** mark label as required explicitly ([a671831](https://github.com/kaltura/kmc-ng/commit/a671831))
* **settings/integration:** fix categories selector width when creating new entitlement in integration settings ([22c20f6](https://github.com/kaltura/kmc-ng/commit/22c20f6))
* **upload:** "Add Files" button style fix ([cbef375](https://github.com/kaltura/kmc-ng/commit/cbef375))
* **upload:** add plus icon to "Add Files" button ([cec95a0](https://github.com/kaltura/kmc-ng/commit/cec95a0))
* **upload:** fix button label ([4b35912](https://github.com/kaltura/kmc-ng/commit/4b35912))
* **upload:** fix transcoding profile's dropdown styles ([5ec89be](https://github.com/kaltura/kmc-ng/commit/5ec89be))
* **upload:** fix uploading icon style ([e7028f4](https://github.com/kaltura/kmc-ng/commit/e7028f4))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/kaltura/kmc-ng/compare/v3.6.1...v4.0.0) (2018-03-04)


### Bug Fixes

* **administration/users:** typo fix in error message for "User already exists" ([eac37fb](https://github.com/kaltura/kmc-ng/commit/eac37fb))
* **content/categories:** navigate to metadata section when saving a category after removing its sub categories ([8605caa](https://github.com/kaltura/kmc-ng/commit/8605caa))
* **content/categories:** show categories entries when selection category > view entries ([5dcccc4](https://github.com/kaltura/kmc-ng/commit/5dcccc4))
* **content/drop-folder:** file doesn't display when uploading remote xml ([594e0c2](https://github.com/kaltura/kmc-ng/commit/594e0c2))
* **content/entries:** incorrect status is displayed when uploading/finish uploading captions ([d9e5646](https://github.com/kaltura/kmc-ng/commit/d9e5646))
* bulk selection layout fix for IE11 in custom data and transcoding settings ([5e0dbe9](https://github.com/kaltura/kmc-ng/commit/5e0dbe9))
* close bulk menu upon browser scroll for categories list view, entries moderation view and categories entitlements view  ([#395](https://github.com/kaltura/kmc-ng/issues/395)) ([5d53f13](https://github.com/kaltura/kmc-ng/commit/5d53f13))
* **content/playlists:** show last item fully in playlist manual > add entry dialog when using filters ([235477b](https://github.com/kaltura/kmc-ng/commit/235477b))
* fix syndication feed list table actions menu style ([820ff31](https://github.com/kaltura/kmc-ng/commit/820ff31))
* fix syndication table layout for IE11 ([37ad88e](https://github.com/kaltura/kmc-ng/commit/37ad88e))
* move syndication assets into the relevant folder ([c87ff15](https://github.com/kaltura/kmc-ng/commit/c87ff15))
* table rows menu that was executing the actions on old row data ([de308e5](https://github.com/kaltura/kmc-ng/commit/de308e5))


### Features

* **External application integration:** Add external applications development samples ([f164cd9](https://github.com/kaltura/kmc-ng/commit/f164cd9))
* **Content/entries:** Add entry details distribution section ([#397](https://github.com/kaltura/kmc-ng/issues/397)) ([1edf248](https://github.com/kaltura/kmc-ng/commit/1edf248))
* **Content/syndication:** Add syndication view ([322f0a5](https://github.com/kaltura/kmc-ng/commit/322f0a5))
* **Settings:** Add account information view ([#378](https://github.com/kaltura/kmc-ng/issues/378)) ([d52d327](https://github.com/kaltura/kmc-ng/commit/d52d327))
* **Content/Entry/Live** Add Kaltura live view in entry details ([#399](https://github.com/kaltura/kmc-ng/issues/399)) ([e15d475](https://github.com/kaltura/kmc-ng/commit/e15d475))
* **External application integration:** Embed usage dashboard, live dashboard and studio external applications ([#391](https://github.com/kaltura/kmc-ng/issues/391)) ([f7ea003](https://github.com/kaltura/kmc-ng/commit/f7ea003))
* **Settings/access control:** Add access control views ([#348](https://github.com/kaltura/kmc-ng/issues/348)) ([09c8f51](https://github.com/kaltura/kmc-ng/commit/09c8f51))
* **Settings/transcoding-settings:** Add transcoding settings view ([#401](https://github.com/kaltura/kmc-ng/issues/401)) ([42b47a7](https://github.com/kaltura/kmc-ng/commit/42b47a7))
* **Performance enhancements**: Performance enhancements for tables in entries list, moderation list, playlists list, syndication list, categories list, bulk upload list, drop folders list and entries selector ([#400](https://github.com/kaltura/kmc-ng/issues/400)) ([56c5859](https://github.com/kaltura/kmc-ng/commit/56c5859))
* **Stack upgrade:** Upgrade stack to angular@5 and [@angular](https://github.com/angular)/cli@1.7.0 ([5262d13](https://github.com/kaltura/kmc-ng/commit/5262d13))


### BREAKING CHANGES

* upgrading from v4 to v5 required multiple changes in build scripts and some code adjustments



<a name="3.6.1"></a>
## [3.6.1](https://github.com/kaltura/kmc-ng/compare/v3.6.0...v3.6.1) (2018-02-06)


### Bug Fixes

* fix wrong import path in custom schema form ([944ea04](https://github.com/kaltura/kmc-ng/commit/944ea04))



<a name="3.6.0"></a>
# [3.6.0](https://github.com/kaltura/kmc-ng/compare/v3.5.0...v3.6.0) (2018-02-05)


### Bug Fixes

* **administration/roles:** fix table layout (padding left) ([750430a](https://github.com/kaltura/kmc-ng/commit/750430a))
* **content-categories:** confirm closing the new category window if the form is dirty or a folder was selected by the user ([#365](https://github.com/kaltura/kmc-ng/issues/365)) ([1efe9b7](https://github.com/kaltura/kmc-ng/commit/1efe9b7))
* **content-categories:** fix confirmation message for bulk updating more than 50 categories at once ([a27cd81](https://github.com/kaltura/kmc-ng/commit/a27cd81))
* **content-categories:** handle creation errors correctly ([dc5ab01](https://github.com/kaltura/kmc-ng/commit/dc5ab01))
* **content-category:** fix labels and headers in entitlement users bulk actions and window title ([7007caf](https://github.com/kaltura/kmc-ng/commit/7007caf))
* **content-category:** fix typo in "Privacy Context Label" label in category details ([4c0908d](https://github.com/kaltura/kmc-ng/commit/4c0908d))
* **content-entries:** send missing filter when creating a new playlist from bulk entries selection ([e730474](https://github.com/kaltura/kmc-ng/commit/e730474))
* **content-moderation:** send admin KS to player to enable playback of moderated entries ([159acfd](https://github.com/kaltura/kmc-ng/commit/159acfd))
* **content-playlists:** close the new playlist now restore the page scrollbar ([#371](https://github.com/kaltura/kmc-ng/issues/371)) ([788e636](https://github.com/kaltura/kmc-ng/commit/788e636))
* **content-playlists:** style fixes for table actions button in rule-based playlist content tab ([c335bd0](https://github.com/kaltura/kmc-ng/commit/c335bd0))
* **content/categories:** fix categories table layout (columns width) ([a3bb4c6](https://github.com/kaltura/kmc-ng/commit/a3bb4c6))
* **content/entries:** cut long text and add tooltip for long access control properties in bulk window ([6b2aace](https://github.com/kaltura/kmc-ng/commit/6b2aace))
* **content/entries:** enable save button when user changes related file > file type ([dd02ce8](https://github.com/kaltura/kmc-ng/commit/dd02ce8))
* **content/entry:** show access control section template when there's no data yet ([431b05b](https://github.com/kaltura/kmc-ng/commit/431b05b))
* **content/entry:** show name required validation error ([5442836](https://github.com/kaltura/kmc-ng/commit/5442836))
* **content/playlist:** display total duration for manual playlists ([fc28c5c](https://github.com/kaltura/kmc-ng/commit/fc28c5c))
* **content/playlist:** display total entries count for manual playlists ([04d09bf](https://github.com/kaltura/kmc-ng/commit/04d09bf))
* **content/playlists:** clear selection of entries upon save for manual playlist ([#388](https://github.com/kaltura/kmc-ng/issues/388)) ([93cf164](https://github.com/kaltura/kmc-ng/commit/93cf164))
* **content/playlists:** placeholder layout fix in new playlist view > name field. ([40e2321](https://github.com/kaltura/kmc-ng/commit/40e2321))
* **content/upload-control:** issues involving selection of items ([1b6df96](https://github.com/kaltura/kmc-ng/commit/1b6df96))
* ensure playlist name provided when creating new playlist from entries view ([4021882](https://github.com/kaltura/kmc-ng/commit/4021882))
* **cotent/playlists:** recalculate entries duration and total count when duplicating entry in manual playlist ([#353](https://github.com/kaltura/kmc-ng/issues/353)) ([bebf701](https://github.com/kaltura/kmc-ng/commit/bebf701))
* **settings-custom data:** style fixes for table actions button ([be495e1](https://github.com/kaltura/kmc-ng/commit/be495e1))
* **settings/custom data:** prevent edit of apply to, handle edge case during saving ([23787d8](https://github.com/kaltura/kmc-ng/commit/23787d8))
* **settings/custom-metadata:** create valid schema when saving ([2867a34](https://github.com/kaltura/kmc-ng/commit/2867a34))
* changed locale format into fixed formats ([#374](https://github.com/kaltura/kmc-ng/issues/374)) ([fa31c48](https://github.com/kaltura/kmc-ng/commit/fa31c48))
* fix drop-folders list styling ([a83538e](https://github.com/kaltura/kmc-ng/commit/a83538e))
* fix reference id comparison when reference id is null ([c831726](https://github.com/kaltura/kmc-ng/commit/c831726))
* IE11 layout fixes ([6b01d0e](https://github.com/kaltura/kmc-ng/commit/6b01d0e))
* layout fix for manual playlist content - bulk selection label ([296e56b](https://github.com/kaltura/kmc-ng/commit/296e56b))
* parse metadata profiles elements that are missing attribute minOccurs ([0df1fd2](https://github.com/kaltura/kmc-ng/commit/0df1fd2))
* **settings/my-user-settings:** fix error message and clean previous errors when opening the floaters ([a0bcf45](https://github.com/kaltura/kmc-ng/commit/a0bcf45))
* **upload:** remove validation error message for file type once user select a type from list ([c4a3940](https://github.com/kaltura/kmc-ng/commit/c4a3940))
* production build issues ([f411d64](https://github.com/kaltura/kmc-ng/commit/f411d64))
* remove grawl message on category delete success. ([5490a9d](https://github.com/kaltura/kmc-ng/commit/5490a9d))
* show moderation flags count ([96b4e7d](https://github.com/kaltura/kmc-ng/commit/96b4e7d))
* sort player names in Share & Embed screen alphabetically disregarding casing ([bb43aa3](https://github.com/kaltura/kmc-ng/commit/bb43aa3))
* ux fixes ([#370](https://github.com/kaltura/kmc-ng/issues/370)) ([a29942c](https://github.com/kaltura/kmc-ng/commit/a29942c))


### Features

* **Server configuration:** the ability to configure against any server using local configuration files
* **Categories move lockdown:** display categories status upon server lock and update states, prevent categories action upon server lock
* **Integration settings:** Settings > Integration Settings screen including Account Info, Notification and Entitlements Settings
* **Rule-based playlist:** Content > Playlists > Rule-based playlist: New playlist, Edit playlist, Add / Edit / Delete rules
* **Custom Data:** Settings > Custom data: Add / Edit / Delete custom data schemas and fields
* **My User Settings:** Settings > My user settings: View & edit user settings
* **Thumbnail capture from entry:** Widget allowing capturing a specific frame from the entry to be used as the entry thumbnail
* **Filters refactor:** Refactor of the filters system across the application
* **UX Fixes:** Following feedback from UX team
* **UI enhancements:** Updated styles and layouts, new "copy to clipboard" component and more
* **studio:** register to studio callback to refresh players list upon add / delete players in Studio
* **content/drop-folder:** add server side sorting


<a name="3.5.0"></a>
# [3.5.0](https://github.com/kaltura/kmc-ng/compare/v3.4.0...v3.5.0) (2018-01-14)


### Bug Fixes

* add bulk entries to new playlist validation issue ([42d25a0](https://github.com/kaltura/kmc-ng/commit/42d25a0))
* aggregate 50 items per bulk request ([3bce5bd](https://github.com/kaltura/kmc-ng/commit/3bce5bd))
* category entitlement tooltips, category change owner ID validation and tooltips ([4fc552e](https://github.com/kaltura/kmc-ng/commit/4fc552e))
* **content-playlists:** fix playlist name validation style and logic, allow adding the same entry multiple times to the playlist, block interface during playlist save operation ([457bb4a](https://github.com/kaltura/kmc-ng/commit/457bb4a))
* **content/categories:** refine filters clear custom metadata when clicking on clear all ([991cb68](https://github.com/kaltura/kmc-ng/commit/991cb68))
* **content/categories:** show tag filter of type categories ([2f69d41](https://github.com/kaltura/kmc-ng/commit/2f69d41))
* **content/categories:** update additional filters list root nodes when clearing filters ([96039fd](https://github.com/kaltura/kmc-ng/commit/96039fd))
* fix refresh button positioning across the app ([4be0f0e](https://github.com/kaltura/kmc-ng/commit/4be0f0e))
* layout fixes for playlists on Safari + user settings popup positioning ([#339](https://github.com/kaltura/kmc-ng/issues/339)) ([5160dcd](https://github.com/kaltura/kmc-ng/commit/5160dcd))
* remove tooltip for upload monitor panel ([da4221f](https://github.com/kaltura/kmc-ng/commit/da4221f))


### Features

* **content/categories:** inherit category entitlement users of parent category ([1cc2844](https://github.com/kaltura/kmc-ng/commit/1cc2844))



<a name="3.4.0"></a>
# [3.4.0](https://github.com/kaltura/kmc-ng/compare/v3.3.0...v3.4.0) (2018-01-09)


### Bug Fixes

* **content-categories:** fix categories data table sticky header layout ([5462bdd](https://github.com/kaltura/kmc-ng/commit/5462bdd))
* **content-entries:** Allow choosing 'Transcoding Profile' while preparing entry ([3153c61](https://github.com/kaltura/kmc-ng/commit/3153c61))
* **content-entries:** clicking on thumbnail should open the entry drill-down on metadata section ([7611583](https://github.com/kaltura/kmc-ng/commit/7611583))
* **content-entries:** remove modal behavior from category filter preferences window ([a4d8393](https://github.com/kaltura/kmc-ng/commit/a4d8393))
* **content-entries:** when creating a draft entry - don't send conversionProfileId if user has no permission for transcoding ([1ecde24](https://github.com/kaltura/kmc-ng/commit/1ecde24))
* **content-entry:** display error message in preview and embed if not suitable players are found in the partner account ([18bb141](https://github.com/kaltura/kmc-ng/commit/18bb141))
* **content-entry:** DVR window parameter: display N/A when dvrWindow is NaN ([fcbff6a](https://github.com/kaltura/kmc-ng/commit/fcbff6a))
* **content-entry:** Entry Thumbnail - verify selected file size and issue an alert if larger than 2GB (prevent upload in this case) ([f45e58c](https://github.com/kaltura/kmc-ng/commit/f45e58c))
* fix entries selector logic ([13169dc](https://github.com/kaltura/kmc-ng/commit/13169dc))
* **content-entry:** fix date pipe format to display correct minutes ([b822632](https://github.com/kaltura/kmc-ng/commit/b822632))
* **content-entry:** fix thumbnail URL link in thumbnails view ([85e5374](https://github.com/kaltura/kmc-ng/commit/85e5374))
* **content-entry:** refresh player preview on flavors refresh ([d6bc5a9](https://github.com/kaltura/kmc-ng/commit/d6bc5a9))
* **content-playlists:** Typo fix in the word Playlists ([ee76316](https://github.com/kaltura/kmc-ng/commit/ee76316))
* add :host before /deep/ on all root classes to prevent app-level overrides ([c5a1694](https://github.com/kaltura/kmc-ng/commit/c5a1694))
* another label update for categories selector button ([5e44b50](https://github.com/kaltura/kmc-ng/commit/5e44b50))
* Bulk upload list > Refine filters popup position ([8ca403a](https://github.com/kaltura/kmc-ng/commit/8ca403a))
* close user settings menu when opening the change account floater ([46342f8](https://github.com/kaltura/kmc-ng/commit/46342f8))
* drop-folders in upload monitor fixes ([7777b7f](https://github.com/kaltura/kmc-ng/commit/7777b7f))
* entries and playlists delete confirmation message fixes, refine filter calendar widgets layout fix ([6d5c350](https://github.com/kaltura/kmc-ng/commit/6d5c350))
* error message fix during bulk upload monitoring ([00d8e04](https://github.com/kaltura/kmc-ng/commit/00d8e04))
* fix file type dropdown visibility in upload table ([e090686](https://github.com/kaltura/kmc-ng/commit/e090686))
* fix filters dropdown positioning ([b031c06](https://github.com/kaltura/kmc-ng/commit/b031c06))
* fix layout of login screen in small resolutions ([9a37c36](https://github.com/kaltura/kmc-ng/commit/9a37c36))
* fix user settings dropdown positioning ([f386b34](https://github.com/kaltura/kmc-ng/commit/f386b34))
* label update for categories selector button ([3144af3](https://github.com/kaltura/kmc-ng/commit/3144af3))
* production build transpiling issues ([b7feb69](https://github.com/kaltura/kmc-ng/commit/b7feb69))
* remove :host before /deep/ ([e1cd8c0](https://github.com/kaltura/kmc-ng/commit/e1cd8c0))
* show notification asking user to select media type when while uploading unrecognized file ([#315](https://github.com/kaltura/kmc-ng/issues/315)) ([41e212a](https://github.com/kaltura/kmc-ng/commit/41e212a))
* show tooltips for filters of type custom metadata in tags component ([eb31a5b](https://github.com/kaltura/kmc-ng/commit/eb31a5b))
* style fixes for categories in IE11 ([bda403a](https://github.com/kaltura/kmc-ng/commit/bda403a))
* style fixes for refine filters calendar ([4a2600d](https://github.com/kaltura/kmc-ng/commit/4a2600d))
* **content/categories:** allow setting owner in entitlement that is was not selected from suggetions ([98f5910](https://github.com/kaltura/kmc-ng/commit/98f5910))
* **content/entries:** fix issue when settings numbers in entry > custom metadata > unlimited text control  ([#317](https://github.com/kaltura/kmc-ng/issues/317)) ([b592cfc](https://github.com/kaltura/kmc-ng/commit/b592cfc))
* update categories bulk action error message ([4295e13](https://github.com/kaltura/kmc-ng/commit/4295e13))
* update live stream creation success message for universal live. ([8c074e9](https://github.com/kaltura/kmc-ng/commit/8c074e9))


### Features

* **content/entries:** add Preview&Embed view ([#308](https://github.com/kaltura/kmc-ng/issues/308)) ([d127ed9](https://github.com/kaltura/kmc-ng/commit/d127ed9))
* **content/categories:** add categories list view filters ([37bece0](https://github.com/kaltura/kmc-ng/commit/37bece0))
* **content/categories:** add category details view ([824d8d2](https://github.com/kaltura/kmc-ng/commit/824d8d2))
* **content/categories:** add new category and move categories views ([026c4f5](https://github.com/kaltura/kmc-ng/commit/026c4f5))
* **content/drop-folder:** add drop folder list view ([25d281c](https://github.com/kaltura/kmc-ng/commit/25d281c))
* **content/drop-folder:** add drop folder to monitor notification ([25d281c](https://github.com/kaltura/kmc-ng/commit/25d281c))
* **administration/users:** add users list and details views ([84e33e6](https://github.com/kaltura/kmc-ng/commit/84e33e6))
* **content/moderation:** add moderation view ([a4ba524](https://github.com/kaltura/kmc-ng/commit/a4ba524))
* **content/entries**: create new playlist from entries bulk operation ([cfe3564](https://github.com/kaltura/kmc-ng/commit/cfe3564))
* **content/entries:** Add help tips to metadata labels with description ([3d69e93](https://github.com/kaltura/kmc-ng/commit/3d69e93))
* **content/playlists:** add playlists list view filters ([f4be2a6](https://github.com/kaltura/kmc-ng/commit/f4be2a6))


<a name="3.3.0"></a>
# [3.3.0](https://github.com/kaltura/kmc-ng/compare/v3.2.0...v3.3.0) (2017-12-06)


### Bug Fixes

*  constraint title to 1 line with ellipsis if needed. Apply to entries, playlists, categories. ([#294](https://github.com/kaltura/kmc-ng/issues/294)) ([ce17e80](https://github.com/kaltura/kmc-ng/commit/ce17e80))
* add polyfill to support ES7 Object methods in older browsers ([aef5fce](https://github.com/kaltura/kmc-ng/commit/aef5fce))
* compare category ID as string to the route snapshot for correct comparison ([91c60d2](https://github.com/kaltura/kmc-ng/commit/91c60d2))
* displaying logic of entry's menu items ([c1876f4](https://github.com/kaltura/kmc-ng/commit/c1876f4))
* **content-entries:** KMCNG-943 Typo fix ([fd50bd3](https://github.com/kaltura/kmc-ng/commit/fd50bd3))
* don't append popups to other components to prevent z-index collision ([63e11be](https://github.com/kaltura/kmc-ng/commit/63e11be))
* enable save button when user update complex form ([a2de282](https://github.com/kaltura/kmc-ng/commit/a2de282))
* error icon ([ea1dca4](https://github.com/kaltura/kmc-ng/commit/ea1dca4))
* fix bug where user settings dropdown becomes disabled when the page is scrolled down ([97d6c6d](https://github.com/kaltura/kmc-ng/commit/97d6c6d))
* fix IE11 crashing issues by removing ES7 specific functions ([411ebd1](https://github.com/kaltura/kmc-ng/commit/411ebd1))
* fix loading spinner layout ([5ffec88](https://github.com/kaltura/kmc-ng/commit/5ffec88))
* fix runtime error when opening the categories selector for entry with no categories and revert entry users tooltip fix which caused a regression ([19263d3](https://github.com/kaltura/kmc-ng/commit/19263d3))
* flavor import url validation ([#252](https://github.com/kaltura/kmc-ng/issues/252)) ([fa71ef6](https://github.com/kaltura/kmc-ng/commit/fa71ef6))
* handle new entry flavor file upload in upload control ([8404c91](https://github.com/kaltura/kmc-ng/commit/8404c91))
* KMCNG-705 set auto-complete minLength to 3 ([35d4e74](https://github.com/kaltura/kmc-ng/commit/35d4e74))
* KMCNG-763 fix tags component width ([80c83ab](https://github.com/kaltura/kmc-ng/commit/80c83ab))
* KMCNG-809 - add pager to the categoryEntry list action and set pageSize to 32 ([b36f774](https://github.com/kaltura/kmc-ng/commit/b36f774))
* KMCNG-843 - make sure the arrow is not cut in media queries ([eb3f4f5](https://github.com/kaltura/kmc-ng/commit/eb3f4f5))
* KMCNG-844 - remove sections vertical scroll bar ([35b1eca](https://github.com/kaltura/kmc-ng/commit/35b1eca))
* KMCNG-846 - close actions menu on page scroll ([8ac19a7](https://github.com/kaltura/kmc-ng/commit/8ac19a7))
* KMCNG-847 - display dropdown without the need for vertical scrollbar ([bbb2e5a](https://github.com/kaltura/kmc-ng/commit/bbb2e5a))
* KMCNG-849 - set flavor preview window height to auto ([4a91e39](https://github.com/kaltura/kmc-ng/commit/4a91e39))
* KMCNG-855 - verify sticky header auto adjust its height according to the title length (support multi-lines) ([a85370c](https://github.com/kaltura/kmc-ng/commit/a85370c))
* KMCNG-865 typo fix ([a59e858](https://github.com/kaltura/kmc-ng/commit/a59e858))
* KMCNG-866 set line breaks for access control profile description in bulk actions ([36a3e30](https://github.com/kaltura/kmc-ng/commit/36a3e30))
* KMCNG-877 fix calendar positioning ([dd878a8](https://github.com/kaltura/kmc-ng/commit/dd878a8))
* layout fixes for entry details (buttons) ([29b8729](https://github.com/kaltura/kmc-ng/commit/29b8729))
* layout fixes for entry details (padding, margin, data tables) ([3fdea43](https://github.com/kaltura/kmc-ng/commit/3fdea43))
* layout fixes for popups ([c10f9cc](https://github.com/kaltura/kmc-ng/commit/c10f9cc))
* login layout issues ([#247](https://github.com/kaltura/kmc-ng/issues/247)) ([70226a0](https://github.com/kaltura/kmc-ng/commit/70226a0))
* playlists list translations ([3740933](https://github.com/kaltura/kmc-ng/commit/3740933))
* prevent retry upload if there is no entryId ([98e73c0](https://github.com/kaltura/kmc-ng/commit/98e73c0))
* remove unused styles ([06a5b1a](https://github.com/kaltura/kmc-ng/commit/06a5b1a))
* removing caption from entry ([e6416ce](https://github.com/kaltura/kmc-ng/commit/e6416ce))
* review comments ([f6e772e](https://github.com/kaltura/kmc-ng/commit/f6e772e))
* show flavors upload in upload monitor ([2fde84d](https://github.com/kaltura/kmc-ng/commit/2fde84d))
* show view menu item for live entry ([33b5692](https://github.com/kaltura/kmc-ng/commit/33b5692))
* style fixes for icon ([1460842](https://github.com/kaltura/kmc-ng/commit/1460842))
* style fixes for layout and new font icon sizes ([cad2eb9](https://github.com/kaltura/kmc-ng/commit/cad2eb9))
* **content-entries:** ignore empty fields values  in metadata  for field type unlimited text ([#288](https://github.com/kaltura/kmc-ng/issues/288)) ([460e9c5](https://github.com/kaltura/kmc-ng/commit/460e9c5))
* **content-entries:** removing categories from multiple entries without any categories should show a message 'nothing to remove' instead of showing all categories ([cdaee35](https://github.com/kaltura/kmc-ng/commit/cdaee35))
* **content-entries:** scroll page to top when deleting flavors and thumbnails ([#287](https://github.com/kaltura/kmc-ng/issues/287)) ([7e84ddc](https://github.com/kaltura/kmc-ng/commit/7e84ddc))
* **content-entries:** Thumbnails - Slides are displayed as thumbnails with no option to upload new ones ([#273](https://github.com/kaltura/kmc-ng/issues/273)) ([96ea7e3](https://github.com/kaltura/kmc-ng/commit/96ea7e3))
* style fixes for user settings ([f8647db](https://github.com/kaltura/kmc-ng/commit/f8647db))
* **content-entry:** Enable preview of entry without mobile flavors ([#278](https://github.com/kaltura/kmc-ng/issues/278)) ([1b2fa41](https://github.com/kaltura/kmc-ng/commit/1b2fa41))
* trim freetext field to prevent sending empty search ([6f9789e](https://github.com/kaltura/kmc-ng/commit/6f9789e))
* **content-entry:** remove unnecessary capital letter in "File Type" column in related section ([270e7bc](https://github.com/kaltura/kmc-ng/commit/270e7bc))
* **content-entrןקד:** enable sort clips by "plays" and "duration" fields ([#277](https://github.com/kaltura/kmc-ng/issues/277)) ([1bd899d](https://github.com/kaltura/kmc-ng/commit/1bd899d))
* **content/entries:** allow user to save related file without file type ([#263](https://github.com/kaltura/kmc-ng/issues/263)) ([2d80ac5](https://github.com/kaltura/kmc-ng/commit/2d80ac5))
* **entry-sections:** style fixes for selected section ([6e2ac7b](https://github.com/kaltura/kmc-ng/commit/6e2ac7b))
* typo in the word Acoount - should be Account ([61848ba](https://github.com/kaltura/kmc-ng/commit/61848ba))
* **upload:** detect file type with case sensitive ([#295](https://github.com/kaltura/kmc-ng/issues/295)) ([0c1a6ba](https://github.com/kaltura/kmc-ng/commit/0c1a6ba))
* updated red color value for errors ([bb3cfa6](https://github.com/kaltura/kmc-ng/commit/bb3cfa6))
* verify subscription existance before unsubcscribing ([b46ce86](https://github.com/kaltura/kmc-ng/commit/b46ce86))
* **content/entries:** set focus on auto-complete when opening the category selector dialog ([#225](https://github.com/kaltura/kmc-ng/issues/225)) ([cfbb379](https://github.com/kaltura/kmc-ng/commit/cfbb379))

### Features

* **content/entries:** improve file uploads stability for content tab ([#266](https://github.com/kaltura/kmc-ng/issues/266)) ([a82aafd](https://github.com/kaltura/kmc-ng/commit/a82aafd))
* **upload:** add application upload monitor popup ([0eb7076](https://github.com/kaltura/kmc-ng/commit/0eb7076))
* **upload:** add bulk upload action with bulk uploads view ([cb3f2a6](https://github.com/kaltura/kmc-ng/commit/cb3f2a6))
* **shell:** block shell when performing save operations so the user will not be able to navigate to other view while application is busy ([4e977ca](https://github.com/kaltura/kmc-ng/commit/4e977ca))
* **content/categories:** update bulk operations ([#242](https://github.com/kaltura/kmc-ng/issues/242)) ([231da70](https://github.com/kaltura/kmc-ng/commit/231da70))
* **upload:** issue warning when leaving app during file upload ([4165504](https://github.com/kaltura/kmc-ng/commit/4165504))
* **upload:** support resume upload in upload control view
* **content/entries:** show tooltip over custom data fields in metadata sections  ([a448e6c](https://github.com/kaltura/kmc-ng/commit/a448e6c))
* **playlists:** manage manual playlists ([2f8f813](https://github.com/kaltura/kmc-ng/commit/2f8f813))
* **shell:** add prepare audio, video, and live entries ([#222](https://github.com/kaltura/kmc-ng/issues/222)) ([ee727d6](https://github.com/kaltura/kmc-ng/commit/ee727d6))


<a name="3.2.0"></a>
# [3.2.0](https://github.com/kaltura/kmc-ng/compare/v3.1.0...v3.2.0) (2017-11-01)


### Bug Fixes

* app failure during bootstrap due to missing Translate module in app module ([23c066a](https://github.com/kaltura/kmc-ng/commit/23c066a))
* deploy kmc-ng with optimization of production mode


### Features

* prevent getting cached translation file when upgrading to new version ([02d43b0](https://github.com/kaltura/kmc-ng/commit/02d43b0))



<a name="3.1.0"></a>
# [3.1.0](https://github.com/kaltura/kmc-ng/compare/v3.0.1...v3.1.0) (2017-10-30)


### Bug Fixes

* add missing tooltip for categories ([4d72635](https://github.com/kaltura/kmc-ng/commit/4d72635))
* add tooltip to category selector ([ee63f7c](https://github.com/kaltura/kmc-ng/commit/ee63f7c))
* caterories-tree style ([01761be](https://github.com/kaltura/kmc-ng/commit/01761be))
* change changelog popup layout ([d899ea1](https://github.com/kaltura/kmc-ng/commit/d899ea1))
* fix area blocker layout to be centered on screen in table viewes ([ae61eac](https://github.com/kaltura/kmc-ng/commit/ae61eac))
* fix jumpto logic to adjust to the new scroll system ([72d2abd](https://github.com/kaltura/kmc-ng/commit/72d2abd))
* KMCNG-389 reload player after save operation ([dbe9626](https://github.com/kaltura/kmc-ng/commit/dbe9626))
* KMCNG-660 flavors table layout fixes ([ea8ea3e](https://github.com/kaltura/kmc-ng/commit/ea8ea3e))
* KMCNG-801 add space before parenthesis ([515bab0](https://github.com/kaltura/kmc-ng/commit/515bab0))
* KMCNG-824 allow short names for owners ([24c5247](https://github.com/kaltura/kmc-ng/commit/24c5247))
* KMCNG-825 set autocomplete input field width so show the entire prompt text ([1b6d101](https://github.com/kaltura/kmc-ng/commit/1b6d101))
* KMCNG-825 set autocomplete input field width so show the entire prompt text (bulk actions) ([4a2a6cd](https://github.com/kaltura/kmc-ng/commit/4a2a6cd))
* KMCNG-825 typo fix ([58dc3b6](https://github.com/kaltura/kmc-ng/commit/58dc3b6))
* KMCNG-830 - fix download popup width ([2a2a8f7](https://github.com/kaltura/kmc-ng/commit/2a2a8f7))
* layout fixes for universal live ([f9f5120](https://github.com/kaltura/kmc-ng/commit/f9f5120))
* login screen layout fix for small resolutions ([3826366](https://github.com/kaltura/kmc-ng/commit/3826366))
* max 2 lines per entry/playlist/category name in table + tooltip ([c865485](https://github.com/kaltura/kmc-ng/commit/c865485))
* prevent crash during call prop on undefined ([a8bb174](https://github.com/kaltura/kmc-ng/commit/a8bb174))
* re-enable upload for entry flavor and captions using the new upload management ([8d24703](https://github.com/kaltura/kmc-ng/commit/8d24703))
* remove default type value, don't let save entry without file type ([26dc5bf](https://github.com/kaltura/kmc-ng/commit/26dc5bf))
* remove fake files used for testing of new layout ([150c174](https://github.com/kaltura/kmc-ng/commit/150c174))
* scroll page to top upon data table pagination ([7a41fb7](https://github.com/kaltura/kmc-ng/commit/7a41fb7))
* **content-entry:** set focus on the name field when entry metadata screen loads ([cee8f20](https://github.com/kaltura/kmc-ng/commit/cee8f20))
* set min height for tables ([281061a](https://github.com/kaltura/kmc-ng/commit/281061a))
* show specific error message on bulk delete error ([90a99fc](https://github.com/kaltura/kmc-ng/commit/90a99fc))
* update color for changelog mark (red -> green) ([a615248](https://github.com/kaltura/kmc-ng/commit/a615248))
* updated text input style ([bb7f596](https://github.com/kaltura/kmc-ng/commit/bb7f596))
* upload control sticky scroll layout ([2ad999e](https://github.com/kaltura/kmc-ng/commit/2ad999e))
* **content-entry:** invoke arrows recalculation in tags component after categories data is loaded ([27861cb](https://github.com/kaltura/kmc-ng/commit/27861cb))
* use new api provided by widgets infrastructure ([248896e](https://github.com/kaltura/kmc-ng/commit/248896e))
* **content-entry:** add "http://" to landing page URL if missing from URL prefix ([b5ebd97](https://github.com/kaltura/kmc-ng/commit/b5ebd97))
* user settings layout and z-indexing fixes ([9d53f74](https://github.com/kaltura/kmc-ng/commit/9d53f74))
* **content-entries:** disable "apply" button when no tags are selected for removal ([64ef2fe](https://github.com/kaltura/kmc-ng/commit/64ef2fe))
* **content-entries:** fix bulk remove tags and categories layout break when handling long names ([d512e66](https://github.com/kaltura/kmc-ng/commit/d512e66))
* **content-entries:** fix styling for scheduling bulk window title ([f5acc99](https://github.com/kaltura/kmc-ng/commit/f5acc99))
* **content-entries:** reverse order of bulk operations ([d3e1e27](https://github.com/kaltura/kmc-ng/commit/d3e1e27))
* **content-entries:** set default access control profile to be the first in the dropdown list in bulk access control settings ([c0c9ff8](https://github.com/kaltura/kmc-ng/commit/c0c9ff8))
* validate flavor file before upload, show error if file size exceed ([#220](https://github.com/kaltura/kmc-ng/issues/220)) ([3ac96b9](https://github.com/kaltura/kmc-ng/commit/3ac96b9))
* **content-entries:** typo fix in bulk access control panel ([83a4c0b](https://github.com/kaltura/kmc-ng/commit/83a4c0b))
* **content-entries:** updated bulk delete confirmation message to use entry names instead of entry IDs ([998f0b3](https://github.com/kaltura/kmc-ng/commit/998f0b3))
* **content-entry:** "View DRM Details" action is optional for flavors in status Error ([1553464](https://github.com/kaltura/kmc-ng/commit/1553464))
* **content-entry:** display N/A for DRM flavors with no start or end dates ([62ac4e8](https://github.com/kaltura/kmc-ng/commit/62ac4e8))
* **content-entry:** fix dropdown during scroll in related files and upload list ([6a3b57f](https://github.com/kaltura/kmc-ng/commit/6a3b57f))
* **login:** keep login button disabled during login process ([4763b58](https://github.com/kaltura/kmc-ng/commit/4763b58))
* **login:** updated placeholder text for user name and password fields ([8a87d6d](https://github.com/kaltura/kmc-ng/commit/8a87d6d))
* **shell:** submenu configuration fix ([dc53e10](https://github.com/kaltura/kmc-ng/commit/dc53e10))

### Features

* new scroll system & layout supporting dynamic sticky elements
* drill-down page layout redesign
* **upload:** upload from desktop: support parralel uploads
* **upload:** upload control view (list of active uploads and upload progress)
* **shell:** add change account per partner ([82f3201](https://github.com/kaltura/kmc-ng/commit/82f3201))
* add release notes popup ([5ad76ba](https://github.com/kaltura/kmc-ng/commit/5ad76ba))
* **shell:** support chunked upload file (remove 2Gb file size limitation) ([0c1e904](https://github.com/kaltura/kmc-ng/commit/0c1e904))
* issue a message when using Internet Explorer lower than 11 and prevent login ([3329b2e](https://github.com/kaltura/kmc-ng/commit/3329b2e))
* **upload:** add high speed upload link to upload menu ([ec6228c](https://github.com/kaltura/kmc-ng/commit/ec6228c))
* add scroll to top button ([cc2faf1](https://github.com/kaltura/kmc-ng/commit/cc2faf1))


### Technical Features

* add app events to allow communication between applications ([08cd89a](https://github.com/kaltura/kmc-ng/commit/08cd89a))
* add isIE11 public function to browser service and use it where needed to detect IE11 ([82429c6](https://github.com/kaltura/kmc-ng/commit/82429c6))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/kaltura/kmc-ng/compare/v3.0.0...v3.0.1) (2017-09-26)



<a name="3.0.0"></a>
# [3.0.0](https://github.com/kaltura/kmc-ng/compare/v2.3.1...v3.0.0) (2017-09-25)


### Bug Fixes

* entry related files - detect file type upon selection ([25b9289](https://github.com/kaltura/kmc-ng/commit/25b9289))
* **administration:** update screens accorind to new design ([49df64d](https://github.com/kaltura/kmc-ng/commit/49df64d))
* center login screen vertically in all resolutions ([5e19ed8](https://github.com/kaltura/kmc-ng/commit/5e19ed8))
* **content-entries:** created on header should come from localization instead of being hard-coded ([5885399](https://github.com/kaltura/kmc-ng/commit/5885399))
* **content-entries:** don't confirm chunk operation on bulk delete ([ebceb15](https://github.com/kaltura/kmc-ng/commit/ebceb15))
* **content-entries:** fix bulk dropdown position ([4fb75d0](https://github.com/kaltura/kmc-ng/commit/4fb75d0))
* **content-entries:** fix bulk menu misplaced position ([68e5835](https://github.com/kaltura/kmc-ng/commit/68e5835))
* **content-entries:** fix chunk size environment constant to be 50 ([0e30ad2](https://github.com/kaltura/kmc-ng/commit/0e30ad2))
* **content-entries:** hook delete icon to delete operation ([418f7fc](https://github.com/kaltura/kmc-ng/commit/418f7fc))
* **content-entries:** replace loading spinner with designed spinner ([4896d04](https://github.com/kaltura/kmc-ng/commit/4896d04))
* **content-entries:** rpopup-widget style ([8ea88d1](https://github.com/kaltura/kmc-ng/commit/8ea88d1))
* **content-entries:** rpopup-widget style ([ba85b50](https://github.com/kaltura/kmc-ng/commit/ba85b50))
* **content-entries:** set preferences window close button onside the window ([8361ff6](https://github.com/kaltura/kmc-ng/commit/8361ff6))
* **content-entry:** add caption UI alignment ([3811409](https://github.com/kaltura/kmc-ng/commit/3811409))
* **content-entry:** default sort by thumbnail dimensions ([48d0006](https://github.com/kaltura/kmc-ng/commit/48d0006))
* **content-entry:** disable preview & Embed link for entries with status other than "ready" ([bb913a1](https://github.com/kaltura/kmc-ng/commit/bb913a1))
* **content-entry:** fix calendar style ([75b5231](https://github.com/kaltura/kmc-ng/commit/75b5231))
* **content-entry:** fix calendar style ([c5f3577](https://github.com/kaltura/kmc-ng/commit/c5f3577))
* **content-entry:** fix file types for flavour upload (video and audio) ([386dc4b](https://github.com/kaltura/kmc-ng/commit/386dc4b))
* move search icon to theme repository ([6009faf](https://github.com/kaltura/kmc-ng/commit/6009faf))
* **content-entry:** fix landing page link when containing {entryId} ([d7ac748](https://github.com/kaltura/kmc-ng/commit/d7ac748))
* allow more space for caption file name on caption upload ([b8e823e](https://github.com/kaltura/kmc-ng/commit/b8e823e))
* beter condition for entry instance checking ([d0f06bd](https://github.com/kaltura/kmc-ng/commit/d0f06bd))
* entries table style fix ([4ffdc2f](https://github.com/kaltura/kmc-ng/commit/4ffdc2f))
* entry captions - allow selecting DFXP files ([0752a25](https://github.com/kaltura/kmc-ng/commit/0752a25))
* entry scheduling - allow calendar popup to overflow the entry details component so it won't get cut in low resolutions ([97cc99f](https://github.com/kaltura/kmc-ng/commit/97cc99f))
* entry scheduling - allow editing of date and time. Allow overflow of calendar popup ([3617484](https://github.com/kaltura/kmc-ng/commit/3617484))
* entry scheduling - clear dates marks the form as dirty ([17aa1db](https://github.com/kaltura/kmc-ng/commit/17aa1db))
* entry scheduling - set time zone syntax fix ([28ce05e](https://github.com/kaltura/kmc-ng/commit/28ce05e))
* fix change owner popup layout (height, margins) in entry details and bulk operation. Fix bug causing a crash when adding tooltip to the selected owner. ([4681097](https://github.com/kaltura/kmc-ng/commit/4681097))
* fix compilation issues due to merge ([8c62d15](https://github.com/kaltura/kmc-ng/commit/8c62d15))
* fix IE11 entry details screen width issue (panel exceeds screen width) ([a042ae1](https://github.com/kaltura/kmc-ng/commit/a042ae1))
* fixed logic in get entry operation ([abc6099](https://github.com/kaltura/kmc-ng/commit/abc6099))
* fixed styles for flavors table ([00f492f](https://github.com/kaltura/kmc-ng/commit/00f492f))
* fixed styles for flavors tags using a pipe ([a047320](https://github.com/kaltura/kmc-ng/commit/a047320))
* prevent double confirmation when navigating between entries with unsaved data ([bbf27ba](https://github.com/kaltura/kmc-ng/commit/bbf27ba))
* prevent ExpressionChangedAfterItHasBeenCheckedError error when initializing the edit panel ([c3681c5](https://github.com/kaltura/kmc-ng/commit/c3681c5))
* redirect to login when navigating to the root ([118e688](https://github.com/kaltura/kmc-ng/commit/118e688))
* resolve symlink version for workspace development ([52cb29c](https://github.com/kaltura/kmc-ng/commit/52cb29c))
* runtime issue when navigating to default route ([789989b](https://github.com/kaltura/kmc-ng/commit/789989b))
* typescript trnaspile errors during deployment to production ([f937423](https://github.com/kaltura/kmc-ng/commit/f937423))
* typo in label ([9424aa5](https://github.com/kaltura/kmc-ng/commit/9424aa5))
* update label for upload button ([94d2442](https://github.com/kaltura/kmc-ng/commit/94d2442))
* use new api provided by kaltura-ui for the form-manager module ([5be9d46](https://github.com/kaltura/kmc-ng/commit/5be9d46))
* verify leave entry details when data is not saved ([a0bd1b1](https://github.com/kaltura/kmc-ng/commit/a0bd1b1))
* **content-entry:** prevent VOD playback of live entries when video broadcast is offline (entry preview panel) ([8f6d08b](https://github.com/kaltura/kmc-ng/commit/8f6d08b))
* **content-entry:** set preview panel tooltips placement to the left ([f29c15d](https://github.com/kaltura/kmc-ng/commit/f29c15d))
* **content-entry:** set preview panel tooltips placement to the left ([ab38a16](https://github.com/kaltura/kmc-ng/commit/ab38a16))
* **content-entry:** set the default access control profile to be the first option in the drop-down list ([abe88a2](https://github.com/kaltura/kmc-ng/commit/abe88a2))
* **content-entry:** support line breaks in access control profile description ([c9300f7](https://github.com/kaltura/kmc-ng/commit/c9300f7))
* **content-playlists:** display an alert when trying to create a rule-based playlist instead of using the area blocker message ([6615ea6](https://github.com/kaltura/kmc-ng/commit/6615ea6))
* **settings-account-settings:** fix form styles ([466a222](https://github.com/kaltura/kmc-ng/commit/466a222))
* **shell:** move sherad configuration outside of environments/environment ([48556d9](https://github.com/kaltura/kmc-ng/commit/48556d9))


### Code Refactoring

* use angular-cli during the deployment process ([a31dd05](https://github.com/kaltura/kmc-ng/commit/a31dd05))


### Features

* **administration-roles:** add roles list, role edit/add/duplicate/delete. missing roles permission modification ([bcc79e5](https://github.com/kaltura/kmc-ng/commit/bcc79e5))
* **content:** entries bulk operations for delete, change owner, remove from category, download, access control ([c386c3d](https://github.com/kaltura/kmc-ng/commit/c386c3d))
* **content:** support categories list actions like reload, pagination and sorting ([2a32ca2](https://github.com/kaltura/kmc-ng/commit/2a32ca2))
* **content-categories:** add category details view (layout & basic functionality only) ([966d178](https://github.com/kaltura/kmc-ng/commit/966d178))
* **content-categories:** show categories list with basic implementation ([c220a6a](https://github.com/kaltura/kmc-ng/commit/c220a6a))
* **content-entries:** placeholders for missing bulk actions (add to new category, add to new playlist) ([ec8864a](https://github.com/kaltura/kmc-ng/commit/ec8864a))
* **content-playlists:** add new playlist wizard (currently support only manual playlist) ([9cdd1a1](https://github.com/kaltura/kmc-ng/commit/9cdd1a1))
* **content-playlists:** add section list navigation panel, show playlist details and loading notifications ([40496cb](https://github.com/kaltura/kmc-ng/commit/40496cb))
* **content-playlists:** bulk delete of playlists ([25a877a](https://github.com/kaltura/kmc-ng/commit/25a877a))
* add categories app (currently without content) and adjust the application routing accordingly ([fb40452](https://github.com/kaltura/kmc-ng/commit/fb40452))
* add growl support as part of the app services ([cf7d8b5](https://github.com/kaltura/kmc-ng/commit/cf7d8b5))
* add high speed upload link and fix upload window text labels ([0524232](https://github.com/kaltura/kmc-ng/commit/0524232))
* add login form, forgot password form, password expired and invalid login hash views ([0b1368b](https://github.com/kaltura/kmc-ng/commit/0b1368b))
* add npm script to easily checkout to the latest standalone commit ([0ca67e1](https://github.com/kaltura/kmc-ng/commit/0ca67e1))
* add studio (load in production build only) ([67a0597](https://github.com/kaltura/kmc-ng/commit/67a0597))
* add tool to extract dependency licenses ([0ca3649](https://github.com/kaltura/kmc-ng/commit/0ca3649))
* allow app minification by removing constraints on function names ([e7051e5](https://github.com/kaltura/kmc-ng/commit/e7051e5))
* notify the user that caption language is used when caption label is set to empty ([ca18dcc](https://github.com/kaltura/kmc-ng/commit/ca18dcc))
* playlist navigation between sections and warn when leaving before changes were saved ([eb37e66](https://github.com/kaltura/kmc-ng/commit/eb37e66))
* show upload menu when user clicks on the upload button in the application header ([57b4a79](https://github.com/kaltura/kmc-ng/commit/57b4a79))
* support auto-complete color and tooltip for manually added items ([31ebf26](https://github.com/kaltura/kmc-ng/commit/31ebf26))
* support confirmation multi lines message ([f060a6d](https://github.com/kaltura/kmc-ng/commit/f060a6d))
* **content/playlists:** add playlist metadata section supporting data loading and saving ([79290b5](https://github.com/kaltura/kmc-ng/commit/79290b5))
* support external media entries ([7c8e1ea](https://github.com/kaltura/kmc-ng/commit/7c8e1ea))
* support language file hash to bypass browser cache upon application upgrade ([3b102dd](https://github.com/kaltura/kmc-ng/commit/3b102dd))
* upgrade PrimeNG to v4.1.0 ([7ca9be2](https://github.com/kaltura/kmc-ng/commit/7ca9be2))


### Performance Improvements

* import kaltura-ngx-client object explicitly to bundle only elements being used ([#163](https://github.com/kaltura/kmc-ng/issues/163)) ([9597b5e](https://github.com/kaltura/kmc-ng/commit/9597b5e))
* upgrade PrimeNG version to 4.1.3 to gain datagrid performances enhancements ([a459304](https://github.com/kaltura/kmc-ng/commit/a459304))


### BREAKING CHANGES

* To support the angular-cli process we performed some adjustments:
- kaltura ng libraries were renamed from `@kaltura-ng2` to `@kaltura-ng`.
- kaltura ng libraries build process uses ngc instead of tsc.
- kaltura typescript client lib `types/all` imports were changed to import types explicitly.
- kaltura theme was moved from the repo outside to a separated theme repo. previously imported theme from `~kmcng-theme/scss/variables`. use `app-styles/_variables.scss`instead.
- the configuration data was merged into angular-cli environment infrastructure and is now accessible by importing `environment` from `app-environment`
- kmc-shell was moved into `app-shared`
- css class `kUseKMCngIcons` was replaced with `kOverrideFAIcons`



<a name="2.3.1"></a>
## [2.3.1](https://github.com/kaltura/KMCng/compare/v2.3.0...v2.3.1) (2017-06-13)

### Bug Fixes

* **content-entries / entries:** fix tree height to show all nodes upon scroll down


<a name="2.3.0"></a>
# [2.3.0](https://github.com/kaltura/KMCng/compare/v2.2.2...v2.3.0) (2017-06-13)


### Bug Fixes

* **content-entries:** fix entries view > refine filter popup > schedule filter.
* prevent creation of multiple tooltip instances

### Features

* **content-entries / entry:** new layout for entry details view>metadata section>categories selector popup. ([5d0b84d](https://github.com/kaltura/KMCng/commit/5d0b84d))
* update style of auto-complete to match the new provided style.


### Performance Improvements

* **content-entries:** improved change detection of changes in the refine filters ([557b851](https://github.com/kaltura/KMCng/commit/557b851))
* **content-entries:** instantiate refine component only when showing the popup and destroy it once closed. remove heavy change detection of multiple tree components ([55c9afd](https://github.com/kaltura/KMCng/commit/55c9afd))



<a name="2.2.2"></a>
## [2.2.2](https://github.com/kaltura/KMCng/compare/v2.2.1...v2.2.2) (2017-06-12)


### Bug Fixes

* **content-entries:** make sure changes in entries are shown when returning from entry details view ([1268ed9](https://github.com/kaltura/KMCng/commit/1268ed9))



<a name="2.2.1"></a>
## [2.2.1](https://github.com/kaltura/KMCng/compare/v2.2.0...v2.2.1) (2017-06-11)


### Bug Fixes

* **content-entries:** fix out-of-sync issue in the categories tree when selecting a parent of already selected node. ([bb1a9da](https://github.com/kaltura/KMCng/commit/bb1a9da))



<a name="2.2.0"></a>
# [2.2.0](https://github.com/kaltura/KMCng/compare/v2.1.0...v2.2.0) (2017-06-11)


### Bug Fixes

* **content-entries:** highlight metadata in sections list when it contains validation errors ([582f7e1](https://github.com/kaltura/KMCng/commit/582f7e1))
* **content-entries / entry:** disable page exit verification check when leaving entry details without saving ([e428d92](https://github.com/kaltura/KMCng/commit/e428d92))
* **content-entries:** restore active filters when returning from entry details (sort, pagination, selected categories and refine filters).
* **content-entries / entry**: Preview and Embed link (in Entry Details) is hidden for 'Media-Less' entries
* **content-entries / entry**: Remove popups when leaving the view they belong to ('jump to' floating in entry metadata)
* **content-entries / entry**: Allow user sorting of Thumbnail section table.
* **style**: various style issues


### Features

* upgrade Angular to version 4.x and any other library that depends on Angular (angular, prime, webpack, typescript) ([c6980dd](https://github.com/kaltura/KMCng/commit/c6980dd))
* **content-entries:** show partial selection state in categories/refine filters ([6a33f94](https://github.com/kaltura/KMCng/commit/6a33f94))
* **content-entries / entries:** show file sizes in various measurements (bytes, KB, MB, GB, TB, PB) in thumbnail and related sections ([226db93](https://github.com/kaltura/KMCng/commit/226db93))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/kaltura/KMCng/compare/v2.0.1...v2.1.0) (2017-05-28)


### Bug Fixes

* **content-entries:** change filters names in additional filters that are not listed as in the same order as in legacy KMC ([b7857dc](https://github.com/kaltura/KMCng/commit/b7857dc))
* **content-entries / entry:** style fixes for floaters ([9cce3f0](https://github.com/kaltura/KMCng/commit/9cce3f0))
* **content-entries / entry:** Universal live - set the section global validation status when validating bitrate changes ([7f9025e](https://github.com/kaltura/KMCng/commit/7f9025e))
* **content-entries / entry:** Universal live - set the section global validation status when validating bitrate changes ([71fe181](https://github.com/kaltura/KMCng/commit/71fe181))
* **content-entries:** fix creation filter tooltip in additional filters ("From" instead of "After", "Until" instead of "Before") ([971c50d](https://github.com/kaltura/KMCng/commit/971c50d))
* **content-entries:** make sure scheduling filter allows setting custom scheduling along with other scheduling filter types ([7396e59](https://github.com/kaltura/KMCng/commit/7396e59))
* **content-entries / entry:** fix metadata section custom metadata forms style ([a4c5160](https://github.com/kaltura/KMCng/commit/a4c5160))


### Features

* **content-entries / entry:** add last update field display in the entry preview panel ([e12477e](https://github.com/kaltura/KMCng/commit/e12477e))
* **content-entries / entry:** notify user before leaving entry details without saving changed data ([eb5a5a2](https://github.com/kaltura/KMCng/commit/eb5a5a2))
* **content-entries / entry:** use category selector popup to select/unselect entry categories in  entry metadata section ([8fd4035](https://github.com/kaltura/KMCng/commit/8fd4035))
* **content-entries / entry:** show linked entries component in entry metadata schema and allow delete/reorder of entries ([52ebefc](https://github.com/kaltura/KMCng/commit/52ebefc))
* **shell:** enable and disable page leave verification + custom message (for supporting browsers) ([706bd18](https://github.com/kaltura/KMCng/commit/706bd18))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/kaltura/KMCng/compare/v2.0.0...v2.0.1) (2017-05-16)


### Bug Fixes

* prevent users section from failing during save when adding publisher to a new entry ([d23b2a1](https://github.com/kaltura/KMCng/commit/d23b2a1))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/kaltura/KMCng/compare/v0.1.0-rc.4...v2.0.0) (2017-05-16)

## Features
- **Entry Details -> Entry details panel**: Entries navigation, data saving, error handling and recovering 
- **Entry Details -> Entry preview panel**: Entry preview and basic details listing
- **Entry Details -> Metadata**: Entry metadata management (basic and custom scheme)
- **Entry Details -> Thumbnails**: Entry thumbnails management
- **Entry Details -> Access control**: Access control management
- **Entry Details -> Scheduling**: Scheduling setup
- **Entry Details -> Flavors**: Entry flavors management
- **Entry Details -> Captions**: Entry captions management
- **Entry Details -> Related files**: Entry related files management
- **Entry Details -> Live**: Manual and Universal live details and setup
- **Entry Details -> Clips**: Entry clips summary
- **Entry Details -> Users**: Entry users management

<a name="0.1.0-rc.4"></a>
# [0.1.0-rc.4](https://github.com/kaltura/KMCng/compare/v0.1.0-rc.3...v0.1.0-rc.4) (2017-02-27)

## Features
- **Entries list -> Entries Table**: Add tooltips to media type column.
- **Entries list -> Category Filters**: Search for categories with auto-complete. Support both default mode when nodes are loaded upon initialize and when lazy loading tree nodes.
- **Entries list -> Refine filters**: Correct start/end date filter times (start dates are adjusted to 00:00:00, end dates are adjusted to 23:59:59). 

## Bugs
- **Entries list -> Entries Table**: Fix some quirks with the bulk selection.
- **Entries list -> Entries Table**: Fix default sort order.

---

<a name="0.1.0-rc.3"></a>
# [0.1.0-rc.3](https://github.com/kaltura/KMCng/compare/v0.1.0-rc.2...v0.1.0-rc.3) (2017-02-20)

## Features
- **General**: Update libraries version

---

<a name="0.1.0-rc.2"></a>
# [0.1.0-rc.2](https://github.com/kaltura/KMCng/compare/v0.1.0-rc.1...v0.1.0-rc.2) (2017-02-09)

### Features

- **Entries list -> Entries Table**: Implement entry status logic.

- **General -> logout**: The logout process was implemented with basic support. It will be handled as part of future delivry. At the moment, logout from the application will clear cache and reload the application.

- **DevOp**: Upgrade dev dependencies:
  - Upgrade webpack to 2.x and all its' loaders accordingly.
  - Upgrade typescript to 2.2.x.
  - Remove typings usage.
  - Add @Types dependencies.
 
- **DevOp**: Optimize build process and deployed package: 
  - Reduce javascript bundle sized.
  - Minify javascript code.
  - Lazy loading support for views.
  - Angular2 component template & styles support.
  - Theme bundling and assets re-organization.
  - Enable Angular runtime production mode.
  - Enable [angular debug tools](https://github.com/angular/angular/blob/86405345b781a9dc2438c0fbe3e9409245647019/TOOLS_JS.md).  
  
 
- **DevOp**: Print application version in console during app load.



### Bug Fixes

- **Login**: fix broken 'download user manual' link.

---

<a name="0.1.0-rc.1"></a>
# 0.1.0-rc.1 (2017-02-01)

### Features

- **General -> KMCng theme**: Creation of KMCng theme based on the [style guide](https://projects.invisionapp.com/d/main#/projects/prototypes/9700090) provided by the UI/UX team.

- **Entries list -> Entries Table**: A list of all entries with support for sorting, pagination, filtering, custom number of rows per page.

- **Entries list -> Free text search**: Support free text entries search.

- **Entries list -> Category Filters**: Support filtering entries by Categories. Support lazy loading for large categories data sets and special visualization for large amount of categories.

- **Entries list -> Additional Filters**: Support additional filters.

- **Entries list -> Metadata Filters**: Support metadata filters.

- **Entries list -> Metadata Search**: Support free text search based on metadata profile values.

- **Entries list -> Filters management**: Filters can be managed from within filter drop-downs as well as from filter tags list.

- **Entries list -> Bulk Selection**: Multiple entries can be selected in the table exposing the Bulk operations menu and allowing bulk operation selection.

### Known Issues
**Entries -> Search categories**: This feature is currently under development and will be released shortly.

**KMCng Login process**: The login process presents basic abilities needed to access the entries list. It lacks graphic design and addtional screens (register, forgot password etc.). It contains the following:
- A basic login form.
- Fetching minimal information about the user/partner required for the entries list.
- Log-out process (basic support only)

**Upper Menu Icons**: The upper menu icons are partially active. The Help menu opens a dropdown placeholder (not functional). The user icon opens a dropdown allowing logout. All other options in this menu are just placeholders.

**Localization**: The current version contains a localization mechanism. Currently, only English is available. Selecting other languages doesn't apply.

**Entries Permissions**: The permissions mechanism is currently under design and is not part of this release.

**Entry Drill-down**: Entry drill-down is not part of this drop. Clicking an entry name or selecting an action from the entry actions menu doesn't invoke drill-down.

**Bulk Operations**: Bulk operations are supported in the entries list screen. However, the actual operations cannot be invoked in this version.
