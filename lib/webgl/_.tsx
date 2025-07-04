import TWGLCyliner from "./TWGLCyliner"
import TWGLLine from "./TWGLLine"
import TWGLObjModelV2 from "./TWGLObjModelV2"
import TWGLPlane from "./TWGLPlane"
import TWGLPoint from "./TWGLPoint"
import TWGLTwoCamera from "./TWGLTwoCamera"
import WebGLInit from "./WebGLInit"

type Props = {
    type?:
        'init' |
        'twgl-objmodel' |
        'twgl-plane' |
        'twgl-point' | 
        'twgl-line' |
        'twgl-cyliner' |
        'twgl-tow-camera'
}
export default function (props: Props) {
    switch (props.type) {
        case 'init': return <WebGLInit key="init" />
        case 'twgl-objmodel': return <TWGLObjModelV2 key="twgl-objmodel" />
        case 'twgl-plane': return <TWGLPlane key="twgl-plane" />
        case 'twgl-point': return <TWGLPoint key="twgl-point" />
        case 'twgl-line': return <TWGLLine key="twgl-line" />
        case 'twgl-cyliner': return <TWGLCyliner key="twgl-cyliner" />
        case 'twgl-tow-camera': return <TWGLTwoCamera key="twgl-tow-camera" />
    }
    return <div>view</div>
}