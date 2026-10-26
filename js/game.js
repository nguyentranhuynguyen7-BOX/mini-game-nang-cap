import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { questions } from "./questions.js";

const teams = [
  { name: "tổ 1:Đế Quốc Phương Đông", color: 0x4caf50, hp: 100, position: [-9, 0, -4] },
  { name: "tổ 2:Liên Bang Ma Quốc Tempest", color: 0xd58b43, hp: 100, position: [9, 0, -4] },
  { name: "tổ 3:Thánh Quốc Lubelius", color: 0xe3c64e, hp: 100, position: [0, 0, 9] }
];

const ui = {
  card: document.querySelector("#quiz-card"),
  teamHud: document.querySelector("#team-hud"),
  turn: document.querySelector("#turn-indicator"),
  number: document.querySelector("#question-number"),
  question: document.querySelector("#question-text"),
  answers: document.querySelector("#answer-list"),
  actions: document.querySelector("#action-list"),
  message: document.querySelector("#status-message"),
  targetHint: document.querySelector("#target-hint"),
  overlay: document.querySelector("#start-overlay"),
  modalMessage: document.querySelector("#modal-message"),
  start: document.querySelector("#start-button"),
  attack: document.querySelector("#attack-button"),
  heal: document.querySelector("#heal-button"),
  fullscreen: document.querySelector("#fullscreen-button"),
  startSound: document.querySelector("#start-sound"),
  victorySound: document.querySelector("#victory-sound"),
  // Cinematic Movie Intro Elements
  cinemaIntro: document.querySelector("#intro-overlay"),
  cinemaScenes: document.querySelectorAll(".cinema-scene"),
  cinemaPills: document.querySelectorAll(".cinema-step-pill"),
  cinemaProgressFill: document.querySelector("#cinema-progress-fill"),
  cinemaSoundToggle: document.querySelector("#cinema-sound-toggle"),
  cinemaSkipBtn: document.querySelector("#cinema-skip-btn"),
  cinemaPrevBtn: document.querySelector("#cinema-prev-btn"),
  cinemaPlayPauseBtn: document.querySelector("#cinema-playpause-btn"),
  cinemaNextBtn: document.querySelector("#cinema-next-btn"),
  cinemaPlayBtn: document.querySelector("#intro-play-button"),
  introSoundIcon: document.querySelector("#intro-sound-icon"),
  soundBtn: document.querySelector("#sound-btn"),
  introReplayBtn: document.querySelector("#intro-replay-btn"),
  modalIntroBtn: document.querySelector("#modal-intro-button")
};

const letters = ["A", "B", "C", "D"];
let activeTeam = 0, questionIndex = 0, missedAttempts = 0, phase = "idle", gameRunning = false, openingSoundStarted = false;
let isMuted = false;

// --- 3D SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x76b2c9); // Bầu trời thung lũng thiên nhiên
scene.fog = new THREE.Fog(0x89bed1, 30, 90); // Sương mù mờ ảo cho đồi núi phía xa

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 150);
camera.position.set(0, 16, 24);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 12;
controls.maxDistance = 45;

// Ánh sáng tự nhiên
scene.add(new THREE.HemisphereLight(0xd4f0ff, 0x4e3825, 2.0));

const sun = new THREE.DirectionalLight(0xfff7e2, 2.4);
sun.position.set(18, 28, 14);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 85;
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
sun.shadow.bias = -0.0005;
scene.add(sun);

const ambientLight = new THREE.AmbientLight(0x405544, 0.55);
scene.add(ambientLight);

// --- TẠO MẶT ĐẤT, ĐƯỜNG ĐẤT & ĐỊA HÌNH HỮU CƠ ---
function createTerrain() {
  const terrainGroup = new THREE.Group();

  // 1. Tầng cỏ bề mặt chính
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7b43, roughness: 0.92 });
  const grassPlateau = new THREE.Mesh(new THREE.CylinderGeometry(18.2, 18.6, 0.6, 64), grassMat);
  grassPlateau.position.y = -0.3;
  grassPlateau.receiveShadow = true;
  terrainGroup.add(grassPlateau);

  // 2. Các tầng vách đất màu mỡ (tượng trưng cho đất mùn, phân bón hữu cơ màu mỡ)
  const soilMat1 = new THREE.MeshStandardMaterial({ color: 0x5c3e26, roughness: 0.95 });
  const soilCliff1 = new THREE.Mesh(new THREE.CylinderGeometry(18.6, 20.4, 1.6, 48), soilMat1);
  soilCliff1.position.y = -1.35;
  soilCliff1.receiveShadow = true;
  terrainGroup.add(soilCliff1);

  const soilMat2 = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 1.0 });
  const soilCliff2 = new THREE.Mesh(new THREE.CylinderGeometry(20.4, 23.0, 2.6, 36), soilMat2);
  soilCliff2.position.y = -3.3;
  soilCliff2.receiveShadow = true;
  terrainGroup.add(soilCliff2);

  const bedrockMat = new THREE.MeshStandardMaterial({ color: 0x27190e, roughness: 1.0 });
  const bedrock = new THREE.Mesh(new THREE.CylinderGeometry(23.0, 26.5, 4.0, 32), bedrockMat);
  bedrock.position.y = -6.4;
  bedrock.receiveShadow = true;
  terrainGroup.add(bedrock);

  // 3. Vòng trung tâm thi đấu & Vành đai năng lượng
  const centerRing = new THREE.Mesh(
    new THREE.TorusGeometry(11.5, 0.14, 12, 64),
    new THREE.MeshStandardMaterial({ color: 0x9cc77c, emissive: 0x183c21, roughness: 0.5 })
  );
  centerRing.rotation.x = Math.PI / 2;
  centerRing.position.y = -0.04;
  terrainGroup.add(centerRing);

  // Vòng sân đất trung tâm
  const centerPlaza = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 32),
    new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.96 })
  );
  centerPlaza.rotation.x = -Math.PI / 2;
  centerPlaza.position.y = 0.01;
  centerPlaza.receiveShadow = true;
  terrainGroup.add(centerPlaza);

  // 4. Các con đường đất nối từ trung tâm ra 3 lâu đài
  const dirtRoadMat = new THREE.MeshStandardMaterial({ color: 0x6e4b31, roughness: 0.98 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8f969b, roughness: 0.85 });

  teams.forEach(team => {
    const targetX = team.position[0];
    const targetZ = team.position[2];
    const distance = Math.hypot(targetX, targetZ);
    const angle = Math.atan2(targetZ, targetX);

    // Dải đường đất uốn lượn nhẹ
    const segments = 12;
    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const x = targetX * t + (Math.sin(t * Math.PI) * 0.4);
      const z = targetZ * t;
      const width = 1.3 - t * 0.2;

      const pathPatch = new THREE.Mesh(
        new THREE.CylinderGeometry(width * 0.9, width, 0.05, 8),
        dirtRoadMat
      );
      pathPatch.position.set(x, 0.015, z);
      pathPatch.receiveShadow = true;
      terrainGroup.add(pathPatch);

      // Các bậc đá lát tự nhiên trên đường đất
      if (s % 2 === 0) {
        const stone = new THREE.Mesh(
          new THREE.BoxGeometry(0.55 + Math.random() * 0.2, 0.07, 0.4 + Math.random() * 0.2),
          stoneMat
        );
        stone.position.set(x + (Math.random() - 0.5) * 0.3, 0.04, z + (Math.random() - 0.5) * 0.3);
        stone.rotation.y = Math.random() * Math.PI;
        stone.receiveShadow = true;
        stone.castShadow = true;
        terrainGroup.add(stone);
      }
    }
  });

  // 5. Các luống đất hữu cơ & đống ủ mùn màu mỡ với mầm cây xanh
  const compostMat = new THREE.MeshStandardMaterial({ color: 0x3d2514, roughness: 1.0 });
  const sproutMat = new THREE.MeshStandardMaterial({ color: 0x76d448, roughness: 0.5 });
  const moundAngles = [0.8, 1.4, 2.7, 3.4, 4.6, 5.5];

  moundAngles.forEach((ang, idx) => {
    const dist = 12.5 + (idx % 3) * 1.5;
    const mx = Math.cos(ang) * dist;
    const mz = Math.sin(ang) * dist;

    // Đống đất ủ phân bón hữu cơ
    const mound = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 1.4, 0.35, 10),
      compostMat
    );
    mound.position.set(mx, 0.15, mz);
    mound.scale.set(1 + Math.random() * 0.3, 1, 1 + Math.random() * 0.3);
    mound.receiveShadow = true;
    mound.castShadow = true;
    terrainGroup.add(mound);

    // Mầm cây xanh vươn lên từ đất hữu cơ màu mỡ
    for (let k = 0; k < 3; k++) {
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 5), sproutMat);
      sprout.position.set(
        mx + (Math.random() - 0.5) * 0.6,
        0.38,
        mz + (Math.random() - 0.5) * 0.6
      );
      sprout.rotation.z = (Math.random() - 0.5) * 0.4;
      sprout.rotation.x = (Math.random() - 0.5) * 0.4;
      terrainGroup.add(sprout);
    }
  });

  scene.add(terrainGroup);
}

