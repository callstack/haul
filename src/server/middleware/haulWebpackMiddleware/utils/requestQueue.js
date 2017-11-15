class RequestQueue {
  constructor() {
    this._queue = [];
  }

  // make getters modifying the ID

  addItem(item) {
    const id = this._queue.push(item);
    return id - 1; // return the index of pushed element
  }

  getItem() {
    return this._queue.pop();
  }

  getSpecific(ID) {
    const [itemRemoved] = this._queue.splice(ID, 1);
    return itemRemoved;
  }

  addSpecific(ID, item) {
    this._queue.splice(ID, 0, item);
  }
}

module.exports = RequestQueue;
