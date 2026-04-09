// Port of CircularBuffer<T> from FF12RNGHelper.Core

export class CircularBuffer<T> {
  private _buffer: T[];
  private _nextFree: number;
  private readonly _length: number;

  constructor(length: number) {
    this._length = length;
    this._buffer = new Array<T>(length);
    this._nextFree = 0;
  }

  add(value: T): void {
    this._buffer[this._nextFree] = value;
    this._nextFree = (this._nextFree + 1) % this._buffer.length;
  }

  get(index: number): T {
    return this._buffer[this.adjustIndex(index)];
  }

  set(index: number, value: T): void {
    this._buffer[this.adjustIndex(index)] = value;
  }

  deepClone(): CircularBuffer<T> {
    const copy = new CircularBuffer<T>(this._length);
    copy._buffer = this._buffer.slice();
    copy._nextFree = this._nextFree;
    return copy;
  }

  private adjustIndex(index: number): number {
    let tempIndex = index % this._buffer.length;
    // JS % is signed — match C# unsigned behaviour
    if (tempIndex < 0) {
      tempIndex = this._buffer.length + tempIndex;
    }
    return tempIndex;
  }
}
