import TWGLInit from "./TWGLInit"
import TWGLObjModel from "./TWGLObjModel"
import WebGLCamera from "./WebGLCamera"
import WebGLCube from "./WebGLCube"
import WebGLInit from "./WebGLInit"

type Props = {
    type?: 'init' | 'cube' | 'camera' | 'twgl-init' | 'twgl-objmodel'
}
export default function(props: Props) {
    switch(props.type) {
        case 'init': return <WebGLInit key="init" />
        case 'cube': return <WebGLCube key="cube" />
        case 'camera': return <WebGLCamera key="camera" />
        case 'twgl-init': return <TWGLInit key="twgl-init" />
        case 'twgl-objmodel': return <TWGLObjModel key="twgl-objmodel" />
    }
    return <div>view</div>
}