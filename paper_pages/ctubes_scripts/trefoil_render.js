import * as THREE from 'three';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// Get the container div
const container = document.getElementById('trefoil-viewer');
const extFactorContainer = 1.015;
const width = extFactorContainer * container.clientWidth;
const height = extFactorContainer * container.clientHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
// Camera parameters (close and far planes will be updated later)
const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
camera.up.set(0, 0, 1);
camera.position.set(0, 5, 5); // position will be updated later
camera.lookAt(0, 0, 0); // will look at the center of the object

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap; // default THREE.PCFShadowMap, THREE.PCFSoftShadowMap
renderer.setSize(width, height);
renderer.setAnimationLoop(animate);
container.appendChild(renderer.domElement);

// Add some light sources
const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(1, 1, 1); // updated later
light.castShadow = true;
light.shadow.mapSize.width = 1*1024;
light.shadow.mapSize.height = 1*1024;
light.shadow.intensity = 0.3;
light.shadow.radius = 50.0;
light.shadow.blurSamples = 32;
light.shadow.bias = -0.0001;
scene.add(light);

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
    clearcoatRoughness: 0.6,
});

// Add geometry
const loader = new OBJLoader();
const modelPaths = [
    '../papers/ctubes/models/trefoil_comparison/tube_opt_240_curve.obj',
    '../papers/ctubes/models/trefoil_comparison/tube_opt_360_curve.obj',
    '../papers/ctubes/models/trefoil_comparison/tube_opt_360_planes.obj',
    '../papers/ctubes/models/trefoil_comparison/tube_opt_360_scaling.obj',
];

function loadModel(modelPath) {
    loader.load(
        modelPath,
        function ( object ) {
            // compute the box that contains all the stuff
            // from root and below
            const box = new THREE.Box3().setFromObject(object);
    
            // make the object flush with the ground
            object.position.z = -box.min.z;
            box.setFromObject(object);
    
            // flip the normals of the mesh
            object.traverse(function (child) {
                if (child.isMesh) {
                    child.material.side = THREE.DoubleSide;
                    child.material = objectMaterial;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(object);
            
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
}
loadModel(modelPaths[0]);

function resizeRendererToDisplaySize(renderer, container) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const canvas = renderer.domElement;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
    }
  }

function animate() {
    resizeRendererToDisplaySize(renderer, container);
	renderer.render(scene, camera);
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
    const extFactor = 1.2;
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

// GUI setup
const gui = new GUI({autoPlace: false, width: 115});
gui.title('Controls');
gui.close();
const params = {modelName: "240 directrix"};

// Append GUI to container
container.appendChild(gui.domElement);
gui.domElement.style.zIndex = '10'; // Ensure it's above the canvas

const modelNameController = gui.add(params, 'modelName',{
    "240 directrix": 0,
    "360 directrix": 1,
    "360 planes": 2,
    "360 apex-locating": 3,
}).name('Model');
modelNameController.onChange((value) => {
    // remove previous objects if any of their own children are meshes
    const objects = [];
    scene.traverse(object => {
        for (let i = 0; i < object.children.length; i++) {
            if (object.children[i].isMesh) {
                objects.push(object);
            }
        }
    });
    objects.forEach(object => {
        scene.remove(object);
    });

    loadModel(modelPaths[value]);
});

// Handle resizing
window.addEventListener('resize', () => {
    
    const width = extFactorContainer * container.clientWidth;
    const height = extFactorContainer * container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, true);
});
