import { EventEmitter } from 'events';

declare global {
  // eslint-disable-next-line no-var
  var __ordersEmitter__: EventEmitter | undefined;
}

export const ordersEmitter = global.__ordersEmitter__ || new EventEmitter();

if (!global.__ordersEmitter__) {
  global.__ordersEmitter__ = ordersEmitter;
}
