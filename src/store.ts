import type { Subscriber, Unsubscriber } from "svelte/store";

export class Subscriptions<T> {
    private subscribers: Set<Subscriber<T>> = new Set();

    subscribe(subscriber: Subscriber<T>, value: T): Unsubscriber {
        this.subscribers.add(subscriber);
        subscriber(value);
        return () => this.subscribers.delete(subscriber);
    }

    notify(value: T) {
        this.subscribers.forEach(subscriber => subscriber(value));
    }
}
