import TWGLInit from "./TWGLInit"
import TWGLObjModel from "./TWGLObjModel"
import TWGLObjModelV2 from "./TWGLObjModelV2"
import WebGLCamera from "./WebGLCamera"
import WebGLCube from "./WebGLCube"
import WebGLInit from "./WebGLInit"

type Props = {
    type?: 'init' | 'cube' | 'camera' | 'twgl-init' | 'twgl-objmodel' | 'twgl-objmodel-v2'
}
export default function(props: Props) {
    switch(props.type) {
        case 'init': return <WebGLInit key="init" />
        case 'cube': return <WebGLCube key="cube" />
        case 'camera': return <WebGLCamera key="camera" />
        case 'twgl-init': return <TWGLInit key="twgl-init" />
        case 'twgl-objmodel': return <TWGLObjModel key="twgl-objmodel" />
        case 'twgl-objmodel-v2': return <TWGLObjModelV2 key="twgl-objmodel-v2" />
    }
    return <div>view</div>
}