// --- TẠO ĐỒI NÚI (HILLS & MOUNTAINS) ---
function createHillsAndMountains() {
  const hillGroup = new THREE.Group();

  // 1. Đồi xanh thoai thoải bao bọc quanh đảo đấu trường (Midground Hills)
  const hillMat1 = new THREE.MeshStandardMaterial({ color: 0x35703d, roughness: 0.95 });
  const hillMat2 = new THREE.MeshStandardMaterial({ color: 0x43814b, roughness: 0.9 });

  const hillPositions = [
    { x: -14, z: -11, r: 6.2, h: 2.8 },
    { x: 0, z: -16.5, r: 7.5, h: 3.4 },
    { x: 14, z: -11, r: 6.5, h: 3.0 },
    { x: -16.5, z: 2, r: 6.8, h: 3.1 },
    { x: 16.5, z: 2, r: 7.0, h: 3.2 },
    { x: -12.5, z: 13, r: 6.0, h: 2.7 },
    { x: 12.5, z: 13, r: 6.0, h: 2.7 },
    { x: 0, z: 17.5, r: 7.2, h: 3.5 }
  ];

  hillPositions.forEach((h, i) => {
    const hillGeo = new THREE.SphereGeometry(h.r, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const hillMesh = new THREE.Mesh(hillGeo, i % 2 === 0 ? hillMat1 : hillMat2);
    hillMesh.scale.set(1, h.h / h.r, 1);
    hillMesh.position.set(h.x, -0.2, h.z);
    hillMesh.receiveShadow = true;
    hillMesh.castShadow = true;
    hillGroup.add(hillMesh);
  });

  // 2. Dãy núi hùng vĩ bao bọc bên ngoài (Outer Mountain Range)
  const mountainRockMat = new THREE.MeshStandardMaterial({
    color: 0x4e5864,
    roughness: 0.95,
    flatShading: true
  });
  const mountainDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3f4650,
    roughness: 0.98,
    flatShading: true
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xeef4f8,
    roughness: 0.65,
    flatShading: true
  });

  const mountainCount = 30;
  for (let i = 0; i < mountainCount; i++) {
    const angle = (i / mountainCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const distance = 25 + (i % 3) * 6 + Math.random() * 5;
    const height = 9 + Math.random() * 14;
    const radius = 5 + Math.random() * 5;
    const segments = 5 + Math.floor(Math.random() * 3); // Low-poly phong cách ấn tượng

    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, segments),
      i % 2 === 0 ? mountainRockMat : mountainDarkMat
    );
    mountain.position.set(
      Math.cos(angle) * distance,
      height * 0.5 - 4.5,
      Math.sin(angle) * distance
    );
    mountain.rotation.y = Math.random() * Math.PI;
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    hillGroup.add(mountain);

    // Chóp núi có tuyết phủ trắng hoặc đá sáng màu cho các đỉnh núi cao
    if (height > 14) {
      const snowHeight = height * 0.28;
      const snowRadius = radius * 0.32;
      const snowPeak = new THREE.Mesh(
        new THREE.ConeGeometry(snowRadius, snowHeight, segments),
        snowMat
      );
      snowPeak.position.set(
        mountain.position.x,
        mountain.position.y + height * 0.5 - snowHeight * 0.5,
        mountain.position.z
      );
      snowPeak.rotation.y = mountain.rotation.y;
      snowPeak.castShadow = true;
      hillGroup.add(snowPeak);
    }
  }

  scene.add(hillGroup);
}

// --- TẠO RỪNG CÂY (LUSH FORESTS & TREES) ---
function createForest() {
  const forestGroup = new THREE.Group();

  // Vật liệu cây cối
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4f3627, roughness: 0.95 });
  const pineMats = [
    new THREE.MeshStandardMaterial({ color: 0x1a4a2b, roughness: 0.85, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x245e39, roughness: 0.85, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x143c23, roughness: 0.85, flatShading: true })
  ];
  const broadleafMats = [
    new THREE.MeshStandardMaterial({ color: 0x327a3a, roughness: 0.88, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x42914b, roughness: 0.88, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x55aa5f, roughness: 0.88, flatShading: true })
  ];
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x2c6a38, roughness: 0.9 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x666d73, roughness: 0.9, flatShading: true });

  // 1. Hàm tạo Cây Thông Rừng (Pine Tree)
  function createPineTree(x, z, scale = 1) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.5, 6), trunkMat);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    tree.add(trunk);

    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.4, 7), pineMats[0]);
    cone1.position.y = 1.8;
    cone1.castShadow = true;
    tree.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.25, 7), pineMats[1]);
    cone2.position.y = 2.65;
    cone2.castShadow = true;
    tree.add(cone2);

    const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.1, 7), pineMats[2]);
    cone3.position.y = 3.4;
    cone3.castShadow = true;
    tree.add(cone3);

    return tree;
  }

  // 2. Hàm tạo Cây Tán Lá Rộng (Broadleaf Tree)
  function createBroadleafTree(x, z, scale = 1) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 2.0, 6), trunkMat);
    trunk.position.y = 1.0;
    trunk.castShadow = true;
    tree.add(trunk);

    const crownGroup = new THREE.Group();
    crownGroup.position.y = 2.3;

    const mainCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), broadleafMats[1]);
    mainCrown.castShadow = true;
    crownGroup.add(mainCrown);

    const puff1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), broadleafMats[0]);
    puff1.position.set(-0.55, 0.3, 0.4);
    puff1.castShadow = true;
    crownGroup.add(puff1);

    const puff2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), broadleafMats[2]);
    puff2.position.set(0.6, 0.25, -0.35);
    puff2.castShadow = true;
    crownGroup.add(puff2);

    const topPuff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), broadleafMats[1]);
    topPuff.position.set(0.1, 0.85, 0.1);
    topPuff.castShadow = true;
    crownGroup.add(topPuff);

    tree.add(crownGroup);
    return tree;
  }

  // 3. Hàm tạo Bụi Cây (Bush)
  function createBush(x, z, scale = 1) {
    const bush = new THREE.Group();
    bush.position.set(x, 0.25 * scale, z);
    bush.scale.setScalar(scale);

    const main = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), bushMat);
    main.castShadow = true;
    bush.add(main);

    const side = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 1), bushMat);
    side.position.set(0.35, -0.1, 0.2);
    side.castShadow = true;
    bush.add(side);

    return bush;
  }

  // Kiểm tra không đặt cây đè lên vị trí 3 lâu đài và lối đi trung tâm
  function isClearOfCastles(x, z) {
    for (const team of teams) {
      const dist = Math.hypot(x - team.position[0], z - team.position[2]);
      if (dist < 4.2) return false;
    }
    // Không chắn tâm đấu trường
    if (Math.hypot(x, z) < 3.8) return false;
    return true;
  }

  // Cụm rừng 1: Rừng Phương Bắc (giữa đội 1 và đội 2)
  for (let i = 0; i < 24; i++) {
    const rx = (Math.random() - 0.5) * 16;
    const rz = -8 - Math.random() * 8;
    if (isClearOfCastles(rx, rz)) {
      const scale = 0.75 + Math.random() * 0.55;
      const tree = Math.random() > 0.4 ? createPineTree(rx, rz, scale) : createBroadleafTree(rx, rz, scale);
      forestGroup.add(tree);
    }
  }

  // Cụm rừng 2: Rừng Tây Nam (giữa đội 1 và đội 3)
  for (let i = 0; i < 22; i++) {
    const rx = -8 - Math.random() * 8;
    const rz = 2 + Math.random() * 9;
    if (isClearOfCastles(rx, rz)) {
      const scale = 0.75 + Math.random() * 0.55;
      const tree = Math.random() > 0.45 ? createPineTree(rx, rz, scale) : createBroadleafTree(rx, rz, scale);
      forestGroup.add(tree);
    }
  }

  // Cụm rừng 3: Rừng Đông Nam (giữa đội 2 và đội 3)
  for (let i = 0; i < 22; i++) {
    const rx = 8 + Math.random() * 8;
    const rz = 2 + Math.random() * 9;
    if (isClearOfCastles(rx, rz)) {
      const scale = 0.75 + Math.random() * 0.55;
      const tree = Math.random() > 0.45 ? createPineTree(rx, rz, scale) : createBroadleafTree(rx, rz, scale);
      forestGroup.add(tree);
    }
  }

  // Vành đai rừng bao quanh chân đồi núi
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 15.5 + Math.random() * 4.5;
    const rx = Math.cos(angle) * radius;
    const rz = Math.sin(angle) * radius;
    if (isClearOfCastles(rx, rz)) {
      const scale = 0.8 + Math.random() * 0.6;
      const tree = Math.random() > 0.5 ? createPineTree(rx, rz, scale) : createBroadleafTree(rx, rz, scale);
      forestGroup.add(tree);
    }
  }

  // Rải bụi cây rậm rạp và tảng đá rừng
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 12;
    const bx = Math.cos(angle) * radius;
    const bz = Math.sin(angle) * radius;
    if (isClearOfCastles(bx, bz)) {
      forestGroup.add(createBush(bx, bz, 0.8 + Math.random() * 0.5));
      if (Math.random() > 0.6) {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.35, 0),
          rockMat
        );
        rock.position.set(bx + 0.6, 0.2, bz + 0.6);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        forestGroup.add(rock);
      }
    }
  }

  scene.add(forestGroup);
}

