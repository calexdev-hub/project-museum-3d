import * as THREE from 'three'; // Importa a biblioteca principal do Three.js para renderização 3D

import Stats from 'three/addons/libs/stats.module.js'; // Importa o módulo para monitorar o desempenho (FPS)

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Importa o loader para carregar modelos GLTF

import { Octree } from 'three/addons/math/Octree.js'; // Importa a estrutura Octree para detecção eficiente de colisões
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js'; // Importa o helper para visualização da Octree

import { Capsule } from 'three/addons/math/Capsule.js'; // Importa a classe Capsule para definir o "collider" do jogador

import { GUI } from 'three/addons/libs/lil-gui.module.min.js'; // Importa o GUI para criar interfaces gráficas de controle

import { VRButton } from 'three/addons/webxr/VRButton.js'; // Importa o VRButton


const clock = new THREE.Clock();

// Criação da cena
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccee ); // Define a cor de fundo da cena
scene.fog = new THREE.Fog( 0x88ccee, 0, 50 ); // Adiciona névoa à cena para efeito de profundidade

// Configuração da câmera
const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ'; // Define a ordem de rotação da câmera

// Adiciona uma luz ambiente para iluminar de forma suave a cena
const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
fillLight1.position.set( 2, 1, 1 );
scene.add( fillLight1 );

// Adiciona uma luz direcional que projeta sombras na cena
const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
directionalLight.position.set( - 5, 25, - 1 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top	= 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.00006;
scene.add( directionalLight );

// Obtém o contêiner HTML onde o renderizador será anexado
const container = document.getElementById( 'container' );

// Configuração do renderizador WebGL
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate ); // Define a função de animação
renderer.shadowMap.enabled = true; // Habilita sombras
renderer.shadowMap.type = THREE.VSMShadowMap; // Define o tipo de sombra
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Define o mapeamento de tons para renderização
container.appendChild( renderer.domElement ); // Adiciona o renderizador ao contêiner HTML

// Adicionar suporte a VR
renderer.xr.enabled = true; // Habilita o WebXR no renderizador
// Acessa o primeiro controlador
const controller1 = renderer.xr.getController(0);
scene.add(controller1);

// Adiciona o botão VR na página
document.body.appendChild(VRButton.createButton(renderer)); // Cria e adiciona o botão de VR

// Monitoramento de desempenho (FPS)
const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild( stats.domElement );

// Constantes de gravidade e configuração das esferas
const GRAVITY = 30;
const STEPS_PER_FRAME = 5; // Número de subpassos por frame para melhorar a detecção de colisões

// Cria a Octree do mundo para otimizar a detecção de colisões
const worldOctree = new Octree();

// Cria o "collider" do jogador usando uma cápsula
const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );

const playerVelocity = new THREE.Vector3(); // Velocidade do jogador
const playerDirection = new THREE.Vector3(); // Direção do movimento do jogador

let playerOnFloor = false; // Indica se o jogador está no chão
let mouseTime = 0; // Tempo do último clique do mouse

const keyStates = {}; // Armazena o estado das teclas pressionadas

// Listeners para os eventos de pressionar e soltar teclas
document.addEventListener( 'keydown', ( event ) => {
    keyStates[ event.code ] = true;
} );

document.addEventListener( 'keyup', ( event ) => {
    keyStates[ event.code ] = false;
} );

// Listener para capturar cliques do mouse
container.addEventListener( 'mousedown', () => {
    document.body.requestPointerLock(); // Solicita travamento do cursor
    mouseTime = performance.now(); // Armazena o tempo do clique
} );

document.addEventListener( 'mouseup', () => {
    if ( document.pointerLockElement !== null ) 
        console.log("Usuário clicou!") // Arremessa a bola
} );

// Listener para capturar movimento do mouse e ajustar a rotação da câmera
document.body.addEventListener( 'mousemove', ( event ) => {
    if ( document.pointerLockElement === document.body ) {
        camera.rotation.y -= event.movementX / 500; // Rotaciona a câmera no eixo Y
        camera.rotation.x -= event.movementY / 500; // Rotaciona a câmera no eixo X
    }
});

// Listener para redimensionar a tela
window.addEventListener( 'resize', onWindowResize );

// Função que ajusta a câmera e renderizador ao redimensionar a janela
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// Função para tratar colisões do jogador com o ambiente
function playerCollisions() {
    const result = worldOctree.capsuleIntersect( playerCollider );
    playerOnFloor = false;

    if ( result ) {
        playerOnFloor = result.normal.y > 0;

        if ( ! playerOnFloor ) {
            playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );
        }

        if ( result.depth >= 1e-10 ) {
            playerCollider.translate( result.normal.multiplyScalar( result.depth ) );
        }
    }
}

