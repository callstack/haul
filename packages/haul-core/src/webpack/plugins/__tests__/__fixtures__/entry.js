'use strict';

console.log('entry');

import('./async').then(m => m.default());
