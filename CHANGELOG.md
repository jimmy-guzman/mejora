## [3.0.2](https://github.com/jimmy-guzman/mejora/compare/v3.0.1...v3.0.2) (2026-02-18)


### Performance Improvements

* ⚡️ some quick tiny performance wins ([#75](https://github.com/jimmy-guzman/mejora/issues/75)) ([54fc831](https://github.com/jimmy-guzman/mejora/commit/54fc8319685d9521bed6b06b27015bef285328dc))

## [3.0.1](https://github.com/jimmy-guzman/mejora/compare/v3.0.0...v3.0.1) (2026-02-17)


### Bug Fixes

* 🐛 should include files in eslint config ([#74](https://github.com/jimmy-guzman/mejora/issues/74)) ([c8c822d](https://github.com/jimmy-guzman/mejora/commit/c8c822d0131257269236bd16f52fb12d98cc8945))

# [3.0.0](https://github.com/jimmy-guzman/mejora/compare/v2.4.0...v3.0.0) (2026-02-17)


### Features

* ✨ replace object-based checks config w/ array & defineCheck() API ([#73](https://github.com/jimmy-guzman/mejora/issues/73)) ([bcdcb71](https://github.com/jimmy-guzman/mejora/commit/bcdcb718149151d0b0817a733b3a9e92e59ec8a1))


### BREAKING CHANGES

* checks is now an array of Check objects instead of a
`Record<string, CheckConfig>`. The check name/ID is now passed as `name`
directly to each check factory rather than being the object key.

- Introduce `defineCheck(`) for creating reusable custom check definitions
- Flatten `ESLintCheckConfig`: replace `overrides` wrapper with direct ESLint
  config fields (rules, languageOptions, etc.)
- Flatten `TypeScriptCheckConfig`: replace `overrides.compilerOptions` with
  top-level `compilerOptions`
- Remove `ESLintCheckRunner`, `TypeScriptCheckRunner`, and `RegexCheckRunner` class exports
- Remove `eslintCheck`/`regexCheck`/`typescriptCheck` aliases

# [2.4.0](https://github.com/jimmy-guzman/mejora/compare/v2.3.7...v2.4.0) (2026-02-13)


### Features

* ✨ auto register regex runner ([#72](https://github.com/jimmy-guzman/mejora/issues/72)) ([54a425f](https://github.com/jimmy-guzman/mejora/commit/54a425fdf36eadd4dc8c404ca2716b361a4e6847))

## [2.3.7](https://github.com/jimmy-guzman/mejora/compare/v2.3.6...v2.3.7) (2026-02-13)


### Performance Improvements

* ⚡️ drop `tinypool`, us native worker threads ([703b4df](https://github.com/jimmy-guzman/mejora/commit/703b4df69f38ab2a5ab2d3a96b13342d68bc2095))

## [2.3.6](https://github.com/jimmy-guzman/mejora/compare/v2.3.5...v2.3.6) (2026-02-12)


### Performance Improvements

* ⚡️ drop `is-in-ci` ([#71](https://github.com/jimmy-guzman/mejora/issues/71)) ([6f76b0c](https://github.com/jimmy-guzman/mejora/commit/6f76b0c869cf9d9f6ffbb79c3036be5642998153))

## [2.3.5](https://github.com/jimmy-guzman/mejora/compare/v2.3.4...v2.3.5) (2026-02-12)


### Performance Improvements

* ⚡️ use native `glob` ([#70](https://github.com/jimmy-guzman/mejora/issues/70)) ([0a6a7b9](https://github.com/jimmy-guzman/mejora/commit/0a6a7b9e81d55ccc7800a4074827c4a2c1071879))

## [2.3.4](https://github.com/jimmy-guzman/mejora/compare/v2.3.3...v2.3.4) (2026-01-19)


### Bug Fixes

* 🐛 handle circular references in cache key generation ([#68](https://github.com/jimmy-guzman/mejora/issues/68)) ([59a3115](https://github.com/jimmy-guzman/mejora/commit/59a311557577fc091deead807f5dd7f46c12c6ee))

## [2.3.3](https://github.com/jimmy-guzman/mejora/compare/v2.3.2...v2.3.3) (2026-01-08)


### Performance Improvements

* ⚡️ use workers for running checks ([#66](https://github.com/jimmy-guzman/mejora/issues/66)) ([de19da8](https://github.com/jimmy-guzman/mejora/commit/de19da8bb72d834e19804153cb7da9456953caa3))

## [2.3.2](https://github.com/jimmy-guzman/mejora/compare/v2.3.1...v2.3.2) (2026-01-06)


### Bug Fixes

* 🐛 no duplicate markdown reports headings ([#65](https://github.com/jimmy-guzman/mejora/issues/65)) ([82c491f](https://github.com/jimmy-guzman/mejora/commit/82c491f78a04360e5142178776411b73b60a70e8)), closes [#64](https://github.com/jimmy-guzman/mejora/issues/64)

## [2.3.1](https://github.com/jimmy-guzman/mejora/compare/v2.3.0...v2.3.1) (2026-01-06)


### Bug Fixes

* 🐛 stable heading anchors in markdown reports ([#63](https://github.com/jimmy-guzman/mejora/issues/63)) ([4bcaf9b](https://github.com/jimmy-guzman/mejora/commit/4bcaf9b1e4236a12f7e7864415983aa65d264822)), closes [#61](https://github.com/jimmy-guzman/mejora/issues/61)

# [2.3.0](https://github.com/jimmy-guzman/mejora/compare/v2.2.3...v2.3.0) (2026-01-06)


### Features

* ✨ add built in `regex` runner ([#62](https://github.com/jimmy-guzman/mejora/issues/62)) ([17901ff](https://github.com/jimmy-guzman/mejora/commit/17901ffa9c1f9e399432d42c5cd4299aa291dff1))

## [2.2.3](https://github.com/jimmy-guzman/mejora/compare/v2.2.2...v2.2.3) (2026-01-05)


### Bug Fixes

* 🐛 only run ESLint rules specified in overrides ([#59](https://github.com/jimmy-guzman/mejora/issues/59)) ([8000867](https://github.com/jimmy-guzman/mejora/commit/8000867d417cc3f6c8da6f77d5c11049f2db4f53))

## [2.2.2](https://github.com/jimmy-guzman/mejora/compare/v2.2.1...v2.2.2) (2026-01-05)


### Bug Fixes

* 🐛 normalize absolute paths in typescript diagnostics ([#58](https://github.com/jimmy-guzman/mejora/issues/58)) ([70c5aa4](https://github.com/jimmy-guzman/mejora/commit/70c5aa4f16f210b68a18be28fe4d96d72c086d81))

## [2.2.1](https://github.com/jimmy-guzman/mejora/compare/v2.2.0...v2.2.1) (2026-01-05)


### Bug Fixes

* 🐛 preserve runner context in lifecycle methods ([#57](https://github.com/jimmy-guzman/mejora/issues/57)) ([f5884f9](https://github.com/jimmy-guzman/mejora/commit/f5884f9dc9b93d6d1d5917c88845ac98cfc6844c))

# [2.2.0](https://github.com/jimmy-guzman/mejora/compare/v2.1.0...v2.2.0) (2026-01-05)


### Features

* ✨ add support for custom checks ([#56](https://github.com/jimmy-guzman/mejora/issues/56)) ([2215633](https://github.com/jimmy-guzman/mejora/commit/2215633402270213372eb5775a0df1e4e3c4a0ae))

# [2.1.0](https://github.com/jimmy-guzman/mejora/compare/v2.0.5...v2.1.0) (2026-01-04)


### Features

* ✨ allow `ESLint`'s `concurrency` to be configurable ([#54](https://github.com/jimmy-guzman/mejora/issues/54)) ([07b8625](https://github.com/jimmy-guzman/mejora/commit/07b8625a49fe168b009cc424f023a1be58d40aa5))

## [2.0.5](https://github.com/jimmy-guzman/mejora/compare/v2.0.4...v2.0.5) (2026-01-03)


### Bug Fixes

* 🐛 regen markdown report when it has merge conflicts ([#50](https://github.com/jimmy-guzman/mejora/issues/50)) ([e29e732](https://github.com/jimmy-guzman/mejora/commit/e29e7328225079474c8f7738aeacb9f652649d7b))

## [2.0.4](https://github.com/jimmy-guzman/mejora/compare/v2.0.3...v2.0.4) (2026-01-03)


### Bug Fixes

* 🐛 add missing forced/warning indicator ([#49](https://github.com/jimmy-guzman/mejora/issues/49)) ([3b7a276](https://github.com/jimmy-guzman/mejora/commit/3b7a27689019ee64cafa66213b9be9bc7ae6d834))

## [2.0.3](https://github.com/jimmy-guzman/mejora/compare/v2.0.2...v2.0.3) (2026-01-03)


### Bug Fixes

* 🐛 stable markdown report by preventing formatting ([#48](https://github.com/jimmy-guzman/mejora/issues/48)) ([c86c19d](https://github.com/jimmy-guzman/mejora/commit/c86c19dfe152095be404d94e84fdc4cf40a481ae))

## [2.0.2](https://github.com/jimmy-guzman/mejora/compare/v2.0.1...v2.0.2) (2026-01-03)


### Bug Fixes

* 🐛 prevent filesystem race conditions during checks ([#47](https://github.com/jimmy-guzman/mejora/issues/47)) ([ea25ce4](https://github.com/jimmy-guzman/mejora/commit/ea25ce4a525e34c337bc927a673c43dbc15ba4cc))

## [2.0.1](https://github.com/jimmy-guzman/mejora/compare/v2.0.0...v2.0.1) (2026-01-03)


### Performance Improvements

* ⚡️ run checks in parallel ([#46](https://github.com/jimmy-guzman/mejora/issues/46)) ([2de14ad](https://github.com/jimmy-guzman/mejora/commit/2de14ad71da69e9adf5b5c1522cf90e971beee10)), closes [#33](https://github.com/jimmy-guzman/mejora/issues/33)

# [2.0.0](https://github.com/jimmy-guzman/mejora/compare/v1.6.2...v2.0.0) (2026-01-02)


### Features

* ✨ use stable diagnostic identifiers to prevent baseline churn ([#44](https://github.com/jimmy-guzman/mejora/issues/44)) ([b4155cd](https://github.com/jimmy-guzman/mejora/commit/b4155cd110a30b3e9fd4310cce0962a5d8a9c758))


### BREAKING CHANGES

* 💥 `baseline.json` now stores structured diagnostic items instead of strings.

Diagnostics are identified using stable, deterministic identifiers that are resilient to
line shifts and refactors, while remaining unique for repeated issues. This prevents
baseline churn caused by formatting or code movement.

Existing baselines must be regenerated.

## [1.6.2](https://github.com/jimmy-guzman/mejora/compare/v1.6.1...v1.6.2) (2026-01-01)


### Bug Fixes

* 🐛 show actual counts in summary ([462fcb0](https://github.com/jimmy-guzman/mejora/commit/462fcb07e2c798157b974528e354ee9f9f737570))
* 🐛 use actual issue counts in json summary ([45e0ab4](https://github.com/jimmy-guzman/mejora/commit/45e0ab4d56babe46f659c164e6d8a4391f793e3a))


### Performance Improvements

* ⚡️ reduce iterations & allocations in json output ([2d4aee5](https://github.com/jimmy-guzman/mejora/commit/2d4aee5b2c9a128b99576ec3c19fe698c13618db))
* ⚡️ reduce iterations & allocations in text output ([ad175c8](https://github.com/jimmy-guzman/mejora/commit/ad175c8d4bd2e89a12b2105d593785459fa6a7e2))

## [1.6.1](https://github.com/jimmy-guzman/mejora/compare/v1.6.0...v1.6.1) (2026-01-01)


### Bug Fixes

* 🐛 unambiguous eslint cache location ([872e356](https://github.com/jimmy-guzman/mejora/commit/872e356c8fab5cd8c83f7e0f0a2eccac8292ed6d))


### Performance Improvements

* ⚡️ a tiny more performant cache key ([de7a211](https://github.com/jimmy-guzman/mejora/commit/de7a211dd445eed460c21592a6fa0c279ef60528))

# [1.6.0](https://github.com/jimmy-guzman/mejora/compare/v1.5.6...v1.6.0) (2026-01-01)


### Features

* ✨ use TypeScript incremental caching ([#34](https://github.com/jimmy-guzman/mejora/issues/34)) ([30be71e](https://github.com/jimmy-guzman/mejora/commit/30be71ef090a065bd891d50439ed1776ea32a8c7))

## [1.5.6](https://github.com/jimmy-guzman/mejora/compare/v1.5.5...v1.5.6) (2025-12-31)


### Bug Fixes

* 🐛 prevent multiple spinners on CI ([#40](https://github.com/jimmy-guzman/mejora/issues/40)) ([1fea852](https://github.com/jimmy-guzman/mejora/commit/1fea852caa714731700c54545d1a96d6776af80d)), closes [#32](https://github.com/jimmy-guzman/mejora/issues/32)

## [1.5.5](https://github.com/jimmy-guzman/mejora/compare/v1.5.4...v1.5.5) (2025-12-31)


### Bug Fixes

* 🐛 make jsdoc consistent with usage ([#39](https://github.com/jimmy-guzman/mejora/issues/39)) ([2ef19fd](https://github.com/jimmy-guzman/mejora/commit/2ef19fdb0cebf428a4a9f75d4b28077bd69e075a))

## [1.5.4](https://github.com/jimmy-guzman/mejora/compare/v1.5.3...v1.5.4) (2025-12-31)


### Bug Fixes

* 🐛 md reports should not have line numbers in hrefs ([#37](https://github.com/jimmy-guzman/mejora/issues/37)) ([21b0878](https://github.com/jimmy-guzman/mejora/commit/21b08788036a050508158f96677bcdab068e17ee)), closes [#21](https://github.com/jimmy-guzman/mejora/issues/21)

## [1.5.3](https://github.com/jimmy-guzman/mejora/compare/v1.5.2...v1.5.3) (2025-12-31)


### Bug Fixes

* 🐛 prevent extra line break at end of md report ([#38](https://github.com/jimmy-guzman/mejora/issues/38)) ([9f9c77d](https://github.com/jimmy-guzman/mejora/commit/9f9c77d2aeb450bbf3d63486eafd8da850cc3a8d)), closes [#35](https://github.com/jimmy-guzman/mejora/issues/35)

## [1.5.2](https://github.com/jimmy-guzman/mejora/compare/v1.5.1...v1.5.2) (2025-12-30)


### Bug Fixes

* 🐛 more robust windows parse in md report ([24debb2](https://github.com/jimmy-guzman/mejora/commit/24debb27e0261b2b219218c892614b0a3f66c864))
* 🐛 should escape square brackets in markdown ([b8f0d2c](https://github.com/jimmy-guzman/mejora/commit/b8f0d2ce681595fea812cda96ba1ec9f4ee5c6e2))
* 🐛 should not have multiple consecutive blank lines (md) ([6ce3fac](https://github.com/jimmy-guzman/mejora/commit/6ce3facafc441f1ac78fe213dc06ffd4aa5ab161))

## [1.5.1](https://github.com/jimmy-guzman/mejora/compare/v1.5.0...v1.5.1) (2025-12-30)


### Bug Fixes

* 🐛 escape what looks like inline html ([13e0052](https://github.com/jimmy-guzman/mejora/commit/13e0052a2e4ec2c5b4dcab5153cac26efab09708)), closes [#29](https://github.com/jimmy-guzman/mejora/issues/29)
* 🐛 heading should be surrounded by blank lines ([85b7d49](https://github.com/jimmy-guzman/mejora/commit/85b7d4938a329daefead934e8d330ea8b4cddb19)), closes [#27](https://github.com/jimmy-guzman/mejora/issues/27)
* 🐛 lists should be surrounded by blank lines ([fff4320](https://github.com/jimmy-guzman/mejora/commit/fff43202f574330baac3b3d64e2068521f0d5a1f)), closes [#28](https://github.com/jimmy-guzman/mejora/issues/28)

# [1.5.0](https://github.com/jimmy-guzman/mejora/compare/v1.4.3...v1.5.0) (2025-12-30)


### Features

* ✨ better markdown report w/ file grouping & counts ([#26](https://github.com/jimmy-guzman/mejora/issues/26)) ([fa98472](https://github.com/jimmy-guzman/mejora/commit/fa984720eb7930ce51efd52ad64dc0e02a2b21be))

## [1.4.3](https://github.com/jimmy-guzman/mejora/compare/v1.4.2...v1.4.3) (2025-12-30)


### Bug Fixes

* 🐛 bold issues in unchanged output for consistency ([3e13599](https://github.com/jimmy-guzman/mejora/commit/3e13599fa57ad2534eee2001ba8c3c8255a48c3b)), closes [#18](https://github.com/jimmy-guzman/mejora/issues/18)
* 🐛 drop "Summary" label for clearer output ([5040722](https://github.com/jimmy-guzman/mejora/commit/50407229103a71dbb92ad2b5e62e2a38d216dcd6)), closes [#21](https://github.com/jimmy-guzman/mejora/issues/21)
* 🐛 line break before duration/values ([9e6cf9d](https://github.com/jimmy-guzman/mejora/commit/9e6cf9d31d19c84d97ba9142113e10703a87c54d)), closes [#19](https://github.com/jimmy-guzman/mejora/issues/19)
* 🐛 undim duration values in output ([0515ebb](https://github.com/jimmy-guzman/mejora/commit/0515ebba3436f6fe65f20b579d8aefd3b9363434)), closes [#20](https://github.com/jimmy-guzman/mejora/issues/20)
* 🐛 use `✔` instead of `✓` for consistency ([c3ed1b3](https://github.com/jimmy-guzman/mejora/commit/c3ed1b371ecc07bb97cee7ed7dd0101b48d6bf2e)), closes [#22](https://github.com/jimmy-guzman/mejora/issues/22)

## [1.4.2](https://github.com/jimmy-guzman/mejora/compare/v1.4.1...v1.4.2) (2025-12-30)


### Bug Fixes

* 🐛 more human language in output ([#17](https://github.com/jimmy-guzman/mejora/issues/17)) ([0fbccde](https://github.com/jimmy-guzman/mejora/commit/0fbccdec70267bbab05ea84d5d9e2de77a1f649a))

## [1.4.1](https://github.com/jimmy-guzman/mejora/compare/v1.4.0...v1.4.1) (2025-12-30)


### Bug Fixes

* 🐛 just dim all duration to avoid misleading colors ([#16](https://github.com/jimmy-guzman/mejora/issues/16)) ([048a47f](https://github.com/jimmy-guzman/mejora/commit/048a47f8334d296b7ea374614b39f689b43ddf3f))

# [1.4.0](https://github.com/jimmy-guzman/mejora/compare/v1.3.1...v1.4.0) (2025-12-30)


### Features

* ✨ improve output w/ aligned compact summary ([#15](https://github.com/jimmy-guzman/mejora/issues/15)) ([52e4de1](https://github.com/jimmy-guzman/mejora/commit/52e4de13b2db7058c257923dbcff5666ff682770))

## [1.3.1](https://github.com/jimmy-guzman/mejora/compare/v1.3.0...v1.3.1) (2025-12-30)


### Bug Fixes

* 🐛 consistent output per scenario ([#13](https://github.com/jimmy-guzman/mejora/issues/13)) ([d7daa21](https://github.com/jimmy-guzman/mejora/commit/d7daa219ab3f1390d0b904efc16c25ba39dfce1d))

# [1.3.0](https://github.com/jimmy-guzman/mejora/compare/v1.2.0...v1.3.0) (2025-12-29)


### Features

* ✨ add detailed summary with check counts ([#9](https://github.com/jimmy-guzman/mejora/issues/9)) ([86eb389](https://github.com/jimmy-guzman/mejora/commit/86eb38948d32e2ac830558c68f75ef3f84532d1c)), closes [#6](https://github.com/jimmy-guzman/mejora/issues/6)

# [1.2.0](https://github.com/jimmy-guzman/mejora/compare/v1.1.0...v1.2.0) (2025-12-29)


### Features

* ✨ add shorter typescript and eslint aliases ([#10](https://github.com/jimmy-guzman/mejora/issues/10)) ([714dac7](https://github.com/jimmy-guzman/mejora/commit/714dac7f3481b990794f157b563aa306b13bfc96)), closes [#3](https://github.com/jimmy-guzman/mejora/issues/3)

# [1.1.0](https://github.com/jimmy-guzman/mejora/compare/v1.0.1...v1.1.0) (2025-12-29)


### Features

* ✨ add progress spinner during checks ([#8](https://github.com/jimmy-guzman/mejora/issues/8)) ([fa9e278](https://github.com/jimmy-guzman/mejora/commit/fa9e27880ecac81d9551b52a842f936b7365695f)), closes [#4](https://github.com/jimmy-guzman/mejora/issues/4)

## [1.0.1](https://github.com/jimmy-guzman/mejora/compare/v1.0.0...v1.0.1) (2025-12-29)


### Bug Fixes

* 🐛 filter out diagnostics from files outside workspace ([#7](https://github.com/jimmy-guzman/mejora/issues/7)) ([5c817d1](https://github.com/jimmy-guzman/mejora/commit/5c817d16ba93de235c472f62a584c4347175628b)), closes [#5](https://github.com/jimmy-guzman/mejora/issues/5)

# 1.0.0 (2025-12-29)


### Features

* ✨ initial release of `mejora` ([#1](https://github.com/jimmy-guzman/mejora/issues/1)) ([c0dc4ed](https://github.com/jimmy-guzman/mejora/commit/c0dc4ed0996afbfc983bbbfb4fcf5eea4e57990c))
