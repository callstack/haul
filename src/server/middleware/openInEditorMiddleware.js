/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 *
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
import type { $Request, $Response, Middleware } from 'express';
import type { ReactNativeStackFrame } from '../../types';

// A configuration object fed into `open-in-editor`.
type OpenInEditorConfig = {
  editor?: ?string,
  cmd?: ?string,
  pattern?: ?string,
};

const basename = require('path').basename;
const openInEditor = require('open-in-editor');
const editors = Object.keys(require('open-in-editor/lib/editors'));
const messages = require('../../messages');
const logger = require('../../logger');

// does `open-in-editor` know how to detect this editor?
const isKnownEditor = (editor: string): boolean =>
  editors.includes(basename(editor));

/**
 * Detect the editor type to use. We use just the basename in case the user
 * has passed a full path. Just the name work here though. Examples:
 *
 *   - sublime
 *   - atom
 *   - /usr/local/bin/atom
 *
 */
function detectEditorType(): ?string {
  if (process.env.REACT_EDITOR) {
    const editor = basename(process.env.REACT_EDITOR);
    if (isKnownEditor(editor)) {
      return editor;
    }
  }

  return null;
}

/**
 * If provided, this will be the editor command that we shell out to. You only
 * need to use this if you've got a specific script or symlink you're trying
 * to target.
 */
function detectEditorCmd(): ?string {
  // the specific haul command gets precident
  if (process.env.REACT_EDITOR_CMD) {
    return process.env.REACT_EDITOR_CMD;
  }

  // use REACT_EDITOR unless it's a shortcut (like just the word 'atom')
  if (process.env.REACT_EDITOR && !isKnownEditor(process.env.REACT_EDITOR)) {
    return process.env.REACT_EDITOR;
  }

  return null;
}

/**
 * If provided, this allows people to control how the arguments are passed
 * to their editor.  For example: -r -g {filename}:{line}:{column}
 */
function detectEditorPattern(): ?string {
  return process.env.REACT_EDITOR_PATTERN || null;
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

// create the middleware
function create(): Middleware {
  // create an editor we'll use to open editor.
  const opener = openInEditor.configure(editorConfig);

  /**
   * The Express middleware for opening in the editor.
   */
  function openInEditorMiddleware(req: $Request, res: $Response, next) {
    // only allow the appropriate path
    if (req.path !== '/open-stack-frame') {
      return next();
    }

    // prevent corner cases from blowing up
    if (typeof req.rawBody !== 'string') {
      return next();
    }

    // parse the inbound request as JSON
    const frame: ReactNativeStackFrame = JSON.parse(req.rawBody);

    // open it with the user's editor. the extra hasValidConfig check effectively
    // turns off `open-in-editor`'s auto detection, which i found didn't work.
    if (opener && hasValidConfig) {
      opener.open(`${frame.file}:${frame.lineNumber}:${frame.column}`).then(
        () => null, // no-op if we're successful
        () => logger.warn(messages.editorNotConfigured()) // problem opening?
      );
    } else {
      logger.warn(messages.editorNotConfigured());
    }

    // reassure React Native that everything is fine
    res.end('OK');
    return null;
  }

  return openInEditorMiddleware;
}

module.exports = create;