// --- TẠO CHI TIẾT HOA DẠI, NẤM RỪNG & ĐOM ĐÓM ---
const fireflies = [];
function createFloraAndAtmosphere() {
  const detailGroup = new THREE.Group();

  // 1. Hoa dại nhiều màu sắc trên đồng cỏ
  const flowerColors = [0xffd75e, 0xffffff, 0xff9944, 0xb88aff, 0x64c8ff];
  const flowerGeo = new THREE.SphereGeometry(0.08, 6, 6);

  for (let i = 0; i < 90; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 3.5 + Math.random() * 13.5;
    const col = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    const flower = new THREE.Mesh(flowerGeo, new THREE.MeshBasicMaterial({ color: col }));
    flower.position.set(Math.cos(angle) * radius, 0.08, Math.sin(angle) * radius);
    detailGroup.add(flower);
  }

  // 2. Nấm rừng sinh thái
  const mushroomStemMat = new THREE.MeshStandardMaterial({ color: 0xedebe4 });
  const mushroomCapMat = new THREE.MeshStandardMaterial({ color: 0xd6392c, roughness: 0.6 });
  const brownMushroomMat = new THREE.MeshStandardMaterial({ color: 0x8a5534, roughness: 0.8 });

  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 8;
    const mx = Math.cos(angle) * radius;
    const mz = Math.sin(angle) * radius;

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.22, 6), mushroomStemMat);
    stem.position.set(mx, 0.11, mz);
    detailGroup.add(stem);

    const capMat = Math.random() > 0.5 ? mushroomCapMat : brownMushroomMat;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
    cap.position.set(mx, 0.22, mz);
    detailGroup.add(cap);
  }

  // 3. Đom đóm / hạt phấn hoa bay lơ lửng trong rừng
  const fireflyGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xe6ff66 });

  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 12;
    const fly = new THREE.Mesh(fireflyGeo, fireflyMat);
    fly.position.set(
      Math.cos(angle) * radius,
      0.8 + Math.random() * 2.5,
      Math.sin(angle) * radius
    );
    fly.userData = {
      baseY: fly.position.y,
      speed: 1.2 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2
    };
    fireflies.push(fly);
    detailGroup.add(fly);
  }

  scene.add(detailGroup);
}

// --- TẠO MÂY TRÔI TRÊN ĐỈNH NÚI (DRIFTING CLOUDS) ---
const clouds = [];
function createClouds() {
  const cloudGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    flatShading: true,
    transparent: true,
    opacity: 0.88
  });

  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Group();
    const sphereCount = 5 + Math.floor(Math.random() * 4);
    for (let s = 0; s < sphereCount; s++) {
      const part = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.4 + Math.random() * 1.2, 1),
        cloudMat
      );
      part.position.set(
        (s - sphereCount / 2) * 1.2 + (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.8
      );
      cloud.add(part);
    }
    const angle = (i / 12) * Math.PI * 2;
    const dist = 24 + Math.random() * 18;
    cloud.position.set(
      Math.cos(angle) * dist,
      16 + Math.random() * 9,
      Math.sin(angle) * dist
    );
    cloud.userData = { speed: 0.35 + Math.random() * 0.45 };
    clouds.push(cloud);
    cloudGroup.add(cloud);
  }

  scene.add(cloudGroup);
}

// KHỞI TẠO BẢN ĐỒ MỚI: ĐẤT, ĐỒI NÚI, RỪNG CÂY, MÂY KHÔNG GIAN
createTerrain();
createHillsAndMountains();
createForest();
createFloraAndAtmosphere();
createClouds();

// --- TẠO LÂU ĐÀI CÁC ĐỘI (CASTLES) ---
const castles = [], raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), clock = new THREE.Clock();
let cameraTransition = null;

// ============================================================================
// 1. LÂU ĐÀI ĐẾ QUỐC PHƯƠNG ĐÔNG (EASTERN IMPERIAL CITADEL) - TỔ 1
// Kiến trúc Hoàng Thành Á Đông: Mái ngói cong 3 tầng, cột sơn son thếp vàng,
// 4 tháp canh bát giác, đèn lồng hoàng cung phát sáng và cờ hiệu đế quốc.
// ============================================================================
function buildEasternEmpireCastle(team, teamIndex) {
  const castle = new THREE.Group();
  castle.userData.lanterns = [];

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3d4147, roughness: 0.9 });
  const redWoodMat = new THREE.MeshStandardMaterial({ color: 0x8a2323, roughness: 0.65 });
  const darkRedMat = new THREE.MeshStandardMaterial({ color: 0x5a1313, roughness: 0.7 });
  const jadeRoofMat = new THREE.MeshStandardMaterial({ color: 0x1f6637, roughness: 0.42, metalness: 0.15 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf5c037, roughness: 0.35, metalness: 0.7 });
  const lanternGlowMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff8811, emissiveIntensity: 0.85 });

  // 1. Thành lũy đá bát giác kiên cố
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.4, 0.85, 8), stoneMat);
  base.position.y = 0.1;
  base.castShadow = base.receiveShadow = true;
  castle.add(base);

  // Lỗ châu mai thành lũy
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const battle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.18), stoneMat);
    battle.position.set(Math.cos(angle) * 2.85, 0.68, Math.sin(angle) * 2.85);
    battle.rotation.y = -angle + Math.PI / 2;
    battle.castShadow = true;
    castle.add(battle);
  }

  // Bậc thang đá trước cổng
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.6 - s * 0.2, 0.12, 0.35), stoneMat);
    step.position.set(0, 0.06 + s * 0.1, -2.8 + s * 0.28);
    step.receiveShadow = true;
    castle.add(step);
  }

  // 2. Đại Điện Hoàng Cung 3 tầng (3-Tier Pagoda Keep)
  // --- TẦNG 1 ---
  const tier1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.3, 2.5), redWoodMat);
  tier1.position.y = 1.2;
  tier1.castShadow = tier1.receiveShadow = true;
  castle.add(tier1);

  // 4 cột son tầng 1
  for (const [cx, cz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 8), darkRedMat);
    col.position.set(cx, 1.2, cz);
    col.castShadow = true;
    castle.add(col);
  }

  // Mái ngói cong tầng 1
  const roof1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 2.3, 0.45, 4), jadeRoofMat);
  roof1.position.y = 1.95;
  roof1.rotation.y = Math.PI / 4;
  roof1.castShadow = true;
  castle.add(roof1);

  // --- TẦNG 2 ---
  const tier2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.15, 1.8), redWoodMat);
  tier2.position.y = 2.65;
  tier2.castShadow = true;
  castle.add(tier2);

  const balcony = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 2.0), goldTrimMat);
  balcony.position.y = 2.15;
  castle.add(balcony);

  const roof2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.7, 0.42, 4), jadeRoofMat);
  roof2.position.y = 3.32;
  roof2.rotation.y = Math.PI / 4;
  roof2.castShadow = true;
  castle.add(roof2);

  // --- TẦNG 3 (Tháp Vọng Cảnh) ---
  const tier3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.95, 1.2), redWoodMat);
  tier3.position.y = 3.9;
  tier3.castShadow = true;
  castle.add(tier3);

  const roof3 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.25, 0.48, 4), jadeRoofMat);
  roof3.position.y = 4.52;
  roof3.rotation.y = Math.PI / 4;
  roof3.castShadow = true;
  castle.add(roof3);

  // Đỉnh Tháp Long Châu Hoàng Kim
  const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.6, 8), goldTrimMat);
  spireBase.position.y = 4.95;
  spireBase.castShadow = true;
  castle.add(spireBase);

  const spireJewel = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), goldTrimMat);
  spireJewel.position.y = 5.3;
  spireJewel.castShadow = true;
  castle.add(spireJewel);

  const spireTop = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), goldTrimMat);
  spireTop.position.y = 5.65;
  spireTop.castShadow = true;
  castle.add(spireTop);

  // 3. Bốn Tháp Canh Bát Giác Quân Sự
  const towerOffsets = [[-1.4, -1.3], [1.4, -1.3], [-1.4, 1.3], [1.4, 1.3]];
  towerOffsets.forEach(([tx, tz]) => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 3.5, 8), stoneMat);
    tower.position.set(tx, 1.8, tz);
    tower.castShadow = true;
    castle.add(tower);

    const tGallery = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.58, 0.6, 8), redWoodMat);
    tGallery.position.set(tx, 3.65, tz);
    tGallery.castShadow = true;
    castle.add(tGallery);

    const tCone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.15, 8), jadeRoofMat);
    tCone.position.set(tx, 4.45, tz);
    tCone.castShadow = true;
    castle.add(tCone);

    const tPin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), goldTrimMat);
    tPin.position.set(tx, 5.15, tz);
    castle.add(tPin);
  });

  // 4. Cổng Hoàng Thành uy nghiêm & Đèn lồng Hoàng Cung
  const gateArch = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.22), darkRedMat);
  gateArch.position.set(0, 0.95, -1.35);
  gateArch.castShadow = true;
  castle.add(gateArch);

  const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.15, 0.12), new THREE.MeshStandardMaterial({ color: 0x1f140e, roughness: 0.8 }));
  gateDoor.position.set(0, 0.85, -1.42);
  castle.add(gateDoor);

  [-0.65, 0.65].forEach(lx => {
    const lanternArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), goldTrimMat);
    lanternArm.position.set(lx, 1.55, -1.4);
    lanternArm.rotation.x = Math.PI / 3;
    castle.add(lanternArm);

    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.32, 8), lanternGlowMat);
    lantern.position.set(lx, 1.32, -1.55);
    lantern.castShadow = true;
    castle.add(lantern);
    castle.userData.lanterns.push(lantern);
  });

  // Cờ phướn Đế Quốc Phương Đông
  const flag1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.52, 0.04), new THREE.MeshStandardMaterial({ color: 0x2e7d32, emissive: 0x1b5e20, emissiveIntensity: 0.3 }));
  flag1.position.set(0.65, 5.75, 0);
  castle.add(flag1);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.8, 8), goldTrimMat);
  pole.position.set(0, 5.0, 0);
  castle.add(pole);

  return castle;
}

