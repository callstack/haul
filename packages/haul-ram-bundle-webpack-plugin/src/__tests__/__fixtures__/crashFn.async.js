import crashNested from './nestedCrashFn.esm';

export default function crash(nested) {
  if (nested) {
    crashNested();
  } else {
    throw new Error('test error');
  }
}
