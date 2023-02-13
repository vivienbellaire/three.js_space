import './sources/css/reset.css'
import './sources/css/style.css'
import './sources/css/font.css'
import * as THREE from 'three'

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
// import { Fog } from 'three';
// import { pingpong } from 'three/src/math/MathUtils';
// import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

let camera, controls, scene, renderer

const worldWidth = 250, worldDepth = 250;
const clock = new THREE.Clock()

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

/**
 * Loaders
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
// textureLoader
const textureLoader = new THREE.TextureLoader()

// groundDirtColorTexture
const groundDirtColorTexture = textureLoader.load('textures/floor/ground_dirt/ground_dirt_baseColor.jpg')
groundDirtColorTexture.wrapS = THREE.RepeatWrapping
groundDirtColorTexture.wrapT = THREE.RepeatWrapping
groundDirtColorTexture.repeat.x = 470
groundDirtColorTexture.repeat.y = 470
// groundDirtNormTexture
const groundDirtNormTexture = textureLoader.load('textures/floor/ground_dirt/ground_dirt_normal.jpg')
groundDirtNormTexture.wrapS = THREE.RepeatWrapping
groundDirtNormTexture.wrapT = THREE.RepeatWrapping
groundDirtNormTexture.repeat.x = 470
groundDirtNormTexture.repeat.y = 470
// groundDirtOccTexture
const groundDirtOccTexture = textureLoader.load('textures/floor/ground_dirt/ground_dirt_ambientOcclusion.jpg')
groundDirtOccTexture.wrapS = THREE.RepeatWrapping
groundDirtOccTexture.wrapT = THREE.RepeatWrapping
groundDirtOccTexture.repeat.x = 470
groundDirtOccTexture.repeat.y = 470
// groundDirtRoughTexture
const groundDirtRoughTexture = textureLoader.load('textures/floor/ground_dirt/ground_dirt_roughness.jpg')
groundDirtRoughTexture.wrapS = THREE.RepeatWrapping
groundDirtRoughTexture.wrapT = THREE.RepeatWrapping
groundDirtRoughTexture.repeat.x = 470
groundDirtRoughTexture.repeat.y = 470
// groundDirtColorTexture.rotation = - Math.PI * 0.5

// moonTexture
const moonTexture = textureLoader.load('textures/2k_moon.jpg')
// moonTexture.wrapS = THREE.RepeatWrapping
// moonTexture.wrapT = THREE.RepeatWrapping
// moonTexture.repeat.x = 470
// moonTexture.repeat.y = 470
// groundDirtColorTexture.rotation = - Math.PI * 0.5


/**
 * Sizes
 */
const sizes = {}
sizes.width = window.innerWidth
sizes.height = window.innerHeight

/**
 * 0bjects
 */
const objects = []

let raycaster

let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false
let canJump = false

let headBobActive = false
let headBobTimer = 0

let prevTime = performance.now()
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()

/**
 * Scene
 */
scene = new THREE.Scene()
scene.background = new THREE.Color( 0xFF3366 )
scene.fog = new THREE.FogExp2( 0x4A4Aff, 0.000005)

/**
 * Particles
 */
// geometry
const count = 1000000
const positionArray = new Float32Array(count * 3)
const colorArray = new Float32Array(count * 3)

for(let i = 0; i < count; i++)
{
    // Position
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 2000  // x
    positionArray[i * 3 + 1] = (Math.random() - 0.5) * 2000  // y
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 2000   // z

    // Color
    colorArray[i * 3 + 0] = 1 // r
    colorArray[i * 3 + 1] = 1 // g
    colorArray[i * 3 + 2] = 1 // b
}
// console.log(positionArray)
const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))

// const particlesGeometry = new THREE.SphereGeometry(2, 2, 2, 4, 4, 4)
let groundColor = new THREE.Color( 0xCCCCFF)

/**
 * particlesTexture
 */
// particlesColorTexture
const particlesTexture = textureLoader.load('particles/1.png')

// Material
const particlesMaterial = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: true,
    color: new THREE.Color(groundColor),
    // map: particlesTexture,
    alphaMap: particlesTexture,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
})
// const particlesMaterial = new THREE.PointsMaterial()
// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

/**
 * axeHelper
 */