// ============================================================================
// 2. LÂU ĐÀI LIÊN BANG MA QUỐC TEMPEST (TEMPEST MAGITECH & SLIME CITADEL) - TỔ 2
// Vương quốc Quái Vật của Rimuru Tempest: Tường đá Obsidian đen huyền ảo,
// vòm cổ thụ kỳ ảo, Đại Pha Lê Ma Lực Slime khổng lồ lơ lửng và tháp ma đạo.
// ============================================================================
function buildTempestCastle(team, teamIndex) {
  const castle = new THREE.Group();
  castle.userData.floatingCrystals = [];

  const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x232933, roughness: 0.82 });
  const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x1b2029, roughness: 0.88 });
  const amberWoodMat = new THREE.MeshStandardMaterial({ color: 0xc87b32, roughness: 0.65 });
  const copperRoofMat = new THREE.MeshStandardMaterial({ color: 0xad5d28, roughness: 0.5, metalness: 0.35 });
  const runeCyanMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x00d4ff, emissiveIntensity: 0.75, roughness: 0.2 });
  const slimeCrystalMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00bfff,
    emissiveIntensity: 0.95,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.92
  });

  // 1. Pháo đài đá Obsidian 12 cạnh
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.5, 0.9, 12), obsidianMat);
  base.position.y = 0.1;
  base.castShadow = base.receiveShadow = true;
  castle.add(base);

  // Vành đai năng lượng ma pháp chạy quanh chân thành
  const runeRing = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.06, 8, 36), runeCyanMat);
  runeRing.rotation.x = Math.PI / 2;
  runeRing.position.y = 0.38;
  castle.add(runeRing);

  // 2. Điện Ma Vương Trung Tâm (Central High Keep)
  const mainKeep = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.3, 2.3, 12), obsidianMat);
  mainKeep.position.y = 1.6;
  mainKeep.castShadow = mainKeep.receiveShadow = true;
  castle.add(mainKeep);

  const keepGallery = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.95, 0.9, 12), amberWoodMat);
  keepGallery.position.y = 2.85;
  keepGallery.castShadow = true;
  castle.add(keepGallery);

  // Ống khói luyện kim ma đạo
  [[-0.85, 0.6], [0.85, 0.6]].forEach(([px, pz]) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 8), copperRoofMat);
    pipe.position.set(px, 3.5, pz);
    pipe.castShadow = true;
    castle.add(pipe);

    const pipeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), runeCyanMat);
    pipeGlow.position.set(px, 3.98, pz);
    castle.add(pipeGlow);
  });

  // Bệ đỡ Pha Lê Thần
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 0.45, 8), darkStoneMat);
  dais.position.y = 3.45;
  dais.castShadow = true;
  castle.add(dais);

  // 4 móng vuốt giữ pha lê
  for (let c = 0; c < 4; c++) {
    const clawAngle = (c / 4) * Math.PI * 2;
    const claw = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.18), copperRoofMat);
    claw.position.set(Math.cos(clawAngle) * 0.9, 3.85, Math.sin(clawAngle) * 0.9);
    claw.rotation.y = -clawAngle;
    claw.rotation.z = Math.PI * 0.15;
    claw.castShadow = true;
    castle.add(claw);
  }

  // ĐẠI PHA LÊ MA LỰC RIMURU KHỔNG LỒ LƠ LỬNG
  const giantCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), slimeCrystalMat);
  giantCrystal.position.set(0, 4.75, 0);
  giantCrystal.castShadow = true;
  castle.add(giantCrystal);
  castle.userData.floatingCrystals.push({ mesh: giantCrystal, baseY: 4.75, speed: 1.8 });

  // 3. Bốn Tháp Ma Đạo Phong Cách Tempest
  const towerOffsets = [[-1.4, -1.3], [1.4, -1.3], [-1.4, 1.3], [1.4, 1.3]];
  towerOffsets.forEach(([tx, tz], i) => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 3.9, 8), darkStoneMat);
    tower.position.set(tx, 2.0, tz);
    tower.castShadow = true;
    castle.add(tower);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.5, 8), copperRoofMat);
    cone.position.set(tx, 4.4, tz);
    cone.castShadow = true;
    castle.add(cone);

    const tRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 8, 24), runeCyanMat);
    tRing.rotation.x = Math.PI / 2;
    tRing.position.set(tx, 3.2, tz);
    castle.add(tRing);

    if (tz < 0) {
      const miniCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), slimeCrystalMat);
      miniCrystal.position.set(tx, 5.4, tz);
      miniCrystal.castShadow = true;
      castle.add(miniCrystal);
      castle.userData.floatingCrystals.push({ mesh: miniCrystal, baseY: 5.4, speed: 2.5 + i });
    }
  });

  // 4. Cổng Thành Ma Tộc & Biểu Tượng Slime Rimuru
  const gateArch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.45, 0.28), darkStoneMat);
  gateArch.position.set(0, 1.0, -1.38);
  gateArch.castShadow = true;
  castle.add(gateArch);

  const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.15), amberWoodMat);
  gateDoor.position.set(0, 0.9, -1.45);
  castle.add(gateDoor);

  const slimeInsignia = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), slimeCrystalMat);
  slimeInsignia.scale.set(1.15, 0.85, 0.7);
  slimeInsignia.position.set(0, 1.85, -1.48);
  slimeInsignia.castShadow = true;
  castle.add(slimeInsignia);

  // Cờ Ma Quốc Tempest
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.52, 0.05), new THREE.MeshStandardMaterial({ color: 0xd58b43, emissive: 0xc87b32, emissiveIntensity: 0.35 }));
  flag.position.set(0.65, 5.8, 0);
  castle.add(flag);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), copperRoofMat);
  pole.position.set(0, 5.0, 0);
  castle.add(pole);

  return castle;
}

// ============================================================================
// 3. LÂU ĐÀI THÁNH QUỐC LUBELIUS (HOLY GOTHIC CATHEDRAL CITADEL) - TỔ 3
// Vương quốc Tôn giáo của Nữ Thần Luminus Valentine: Kiến trúc Gothic vĩ đại,
// Đá cẩm thạch trắng Carrara, Cửa sổ Hoa hồng phát sáng thần thánh,
// Trụ bay Gothic kiệt tác và Thánh Giá Mặt Trời Hoàng Kim vươn cao.
// ============================================================================
function buildLubeliusCastle(team, teamIndex) {
  const castle = new THREE.Group();

  const whiteMarbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const offWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45 });
  const slateRoofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 });
  const holyGoldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.8 });
  const roseWindowMat = new THREE.MeshStandardMaterial({
    color: 0x818cf8,
    emissive: 0x6366f1,
    emissiveIntensity: 0.85,
    roughness: 0.2
  });

  // 1. Bệ Đá Thánh Điện Bằng Cẩm Thạch Trắng
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.5, 0.85, 8), whiteMarbleMat);
  base.position.y = 0.1;
  base.castShadow = base.receiveShadow = true;
  castle.add(base);

  // Cầu thang lễ nghi cẩm thạch trước cổng
  for (let s = 0; s < 4; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.8 - s * 0.22, 0.12, 0.38), whiteMarbleMat);
    step.position.set(0, 0.06 + s * 0.1, -2.9 + s * 0.28);
    step.receiveShadow = true;
    castle.add(step);
  }

  // 2. Đại Thánh Đường Trung Tâm (Grand Basilica Sanctuary Nave)
  const nave = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.7, 3.0), whiteMarbleMat);
  nave.position.set(0, 1.7, 0.1);
  nave.castShadow = nave.receiveShadow = true;
  castle.add(nave);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.5, 4), slateRoofMat);
  roof.position.set(0, 3.7, 0.1);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.0, 1.0, 1.35);
  roof.castShadow = true;
  castle.add(roof);

  // KIỆT TÁC TRỤ BAY GOTHIC (4 Flying Buttresses)
  const buttressOffsets = [[-1.5, -0.6], [1.5, -0.6], [-1.5, 0.8], [1.5, 0.8]];
  buttressOffsets.forEach(([bx, bz]) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 0.3), whiteMarbleMat);
    pier.position.set(bx, 1.5, bz);
    pier.castShadow = true;
    castle.add(pier);

    const pierPinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.8, 6), slateRoofMat);
    pierPinnacle.position.set(bx, 3.2, bz);
    castle.add(pierPinnacle);

    const arch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.75), whiteMarbleMat);
    arch.position.set(bx * 0.75, 2.7, bz);
    arch.rotation.z = bx > 0 ? Math.PI * 0.2 : -Math.PI * 0.2;
    arch.castShadow = true;
    castle.add(arch);
  });

  // 3. THÁP CHUÔNG TRUNG TÂM VƯƠN CAO
  const belfry = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 3.4, 8), whiteMarbleMat);
  belfry.position.set(0, 3.9, 0);
  belfry.castShadow = true;
  castle.add(belfry);

  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.28, 8), holyGoldMat);
  bell.position.set(0, 4.4, 0);
  castle.add(bell);

  const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.72, 2.5, 8), slateRoofMat);
  pinnacle.position.set(0, 6.4, 0);
  pinnacle.castShadow = true;
  castle.add(pinnacle);

  // Đỉnh Thánh Giá Mặt Trời Bằng Vàng Rực Rỡ
  const crossGroup = new THREE.Group();
  crossGroup.position.set(0, 7.8, 0);

  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), holyGoldMat);
  crossGroup.add(crossV);

  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), holyGoldMat);
  crossH.position.y = 0.15;
  crossGroup.add(crossH);

  const sunHalo = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 24), holyGoldMat);
  sunHalo.position.y = 0.15;
  crossGroup.add(sunHalo);

  castle.add(crossGroup);

  // 4. Bốn Tháp Nhọn Góc Gothic
  const cornerOffsets = [[-1.4, -1.35], [1.4, -1.35], [-1.4, 1.35], [1.4, 1.35]];
  cornerOffsets.forEach(([cx, cz]) => {
    const spireTower = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 4.2, 8), offWhiteMat);
    spireTower.position.set(cx, 2.1, cz);
    spireTower.castShadow = true;
    castle.add(spireTower);

    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.8, 8), slateRoofMat);
    needle.position.set(cx, 4.8, cz);
    needle.castShadow = true;
    castle.add(needle);

    const miniCross = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), holyGoldMat);
    miniCross.position.set(cx, 5.8, cz);
    castle.add(miniCross);
  });

  // 5. CỔNG THÁNH ĐƯỜNG & CỬA SỔ HOA HỒNG GOTHIC
  const portalArch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.7, 0.25), offWhiteMat);
  portalArch.position.set(0, 1.05, -1.4);
  portalArch.castShadow = true;
  castle.add(portalArch);

  const holyDoor = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.3, 0.15), holyGoldMat);
  holyDoor.position.set(0, 0.9, -1.46);
  castle.add(holyDoor);

  const roseFrame = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 8, 32), holyGoldMat);
  roseFrame.position.set(0, 2.35, -1.45);
  castle.add(roseFrame);

  const roseWindow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), roseWindowMat);
  roseWindow.position.set(0, 2.35, -1.44);
  castle.add(roseWindow);
  castle.userData.roseWindow = roseWindow;

  // Cờ Tôn Giáo Thánh Quốc Lubelius
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.52, 0.05), new THREE.MeshStandardMaterial({ color: 0xe3c64e, emissive: 0xd4af37, emissiveIntensity: 0.35 }));
  flag.position.set(0.65, 6.2, 0);
  castle.add(flag);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.0, 8), holyGoldMat);
  pole.position.set(0, 5.4, 0);
  castle.add(pole);

  return castle;
}

