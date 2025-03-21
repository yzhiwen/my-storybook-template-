import { useRef, useEffect } from "react"

export default function (props: any) {
    const ref = useRef<any>({})

    useEffect(() => {
        if (!ref.current.ele) {
            const ele = document.getElementById('grid-item-pre-overlay') ?? document.createElement('div')
            ele.style.position = "absolute"
            ele.style.border = '2px dashed blue'
            ele.style.borderRadius = '6px'
            document.body.append(ele)
            ref.current.ele = ele
        }

        if (props.style.x && props.style.y && props.style.width && props.style.height) {
            ref.current.ele.style.display = 'block'
            ref.current.ele.style.left = `${props.style.x}px`
            ref.current.ele.style.top = `${props.style.y}px`
            ref.current.ele.style.width = `${props.style.width}px`
            ref.current.ele.style.height = `${props.style.height}px`
        }

        return () => {
            ref.current.ele.style.display = 'none'
        }
    }, [props])

    return <div {...props}></div>
}