const axesHelper = new THREE.AxesHelper( 1000 )
scene.add( axesHelper )

/**
 * gridHelper
 */
// const size = 1000;
// const divisions = 100;
// const gridHelper = new THREE.GridHelper( size, divisions )
// scene.add( gridHelper )

/**
 * Camera
 */
camera = new THREE.PerspectiveCamera(40, sizes.width / sizes.height, 1, 30000)
camera.position.set( 0, 10, 180 );
// camera.lookAt( 0, 2, - 85 );
console.log(camera.position)
scene.add(camera)

/**
 * Resize
 */
window.addEventListener('resize', () =>
{
    // Update sizes object
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    fpControls.handleResize ()
    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(window.devicePixelRatio, 2)
})

/**
 * Input
 */
const onKeyDown = function ( event ) 
{
    switch ( event.code ) 
    {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;

        case 'Space':
            if ( canJump === true ) velocity.y += 350;
            canJump = false;
            break;
    }
}
const onKeyUp = function ( event ) 
{
    switch ( event.code ) 
{
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}
document.addEventListener( 'keydown', onKeyDown );
document.addEventListener( 'keyup', onKeyUp );

/**
 * Raycaster
 */
raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

/**
 * Renderer
 */
renderer = new THREE.WebGLRenderer({ antialias: true})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio( window.devicePixelRatio)
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(window.devicePixelRatio, 2)
document.body.appendChild(renderer.domElement)

/**
 * PointerLockControls
 */
controls = new PointerLockControls( camera, renderer.domElement );
scene.add( controls.getObject() );    

/**
 * FirsPersonControls
 */
let fpControls = new FirstPersonControls( camera, renderer.domElement );
fpControls.movementSpeed = 50
fpControls.lookSpeed = 0.6
// controls.lock() 
/**
 * Orbit Controls
 */
let obControls = new OrbitControls(camera, renderer.domElement)
obControls.zoomSpeed = 2
obControls.enableDamping = false


/**
 * Skybox
*/
let materialArray = [];
let skyBoxFront = textureLoader.load( 'skybox/space/back.png');
let skyBoxBack = textureLoader.load( 'skybox/space/front.png');
let skyBoxTop = textureLoader.load( 'skybox/space/top.png');
let skyBoxBottom = textureLoader.load( 'skybox/space/bottom.png');
let skyBoxRight = textureLoader.load( 'skybox/space/right.jpg');
skyBoxRight.wrapS = THREE.ClampToEdgeWrapping
skyBoxRight.wrapT = THREE.ClampToEdgeWrapping
let skyBoxLeft = textureLoader.load( 'skybox/space/left.png');

let color = new THREE.Color( 0x9999ff )

materialArray.push(new THREE.MeshBasicMaterial({ color: color, map: skyBoxFront }));
materialArray.push(new THREE.MeshBasicMaterial({ color: color, map: skyBoxBack }));
materialArray.push(new THREE.MeshBasicMaterial({ color: color, map: skyBoxTop }));
materialArray.push(new THREE.MeshBasicMaterial({ color: color, map: skyBoxBottom }));
materialArray.push(new THREE.MeshBasicMaterial({ color: color, map: skyBoxRight }));
materialArray.push(new THREE.MeshBasicMaterial({ color: color, map: skyBoxLeft }));

for (let i = 0; i < 6; i++)
materialArray[i].side = THREE.BackSide;

let skyboxGeo = new THREE.BoxGeometry( 20000, 20000, 20000);
let skybox = new THREE.Mesh( skyboxGeo, materialArray );
scene.add( skybox );

/**
 * Lunar
 */
const geometry = new THREE.SphereGeometry( 1000, 1000, 1000 );
const material = new THREE.MeshStandardMaterial( { color: 0xffffff, map: moonTexture } );
const lunar = new THREE.Mesh( geometry, material );
// lunar.rotation.
lunar.position.y = - 200
lunar.position.x = 5000
lunar.position.z = 8000
scene.add( lunar );

/**
 * Text
 */
const loader = new FontLoader();

loader.load( 'fonts/press_start2_regular.json', 
(font) => {
    const geometry = new TextGeometry( 'THREE.JS.JOURNEY.corp', {
        font: font,
        size: 40,
        height: 20,
        curveSegments: 1,
        bevelEnabled: false,
        // bevelThickness: 1,
        // bevelSize: 1,
        // bevelOffset: 1,
        // bevelSegments: 1
    })
    const material = new THREE.MeshBasicMaterial({color: 0xFFFFFF})
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = - 600
    mesh.position.y = - 6.5
    mesh.position.z = - 2000
    // mesh.rotation.y = - Math.PI * 0.5
    scene.add(mesh)
})

const rotator = new THREE.Group()
scene.add(rotator)
/**
 * Models
 */
// asteroid2
let asteroid2 = null
gltfLoader.load(
    'models/asteroid2.glb',
    (gltf) =>
    {
        console.log('success')
        console.log(gltf)
        // const model = gltf.scene
        asteroid2 = gltf.scene

        asteroid2.traverse((child) =>
        {
            if(child.isMesh)
                child.castShadow = true
        })

        asteroid2.scale.set(400, 400, 400)
        asteroid2.position.y = 0
        // asteroid2.rotation.y = - Math.PI * 0.5
        asteroid2.position.x = 0
        asteroid2.position.z = - 10000
        gltf.scene.add(asteroid2)
        scene.add(gltf.scene)
    }
)
// space_shuttle
let spaceshuttle = null
gltfLoader.load(
    'models/space_shuttle.glb',
    (gltf) =>
    {
        console.log('success')
        console.log(gltf)
        // const model = gltf.scene
        spaceshuttle = gltf.scene

        spaceshuttle.traverse((child) =>
        {
            if(child.isMesh)
                child.castShadow = true
        })

        spaceshuttle.scale.set(80, 80, 80)
        spaceshuttle.position.y = 0
        spaceshuttle.rotation.y = Math.PI * 0.2
        spaceshuttle.position.x = - 100
        spaceshuttle.position.z = 20
        gltf.scene.add(spaceshuttle)
        rotator.add(gltf.scene)
    }
)
// spaceship
let spaceship = null
gltfLoader.load(
    'models/spaceship.glb',
    (gltf) =>
    {
        console.log('success')
        console.log(gltf)
        // const model = gltf.scene
        spaceship = gltf.scene

        spaceship.traverse((child) =>
        {
            if(child.isMesh)
                child.castShadow = true
        })

        spaceship.scale.set(20, 20, 20)
        spaceship.position.y = 22
        spaceship.rotation.y = - Math.PI * 1.8
        spaceship.position.x = 100
        spaceship.position.z = - 170
        gltf.scene.add(spaceship)
        rotator.add(gltf.scene)
    }
)
// astronaut2
let astronaut2 = null
gltfLoader.load(
    'models/astronaut2.glb',
    (gltf) =>
    {
        console.log('success')
        console.log(gltf)
        // const model = gltf.scene
        astronaut2 = gltf.scene

        astronaut2.traverse((child) =>
        {
            if(child.isMesh)
                child.castShadow = true
        })

        astronaut2.scale.set(7, 7, 7)
        astronaut2.position.y = 0
        // astronaut2.rotation.y = - Math.PI * 1.8
        astronaut2.position.x = 0
        astronaut2.position.z = 0
        gltf.scene.add(astronaut2)
        scene.add(gltf.scene)
    }
)

// iss
let iss = null
gltfLoader.load(
    'models/iss.glb',
    (gltf) =>
    {
        console.log('success')
        console.log(gltf)
        // const model = gltf.scene
        iss = gltf.scene

        iss.traverse((child) =>
        {
            if(child.isMesh)
                child.castShadow = true
        })

        iss.scale.set(12, 12, 12)
        iss.position.y = 7.5
        iss.rotation.x = - Math.PI * 0.1
        iss.rotation.y = - Math.PI * 0.3
        iss.position.x = - 20
        iss.position.z = 1015
        gltf.scene.add(iss)
        scene.add(gltf.scene)
    }
)
// xenomorph2
let xenomorph2 = null
gltfLoader.load(
    'models/xenomorph.glb',
    (gltf) =>
    {
        console.log('success')
        console.log(gltf)
        // const model = gltf.scene
        xenomorph2 = gltf.scene

        xenomorph2.traverse((child) =>
        {
            if(child.isMesh)
                child.castShadow = true
        })

        xenomorph2.scale.set(7, 7, 7)
        xenomorph2.position.y = 7.8
        xenomorph2.rotation.y = - Math.PI * 0.2
        xenomorph2.position.x = - 50
        xenomorph2.position.z = 310
        gltf.scene.add(xenomorph2)
        rotator.add(gltf.scene)
    }
)
// spaceProbe
let spaceProbe = null
gltfLoader.load(
    'models/space_probe.glb',
    (gltf) =>
    {
        console.log('success')
        console.log(gltf)
        // const model = gltf.scene
        spaceProbe = gltf.scene

        spaceProbe.traverse((child) =>
        {
            if(child.isMesh)
                child.castShadow = true
        })

        spaceProbe.scale.set(0.5, 0.5, 0.5)
        spaceProbe.position.y = 7.8
        spaceProbe.rotation.y = Math.PI * 0.05
        spaceProbe.position.x = 50
        spaceProbe.position.z = 310
        gltf.scene.add(spaceProbe)
        rotator.add(gltf.scene)
    }
)

// tv
let tv = null
gltfLoader.load(
    'models/tv.glb',
    (gltf) =>
    {
        console.log('success')
        console.log(gltf)
        // const model = gltf.scene
        tv = gltf.scene

        tv.traverse((child) =>
        {
            if(child.isMesh)
                child.castShadow = true
        })

        tv.scale.set(7, 7, 7)
        tv.position.y = 7.8
        tv.rotation.y = Math.PI * 0.05
        tv.position.x = 50
        tv.position.z = 260
        gltf.scene.add(tv)
        rotator.add(gltf.scene)
    }
)

/**
 * Lights
 */
const ambiantLight = new THREE.AmbientLight( 0xAAAAFF, 1.6)
// const ambiantLight = new THREE.AmbientLight(0x111111, 0.2)
scene.add(ambiantLight)

let spotLight = new THREE.SpotLight(0xFFFFFF, 1800, 220, 0.35,1,2)

// spotLight.power = 1000

// scene.add( camera );
// camera.add( pointLight );

scene.add(spotLight)

let flashLightOn = true
function flashlight()
{
    spotLight.target.position.set( 0, 0, -1 );
    spotLight.position.copy(camera.position)    
}
window.addEventListener( 'mousemove', flashlight );
camera.add( spotLight.target );
// scene.add(spotLight.target)

// const spotLightHelper = new THREE.SpotLightHelper(spotLight)
// scene.add(spotLightHelper)

// let lightCeilling = new THREE.SpotLight(0xFFFFFF, 100, 120, 0.3,1,2)
// scene.add(lightCeilling)
// lightCeilling.position.y = 10
// // lightCeilling.rotation.y = - Math.PI * 0.164
// lightCeilling.position.x = 0.5
// lightCeilling.position.z = - 86.8

// spotLight.target.position.set( 0.5, 0, - 86.8 )

/**
 * Shadows
 */
spotLight.castShadow = true
// floor3.receiveShadow = true
// wall9.receiveShadow = true

/**
 * CameracameraSwitchControls
 */
 controls.isLocked === true
 controls.lock()
 fpControls.enabled = false
 obControls.enabled = false
 
 function cameraSwitchControls ()
 {
     if(obControls.enabled != false)
     {
         fpControls.enabled = true
         obControls.enabled = false
         controls.unlock()
         controls.isLocked = false
     }
     else
     {
         if(fpControls.enabled != false)
         {
             fpControls.enabled = false
             obControls.enabled = false
             controls.lock()
             controls.isLocked = true
         }
         else
         {
             if(controls.isLocked != false)
             {
                 fpControls.enabled = false
                 obControls.enabled = true
                 controls.unlock()
                 controls.isLocked = false
             }
             else
             {
                 if(controls.isLocked != true && fpControls.enabled != true && obControls.enabled != true)
                 {
                    fpControls.enabled = true
                 }
             }
         }
     }  
 }

let isRightPressed = false

function KeyDown ( event ) 
{
    if(event.code === 'KeyR')
    {
        isRightPressed = true

        event.preventDefault()
    } 
    if(event.code === 'KeyV')
    {
        isRightPressed = true
        cameraSwitchControls ()
        // event.preventDefault()
    }
    if(event.code === 'KeyG')
    {
        isRightPressed = true

        event.preventDefault()
    } 
    if(event.code === 'KeyT')
    {
        isRightPressed = true

        event.preventDefault()
    } 
    if(event.code === 'KeyC')
    {
        isRightPressed = true

        event.preventDefault()
    }
    if(event.code === 'KeyF')
    {
        isRightPressed = true
        // spotLight.intensity = 0
        // flashLightOn = false
        if(flashLightOn = true)
        {
            spotLight.intensity = 0
            flashLightOn = false
        }
        else(flashLightOn != true)
        {
            spotLight.intensity = 1800
            flashLightOn = true
        }
            
        event.preventDefault()
    } 
    if(event.code === 'Escape')
    {
        isRightPressed = true
        cameraSwitchControls ()
        event.preventDefault()
    }      
}

function KeyUp ( event ) 
{
    if(event.code === 'KeyR')
    {
        isRightPressed = false

        event.preventDefault()
    } 
    if(event.code === 'KeyV' )
    {
        isRightPressed = false
        
        event.preventDefault()
    }
    if(event.code === 'KeyG')
    {
        isRightPressed = false

        event.preventDefault()
    } 
    if(event.code === 'KeyT')
    {
        isRightPressed = false

        event.preventDefault()
    } 
    if(event.code === 'KeyC')
    {
        isRightPressed = false

        event.preventDefault()
    }        
    if(event.code === 'Escape')
    {
        isRightPressed = false

        event.preventDefault()
    } 
}
window.addEventListener( 'keydown', KeyDown );
window.addEventListener( 'keyup', KeyUp ); 

function animate() 
{
    const time = performance.now();

    if ( controls.isLocked === true ) {

        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;
        

        const intersections = raycaster.intersectObjects( objects, false );

        const onObject = intersections.length > 0;

        const delta = ( time - prevTime ) / 1000;
        

        velocity.x -= velocity.x * 22 * delta;
        velocity.z -= velocity.z * 22 * delta;
        velocity.y -= 9.8 * 400 * delta; // 100.0 = mass

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

        if ( onObject === true ) {

            velocity.y = Math.max( 0, velocity.y );
            // canJump = true;

        }

        controls.moveRight( - velocity.x * delta );
        controls.moveForward( - velocity.z * delta );

        controls.getObject().position.y += ( velocity.y * delta ); // new behavior

        if ( controls.getObject().position.y < 20 ) {

            velocity.y = 0;
            controls.getObject().position.y = 9;

            // canJump = true;
        }
        
        camera.position.y += Math.sin(headBobTimer * 14) * 0.2
        if(moveForward == true || moveBackward == true || moveRight == true || moveLeft == true) 
        {
            headBobActive = true            
        }
        if(headBobActive)
        {
            const waveLength = Math.PI
            const nextStep = 1 + Math.floor(((headBobTimer + 0.000001) * 10) / waveLength)
            const nextStepTime = nextStep * waveLength / 10
            headBobTimer = Math.min(headBobTimer + delta, nextStepTime)
            // headBobTimer += delta

            if(headBobTimer == nextStepTime) 
            {
                headBobActive = false    
            } 
        }
    }
    prevTime = time;
}


/**
 * Loop
 */
const loop = () =>
{
    window.requestAnimationFrame(loop)
    // stats
    stats.begin()
    // ...
    stats.end() 
    // Update controls
    fpControls.update( clock.getDelta() );
    // Skybox rotation
    skybox.rotation.y += 0.00002
    // cameracontrols.update(delta);    

    // Update model
    particles.rotation.y += 0.000021
    astronaut2.rotation.y += 0.00061
    astronaut2.rotation.z += 0.000061
    astronaut2.rotation.x += 0.000061
    spaceshuttle.rotation.x += 0.0001
    spaceship.rotation.z += 0.00005
    iss.rotation.y += 0.00002
    tv.rotation.y += 0.0002
    tv.rotation.z += 0.0002
    tv.rotation.x += 0.0002
    spaceProbe.rotation.y += 0.0002
    spaceProbe.rotation.z += 0.0002
    spaceProbe.rotation.x += 0.0002
    rotator.rotation.y += 0.0002
    // Flashlight
    flashlight()
    // Render

    animate()
    renderer.render(scene, camera)
}
loop()



    