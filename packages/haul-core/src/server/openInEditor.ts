import path from 'path';
// @ts-ignore
import { configure } from 'open-in-editor';
import Runtime from '../runtime/Runtime';
const editors = Object.keys(require('open-in-editor/lib/editors'));

/**
 * --- OVERVIEW ---
 *
 * React Native apps show a stack trace when an error occurs. Each
 * frame can be tapped on by the user. When they do, React Native will
 * send a POST to /open-stack-frame passing along {file, lineNumber}.
 *
 * Haul should then open the user's editor to the file and lineNumber.
 *
 * What makes this gloriously fragile is, people use different editors
 * on different platforms.
 *
 * We will rely on the NPM package `open-in-editor` to provide this
 * functionality. (read: scapegoat).
 */

// A configuration object fed into `open-in-editor`.
type OpenInEditorConfig = {
  editor?: string;
  cmd?: string;
  pattern?: string;
};

// does `open-in-editor` know how to detect this editor?
const isKnownEditor = (editor: string): boolean =>
  editors.includes(path.basename(editor));

/**
 * Detect the editor type to use. We use just the basename in case the user
 * has passed a full path. Just the name work here though. Examples:
 *
 *   - sublime
 *   - atom
 *   - /usr/local/bin/atom
 *
 */
function detectEditorType(): string | undefined {
  if (process.env.REACT_EDITOR) {
    const editor = path.basename(process.env.REACT_EDITOR);
    if (isKnownEditor(editor)) {
      return editor;
    }
  }

  return undefined;
}

/**
 * If provided, this will be the editor command that we shell out to. You only
 * need to use this if you've got a specific script or symlink you're trying
 * to target.
 */
function detectEditorCmd(): string | undefined {
  // the specific haul command gets precedent
  if (process.env.REACT_EDITOR_CMD) {
    return process.env.REACT_EDITOR_CMD;
  }

  // use REACT_EDITOR unless it's a shortcut (like just the word 'atom')
  if (process.env.REACT_EDITOR && !isKnownEditor(process.env.REACT_EDITOR)) {
    return process.env.REACT_EDITOR;
  }

  return undefined;
}

/**
 * If provided, this allows people to control how the arguments are passed
 * to their editor.  For example: -r -g {filename}:{line}:{column}
 */
function detectEditorPattern(): string | undefined {
  return process.env.REACT_EDITOR_PATTERN || undefined;
}

// configure the editor open library
const editorConfig: OpenInEditorConfig = {};
editorConfig.editor = detectEditorType();
editorConfig.cmd = detectEditorCmd();

// null is a valid pattern, so we need to only add it if we mean it
const pattern = detectEditorPattern();
if (pattern) {
  editorConfig.pattern = pattern;
}

const hasValidConfig = editorConfig.editor || editorConfig.cmd;

// create an editor we'll use to open editor.
const opener = configure(editorConfig);

export default async function openInEditor(runtime: Runtime, url: string) {
  // open it with the user's editor. the extra hasValidConfig check effectively
  // turns off `open-in-editor`'s auto detection, which i found didn't work.
  if (opener && hasValidConfig) {
    try {
      await opener.open(url);
    } catch (error) {
      printErrorMessage(runtime); // problem opening?
    }
  } else {
    printErrorMessage(runtime);
  }
}

function printErrorMessage(runtime: Runtime) {
  const boldify = (text: string) =>
    runtime.logger.enhanceWithModifier('bold', text);
  const greyify = (text: string) =>
    runtime.logger.enhanceWithColor('gray', text);

  runtime.logger.error(
    'Unable to open in editor. You can set environment variables to open your editor.'
  );
  runtime.logger.info(
    [
      ' --- Easiest (auto-detect) ---',
      '',
      `${boldify('export REACT_EDITOR=code')}`,
      `${greyify('or')}`,
      `${boldify('export REACT_EDITOR=/path/to/atom')}`,
      '',
      `${greyify(
        '(sublime, atom, code, webstorm, phpstorm, idea14ce, vim, emacs, visualstudio)'
      )}`,
      `${greyify('via https://github.com/lahmatiy/open-in-editor')}`,
    ].join('\n')
  );
  runtime.logger.info(
    [
      ' --- Harder (you have a custom script or symlink) ---',
      '',
      `${boldify('export REACT_EDITOR=vim')}`,
      `${boldify('export REACT_EDITOR_CMD=/usr/local/bin/nvim')}`,
      `${boldify('export REACT_EDITOR=/path/to/atom')}`,
      '',
      `${greyify(
        'You can use this if you have recognized editor, but in non-standard location.'
      )}`,
    ].join('\n')
  );
  runtime.logger.info(
    [
      ' --- Hardest (completely custom -- hold my beer) ---',
      '',
      `${boldify('export REACT_EDITOR_CMD=/path/to/a/crazy/editor')}`,
      `${boldify(
        'export REACT_EDITOR_PATTERN="-r -g {filename}:{line}:{column}"'
      )}`,
      '',
      `${greyify(
        'You can use this if your editor is unknown or you want to launch with different flags.'
      )}`,
    ].join('\n')
  );
}
