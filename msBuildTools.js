const EOL = require('os').EOL;
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

function VSWhere(requires, version, property, verbose) {
  // This path is maintained and VS has promised to keep it valid.
  const vsWherePath = path.join(
    process.env['ProgramFiles(x86)'] || process.env.ProgramFiles,
    '/Microsoft Visual Studio/Installer/vswhere.exe'
  );

  if (verbose) {
    console.log('Looking for vswhere at: ' + vsWherePath);
  }

  // Check if vswhere is present and try to find MSBuild.
  if (fs.existsSync(vsWherePath)) {
    if (verbose) {
      console.log('Found vswhere.');
    }
    const propertyValue = child_process
      .execSync(
        `"${vsWherePath}" -version [${version},${Number(version) +
          1}) -products * -requires ${requires} -property ${property}`
      )
      .toString()
      .split(EOL)[0];
    return propertyValue;
  } else {
    if (verbose) {
      console.log("Couldn't find vswhere, querying registry.");
    }
    const query = `reg query HKLM\\SOFTWARE\\Microsoft\\MSBuild\\ToolsVersions\\${version} /s /v MSBuildToolsPath`;
    let toolsPath = null;
    // Try to get the MSBuild path using registry
    try {
      const output = child_process.execSync(query).toString();
      let toolsPathOutput = /MSBuildToolsPath\s+REG_SZ\s+(.*)/i.exec(output);
      if (toolsPathOutput) {
        let toolsPathOutputStr = toolsPathOutput[1];
        if (verbose) {
          console.log('Query found: ' + toolsPathOutputStr);
        }
        // Win10 on .NET Native uses x86 arch compiler, if using x64 Node, use x86 tools
        if (version === '16.0') {
          toolsPathOutputStr = path.resolve(toolsPathOutputStr, '..');
        }
        toolsPath = toolsPathOutputStr;
      }
    } catch (e) {
      toolsPath = null;
    }
    return toolsPath;
  }
}

function checkMSBuildVersion(version, buildArch, verbose) {
  let toolsPath = null;
  if (verbose) {
    console.log('Searching for MSBuild version ' + version);
  }

  // https://aka.ms/vs/workloads
  const requires = [
    'Microsoft.Component.MSBuild',
    'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
  ];

  const vsPath = VSWhere(
    requires.join(' '),
    version,
    'installationPath',
    verbose
  );

  if (verbose) {
    console.log('VS path: ' + vsPath);
  }

  const installationVersion = VSWhere(
    requires.join(' '),
    version,
    'installationVersion',
    verbose
  );

  if (verbose) {
    console.log('VS version: ' + installationVersion);
  }

  // VS 2019 changed path naming convention
  const vsVersion = version === '16.0' ? 'Current' : version;

  // look for the specified version of msbuild
  const msBuildPath = path.join(
    vsPath,
    'MSBuild',
    vsVersion,
    'Bin/MSBuild.exe'
  );

  if (verbose) {
    console.log('Looking for MSBuilt at: ' + msBuildPath);
  }

  toolsPath = fs.existsSync(msBuildPath) ? path.dirname(msBuildPath) : null;

  // We found something so return MSBuild Tools.
  if (toolsPath) {
    console.log(
      `Found MSBuild v${version} at ${toolsPath} (${installationVersion})`
    );
    // return new MSBuildTools(version, toolsPath, installationVersion);
  } else {
    return null;
  }
}

checkMSBuildVersion('16.0', 'x64', true);
