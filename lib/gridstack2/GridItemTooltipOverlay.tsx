import { useFloating, shift, flip, autoUpdate } from "@floating-ui/react";
import { useContext, useEffect, useRef, useState } from "react";
import { GridStackPayloadContext } from "./GridStackContext";

type Props = {

}

export default function (props: Props) {
    const { clickId } = useContext(GridStackPayloadContext)
    const floatRef = useRef<HTMLDivElement>(null as any)
    const [isOpen, setIsOpen] = useState(false);
    const { refs, floatingStyles } = useFloating({
        placement: 'top-end',
        open: isOpen,
        // onOpenChange: setIsOpen,
        strategy: 'fixed',
        middleware: [shift({ padding: 0, crossAxis: true, }), flip()],
        // elements: {
        // reference: clickEle,
        // floating: floatRef.current,
        // },
        whileElementsMounted: (reference, floating, update) => {
            return autoUpdate(reference, floating, update, { animationFrame: false, })
        }
    })

    useEffect(() => {
        const ele = clickId ? document.getElementById(clickId) : null
        refs.setReference(ele)
        setIsOpen(ele !== null)
    }, [clickId])

    return <div
        ref={refs.setFloating}
        style={{ ...floatingStyles, display: isOpen ? 'block' : 'none' }}
    >
        tooltip
        {/* <div className="flex flex-row gap-1">
            <div>按钮1</div>
            <div>按钮1</div>
            <div>按钮1</div>
            <div>按钮1</div>
        </div> */}
    </div>
}