// Master dispatcher
function createCastle(team, teamIndex) {
  let castle;
  if (teamIndex === 0) {
    castle = buildEasternEmpireCastle(team, teamIndex);
  } else if (teamIndex === 1) {
    castle = buildTempestCastle(team, teamIndex);
  } else {
    castle = buildLubeliusCastle(team, teamIndex);
  }

  castle.position.set(...team.position);
  castle.userData.teamIndex = teamIndex;

  // Cổng lâu đài (mặt local -Z) luôn hướng vào tâm đấu trường.
  castle.lookAt(0, 0, 0);
  castle.rotateY(Math.PI);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(3.1, 3.32, 48),
    new THREE.MeshBasicMaterial({ color: team.color, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.02;
  castle.add(halo);
  castle.userData.halo = halo;

  castles.push(castle);
  scene.add(castle);
}

teams.forEach(createCastle);

// --- LOGIC TRẬN ĐẤU & ĐIỀU KHIỂN ---
function livingTeams() {
  return teams.map((team, index) => team.hp > 0 ? index : null).filter(Number.isInteger);
}

function nextLivingTeam(from) {
  for (let offset = 1; offset <= teams.length; offset++) {
    const candidate = (from + offset) % teams.length;
    if (teams[candidate].hp > 0) return candidate;
  }
  return from;
}

function focusCameraOnTeam(teamIndex, immediate = false) {
  const castlePosition = castles[teamIndex].position.clone();
  const outward = castlePosition.clone().setY(0).normalize();
  const cameraDestination = castlePosition.clone().add(outward.multiplyScalar(8)).add(new THREE.Vector3(0, 4.5, 0));
  const targetDestination = castlePosition.clone().lerp(new THREE.Vector3(0, 0, 0), 0.48).add(new THREE.Vector3(0, 1.4, 0));

  if (immediate) {
    camera.position.copy(cameraDestination);
    controls.target.copy(targetDestination);
    controls.update();
    return;
  }
  cameraTransition = {
    start: clock.getElapsedTime(),
    duration: 0.72,
    fromPosition: camera.position.clone(),
    toPosition: cameraDestination,
    fromTarget: controls.target.clone(),
    toTarget: targetDestination
  };
}

function updateHud() {
  ui.teamHud.innerHTML = teams.map((team, index) => {
    const hpColor = team.hp > 45 ? `#${team.color.toString(16).padStart(6, "0")}` : "#dc5757";
    return `<article class="team-card ${gameRunning && index === activeTeam ? "active" : ""} ${team.hp === 0 ? "eliminated" : ""}">
      <div class="team-line"><span>${team.name}</span><span>${team.hp}/100 HP</span></div>
      <div class="hp-bar"><div class="hp-fill" style="width:${team.hp}%;background:${hpColor}"></div></div>
    </article>`;
  }).join("");

  ui.turn.textContent = gameRunning ? `Lượt của ${teams[activeTeam].name}` : "Chuẩn bị trận đấu";
  castles.forEach((castle, index) => {
    castle.visible = teams[index].hp > 0;
    castle.userData.halo.visible = castle.visible && gameRunning && (index === activeTeam || (phase === "target" && index !== activeTeam && teams[index].hp > 0));
  });
}

function renderQuestion() {
  const question = questions[questionIndex];
  phase = "question";
  focusCameraOnTeam(activeTeam);
  ui.card.hidden = false;
  ui.number.hidden = false;
  ui.question.hidden = false;
  ui.number.textContent = `CÂU ${questionIndex + 1} / ${questions.length}`;
  ui.question.textContent = question.text;
  ui.answers.hidden = false;
  ui.actions.hidden = true;
  ui.answers.innerHTML = question.choices.map((choice, index) =>
    `<button class="answer" data-choice="${index}"><span class="answer-letter">${letters[index]}</span>${choice}</button>`
  ).join("");
  ui.message.textContent = "Chọn một đáp án.";
  ui.targetHint.hidden = true;
  updateHud();

  ui.answers.querySelectorAll("button").forEach(button =>
    button.addEventListener("click", () => answerQuestion(Number(button.dataset.choice), button))
  );
}

function answerQuestion(choice, selectedButton) {
  if (phase !== "question") return;
  const question = questions[questionIndex];
  phase = "feedback";
  ui.answers.querySelectorAll("button").forEach(button => button.disabled = true);

  if (choice === question.answer) {
    selectedButton.classList.add("correct");
    ui.message.textContent = "Chính xác! Chuẩn bị chọn hành động...";
    setTimeout(() => {
      if (phase !== "feedback") return;
      phase = "action";
      ui.number.hidden = true;
      ui.question.hidden = true;
      ui.answers.hidden = true;
      ui.actions.hidden = false;
      ui.message.textContent = "Chọn Tấn công hoặc Hồi máu.";
    }, 1500);
    return;
  }

  selectedButton.classList.add("incorrect");
  missedAttempts++;

  if (missedAttempts >= livingTeams().length) {
    const recipient = nextLivingTeam(activeTeam);
    missedAttempts = 0;
    ui.message.textContent = `Cả các đội đều chưa đúng. Giữ nguyên câu hỏi và quay lại ${teams[recipient].name}.`;
    setTimeout(() => {
      activeTeam = recipient;
      renderQuestion();
    }, 1100);
    return;
  }

  const recipient = nextLivingTeam(activeTeam);
  ui.message.textContent = `Chưa đúng. Câu hỏi chuyển cho ${teams[recipient].name}.`;
  setTimeout(() => {
    activeTeam = recipient;
    renderQuestion();
  }, 1100);
}

function resolveQuestion() {
  questionIndex = (questionIndex + 1) % questions.length;
  missedAttempts = 0;
  activeTeam = nextLivingTeam(activeTeam);
  if (livingTeams().length === 1) return endGame(livingTeams()[0]);
  renderQuestion();
}

// ============================================================================
// HỆ THỐNG ÂM THANH TỔNG HỢP (WEB AUDIO SYNTHESIZER)
// ============================================================================
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playLaunchSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.65);
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.72);
  } catch (e) {}
}

function playExplosionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.85);
    gain.gain.setValueAtTime(0.65, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.85);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.88);

    const bufferSize = Math.floor(ctx.sampleRate * 0.55);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.55);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.42, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.55);
  } catch (e) {}
}

function playHealSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const start = ctx.currentTime + idx * 0.07;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.7);
    });
  } catch (e) {}
}

// ============================================================================
// POPUP SÁT THƯƠNG VÀ HỒI MÁU (FLOATING 2D/3D COMBAT POPUP)
// ============================================================================
function getScreenPosition(pos3D) {
  const v = pos3D.clone();
  v.project(camera);
  const x = (v.x * 0.5 + 0.5) * innerWidth;
  const y = (-(v.y * 0.5) + 0.5) * innerHeight;
  return { x, y };
}

function showCombatPopup(text, type, pos3D) {
  const screenPos = getScreenPosition(pos3D);
  const popup = document.createElement("div");
  popup.className = `combat-popup ${type}`;
  popup.textContent = text;
  popup.style.left = `${screenPos.x}px`;
  popup.style.top = `${screenPos.y - 25}px`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1250);
}

