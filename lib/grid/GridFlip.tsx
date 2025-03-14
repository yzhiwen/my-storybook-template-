import gsap from "gsap";
import { Flip } from "gsap/all";
import { useEffect, useState } from "react"

gsap.registerPlugin(Flip);

// 测试gird-item位置获取
export default function () {
    const [flag, setFlag] = useState(false)

    useEffect(() => {
        const c = document.getElementById('grid-c')!
        const item3 = document.getElementById("grid-item-3")!
        for (let i = 0; i < c.children.length; i++) {
            const child = c.children[i]!;
            const rect = child.getBoundingClientRect()
            console.log(rect);
        }

        const state = Flip.getState(".grid-item");
        item3.style.display = item3.style.display === 'block' ? 'none' : 'block'
        Flip.from(state, {
            // duration: 0.3,
            // duration: 1,
            // scale: true,
            // absolute: true,
        })
    }, [flag])


    return <>
        <button onClick={() => {
            setFlag(!flag)
        }}>插入</button>
        <div id='grid-c' className="grid w-[200px] h-[200px] grid-cols-3 grid-rows-3 bg-amber-200">
            <div id="grid-item-3"  className="grid-item hidden">3</div>
            <div className="grid-item  grid row-span-2 col-span-2 bg-blue-200">1</div>
            <div className="grid-item row-start-3 col-start-3 bg-amber-500">2</div>
        </div>
    </>
}