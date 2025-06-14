///////////////////////////////////////////////////////////////////////////////
// gles_phongColorTex.frag
// =======================
// Per-Pixel lighting shader (Bui-Tuong Phong lighting model) with vertex color
//
// UNIFORMS:                    ATTRIBUTES:             VARYINGS:
// ============================================================================
// matrixNormal                 vertexPosition          positionVec
// matrixModelView              vertexNormal            normalVec
// matrixModelViewProjection    vertexColor             colorVec
// lightPosition                vertexTexCoord0         texCoord0
// lightColor
// lightAttenuation
// materialAmbient
// materialDiffuse
// materialSpecular
// materialShininess
// map0
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-11
// UPDATED: 2025-04-22
///////////////////////////////////////////////////////////////////////////////

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

// constants
const float ZERO = 0.0;
const float ONE  = 1.0;
const float TWO  = 2.0;

// uniforms
uniform vec4 lightColor;
uniform vec4 lightPosition;             // should be in the eye space
uniform vec3 lightAttenuation;          // attenuation coefficients (k0, k1, k2)
uniform vec4 materialAmbient;           // material ambient color
uniform vec4 materialDiffuse;           // material diffuse color
uniform vec4 materialSpecular;          // material specular color
uniform float materialShininess;        // material specular exponent
uniform sampler2D map0;                 // texture map #1

// varying variables
varying vec3 positionVec;               // vertex position in eye space
varying vec3 normalVec;                 // normal vector in eye space
varying vec4 colorVec;                  // vertex color
varying vec2 texCoord0;

void main(void)
{
    // re-normalize varying vars
    vec3 normal = normalize(normalVec);

    // compute light vector and attenuation
    vec3 light;
    float attenuation;
    // directional light
    if(lightPosition.w == ZERO)
    {
        light = normalize(lightPosition.xyz);
        attenuation = ONE;
    }
    // positional light
    else
    {
        // compute light vector in eye space
        light = lightPosition.xyz - positionVec;

        // compute attenuation: 1 / (k0 + k1*d + k2*d*d)
        vec3 attFact;
        attFact.x = ONE;                // 1
        attFact.z = dot(light, light);  // dist * dist
        attFact.y = sqrt(attFact.z);    // dist
        attenuation = ONE / dot(lightAttenuation, attFact);

        light = normalize(light);
    }

    // compute reflected ray vector: 2 * N * (N dot L) - L
    vec3 reflectVec = reflect(-light, normal);

    // compute view vector (from vertex to camera) in eye space
    vec3 view = normalize(-positionVec);

    // start with ambient
    vec4 color = materialAmbient * lightColor * colorVec;

    // add diffuse portion using Lambert cosine law
    float dotNL = max(dot(normal, light), ZERO);
    color += dotNL * materialDiffuse * lightColor * colorVec;

    // apply texture before specular
    color *= texture2D(map0, texCoord0);

    // add specular portion
    float dotVR = max(dot(view, reflectVec), ZERO);
    color += pow(dotVR, materialShininess) * materialSpecular * lightColor * colorVec;

    // set frag color
    gl_FragColor = color;
}