// ============================================================================
// HỆ THỐNG TÊN LỬA TẤN CÔNG (MISSILE & EXPLOSION SYSTEM)
// ============================================================================
const activeMissiles = [];
const missileTrails = [];
const activeExplosions = [];
const activeHeals = [];

function createMissileMesh() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, 1.3, 12),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 })
  );
  body.castShadow = true;
  group.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.6, 12),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5, roughness: 0.3 })
  );
  nose.position.y = 0.95;
  nose.castShadow = true;
  group.add(nose);

  for (let f = 0; f < 4; f++) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.35, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.6, roughness: 0.3 })
    );
    fin.position.y = -0.45;
    fin.rotation.y = (f * Math.PI) / 2;
    fin.castShadow = true;
    group.add(fin);
  }

  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.12, 0.25, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
  );
  nozzle.position.y = -0.75;
  group.add(nozzle);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.75, 8),
    new THREE.MeshBasicMaterial({ color: 0xff7700 })
  );
  flame.position.y = -1.2;
  flame.rotation.x = Math.PI;
  group.add(flame);

  const light = new THREE.PointLight(0xff6600, 3.5, 12);
  light.position.y = -0.9;
  group.add(light);

  group.userData.flame = flame;
  return group;
}

function launchMissile(attackerIdx, targetIdx, onHit) {
  playLaunchSound();

  const startPos = castles[attackerIdx].position.clone().add(new THREE.Vector3(0, 3.8, 0));
  const targetPos = castles[targetIdx].position.clone().add(new THREE.Vector3(0, 2.5, 0));
  const midPos = startPos.clone().add(targetPos).multiplyScalar(0.5);
  midPos.y += 8.5;

  const mesh = createMissileMesh();
  mesh.position.copy(startPos);
  scene.add(mesh);

  activeMissiles.push({
    mesh,
    startPos,
    midPos,
    targetPos,
    targetIdx,
    progress: 0,
    duration: 1.15,
    onHit
  });
}

function createExplosion(pos) {
  playExplosionSound();

  const expGroup = new THREE.Group();
  expGroup.position.copy(pos);

  const flash = new THREE.PointLight(0xff9922, 6.5, 20);
  expGroup.add(flash);

  const ringGeo = new THREE.RingGeometry(0.4, 0.85, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffdd66,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide
  });
  const shockwave = new THREE.Mesh(ringGeo, ringMat);
  shockwave.rotation.x = Math.PI / 2;
  expGroup.add(shockwave);

  const particles = [];
  const partColors = [0xff2200, 0xff6600, 0xffaa00, 0xffffff];
  const partGeo = new THREE.SphereGeometry(0.18, 6, 6);

  for (let i = 0; i < 28; i++) {
    const col = partColors[Math.floor(Math.random() * partColors.length)];
    const pMesh = new THREE.Mesh(partGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 }));
    const speed = 4 + Math.random() * 8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.cos(phi) * speed * 0.8 + 2.5,
      Math.sin(phi) * Math.sin(theta) * speed
    );
    pMesh.scale.setScalar(0.8 + Math.random() * 0.7);
    expGroup.add(pMesh);
    particles.push({ mesh: pMesh, vel });
  }

  scene.add(expGroup);
  activeExplosions.push({
    group: expGroup,
    flash,
    shockwave,
    particles,
    age: 0,
    lifespan: 0.85
  });
}

function shakeCastle(targetIdx) {
  const castle = castles[targetIdx];
  const origPos = castle.position.clone();
  const startTime = clock.getElapsedTime();
  const duration = 0.42;

  const interval = setInterval(() => {
    const elapsed = clock.getElapsedTime() - startTime;
    if (elapsed >= duration) {
      clearInterval(interval);
      castle.position.copy(origPos);
      return;
    }
    const decay = 1 - elapsed / duration;
    castle.position.x = origPos.x + (Math.random() - 0.5) * 0.55 * decay;
    castle.position.y = origPos.y + (Math.random() - 0.5) * 0.4 * decay;
    castle.position.z = origPos.z + (Math.random() - 0.5) * 0.55 * decay;
  }, 16);
}

// ============================================================================
// HỆ THỐNG HIỆU ỨNG HỒI PHỤC (HOLY HEALING SYSTEM)
// ============================================================================
function triggerHealEffect(teamIdx, onComplete) {
  playHealSound();

  const castle = castles[teamIdx];
  const pos = castle.position.clone();
  const healGroup = new THREE.Group();
  healGroup.position.copy(pos);

  const pillarGeo = new THREE.CylinderGeometry(2.4, 2.7, 18, 24, 1, true);
  const pillarMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide
  });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 9;
  healGroup.add(pillar);

  const rings = [];
  for (let r = 0; r < 3; r++) {
    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.08, 8, 36),
      new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.9 })
    );
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.2;
    healGroup.add(ringMesh);
    rings.push({ mesh: ringMesh, startDelay: r * 0.22 });
  }

  const motes = [];
  const moteGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const greenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  for (let m = 0; m < 26; m++) {
    const mote = new THREE.Mesh(moteGeo, m % 2 === 0 ? greenMat : goldMat);
    const angle = Math.random() * Math.PI * 2;
    const rad = 1.4 + Math.random() * 1.6;
    mote.position.set(Math.cos(angle) * rad, 0.2 + Math.random() * 1.5, Math.sin(angle) * rad);
    healGroup.add(mote);
    motes.push({
      mesh: mote,
      baseAngle: angle,
      radius: rad,
      speed: 2.5 + Math.random() * 2.5,
      upSpeed: 3.5 + Math.random() * 2.5
    });
  }

  scene.add(healGroup);

  activeHeals.push({
    group: healGroup,
    pillar,
    rings,
    motes,
    age: 0,
    duration: 1.35,
    onComplete
  });
}

function updateMissiles(delta) {
  for (let i = activeMissiles.length - 1; i >= 0; i--) {
    const m = activeMissiles[i];
    m.progress += delta / m.duration;
    const t = Math.min(m.progress, 1);

    const oneMinusT = 1 - t;
    const x = oneMinusT * oneMinusT * m.startPos.x + 2 * oneMinusT * t * m.midPos.x + t * t * m.targetPos.x;
    const y = oneMinusT * oneMinusT * m.startPos.y + 2 * oneMinusT * t * m.midPos.y + t * t * m.targetPos.y;
    const z = oneMinusT * oneMinusT * m.startPos.z + 2 * oneMinusT * t * m.midPos.z + t * t * m.targetPos.z;
    m.mesh.position.set(x, y, z);

    const tx = 2 * oneMinusT * (m.midPos.x - m.startPos.x) + 2 * t * (m.targetPos.x - m.midPos.x);
    const ty = 2 * oneMinusT * (m.midPos.y - m.startPos.y) + 2 * t * (m.targetPos.y - m.midPos.y);
    const tz = 2 * oneMinusT * (m.midPos.z - m.startPos.z) + 2 * t * (m.targetPos.z - m.midPos.z);
    const dir = new THREE.Vector3(tx, ty, tz).normalize();

    const up = new THREE.Vector3(0, 1, 0);
    m.mesh.quaternion.setFromUnitVectors(up, dir);

    const exhaustPos = m.mesh.position.clone().sub(dir.clone().multiplyScalar(0.95));
    for (let p = 0; p < 2; p++) {
      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(0.16 + Math.random() * 0.12, 6, 6),
        new THREE.MeshBasicMaterial({
          color: Math.random() > 0.4 ? 0xff7722 : 0xcccccc,
          transparent: true,
          opacity: 0.8
        })
      );
      smoke.position.copy(exhaustPos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.15
      ));
      scene.add(smoke);
      missileTrails.push({ mesh: smoke, age: 0, lifespan: 0.45 });
    }

    if (t >= 1) {
      scene.remove(m.mesh);
      createExplosion(m.targetPos);
      shakeCastle(m.targetIdx);
      if (m.onHit) m.onHit();
      activeMissiles.splice(i, 1);
    }
  }
}

function updateMissileTrails(delta) {
  for (let i = missileTrails.length - 1; i >= 0; i--) {
    const tr = missileTrails[i];
    tr.age += delta;
    const progress = tr.age / tr.lifespan;
    tr.mesh.scale.multiplyScalar(1 + delta * 2.2);
    tr.mesh.material.opacity = Math.max(0, 0.8 * (1 - progress));
    if (progress >= 1) {
      scene.remove(tr.mesh);
      missileTrails.splice(i, 1);
    }
  }
}

function updateExplosions(delta) {
  for (let i = activeExplosions.length - 1; i >= 0; i--) {
    const exp = activeExplosions[i];
    exp.age += delta;
    const progress = exp.age / exp.lifespan;

    exp.flash.intensity = Math.max(0, 6.5 * (1 - progress * 2));

    const ringScale = 1 + progress * 5.2;
    exp.shockwave.scale.set(ringScale, ringScale, ringScale);
    exp.shockwave.material.opacity = Math.max(0, 0.95 * (1 - progress));

    exp.particles.forEach(p => {
      p.vel.y -= 14 * delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      p.mesh.material.opacity = Math.max(0, 1 - progress);
    });

    if (progress >= 1) {
      scene.remove(exp.group);
      activeExplosions.splice(i, 1);
    }
  }
}

