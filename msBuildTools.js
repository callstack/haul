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

const requires = [
  'Microsoft.Component.MSBuild',
  'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
];

const vs16 = VSWhere(requires.join(' '), '16.0', 'installationPath', true);

console.log(vs16);
