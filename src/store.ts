import type { Readable, Subscriber, Unsubscriber } from "svelte/store";

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

/** Extract a new Readable<U> from store that is updated when:
 * - store changes, using whenNull as the updated value if the store value is null
 * - extractor(store) changes, using mutator on the extracted store as the updated value
*/
export function extract<S, T, U>(
    store: Readable<S>,
    whenNull: U,
    extractor: (s: S) => Readable<T>,
    mutator: (t: T) => U): Readable<U> {
    return new class implements Readable<U> {
        private subscriptions = new Subscriptions<U>();

        subscribe(subscriber: Subscriber<U>) {
            let subscriptionsUnsubscribe = this.subscriptions.subscribe(subscriber, whenNull);

            let extractedUnsubscribe = () => { };

            let sourceUnsubscribe = store.subscribe(s => {
                extractedUnsubscribe();

                if (s == null) {
                    this.subscriptions.notify(whenNull)
                }
                else {
                    extractedUnsubscribe = extractor(s).subscribe(t => this.subscriptions.notify(mutator(t)));
                }
            });

            return () => {
                extractedUnsubscribe()
                sourceUnsubscribe();
                subscriptionsUnsubscribe();
            }
        }

    };
}