function updateHeals(delta) {
  for (let i = activeHeals.length - 1; i >= 0; i--) {
    const h = activeHeals[i];
    h.age += delta;
    const progress = h.age / h.duration;

    h.pillar.rotation.y += delta * 1.8;
    h.pillar.material.opacity = Math.max(0, 0.65 * (1 - progress));

    h.rings.forEach(r => {
      if (h.age >= r.startDelay) {
        const ringProg = Math.min((h.age - r.startDelay) / (h.duration - r.startDelay), 1);
        r.mesh.position.y = 0.2 + ringProg * 6.5;
        const scale = 1 + ringProg * 0.45;
        r.mesh.scale.set(scale, scale, scale);
        r.mesh.material.opacity = Math.max(0, 0.9 * (1 - ringProg));
      }
    });

    h.motes.forEach(m => {
      const curAngle = m.baseAngle + h.age * m.speed;
      m.mesh.position.x = Math.cos(curAngle) * m.radius;
      m.mesh.position.z = Math.sin(curAngle) * m.radius;
      m.mesh.position.y += delta * m.upSpeed;
      m.mesh.rotation.y += delta * 4;
      m.mesh.rotation.x += delta * 3;
    });

    if (progress >= 1) {
      scene.remove(h.group);
      if (h.onComplete) h.onComplete();
      activeHeals.splice(i, 1);
    }
  }
}

// ============================================================================
// HÀNH ĐỘNG TẤN CÔNG & HỒI PHỤC (GAME ACTIONS)
// ============================================================================
function beginAttack() {
  if (phase !== "action") return;
  phase = "target";
  ui.card.hidden = true;
  ui.actions.hidden = true;
  ui.message.textContent = "";
  ui.targetHint.hidden = false;
  updateHud();
}

function heal() {
  if (phase !== "action") return;
  phase = "animating";
  ui.actions.hidden = true;
  ui.card.hidden = true;
  ui.message.textContent = `✨ ${teams[activeTeam].name} đang thi triển hồi phục ma pháp...`;

  triggerHealEffect(activeTeam, () => {
    const before = teams[activeTeam].hp;
    teams[activeTeam].hp = Math.min(100, before + 15);
    updateHud();
    ui.message.textContent = `✨ ${teams[activeTeam].name} nhận phước lành: hồi +${teams[activeTeam].hp - before} HP!`;
    const healPos = castles[activeTeam].position.clone().add(new THREE.Vector3(0, 4.2, 0));
    showCombatPopup(`+${teams[activeTeam].hp - before} HP`, "heal", healPos);

    setTimeout(() => {
      resolveQuestion();
    }, 1200);
  });
}

function attack(targetIndex) {
  if (phase !== "target" || targetIndex === activeTeam || teams[targetIndex].hp === 0) return;
  const attacker = activeTeam;
  phase = "animating";
  ui.targetHint.hidden = true;
  ui.message.textContent = `🚀 ${teams[attacker].name} khai hỏa tên lửa tấn công ${teams[targetIndex].name}!`;

  launchMissile(attacker, targetIndex, () => {
    teams[targetIndex].hp = Math.max(0, teams[targetIndex].hp - 25);
    updateHud();
    ui.message.textContent = `💥 Tên lửa bắn trúng ${teams[targetIndex].name}: −25 HP!`;
    const targetPos = castles[targetIndex].position.clone().add(new THREE.Vector3(0, 3.8, 0));
    showCombatPopup("−25 HP", "damage", targetPos);

    setTimeout(() => {
      resolveQuestion();
    }, 1200);
  });
}

function playSound(audio) {
  if (isMuted) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playOpeningSound() {
  if (isMuted) return;
  ui.startSound.volume = 0.45;
  ui.startSound.play().then(() => {
    openingSoundStarted = true;
  }).catch(() => {});
}

// Âm thanh chuyển cảnh phim điện ảnh (Sub-bass cinematic boom + white noise whoosh)
function playCinemaTransitionSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // 1. Sub-bass boom
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(130, now);
    sub.frequency.exponentialRampToValueAtTime(36, now + 0.45);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.46);

    // 2. Whoosh noise sweep
    const bufSize = Math.floor(ctx.sampleRate * 0.3);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.3);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.16, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.32);
  } catch (e) {}
}

// Âm thanh kèn trận vang dội khi bấm nút PLAY
function playPlayButtonSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const start = ctx.currentTime + idx * 0.07;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.24, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  } catch (e) {}
}

// Bật / tắt âm thanh toàn hệ thống
function toggleSound() {
  isMuted = !isMuted;
  ui.startSound.muted = isMuted;
  ui.victorySound.muted = isMuted;

  const icon = isMuted ? "🔇" : "🔊";
  const label = isMuted ? "🔇 Tắt âm" : "🔊 Âm thanh";
  if (ui.introSoundIcon) ui.introSoundIcon.textContent = icon;
  if (ui.soundBtn) ui.soundBtn.textContent = label;

  if (!isMuted && !openingSoundStarted) {
    playOpeningSound();
  }
}

// ============================================================================
// HỆ THỐNG ĐẠO DIỄN ĐIỆN ẢNH (CINEMATIC MOVIE DIRECTOR)
// ============================================================================
let isIntroActive = true;
let cinemaSceneIndex = 0;
let cinemaSceneTime = 0;
let isCinemaPlaying = true;
const cinemaSceneDurations = [5.5, 4.8, 4.8, 4.8, 5.2, 9999];

// 6 góc máy điện ảnh tương ứng với 6 cảnh phim
const cinemaShots = [
  // Cảnh 0: Khởi nguyên thung lũng (Góc máy trên cao lướt qua mây sương)
  {
    fromPos: new THREE.Vector3(0, 26, 36),
    toPos: new THREE.Vector3(14, 18, 27),
    fromTarget: new THREE.Vector3(0, 1.2, 0),
    toTarget: new THREE.Vector3(0, 1.5, 0)
  },
  // Cảnh 1: Tổ 1 - Hoàng Thành Phương Đông (Góc thấp nhìn lên đại điện mái ngói & đèn lồng)
  {
    fromPos: new THREE.Vector3(-14.8, 3.2, -8.5),
    toPos: new THREE.Vector3(-12.4, 5.8, -7.0),
    fromTarget: new THREE.Vector3(-9, 3.5, -4),
    toTarget: new THREE.Vector3(-9, 4.8, -4)
  },
  // Cảnh 2: Tổ 2 - Pháo Đài Tempest (Góc máy xoay quanh Đại Pha Lê Slime ma pháp)
  {
    fromPos: new THREE.Vector3(14.5, 3.8, -0.8),
    toPos: new THREE.Vector3(12.5, 6.2, -7.0),
    fromTarget: new THREE.Vector3(9, 3.2, -4),
    toTarget: new THREE.Vector3(9, 4.2, -4)
  },
  // Cảnh 3: Tổ 3 - Đại Thánh Đường Lubelius (Góc ngước lên tháp nhọn Gothic & cửa sổ hoa hồng)
  {
    fromPos: new THREE.Vector3(0, 3.2, 15.8),
    toPos: new THREE.Vector3(0, 6.8, 14.2),
    fromTarget: new THREE.Vector3(0, 4.0, 9),
    toTarget: new THREE.Vector3(0, 5.6, 9)
  },
  // Cảnh 4: Thể lệ chiến đấu & Trận địa (Góc bao quát các tuyến đường tên lửa đan xen)
  {
    fromPos: new THREE.Vector3(-7, 18, 20),
    toPos: new THREE.Vector3(7, 16, 21),
    fromTarget: new THREE.Vector3(0, 1.0, 0),
    toTarget: new THREE.Vector3(0, 1.0, 0)
  },
  // Cảnh 5: Cao trào vào trận & Nút PLAY (Góc máy anh hùng đại cảnh tráng lệ)
  {
    fromPos: new THREE.Vector3(-12.5, 14, 21),
    toPos: new THREE.Vector3(-10.2, 12.5, 19),
    fromTarget: new THREE.Vector3(0, 1.8, 0),
    toTarget: new THREE.Vector3(0, 1.8, 0)
  }
];

function setCinemaScene(index) {
  cinemaSceneIndex = Math.max(0, Math.min(index, ui.cinemaScenes.length - 1));
  cinemaSceneTime = 0;

  // Âm thanh chuyển cảnh điện ảnh mượt mà
  playCinemaTransitionSound();

  ui.cinemaScenes.forEach((scene, i) => {
    scene.classList.toggle("active", i === cinemaSceneIndex);
  });

  ui.cinemaPills.forEach((pill, i) => {
    pill.classList.toggle("active", i === cinemaSceneIndex);
  });

  if (ui.cinemaPrevBtn) ui.cinemaPrevBtn.disabled = cinemaSceneIndex === 0;
  if (ui.cinemaNextBtn) {
    ui.cinemaNextBtn.textContent = cinemaSceneIndex === ui.cinemaScenes.length - 1 ? "▶" : "⏭";
  }

  // Cập nhật vị trí tức thì vào đầu cảnh mới
  const shot = cinemaShots[cinemaSceneIndex];
  camera.position.copy(shot.fromPos);
  controls.target.copy(shot.fromTarget);
  controls.update();
}

function toggleCinemaPlayPause() {
  isCinemaPlaying = !isCinemaPlaying;
  if (ui.cinemaPlayPauseBtn) {
    ui.cinemaPlayPauseBtn.textContent = isCinemaPlaying ? "⏸" : "▶";
    ui.cinemaPlayPauseBtn.title = isCinemaPlaying ? "Tạm dừng" : "Tiếp tục chiếu";
  }
}

function skipCinema() {
  setCinemaScene(ui.cinemaScenes.length - 1);
}

