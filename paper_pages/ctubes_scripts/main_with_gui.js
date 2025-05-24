import * as THREE from 'three';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// Get the container div
const container = document.getElementById('viewer');
const width = container.clientWidth;
const height = container.clientHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
// Camera parameters (close and far planes will be updated later)
const camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 1000 );
camera.up.set(0, 0, 1);
camera.position.set(0, 5, 5); // position will be updated later
camera.lookAt(0, 0, 0); // will look at the center of the object

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap; // default THREE.PCFShadowMap, THREE.PCFSoftShadowMap
renderer.setSize( width, height );
renderer.setAnimationLoop( animate );
container.appendChild(renderer.domElement);

// Add some light
const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(1, 1, 1); // updated later
light.castShadow = true;
light.shadow.mapSize.width = 1*1024;
light.shadow.mapSize.height = 1*1024;
light.shadow.intensity = 0.4;
light.shadow.radius = 100.0;
light.shadow.blurSamples = 32;
light.shadow.bias = -0.0001;
scene.add(light);

// Hemisphere light for bright ambient fill
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.2); // Sky color, ground color, intensity
scene.add(hemiLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Add a ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
scene.add(ground);

// Object material
const objectMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x049ef4,
    side: THREE.DoubleSide,
    wireframe: false,
    flatShading: false,
    metalness: 0.0,
    roughness: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.8,
});

// Add a camera helper
const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
// scene.add(cameraHelper);

// Add geometry
const loader = new OBJLoader();
loader.load(
    'ctubes_scripts/tube_0030.obj',
    function ( object ) {
        // compute the box that contains all the stuff
        // from root and below
        const box = new THREE.Box3().setFromObject(object);

        // make the object flush with the ground
        object.position.z = -box.min.z;

        // flip the normals of the mesh
        object.traverse(function (child) {
            if (child.isMesh) {
                child.material.side = THREE.DoubleSide;
                child.material = objectMaterial;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        // add the object to the scene
		scene.add( object );
        
        const boxSize = box.getSize(new THREE.Vector3()).length();
        const boxCenter = box.getCenter(new THREE.Vector3());
    
        // set the camera to frame the box
        frameArea(boxSize * 1.2, boxSize, boxCenter, camera);
    
        // update the Trackball controls to handle the new size
        controls.maxDistance = boxSize * 10;
        controls.target.copy(boxCenter);
        controls.update();
	},
);

function animate() {
	renderer.render( scene, camera );
}

function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
   
    // compute a unit vector that points in the direction the camera is now
    // from the center of the box
    const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).normalize();
    const offsetCamera = (new THREE.Vector3()).copy(direction).multiplyScalar(distance).add(boxCenter);
   
    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(offsetCamera);
   
    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;
   
    camera.updateProjectionMatrix();
   
    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);

    // update the light direction to point to the center of the box
    light.position.copy(offsetCamera);
    light.target.position.copy(boxCenter);

    // same for the shadow camera
    const extFactor = 1.1;
    light.shadow.camera.position.copy(offsetCamera);
    light.shadow.camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
    light.shadow.camera.near = boxSize / 100;
    light.shadow.camera.far = boxSize * 4;
    light.shadow.camera.left = - extFactor * boxSize / 2;
    light.shadow.camera.right = extFactor * boxSize / 2;
    light.shadow.camera.top = extFactor * boxSize / 2;
    light.shadow.camera.bottom = - extFactor * boxSize / 2;
    light.shadow.camera.updateProjectionMatrix();
}

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = 0.95 * Math.PI / 2;
controls.target.set(0, 0, 0);
controls.update();

class DimensionGUIHelper {
    constructor(obj, minProp, maxProp) {
      this.obj = obj;
      this.minProp = minProp;
      this.maxProp = maxProp;
    }
    get value() {
      return this.obj[this.maxProp] * 2;
    }
    set value(v) {
      this.obj[this.maxProp] = v /  2;
      this.obj[this.minProp] = v / -2;
    }
}

class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
      this.obj = obj;
      this.minProp = minProp;
      this.maxProp = maxProp;
      this.minDif = minDif;
    }
    get min() {
      return this.obj[this.minProp];
    }
    set min(v) {
      this.obj[this.minProp] = v;
      this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    }
    get max() {
      return this.obj[this.maxProp];
    }
    set max(v) {
      this.obj[this.maxProp] = v;
      this.min = this.min;  // this will call the min setter
    }
}

function updateCamera() {
    // update the light target's matrixWorld because it's needed by the helper
    light.target.updateMatrixWorld();
    cameraHelper.update();
    // update the light's shadow camera's projection matrix
    light.shadow.camera.updateProjectionMatrix();
    // and now update the camera helper we're using to show the light's shadow camera
    cameraHelper.update();
}
updateCamera();

// Add a GUI for light intensity
const gui = new GUI();
gui.add(light, 'intensity', 0, 5, 0.01);
{
    const folder = gui.addFolder('Shadow Camera');
    folder.open();
    folder.add(new DimensionGUIHelper(light.shadow.camera, 'left', 'right'), 'value', 1, 100)
      .name('width')
      .onChange(updateCamera);
    folder.add(new DimensionGUIHelper(light.shadow.camera, 'bottom', 'top'), 'value', 1, 100)
      .name('height')
      .onChange(updateCamera);
    const minMaxGUIHelper = new MinMaxGUIHelper(light.shadow.camera, 'near', 'far', 0.1);
    folder.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
    folder.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);
    folder.add(light.shadow.camera, 'zoom', 0.01, 1.5, 0.01).onChange(updateCamera);
  }

// Optional: Handle resizing
window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});
