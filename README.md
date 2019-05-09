<p align="center">
  <img alt="Haul" src="https://cloud.githubusercontent.com/assets/1174278/24502391/25619f98-156b-11e7-994c-a8495b4735d5.png" width="512">
</p>

<p align="center">
  A command line tool for developing React Native apps
</p>

---

[![Build Status][build-badge]][build]
[![Version][version-badge]][package]
[![MIT License][license-badge]][license]


[![All Contributors][all-contributors-badge]](#contributors)
[![PRs Welcome][prs-welcome-badge]][prs-welcome]
[![Code of Conduct][coc-badge]][coc]

[![Chat][chat-badge]][chat]
[![tweet][tweet-badge]][tweet]

Haul is a drop-in replacement for `react-native` CLI built on open tools like Webpack. It can act as a development server or bundle your React Native app for production.

`@haul-bundler/cli` and other packages under `@haul-bundler` scope are a overhaul of `haul` package __and support only React Native 0.59.0 and above__. If you need to support older versions, please check [`master` branch](https://github.com/callstack/haul/tree/master).

## Features

- Replaces React Native packager to bundle your app
- Access to full webpack ecosystem, using additional loaders and plugins is simple
- Doesn't need watchman, symlinks work nicely
- Helpful and easy to understand error messages

## Getting started

Start by adding Haul as a dependency to your React Native project (use `react-native init MyProject` to create one if you don't have a project):

```bash
yarn add --dev @haul-bundler/cli @haul-bundler/preset-<x>.<y> # Use major version as x and minor as y for your version of React Native
# Example: yarn add --dev @haul-bundler/cli @haul-bundler/preset-0.59

# Traditionalist? No problem:
npm install --save-dev @haul-bundler/cli @haul-bundler/preset-<x>.<y>
```

To configure your project to use haul, run the following:

```bash
yarn haul init
# npm >= 5.2.0 :
npx haul init
# npm < 5.2.0 :
npm install -g npx
npx haul init
```

This will automatically add the configuration needed to make Haul work with your app, e.g. add `haul.config.js` to your project, which you can customize to add more functionality.

Next, you're ready to start the development server:

```bash
yarn haul start
# Or:
npx haul start
```

Finally, reload your app to update the bundle or run your app just like you normally would:

```bash
react-native run-ios
```

<p align="center">
  <img width="635" src="https://cloud.githubusercontent.com/assets/2464966/24395888/8957aba8-13a1-11e7-96a3-70d34d4b5069.png" />
</p>

## Documentation

Check out the docs to learn more about available commands and tips on customizing the webpack configuration.

1. [CLI Commands](docs/CLI%20Commands.md)
2. [Configuration](docs/Configuration.md)
3. [Recipes](docs/Recipes.md)

<!-- ### Hot Module Replacement

__Hot Module Replacement is an experimental feature and it's disabled by default.__

Please refer to the [Setup guide](./docs/HMR_Setup.md). -->

## Limitations

Haul uses a completely different architecture from React Native packager, which means there are some things which don't work quite the same.

* Delta Bundles (RN 0.52+) have minimal support
* Existing `react-native` commands
* No support for Hot Module Replacement

The following features are **unlikely to be supported** in the future:

- Haste module system: use something like [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver) instead
- Transpile files under `node_modules`: transpile your modules before publishing, or configure webpack not to ignore them

# Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars2.githubusercontent.com/u/2464966?v=4" width="100px;"/><br /><sub>Mike Grabowski</sub>](https://twitter.com/grabbou)<br />[💬](#question-grabbou "Answering Questions") [💻](https://github.com/grabbou/haul/commits?author=grabbou "Code") [🎨](#design-grabbou "Design") [📖](https://github.com/grabbou/haul/commits?author=grabbou "Documentation") [💡](#example-grabbou "Examples") [🤔](#ideas-grabbou "Ideas, Planning, & Feedback") [👀](#review-grabbou "Reviewed Pull Requests") | [<img src="https://avatars2.githubusercontent.com/u/1174278?v=4" width="100px;"/><br /><sub>Satyajit Sahoo</sub>](https://twitter.com/satya164)<br />[💬](#question-satya164 "Answering Questions") [💻](https://github.com/grabbou/haul/commits?author=satya164 "Code") [🎨](#design-satya164 "Design") [🤔](#ideas-satya164 "Ideas, Planning, & Feedback") [👀](#review-satya164 "Reviewed Pull Requests") | [<img src="https://avatars2.githubusercontent.com/u/17573635?v=4" width="100px;"/><br /><sub>Paweł Trysła</sub>](https://twitter.com/_zamotany)<br />[💬](#question-zamotany "Answering Questions") [🐛](https://github.com/grabbou/haul/issues?q=author%3Azamotany "Bug reports") [💻](https://github.com/grabbou/haul/commits?author=zamotany "Code") [📖](https://github.com/grabbou/haul/commits?author=zamotany "Documentation") [💡](#example-zamotany "Examples") [🤔](#ideas-zamotany "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/6444719?v=4" width="100px;"/><br /><sub>Krzysztof Borowy</sub>](https://twitter.com/Krizzu)<br />[💬](#question-Krizzu "Answering Questions") [🐛](https://github.com/grabbou/haul/issues?q=author%3AKrizzu "Bug reports") [💻](https://github.com/grabbou/haul/commits?author=Krizzu "Code") [🤔](#ideas-Krizzu "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/5106466?v=4" width="100px;"/><br /><sub>Michał Pierzchała</sub>](https://twitter.com/thymikee)<br />[💻](https://github.com/grabbou/haul/commits?author=thymikee "Code") [🤔](#ideas-thymikee "Ideas, Planning, & Feedback") [⚠️](https://github.com/grabbou/haul/commits?author=thymikee "Tests") |                                           [<img src="https://avatars0.githubusercontent.com/u/68273?v=4" width="100px;"/><br /><sub>Steve Kellock</sub>](https://github.com/skellock)<br />[💻](https://github.com/grabbou/haul/commits?author=skellock "Code")                                            |     [<img src="https://avatars2.githubusercontent.com/u/3254314?v=4" width="100px;"/><br /><sub>Mathieu Dutour</sub>](https://mathieu.dutour.me)<br />[💻](https://github.com/grabbou/haul/commits?author=mathieudutour "Code")      |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                                                                                                                         [<img src="https://avatars2.githubusercontent.com/u/49038?v=4" width="100px;"/><br /><sub>Orta</sub>](http://orta.io)<br />[📖](https://github.com/grabbou/haul/commits?author=orta "Documentation")                                                                                                                                                          |                                                     [<img src="https://avatars0.githubusercontent.com/u/5436545?v=4" width="100px;"/><br /><sub>Yann Pringault</sub>](https://github.com/Kerumen)<br />[💻](https://github.com/grabbou/haul/commits?author=Kerumen "Code") [📖](https://github.com/grabbou/haul/commits?author=Kerumen "Documentation")                                                      |                                                                                                             [<img src="https://avatars2.githubusercontent.com/u/16336501?v=4" width="100px;"/><br /><sub>Drapich Piotr</sub>](https://github.com/dratwas)<br />[💻](https://github.com/grabbou/haul/commits?author=dratwas "Code") [📖](https://github.com/grabbou/haul/commits?author=dratwas "Documentation")                                                                                                              |                                                        [<img src="https://avatars3.githubusercontent.com/u/387794?v=4" width="100px;"/><br /><sub>Júlio César</sub>](http://julioc.me)<br />[🐛](https://github.com/grabbou/haul/issues?q=author%3AJulioC "Bug reports") [💻](https://github.com/grabbou/haul/commits?author=JulioC "Code")                                                         |                                                                     [<img src="https://avatars0.githubusercontent.com/u/1216029?v=4" width="100px;"/><br /><sub>LiJung Chi</sub>](http://chilijung.me)<br />[💻](https://github.com/grabbou/haul/commits?author=chilijung "Code")                                                                      |                                                [<img src="https://avatars1.githubusercontent.com/u/6403450?v=4" width="100px;"/><br /><sub>spypsy</sub>](https://github.com/spypsy)<br />[💻](https://github.com/grabbou/haul/commits?author=spypsy "Code")                                                | [<img src="https://avatars1.githubusercontent.com/u/12488826?v=4" width="100px;"/><br /><sub>Juwan Wheatley</sub>](https://fiber-god.github.io/)<br />[📖](https://github.com/grabbou/haul/commits?author=fiber-god "Documentation") |
|                                                                                                                                              [<img src="https://avatars2.githubusercontent.com/u/3100817?v=4" width="100px;"/><br /><sub>Jeremi Stadler</sub>](http://jeremi.se)<br />[📖](https://github.com/grabbou/haul/commits?author=jeremistadler "Documentation")                                                                                                                                              |                                                                                             [<img src="https://avatars2.githubusercontent.com/u/1242537?v=4" width="100px;"/><br /><sub>David Sheldrick</sub>](https://github.com/ds300)<br />[💻](https://github.com/grabbou/haul/commits?author=ds300 "Code")                                                                                              |                                                                                                         [<img src="https://avatars3.githubusercontent.com/u/5677929?v=4" width="100px;"/><br /><sub>Miguel Oller</sub>](https://twitter.com/ollermi)<br />[🐛](https://github.com/grabbou/haul/issues?q=author%3Amigueloller "Bug reports") [💻](https://github.com/grabbou/haul/commits?author=migueloller "Code")                                                                                                          |                                                                               [<img src="https://avatars3.githubusercontent.com/u/12470911?v=4" width="100px;"/><br /><sub>Krzysztof Karol</sub>](https://github.com/KrzysztofKarol)<br />[💻](https://github.com/grabbou/haul/commits?author=KrzysztofKarol "Code")                                                                                |                                                                [<img src="https://avatars1.githubusercontent.com/u/7150839?v=4" width="100px;"/><br /><sub>Jakub Stasiak</sub>](https://github.com/jakubsta)<br />[💻](https://github.com/grabbou/haul/commits?author=jakubsta "Code")                                                                 |    [<img src="https://avatars2.githubusercontent.com/u/774577?v=4" width="100px;"/><br /><sub>Ferran Negre</sub>](http://twitter.com/ferrannp)<br />[🐛](https://github.com/grabbou/haul/issues?q=author%3Aferrannp "Bug reports") [💻](https://github.com/grabbou/haul/commits?author=ferrannp "Code")    |     [<img src="https://avatars2.githubusercontent.com/u/26751770?v=4" width="100px;"/><br /><sub>CL123123</sub>](https://github.com/CL123123)<br />[📖](https://github.com/grabbou/haul/commits?author=CL123123 "Documentation")     |
|                                                                                                                                                [<img src="https://avatars0.githubusercontent.com/u/1819798?v=4" width="100px;"/><br /><sub>Marty Penner</sub>](http://penner.me)<br />[📖](https://github.com/grabbou/haul/commits?author=martypenner "Documentation")                                                                                                                                                |                                                                                           [<img src="https://avatars0.githubusercontent.com/u/108938?v=4" width="100px;"/><br /><sub>Jim Cummins</sub>](https://jimthedev.com)<br />[📖](https://github.com/grabbou/haul/commits?author=jimthedev "Documentation")                                                                                           |                                                                                                                                                 [<img src="https://avatars0.githubusercontent.com/u/997157?v=4" width="100px;"/><br /><sub>Gant Laborde</sub>](https://github.com/GantMan)<br />[📖](https://github.com/grabbou/haul/commits?author=GantMan "Documentation")                                                                                                                                                 |                                                                                    [<img src="https://avatars0.githubusercontent.com/u/1809192?v=4" width="100px;"/><br /><sub>Paweł Burniak</sub>](https://github.com/mitcom)<br />[📖](https://github.com/grabbou/haul/commits?author=mitcom "Documentation")                                                                                     |                                                                  [<img src="https://avatars0.githubusercontent.com/u/25077318?v=4" width="100px;"/><br /><sub>bsnelder</sub>](https://github.com/bsnelder)<br />[💻](https://github.com/grabbou/haul/commits?author=bsnelder "Code")                                                                   |                                                    [<img src="https://avatars2.githubusercontent.com/u/4400726?v=4" width="100px;"/><br /><sub>aivæn</sub>](https://ivan.moe/)<br />[💻](https://github.com/grabbou/haul/commits?author=SEAPUNK "Code")                                                    |          [<img src="https://avatars2.githubusercontent.com/u/9661806?v=4" width="100px;"/><br /><sub>Nemanja Stojanovic</sub>](https://nem035.com)<br />[💻](https://github.com/grabbou/haul/commits?author=nem035 "Code")           |
|                                                                                                                                      [<img src="https://avatars3.githubusercontent.com/u/2010912?v=4" width="100px;"/><br /><sub>bogdanbolchis</sub>](https://github.com/bogdanbolchis)<br />[📖](https://github.com/grabbou/haul/commits?author=bogdanbolchis "Documentation")                                                                                                                                       |                                                         [<img src="https://avatars1.githubusercontent.com/u/3767?v=4" width="100px;"/><br /><sub>Joe Arasin</sub>](http://joe.arasin.com)<br />[🐛](https://github.com/grabbou/haul/issues?q=author%3Ajoearasin "Bug reports") [💻](https://github.com/grabbou/haul/commits?author=joearasin "Code")                                                         |                                                                                                                                            [<img src="https://avatars2.githubusercontent.com/u/3070389?v=4" width="100px;"/><br /><sub>Norbert de Langen</sub>](https://github.com/ndelangen)<br />[📖](https://github.com/grabbou/haul/commits?author=ndelangen "Documentation")                                                                                                                                            |                                                                                      [<img src="https://avatars3.githubusercontent.com/u/6381792?v=4" width="100px;"/><br /><sub>Gustav Wengel</sub>](http://gustavwengel.dk)<br />[📖](https://github.com/grabbou/haul/commits?author=GeeWee "Documentation")                                                                                      |                        [<img src="https://avatars2.githubusercontent.com/u/1930227?v=4" width="100px;"/><br /><sub>Eric Wooley</sub>](http://ericwooley.github.io)<br />[🐛](https://github.com/grabbou/haul/issues?q=author%3Aericwooley "Bug reports") [💻](https://github.com/grabbou/haul/commits?author=ericwooley "Code")                        | [<img src="https://avatars2.githubusercontent.com/u/6714912?v=4" width="100px;"/><br /><sub>Matt Cubitt</sub>](https://github.com/mattcubitt)<br />[🐛](https://github.com/grabbou/haul/issues?q=author%3Amattcubitt "Bug reports") [💻](https://github.com/grabbou/haul/commits?author=mattcubitt "Code") |              [<img src="https://avatars3.githubusercontent.com/u/8135252?v=4" width="100px;"/><br /><sub>Jakub Beneš</sub>](https://jukben.cz)<br />[💻](https://github.com/grabbou/haul/commits?author=jukben "Code")               |
|                                                                                                                                                [<img src="https://avatars2.githubusercontent.com/u/397824?v=4" width="100px;"/><br /><sub>Tasveer Singh</sub>](http://twitter.com/tazsingh)<br />[💻](https://github.com/grabbou/haul/commits?author=tazsingh "Code")                                                                                                                                                 |                                                                         [<img src="https://avatars3.githubusercontent.com/u/10349378?v=4" width="100px;"/><br /><sub>Luke Czyszczonik</sub>](https://github.com/czystyl)<br />[💻](https://github.com/grabbou/haul/commits?author=czystyl "Code") [💡](#example-czystyl "Examples")                                                                          |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!

<!-- badges -->
[build-badge]: https://img.shields.io/circleci/project/github/callstack/haul/master.svg?style=flat-square
[build]: https://circleci.com/gh/callstack/haul
[version-badge]: https://img.shields.io/npm/v/@haul-bundler/cli.svg?style=flat-square
[package]: https://www.npmjs.com/package/@haul-bundler/cli
[license-badge]: https://img.shields.io/npm/l/@haul-bundler/cli.svg?style=flat-square
[license]: https://github.com/callstack/haul/blob/master/LICENSE
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/callstack/haul/blob/master/CODE_OF_CONDUCT.md
[all-contributors-badge]: https://img.shields.io/badge/all_contributors-34-orange.svg?style=flat-square
[chat-badge]: https://img.shields.io/discord/426714625279524876.svg?style=flat-square&colorB=758ED3
[chat]: https://discord.gg/zwR2Cdh
[tweet-badge]: https://img.shields.io/badge/tweet-%23haul-blue.svg?style=flat-square&colorB=1DA1F2&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAUCAYAAACXtf2DAAAAAXNSR0IArs4c6QAAAaRJREFUOBGtlM8rBGEYx3cWtRHJRaKcuMtBSitxkCQ3LtzkP9iUUu5ODspRHLhRLtq0FxeicEBC2cOivcge%2FMgan3fNM8bbzL4zm6c%2BPT%2Fe7%2FO8887svrFYBWbbtgWzsAt3sAcpqJFxxF1QV8oJFqFPFst5dLWQAT87oTgPB7DtziFRT1EA4yZolsFkhwjGYFRO8Op0KD8HVe7unoB6PRTBZG8IctAmG1xrHcfkQ2B55sfI%2ByGMXSBqV71xZ8CWdxBxN6ThFuECDEAL%2Bc9HIzDYumVZ966GZnX0SzCZvEqTbkaGywkyFE6hKAsBPhFQ18uPUqh2ggJ%2BUor%2F4M%2F%2FzOC8g6YzR1i%2F8g4vvSI%2ByD7FFNjexQrjHd8%2BnjABI3AU4Wl16TuF1qANGll81jsi5qu%2Bw6XIsCn4ijhU5FmCJpkV6BGNw410hfSf6JKBQ%2FUFxHGYBnWnmOwDwYQ%2BwzdHqO75HtiAMJfaC7ph32FSRJCENUhDHsLaJkL%2FX4wMF4%2BwA5bgAcrZE4sr0Cu9Jq9fxyrvBHWbNkMD5CEHWTjjT2m6r5D92jfmbbKJEWuMMAAAAABJRU5ErkJggg%3D%3D
[tweet]: https://twitter.com/intent/tweet?text=Check%20out%20Haul!%20https://github.com/callstack/haul%20%F0%9F%91%8D
