import { TestScheduler } from 'rxjs/testing';
import { map } from 'rxjs/operators';
import { describe, expect, it, vi } from 'vitest';

it('rxjs TestScheduler', () => {
    const testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected);
    });

    testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('-a-b-c|', { a: 1, b: 2, c: 3 });
        const result$ = source$.pipe(map(x => x * 10));

        const expectedMarble = '-a-b-c|';
        const expectedValues = { a: 10, b: 20, c: 30 };

        expectObservable(result$).toBe(expectedMarble, expectedValues);
    });
});
