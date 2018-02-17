/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 * 
 * @flow
 */

module.exports = class TaskQueue {
  queue: any[];
  nextId: number;

  constructor() {
    this.queue = [];
    this.nextId = 0;
  }

  add(item: any) {
    const id = this.nextId++;
    this.queue.push({ id, item });
    return id;
  }

  pop(id: number) {
    const index = this.queue.findIndex(task => task.id === id);
    const { item } = this.queue[index];
    this.queue.splice(index, 1);
    return item;
  }
};