// Atualiza o movimento do jogador com base no tempo decorrido
function updatePlayer( deltaTime ) {
    let damping = Math.exp( - 4 * deltaTime ) - 1;

    if ( ! playerOnFloor ) {
        playerVelocity.y -= GRAVITY * deltaTime; // Aplica gravidade
        damping *= 0.1; // Pequena resistência do ar
    }

    playerVelocity.addScaledVector( playerVelocity, damping );
    const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
    playerCollider.translate( deltaPosition );
    playerCollisions();
    camera.position.copy( playerCollider.end );
}

// Função para obter o vetor de direção para frente da câmera
function getForwardVector() {
    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    return playerDirection;
}

// Função para obter o vetor de direção lateral da câmera
function getSideVector() {
    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross( camera.up );
    return playerDirection;
}

// Função que controla o movimento do jogador baseado nas teclas pressionadas
function controls( deltaTime ) {

    // Ajusta a velocidade com base se o jogador está no chão ou no ar
    const speedDelta = deltaTime * ( playerOnFloor ? 25 : 8 );

    if (keyStates['KeyW'] || keyStates['ArrowUp']) {
        playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
    }
    
    if (keyStates['KeyS'] || keyStates['ArrowDown']) {
        playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
    }
    
    if (keyStates['KeyA'] || keyStates['ArrowLeft']) {
        playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
    }
    
    if (keyStates['KeyD'] || keyStates['ArrowRight']) {
        playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
    }
}

// Função para detectar o movimento do joystick (thumbstick)
function handleJoystick(controller) {
    const gamepad = controller.gamepad;  // Acessa o gamepad do controlador

    if (gamepad && gamepad.axes.length > 0) {
        // Acessa os valores dos eixos do joystick (thumbstick)
        const xAxis = gamepad.axes[2];  // Eixo horizontal (esquerda/direita)
        const yAxis = gamepad.axes[3];  // Eixo vertical (frente/trás)

        // Exibe os valores do joystick para depuração
        console.log(`Joystick: X: ${xAxis}, Y: ${yAxis}`);

        // Movimenta o jogador baseado no valor dos eixos
        if (yAxis < -0.1) {
            playerVelocity.z -= speedDelta;  // Movimenta para frente
        }
        if (yAxis > 0.1) {
            playerVelocity.z += speedDelta;  // Movimenta para trás
        }
        if (xAxis < -0.1) {
            playerVelocity.x -= speedDelta;  // Movimenta para a esquerda
        }
        if (xAxis > 0.1) {
            playerVelocity.x += speedDelta;  // Movimenta para a direita
        }
    }
}

// Função para ocultar o loader após o carregamento
function hideLoader() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'none'; // Esconde o loader
}

// Carrega o modelo GLTF do mundo 3D
const loader = new GLTFLoader().setPath( './models/gltf/' );

loader.load('museu.glb', (gltf) => {
    scene.add(gltf.scene); // Adiciona o modelo à cena
    worldOctree.fromGraphNode(gltf.scene); // Gera a Octree a partir do modelo GLTF

    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material.map) {
                child.material.map.anisotropy = 4; // Define a anisotropia da textura para melhor qualidade
            }
        }
    });

    // Helper para visualizar a Octree
    const helper = new OctreeHelper(worldOctree);
    helper.visible = false; // Por padrão, a visualização da Octree está desativada
    scene.add(helper);

    // GUI para ativar/desativar a visualização da Octree
    const gui = new GUI({ width: 200 });
    gui.add({ debug: false }, 'debug').onChange(function (value) {
        helper.visible = value; // Ativa/desativa o helper da Octree
    });

    // Esconda o loader após o carregamento dos recursos
    hideLoader();
});

// Teleporta o jogador para uma posição segura se ele cair fora dos limites do mundo
function teleportPlayerIfOob() {
    if ( camera.position.y <= - 25 ) {
        playerCollider.start.set( 0, 0.35, 0 );
        playerCollider.end.set( 0, 1, 0 );
        playerCollider.radius = 0.35;
        camera.position.copy( playerCollider.end );
        camera.rotation.set( 0, 0, 0 );
    }
}

// Função de animação principal
function animate() {

    const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;

    // Executa múltiplos subpassos por frame para garantir a detecção precisa de colisões
    for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {
        controls( deltaTime ); // Atualiza o controle do jogador
        updatePlayer( deltaTime ); // Atualiza o jogador
        teleportPlayerIfOob(); // Teleporta o jogador caso saia dos limites
    }

    renderer.setAnimationLoop(() => {
        handleJoystick(controller1);  // Detecta o movimento do joystick no controlador 1
        renderer.render(scene, camera);  // Renderiza a cena
    });

    // Atualiza as estatísticas de desempenho (FPS)
    stats.update();

}
