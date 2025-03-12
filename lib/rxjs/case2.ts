import { from, of, timer } from "rxjs";
import { bufferCount, concatMap, mergeMap, takeUntil, tap } from "rxjs/operators"


type Entity = {
    id: number
    type: string
    value: string
}

const ids = new Array(1000).fill(1).map((_, index) => index)

from(ids).pipe(
    bufferCount(200),
    mergeMap(ids => fetchDataByNet(ids), 2),
    concatMap(entites => entites),
).subscribe(value => {
    onEntity(value)
})

async function fetchDataByNet(ids: number[]): Promise<Entity[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const entities = ids.map(id => ({ id, type: 'net', value: 'mock' }))
            resolve(entities)
        }, 1000)
    })
}

function renderEntity(entity: any) {
    const start = performance.now()
    // mock work
    while(performance.now() - start < 1) {} 
    return performance.now() - start
}

let _active = false
let buffers: any[] = []
function onEntity(entity: any) {
    buffers.push(entity)

    if (!_active) {
        _active = true
        const onFrame = () => {
            let renderTime = 0
            let rendered = []
            while (true) {
                const entity = buffers.shift()
                if (!entity) break
                const time = renderEntity(entity)
                rendered.push(entity)
                renderTime += time;
                if (renderTime > 10) break;
            }
            console.log(">>> onFrame 处理了", renderTime, rendered)
            if (buffers.length > 0) {
                requestAnimationFrame(onFrame)
            } else {
                _active = false
            }
        }
        requestAnimationFrame(onFrame)
    }
}

