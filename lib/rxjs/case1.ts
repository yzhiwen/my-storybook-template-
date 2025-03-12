// @ts-nocheck
import { from, merge, Observable, partition } from 'rxjs';
import { bufferCount, mergeMap, map, tap } from 'rxjs/operators';
import { tag } from 'rxjs-spy/operators';

console.log("tag", tag)

// 模拟缓存和批量请求函数
const cache = new Map<number, string>();
cache.set(1, 'value 1')
const checkCache = (id: number): string | undefined => cache.get(id);
const batchFetch = (ids: number[]) => {
    console.log(">>>batchFetch", ids)
    function sleep(time) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, time)
        })
    }
    // return new Observable((sub) => {
    //     sleep(3333).then(() => {
    //         return fetch("http://127.0.0.1:8080/README.md")
    //     }).then(() => {
    //         const results = ids.map(id => ({ id, data: `Data for ${id}` }));
    //         sub.next(results)
    //     })
    // })
    function fetchNet() {
        return new Promise((resolve) => {
            setTimeout(() => {
                fetch("http://127.0.0.1:8080/README.md")
                    .then(() => {
                        const results = ids.map(id => ({ id, data: `Data for ${id}` }));
                        resolve([results]) 
                    })
            }, 1000)
        })
    }
    return from(fetchNet())
    // 模拟批量请求，返回结果数组（假设顺序与 ids 一致）
    const results = ids.map(id => ({ id, data: `Data for ${id}` }));
    return from([results]);
};

// 生成十万个 ID 的数组
const ids = Array.from({ length: 100000 }, (_, i) => i);

// 创建 ID 流
const source$ = from(ids);

// 将流分为缓存命中（hit$）和未命中（miss$）
const [hit$, miss$] = partition(source$, (id) => checkCache(id) !== undefined);

// 处理命中：直接返回缓存数据
const cacheHits$ = hit$.pipe(
    map((id) => ({ id, data: checkCache(id) as string })),
    tag("hit cache"),
);

// 处理未命中：累积 5000 个后批量请求
const cacheMisses$ = miss$.pipe(
    bufferCount(5000), // 累积 5000 个 ID
    tag("bufferCount"),
    mergeMap((batchIds) => {
        return batchFetch(batchIds).pipe(
            // 批量请求后更新缓存
            // tap((res) => console.log("on tap", res)),
            tap((results) => {
                results.forEach(({ id, data }) => cache.set(id, data))
            }),
            tag("batchIds"),
            // 展平结果数组为单独的对象
            mergeMap((results) => results),
            tag("mergeMap"),
        )
    }, 2),
    tag("mergeMap 2"),
);

// 合并结果流
const result$ = merge(cacheHits$, cacheMisses$);

// 订阅输出
setTimeout(() => {
    result$.subscribe({
        next: ({ id, data }) => {
            // console.log(`Processed ID ${id}: ${data}`)
        },
        complete: () => console.log('All IDs processed')
    });
}, 2000)