function openIntro() {
  isIntroActive = true;
  gameRunning = false;
  isCinemaPlaying = true;
  ui.card.hidden = true;
  ui.overlay.classList.add("hidden");
  if (ui.cinemaIntro) ui.cinemaIntro.classList.remove("hidden");
  if (ui.cinemaPlayPauseBtn) ui.cinemaPlayPauseBtn.textContent = "⏸";
  setCinemaScene(0);
}

function finishIntroAndPlay() {
  playPlayButtonSound();
  playOpeningSound();
  isIntroActive = false;
  if (ui.cinemaIntro) ui.cinemaIntro.classList.add("hidden");
  startGame();
}

function endGame(winnerIndex) {
  gameRunning = false;
  phase = "finished";
  playSound(ui.victorySound);
  ui.card.hidden = false;
  ui.number.hidden = false;
  ui.question.hidden = false;
  ui.question.textContent = `🏆 ${teams[winnerIndex].name} chiến thắng!`;
  ui.number.textContent = "KẾT THÚC TRẬN ĐẤU";
  ui.answers.innerHTML = "";
  ui.actions.hidden = true;
  ui.message.textContent = "Nhấn “Chơi lại” để bắt đầu một trận mới.";
  ui.overlay.classList.remove("hidden");
  ui.overlay.querySelector("#rules-title").textContent = `🎉 ${teams[winnerIndex].name} chiến thắng!`;
  ui.overlay.querySelector("ol").hidden = true;
  ui.modalMessage.hidden = false;
  ui.modalMessage.textContent = "Chúc mừng! Lâu đài của đội bạn là thành trì cuối cùng còn đứng vững trong đấu trường.";
  ui.start.textContent = "Chơi lại";
  updateHud();
}

function startGame() {
  playOpeningSound();
  teams.forEach(team => team.hp = 100);
  activeTeam = 0;
  questionIndex = 0;
  missedAttempts = 0;
  gameRunning = true;
  isIntroActive = false;
  if (ui.cinemaIntro) ui.cinemaIntro.classList.add("hidden");
  ui.overlay.classList.add("hidden");
  ui.overlay.querySelector("ol").hidden = false;
  ui.modalMessage.hidden = true;
  ui.overlay.querySelector("#rules-title").textContent = "Luật chơi";
  ui.start.textContent = "Bắt đầu";
  updateHud();
  focusCameraOnTeam(activeTeam, true);
  renderQuestion();
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  else await document.exitFullscreen();
}

function updateFullscreenLabel() {
  ui.fullscreen.textContent = document.fullscreenElement ? "⛶ Thoát toàn màn hình" : "⛶ Toàn màn hình";
}

// Đăng ký sự kiện
ui.start.addEventListener("click", startGame);
ui.attack.addEventListener("click", beginAttack);
ui.heal.addEventListener("click", heal);
ui.fullscreen.addEventListener("click", () => toggleFullscreen().catch(() => {}));
document.addEventListener("fullscreenchange", updateFullscreenLabel);

// Sự kiện cho phần Cinema Intro & Điều khiển xem phim
if (ui.cinemaPlayBtn) ui.cinemaPlayBtn.addEventListener("click", finishIntroAndPlay);
if (ui.cinemaSkipBtn) ui.cinemaSkipBtn.addEventListener("click", skipCinema);
if (ui.cinemaPlayPauseBtn) ui.cinemaPlayPauseBtn.addEventListener("click", toggleCinemaPlayPause);

if (ui.cinemaPrevBtn) {
  ui.cinemaPrevBtn.addEventListener("click", () => {
    if (cinemaSceneIndex > 0) setCinemaScene(cinemaSceneIndex - 1);
  });
}

if (ui.cinemaNextBtn) {
  ui.cinemaNextBtn.addEventListener("click", () => {
    if (cinemaSceneIndex < ui.cinemaScenes.length - 1) {
      setCinemaScene(cinemaSceneIndex + 1);
    } else {
      finishIntroAndPlay();
    }
  });
}

ui.cinemaPills.forEach(pill => {
  pill.addEventListener("click", () => {
    const sceneIdx = Number(pill.dataset.scene);
    if (!isNaN(sceneIdx)) setCinemaScene(sceneIdx);
  });
});

if (ui.cinemaSoundToggle) ui.cinemaSoundToggle.addEventListener("click", toggleSound);
if (ui.soundBtn) ui.soundBtn.addEventListener("click", toggleSound);
if (ui.introReplayBtn) ui.introReplayBtn.addEventListener("click", openIntro);
if (ui.modalIntroBtn) ui.modalIntroBtn.addEventListener("click", openIntro);

renderer.domElement.addEventListener("pointerdown", event => {
  if (!gameRunning || phase !== "target") return;
  pointer.x = (event.clientX / innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(castles, true)[0];
  if (!hit) return;
  let object = hit.object;
  while (object.parent && object.userData.teamIndex === undefined) object = object.parent;
  attack(object.userData.teamIndex);
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let lastFrameTime = 0;

// --- ANIMATION LOOP ---
function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  const delta = Math.min(time - lastFrameTime, 0.05) || 0.016;
  lastFrameTime = time;

  // Cập nhật chuyển động tên lửa đạn đạo, vệt khói lửa, vụ nổ và hồi phục ma pháp
  updateMissiles(delta);
  updateMissileTrails(delta);
  updateExplosions(delta);
  updateHeals(delta);

  // =========================================================================
  // CHUYỂN ĐỘNG CAMERA ĐIỆN ẢNH (CINEMATIC CAMERA MOVES)
  // =========================================================================
  if (isIntroActive) {
    const duration = cinemaSceneDurations[cinemaSceneIndex];

    if (isCinemaPlaying && cinemaSceneIndex < ui.cinemaScenes.length - 1) {
      cinemaSceneTime += delta;
      const progress = Math.min(cinemaSceneTime / duration, 1);

      // Cập nhật thanh tiến trình chạy trên thanh viền đen
      if (ui.cinemaProgressFill) {
        const totalProgress = ((cinemaSceneIndex + progress) / (ui.cinemaScenes.length - 1)) * 100;
        ui.cinemaProgressFill.style.width = `${Math.min(totalProgress, 100)}%`;
      }

      if (progress >= 1) {
        setCinemaScene(cinemaSceneIndex + 1);
      }
    }

    const currentShot = cinemaShots[cinemaSceneIndex];
    if (currentShot) {
      const p = Math.min(cinemaSceneTime / Math.max(duration, 0.1), 1);
      // Easing mượt mà như cần cẩu quay phim điện ảnh (smooth cubic ease in-out)
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      camera.position.lerpVectors(currentShot.fromPos, currentShot.toPos, eased);
      controls.target.lerpVectors(currentShot.fromTarget, currentShot.toTarget, eased);
    }
  } else if (cameraTransition) {
    const progress = Math.min((time - cameraTransition.start) / cameraTransition.duration, 1);
    const eased = progress * (2 - progress);
    camera.position.lerpVectors(cameraTransition.fromPosition, cameraTransition.toPosition, eased);
    controls.target.lerpVectors(cameraTransition.fromTarget, cameraTransition.toTarget, eased);
    if (progress === 1) cameraTransition = null;
  }

  // Hiệu ứng hào quang & chuyển động điện ảnh chi tiết của từng lâu đài
  castles.forEach((castle, index) => {
    // 1. Hào quang dưới chân lâu đài
    castle.userData.halo.material.opacity = 0.3 + Math.sin(time * 3 + index) * 0.15;

    // 2. Liên Bang Ma Quốc Tempest: Đại Pha Lê và tinh thể tháp lơ lửng & xoay huyền ảo
    if (castle.userData.floatingCrystals) {
      castle.userData.floatingCrystals.forEach((item, i) => {
        item.mesh.rotation.y += 0.025;
        item.mesh.rotation.x = Math.sin(time * 1.6 + i) * 0.18;
        item.mesh.position.y = item.baseY + Math.sin(time * item.speed + i) * 0.18;
      });
    }

    // 3. Đế Quốc Phương Đông: Đèn lồng cung đình đung đưa nhẹ trong gió thung lũng
    if (castle.userData.lanterns) {
      castle.userData.lanterns.forEach((lantern, i) => {
        lantern.rotation.z = Math.sin(time * 2.2 + i * Math.PI) * 0.1;
      });
    }

    // 4. Thánh Quốc Lubelius: Cửa sổ hoa hồng Gothic và hào quang thánh điện tỏa sáng
    if (castle.userData.roseWindow) {
      castle.userData.roseWindow.material.emissiveIntensity = 0.7 + Math.sin(time * 2.5) * 0.3;
    }
  });

  // Mây trôi lững lờ ngang qua các rặng núi
  clouds.forEach(cloud => {
    cloud.rotation.y += cloud.userData.speed * 0.001;
  });

  // Đom đóm / hạt phấn hoa lơ lửng trong rừng
  fireflies.forEach(fly => {
    fly.position.y = fly.userData.baseY + Math.sin(time * fly.userData.speed + fly.userData.offset) * 0.35;
  });

  controls.update();
  renderer.render(scene, camera);
}

// Tự động phát âm thanh khi người dùng tương tác lần đầu
document.addEventListener("pointerdown", playOpeningSound, { capture: true, once: true });
document.addEventListener("keydown", playOpeningSound, { capture: true, once: true });

// Khởi tạo ban đầu: Ẩn card câu hỏi trong lúc xem phim Intro, hiển thị HUD và bắt đầu Cảnh 0
ui.card.hidden = true;
updateHud();
setCinemaScene(0);
animate();
playOpeningSound();

