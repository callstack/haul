# Haul

Haul is a command line interface for developing React Native applications.

**Open:** Haul uses Webpack 2 to bundle your application code and Express.js to serve it to your devices. It is a drop-in replacement for `react-packager` built on open tools.

**Hackable:** Haul laverages existing Webpack ecosystem and can be configured just like any other Webpack project. Adding Hot Module Replacement is just a matter of few lines.

**Just works:** Built on top of battle tested open source projects, it makes sure you never hit annoying issues (like symlink support) again. 

**Simply beautiful:** Redesigned from the ground up with self-explanatory error messages to increase your productivity and minimize time spent on debugging issues

## Installing Haul

Install `haul-cli` on your machine:

```bash
npm install -g haul-cli
```

then, enter your React Native project and run the following:

```bash
haul init
```

This will automatically integrate Haul with your app by creating `webpack.haul.js` config in the root folder of your project. You can customise it later to add some features.

When it finishes, you can start the development server by running:

```bash
haul start --platform ios
```

## Using Haul

## Contributing to Haul

## Credits
