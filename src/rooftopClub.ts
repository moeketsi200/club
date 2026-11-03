import {
  engine,
  Transform,
  MeshRenderer,
  MeshCollider,
  Material,
  MaterialTransparencyMode,
  TextShape,
  Billboard,
  BillboardMode,
  LightSource,
  ParticleSystem,
  PBParticleSystem_BlendMode,
  PBParticleSystem_PlaybackState,
  PBParticleSystem_SimulationSpace,
  AudioSource,
  pointerEventsSystem,
  InputAction,
  Entity
} from '@dcl/sdk/ecs'
import { Vector3, Color4, Color3, Quaternion } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'

export function setupRooftopClub() {
  // ---------------------------------------------------------------------------
  // 1. Luxury Architectural & Club Materials
  // ---------------------------------------------------------------------------
  const obsidianDeckMat = {
    albedoColor: Color4.create(0.08, 0.09, 0.12, 1),
    metallic: 0.85,
    roughness: 0.20
  }

  const polishedGoldMat = {
    albedoColor: Color4.create(0.92, 0.74, 0.32, 1),
    metallic: 0.96,
    roughness: 0.18
  }

  const smokedGlassMat = {
    albedoColor: Color4.create(0.10, 0.16, 0.22, 0.60),
    metallic: 0.35,
    roughness: 0.05,
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    emissiveColor: Color3.create(0.05, 0.10, 0.16),
    emissiveIntensity: 0.25
  }

  const neonCyanMat = {
    albedoColor: Color4.create(0.10, 0.92, 1.0, 1),
    emissiveColor: Color3.create(0.10, 0.92, 1.0),
    emissiveIntensity: 5.5
  }

  const neonMagentaMat = {
    albedoColor: Color4.create(1.0, 0.12, 0.75, 1),
    emissiveColor: Color3.create(1.0, 0.12, 0.75),
    emissiveIntensity: 5.5
  }

  const neonPurpleMat = {
    albedoColor: Color4.create(0.68, 0.18, 1.0, 1),
    emissiveColor: Color3.create(0.68, 0.18, 1.0),
    emissiveIntensity: 5.0
  }

  const neonLimeMat = {
    albedoColor: Color4.create(0.20, 1.0, 0.45, 1),
    emissiveColor: Color3.create(0.20, 1.0, 0.45),
    emissiveIntensity: 5.0
  }

  const neonAmberMat = {
    albedoColor: Color4.create(1.0, 0.75, 0.25, 1),
    emissiveColor: Color3.create(1.0, 0.75, 0.25),
    emissiveIntensity: 5.0
  }

  const royalVelvetMat = {
    albedoColor: Color4.create(0.12, 0.16, 0.42, 1),
    metallic: 0.1,
    roughness: 0.85
  }

  const crimsonVelvetMat = {
    albedoColor: Color4.create(0.60, 0.08, 0.18, 1),
    metallic: 0.1,
    roughness: 0.85
  }

  const travertineMarbleMat = {
    albedoColor: Color4.create(0.92, 0.89, 0.84, 1),
    metallic: 0.05,
    roughness: 0.22
  }

  // ---------------------------------------------------------------------------
  // 2. Rooftop Terrace Deck & Frameless Balustrades
  // ---------------------------------------------------------------------------
  const ROOF_Y = 11.20
  const DECK_CENTER_X = 32.0
  const DECK_CENTER_Z = 16.0
  const DECK_WIDTH_X = 25.0
  const DECK_DEPTH_Z = 14.8
  const STAIR_STEPS = 16
  const STAIR_START_X = 24.4
  const STAIR_START_Y = 7.15
  const STAIR_START_Z = 13.6
  const STAIR_END_X = 21.0
  const STAIR_END_Y = ROOF_Y
  const STAIR_END_Z = 13.6
  const ROOF_MIN_X = DECK_CENTER_X - DECK_WIDTH_X * 0.5
  const ROOF_MAX_X = DECK_CENTER_X + DECK_WIDTH_X * 0.5
  const ROOF_MIN_Z = DECK_CENTER_Z - DECK_DEPTH_Z * 0.5
  const ROOF_MAX_Z = DECK_CENTER_Z + DECK_DEPTH_Z * 0.5
  const STAIR_OPENING_MIN_X = STAIR_END_X - 0.16
  const STAIR_OPENING_MAX_X = STAIR_START_X + 0.16
  const STAIR_OPENING_MIN_Z = STAIR_START_Z - 1.05
  const STAIR_OPENING_MAX_Z = STAIR_START_Z + 1.05

  // Split the rooftop slab around the stair run. The opening follows the tread
  // footprint and leaves the upper end flush with the deck landing.
  const roofSections = [
    { minX: ROOF_MIN_X, maxX: STAIR_OPENING_MIN_X, minZ: ROOF_MIN_Z, maxZ: ROOF_MAX_Z },
    { minX: STAIR_OPENING_MAX_X, maxX: ROOF_MAX_X, minZ: ROOF_MIN_Z, maxZ: ROOF_MAX_Z },
    {
      minX: STAIR_OPENING_MIN_X,
      maxX: STAIR_OPENING_MAX_X,
      minZ: ROOF_MIN_Z,
      maxZ: STAIR_OPENING_MIN_Z
    },
    {
      minX: STAIR_OPENING_MIN_X,
      maxX: STAIR_OPENING_MAX_X,
      minZ: STAIR_OPENING_MAX_Z,
      maxZ: ROOF_MAX_Z
    }
  ]

  roofSections.forEach((section) => {
    const width = section.maxX - section.minX
    const depth = section.maxZ - section.minZ
    if (width <= 0 || depth <= 0) return
    const roofSection = engine.addEntity()
    Transform.create(roofSection, {
      position: Vector3.create((section.minX + section.maxX) * 0.5, ROOF_Y, (section.minZ + section.maxZ) * 0.5),
      scale: Vector3.create(width, 0.35, depth)
    })
    MeshRenderer.setBox(roofSection)
    MeshCollider.setBox(roofSection)
    Material.setPbrMaterial(roofSection, obsidianDeckMat)
  })

  const createDeckTrim = (position: Vector3, scale: Vector3) => {
    const trim = engine.addEntity()
    Transform.create(trim, { position, scale })
    MeshRenderer.setBox(trim)
    Material.setPbrMaterial(trim, polishedGoldMat)
  }

  // Gold outer edge and stairwell edge trim; no solid trim spans the opening.
  createDeckTrim(Vector3.create(DECK_CENTER_X, ROOF_Y, ROOF_MIN_Z), Vector3.create(DECK_WIDTH_X + 0.12, 0.36, 0.08))
  createDeckTrim(Vector3.create(DECK_CENTER_X, ROOF_Y, ROOF_MAX_Z), Vector3.create(DECK_WIDTH_X + 0.12, 0.36, 0.08))
  createDeckTrim(Vector3.create(ROOF_MIN_X, ROOF_Y, DECK_CENTER_Z), Vector3.create(0.08, 0.36, DECK_DEPTH_Z))
  createDeckTrim(Vector3.create(ROOF_MAX_X, ROOF_Y, DECK_CENTER_Z), Vector3.create(0.08, 0.36, DECK_DEPTH_Z))
  const stairOpeningCenterX = (STAIR_OPENING_MIN_X + STAIR_OPENING_MAX_X) * 0.5
  const stairOpeningWidth = STAIR_OPENING_MAX_X - STAIR_OPENING_MIN_X
  const stairOpeningDepth = STAIR_OPENING_MAX_Z - STAIR_OPENING_MIN_Z
  const stairOpeningTrimY = ROOF_Y + 0.16
  createDeckTrim(
    Vector3.create(stairOpeningCenterX, stairOpeningTrimY, STAIR_OPENING_MIN_Z),
    Vector3.create(stairOpeningWidth, 0.06, 0.08)
  )
  createDeckTrim(
    Vector3.create(stairOpeningCenterX, stairOpeningTrimY, STAIR_OPENING_MAX_Z),
    Vector3.create(stairOpeningWidth, 0.06, 0.08)
  )
  createDeckTrim(
    Vector3.create(STAIR_OPENING_MIN_X, stairOpeningTrimY, STAIR_START_Z),
    Vector3.create(0.08, 0.06, stairOpeningDepth)
  )
  createDeckTrim(
    Vector3.create(STAIR_OPENING_MAX_X, stairOpeningTrimY, STAIR_START_Z),
    Vector3.create(0.08, 0.06, stairOpeningDepth)
  )

  // Frameless Smoked Glass Balustrades with Bronze Handrail
  const createRailing = (pos: Vector3, scale: Vector3) => {
    // Glass panel
    const glass = engine.addEntity()
    Transform.create(glass, {
      position: Vector3.create(pos.x, pos.y + 0.58, pos.z),
      scale: scale
    })
    MeshRenderer.setBox(glass)
    MeshCollider.setBox(glass)
    Material.setPbrMaterial(glass, smokedGlassMat)

    // Gold Top Handrail
    const rail = engine.addEntity()
    Transform.create(rail, {
      position: Vector3.create(pos.x, pos.y + 1.18, pos.z),
      scale: Vector3.create(
        scale.x > scale.z ? scale.x + 0.1 : 0.08,
        0.06,
        scale.z > scale.x ? scale.z + 0.1 : 0.08
      )
    })
    MeshRenderer.setBox(rail)
    Material.setPbrMaterial(rail, polishedGoldMat)
  }

  const HALF_X = DECK_WIDTH_X * 0.5
  const HALF_Z = DECK_DEPTH_Z * 0.5

  // South railing (facing front estate)
  createRailing(
    Vector3.create(DECK_CENTER_X, ROOF_Y, DECK_CENTER_Z + HALF_Z),
    Vector3.create(DECK_WIDTH_X, 1.15, 0.06)
  )
  // North railing (facing rear scenic hills)
  createRailing(
    Vector3.create(DECK_CENTER_X, ROOF_Y, DECK_CENTER_Z - HALF_Z),
    Vector3.create(DECK_WIDTH_X, 1.15, 0.06)
  )
  // West railing
  createRailing(
    Vector3.create(DECK_CENTER_X - HALF_X, ROOF_Y, DECK_CENTER_Z),
    Vector3.create(0.06, 1.15, DECK_DEPTH_Z)
  )
  // East railing
  createRailing(
    Vector3.create(DECK_CENTER_X + HALF_X, ROOF_Y, DECK_CENTER_Z),
    Vector3.create(0.06, 1.15, DECK_DEPTH_Z)
  )

  // Floating Club Grand Billboard Sign above North Edge
  const clubSign = engine.addEntity()
  Transform.create(clubSign, {
    position: Vector3.create(DECK_CENTER_X, ROOF_Y + 7.6, DECK_CENTER_Z - HALF_Z + 0.4)
  })
  TextShape.create(clubSign, {
    text: '✦ SKYLINE CLUB ✦\nROOFTOP LOUNGE & VIP STAGE',
    fontSize: 2.8,
    textColor: Color4.create(1.0, 0.90, 0.55, 1)
  })
  Billboard.create(clubSign, {
    billboardMode: BillboardMode.BM_Y
  })

  // ---------------------------------------------------------------------------
  // 3. Interactive Neon LED Dance Floor (4x4 Grid of Dynamic Tiles)
  // ---------------------------------------------------------------------------
  const DANCE_CENTER_X = 32.0
  const DANCE_CENTER_Z = 16.8
  const DANCE_TILE_SIZE = 1.35
  const DANCE_TILE_SPACING = 1.45
  const DANCE_TILES_GRID = 4

  const danceTiles: { entity: Entity; row: number; col: number; activePulse: number }[] = []
  const palette = [neonCyanMat, neonMagentaMat, neonPurpleMat, neonLimeMat, neonAmberMat]

  // Dance Floor Base Platform Border
  const floorBorder = engine.addEntity()
  Transform.create(floorBorder, {
    position: Vector3.create(DANCE_CENTER_X, ROOF_Y + 0.05, DANCE_CENTER_Z),
    scale: Vector3.create(
      DANCE_TILES_GRID * DANCE_TILE_SPACING + 0.4,
      0.10,
      DANCE_TILES_GRID * DANCE_TILE_SPACING + 0.4
    )
  })
  MeshRenderer.setBox(floorBorder)
  Material.setPbrMaterial(floorBorder, polishedGoldMat)

  for (let r = 0; r < DANCE_TILES_GRID; r++) {
    for (let c = 0; c < DANCE_TILES_GRID; c++) {
      const offX = (c - (DANCE_TILES_GRID - 1) * 0.5) * DANCE_TILE_SPACING
      const offZ = (r - (DANCE_TILES_GRID - 1) * 0.5) * DANCE_TILE_SPACING

      const tileEntity = engine.addEntity()
      Transform.create(tileEntity, {
        position: Vector3.create(DANCE_CENTER_X + offX, ROOF_Y + 0.08, DANCE_CENTER_Z + offZ),
        scale: Vector3.create(DANCE_TILE_SIZE, 0.08, DANCE_TILE_SIZE)
      })
      MeshRenderer.setBox(tileEntity)
      MeshCollider.setBox(tileEntity)

      const initialMatIndex = (r + c) % palette.length
      Material.setPbrMaterial(tileEntity, palette[initialMatIndex])

      const tileRecord = { entity: tileEntity, row: r, col: c, activePulse: 0 }
      danceTiles.push(tileRecord)

      // Interactive Click on Dance Floor Tile
      pointerEventsSystem.onPointerDown(
        {
          entity: tileEntity,
          opts: { button: InputAction.IA_POINTER, hoverText: 'Step & Trigger Light Ripple' }
        },
        () => {
          // Trigger explosion ripple across neighboring tiles
          danceTiles.forEach((t) => {
            const dist = Math.hypot(t.row - r, t.col - c)
            t.activePulse = Math.max(0, 1.8 - dist * 0.4)
          })
          AudioSource.playSound(tileEntity, 'assets/Audio/button-sound.mp3')
        }
      )
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Elevated DJ Stage & Interactive DJ Console
  // ---------------------------------------------------------------------------
  const STAGE_X = 32.0
  const STAGE_Z = 11.2
  const STAGE_Y = ROOF_Y + 0.35 // 11.55m

  // DJ Platform
  const stagePlatform = engine.addEntity()
  Transform.create(stagePlatform, {
    position: Vector3.create(STAGE_X, ROOF_Y + 0.18, STAGE_Z),
    scale: Vector3.create(6.4, 0.36, 3.2)
  })
  MeshRenderer.setBox(stagePlatform)
  MeshCollider.setBox(stagePlatform)
  Material.setPbrMaterial(stagePlatform, obsidianDeckMat)

  // Stage Glowing Front Edge
  const stageFacia = engine.addEntity()
  Transform.create(stageFacia, {
    position: Vector3.create(STAGE_X, ROOF_Y + 0.18, STAGE_Z + 1.62),
    scale: Vector3.create(6.4, 0.36, 0.06)
  })
  MeshRenderer.setBox(stageFacia)
  Material.setPbrMaterial(stageFacia, neonCyanMat)

  // DJ Console Table
  const djTable = engine.addEntity()
  Transform.create(djTable, {
    position: Vector3.create(STAGE_X, STAGE_Y + 0.50, STAGE_Z),
    scale: Vector3.create(2.8, 0.95, 1.1)
  })
  MeshRenderer.setBox(djTable)
  MeshCollider.setBox(djTable)
  Material.setPbrMaterial(djTable, obsidianDeckMat)

  // Table Gold Border
  const djTableTrim = engine.addEntity()
  Transform.create(djTableTrim, {
    position: Vector3.create(STAGE_X, STAGE_Y + 0.98, STAGE_Z),
    scale: Vector3.create(2.86, 0.06, 1.16)
  })
  MeshRenderer.setBox(djTableTrim)
  Material.setPbrMaterial(djTableTrim, polishedGoldMat)

  // DJ Mixer (Center)
  const djMixer = engine.addEntity()
  Transform.create(djMixer, {
    position: Vector3.create(STAGE_X, STAGE_Y + 1.02, STAGE_Z),
    scale: Vector3.create(0.55, 0.05, 0.65)
  })
  MeshRenderer.setBox(djMixer)
  MeshCollider.setBox(djMixer)
  Material.setPbrMaterial(djMixer, neonMagentaMat)

  // Left Turntable / Jog Wheel
  const deckLeft = engine.addEntity()
  Transform.create(deckLeft, {
    position: Vector3.create(STAGE_X - 0.75, STAGE_Y + 1.02, STAGE_Z),
    scale: Vector3.create(0.50, 0.05, 0.50)
  })
  MeshRenderer.setCylinder(deckLeft)
  MeshCollider.setBox(deckLeft)
  Material.setPbrMaterial(deckLeft, neonCyanMat)

  // Right Turntable / Jog Wheel
  const deckRight = engine.addEntity()
  Transform.create(deckRight, {
    position: Vector3.create(STAGE_X + 0.75, STAGE_Y + 1.02, STAGE_Z),
    scale: Vector3.create(0.50, 0.05, 0.50)
  })
  MeshRenderer.setCylinder(deckRight)
  MeshCollider.setBox(deckRight)
  Material.setPbrMaterial(deckRight, neonPurpleMat)

  // Dual Stage Monitor Speakers
  const createSpeaker = (pos: Vector3, rotDeg: number) => {
    const speaker = engine.addEntity()
    Transform.create(speaker, {
      position: pos,
      scale: Vector3.create(0.55, 0.90, 0.60),
      rotation: Quaternion.fromEulerDegrees(0, rotDeg, 0)
    })
    MeshRenderer.setBox(speaker)
    MeshCollider.setBox(speaker)
    Material.setPbrMaterial(speaker, obsidianDeckMat)

    // Speaker Cone Accent
    const cone = engine.addEntity()
    Transform.create(cone, {
      position: Vector3.create(pos.x, pos.y, pos.z + 0.31),
      scale: Vector3.create(0.38, 0.38, 0.04),
      rotation: Quaternion.fromEulerDegrees(0, rotDeg, 0)
    })
    MeshRenderer.setCylinder(cone)
    Material.setPbrMaterial(cone, polishedGoldMat)
  }

  createSpeaker(Vector3.create(STAGE_X - 2.6, STAGE_Y + 0.45, STAGE_Z), 25)
  createSpeaker(Vector3.create(STAGE_X + 2.6, STAGE_Y + 0.45, STAGE_Z), -25)

  // Overhead Lighting Truss Arch
  const trussLeft = engine.addEntity()
  Transform.create(trussLeft, {
    position: Vector3.create(STAGE_X - 3.1, STAGE_Y + 2.4, STAGE_Z),
    scale: Vector3.create(0.22, 4.8, 0.22)
  })
  MeshRenderer.setBox(trussLeft)
  Material.setPbrMaterial(trussLeft, polishedGoldMat)

  const trussRight = engine.addEntity()
  Transform.create(trussRight, {
    position: Vector3.create(STAGE_X + 3.1, STAGE_Y + 2.4, STAGE_Z),
    scale: Vector3.create(0.22, 4.8, 0.22)
  })
  MeshRenderer.setBox(trussRight)
  Material.setPbrMaterial(trussRight, polishedGoldMat)

  const trussTop = engine.addEntity()
  Transform.create(trussTop, {
    position: Vector3.create(STAGE_X, STAGE_Y + 4.8, STAGE_Z),
    scale: Vector3.create(6.4, 0.25, 0.25)
  })
  MeshRenderer.setBox(trussTop)
  Material.setPbrMaterial(trussTop, polishedGoldMat)

  // Overhead Intelligent Moving Spotlights
  const spotLeft = engine.addEntity()
  Transform.create(spotLeft, {
    position: Vector3.create(STAGE_X - 1.8, STAGE_Y + 4.65, STAGE_Z),
    rotation: Quaternion.fromEulerDegrees(35, 0, 0)
  })
  MeshRenderer.setBox(spotLeft)
  Material.setPbrMaterial(spotLeft, neonCyanMat)
  LightSource.create(spotLeft, {
    type: LightSource.Type.Spot({ innerAngle: 20, outerAngle: 42 }),
    color: Color3.create(0.1, 0.85, 1.0),
    intensity: 15000,
    range: 22
  })

  const spotRight = engine.addEntity()
  Transform.create(spotRight, {
    position: Vector3.create(STAGE_X + 1.8, STAGE_Y + 4.65, STAGE_Z),
    rotation: Quaternion.fromEulerDegrees(35, 0, 0)
  })
  MeshRenderer.setBox(spotRight)
  Material.setPbrMaterial(spotRight, neonMagentaMat)
  LightSource.create(spotRight, {
    type: LightSource.Type.Spot({ innerAngle: 20, outerAngle: 42 }),
    color: Color3.create(1.0, 0.1, 0.8),
    intensity: 15000,
    range: 22
  })

  // Atmospheric Fog Machine using SDK7 ParticleSystem
  const fogEmitter = engine.addEntity()
  Transform.create(fogEmitter, {
    position: Vector3.create(STAGE_X, STAGE_Y + 0.1, STAGE_Z + 1.2),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0)
  })
  ParticleSystem.create(fogEmitter, {
    active: true,
    rate: 16,
    maxParticles: 120,
    lifetime: 4.2,
    gravity: -0.12,
    initialSize: { start: 0.4, end: 1.0 },
    sizeOverTime: { start: 1.0, end: 2.8 },
    initialColor: {
      start: Color4.create(0.8, 0.5, 1.0, 0.25),
      end: Color4.create(0.3, 0.8, 1.0, 0.25)
    },
    colorOverTime: {
      start: Color4.create(0.7, 0.4, 0.9, 0.20),
      end: Color4.create(0.1, 0.2, 0.5, 0.0)
    },
    initialVelocitySpeed: { start: 1.2, end: 2.6 },
    shape: ParticleSystem.Shape.Cone({ angle: 25, radius: 0.5 }),
    blendMode: PBParticleSystem_BlendMode.PSB_ALPHA,
    simulationSpace: PBParticleSystem_SimulationSpace.PSS_LOCAL,
    playbackState: PBParticleSystem_PlaybackState.PS_PLAYING,
    loop: true,
    prewarm: true
  })

  // Audio Music Entity & Interactive Track Switching
  const djAudio = engine.addEntity()
  Transform.create(djAudio, {
    position: Vector3.create(STAGE_X, STAGE_Y + 1.2, STAGE_Z)
  })
  AudioSource.create(djAudio, {
    audioClipUrl: 'assets/Audio/dance_club_1.mp3',
    playing: true,
    loop: true,
    volume: 0.75
  })

  // DJ Booth 3D Display Sign
  const djScreen = engine.addEntity()
  Transform.create(djScreen, {
    position: Vector3.create(STAGE_X, STAGE_Y + 1.45, STAGE_Z - 0.2)
  })
  TextShape.create(djScreen, {
    text: '♫ LIVE DJ SET ♫\n[ CLICK DECKS TO SWITCH TRACK / DROP BASS ]',
    fontSize: 1.6,
    textColor: Color4.create(0.2, 1.0, 0.8, 1)
  })
  Billboard.create(djScreen, {
    billboardMode: BillboardMode.BM_Y
  })

  let currentTrack = 1
  let isBassDrop = false

  // Deck Left: Switch Track
  pointerEventsSystem.onPointerDown(
    {
      entity: deckLeft,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Switch DJ Track (Club 1 ↔ Club 2)' }
    },
    () => {
      currentTrack = currentTrack === 1 ? 2 : 1
      const newTrack = currentTrack === 1 ? 'assets/Audio/dance_club_1.mp3' : 'assets/Audio/dance_club_2.mp3'
      AudioSource.playSound(djAudio, newTrack)
      const text = TextShape.getMutable(djScreen)
      text.text = `♫ NOW PLAYING: CLUB MIX ${currentTrack} ♫\n[ TEMPO: 128 BPM | KEY: D MINOR ]`
      text.textColor = currentTrack === 1 ? Color4.create(0.2, 1.0, 0.8, 1) : Color4.create(1.0, 0.3, 0.8, 1)
    }
  )

  // Deck Right: Beat Drop / Fireworks Celebration
  pointerEventsSystem.onPointerDown(
    {
      entity: deckRight,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Trigger Bass Drop & Stage Pyro!' }
    },
    () => {
      isBassDrop = true
      AudioSource.playSound(deckRight, 'assets/Audio/fireworkexplode.mp3')
      const text = TextShape.getMutable(djScreen)
      text.text = '🔥 BASS DROP ACTIVATED! 🔥\n[ ENERGY 100% | RAVE MODE ]'
      text.textColor = Color4.create(1.0, 0.85, 0.2, 1)

      // Burst ripples on all dance tiles
      danceTiles.forEach((t) => {
        t.activePulse = 2.5
      })

      // Reset text after 4 seconds
      const resetEntity = engine.addEntity()
      let timer = 0
      engine.addSystem((dt: number) => {
        if (!isBassDrop) return
        timer += dt
        if (timer >= 4.0) {
          isBassDrop = false
          const curText = TextShape.getMutable(djScreen)
          curText.text = `♫ NOW PLAYING: CLUB MIX ${currentTrack} ♫\n[ TEMPO: 128 BPM | KEY: D MINOR ]`
          curText.textColor = Color4.create(0.2, 1.0, 0.8, 1)
          engine.removeEntity(resetEntity)
        }
      })
    }
  )

  // ---------------------------------------------------------------------------
  // 5. VIP Party Lounge (West Terrace Deck: X = 23 to 27)
  // ---------------------------------------------------------------------------
  const VIP_CENTER_X = 24.2
  const VIP_CENTER_Z = 16.5
  const VIP_FLOOR_Y = ROOF_Y + 0.15

  // Elevated VIP Marble Dais
  const vipDais = engine.addEntity()
  Transform.create(vipDais, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y, VIP_CENTER_Z),
    scale: Vector3.create(6.8, 0.22, 7.5)
  })
  MeshRenderer.setBox(vipDais)
  MeshCollider.setBox(vipDais)
  Material.setPbrMaterial(vipDais, travertineMarbleMat)

  // VIP Gold Border
  const vipDaisTrim = engine.addEntity()
  Transform.create(vipDaisTrim, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.05, VIP_CENTER_Z),
    scale: Vector3.create(6.9, 0.06, 7.6)
  })
  MeshRenderer.setBox(vipDaisTrim)
  Material.setPbrMaterial(vipDaisTrim, polishedGoldMat)

  // Semicircular VIP Velvet Booth (North Curve)
  const boothBackNorth = engine.addEntity()
  Transform.create(boothBackNorth, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.65, VIP_CENTER_Z - 2.6),
    scale: Vector3.create(4.6, 0.90, 0.65)
  })
  MeshRenderer.setBox(boothBackNorth)
  MeshCollider.setBox(boothBackNorth)
  Material.setPbrMaterial(boothBackNorth, royalVelvetMat)

  const boothSeatNorth = engine.addEntity()
  Transform.create(boothSeatNorth, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.25, VIP_CENTER_Z - 2.1),
    scale: Vector3.create(4.6, 0.45, 0.85)
  })
  MeshRenderer.setBox(boothSeatNorth)
  MeshCollider.setBox(boothSeatNorth)
  Material.setPbrMaterial(boothSeatNorth, crimsonVelvetMat)

  // Semicircular VIP Velvet Booth (South Curve)
  const boothBackSouth = engine.addEntity()
  Transform.create(boothBackSouth, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.65, VIP_CENTER_Z + 2.6),
    scale: Vector3.create(4.6, 0.90, 0.65)
  })
  MeshRenderer.setBox(boothBackSouth)
  MeshCollider.setBox(boothBackSouth)
  Material.setPbrMaterial(boothBackSouth, royalVelvetMat)

  const boothSeatSouth = engine.addEntity()
  Transform.create(boothSeatSouth, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.25, VIP_CENTER_Z + 2.1),
    scale: Vector3.create(4.6, 0.45, 0.85)
  })
  MeshRenderer.setBox(boothSeatSouth)
  MeshCollider.setBox(boothSeatSouth)
  Material.setPbrMaterial(boothSeatSouth, crimsonVelvetMat)

  // Backlit Onyx Cocktail Tables
  const createCocktailTable = (pos: Vector3) => {
    // Table Base Stem
    const stem = engine.addEntity()
    Transform.create(stem, {
      position: Vector3.create(pos.x, pos.y + 0.25, pos.z),
      scale: Vector3.create(0.12, 0.50, 0.12)
    })
    MeshRenderer.setCylinder(stem)
    Material.setPbrMaterial(stem, polishedGoldMat)

    // Table Top
    const top = engine.addEntity()
    Transform.create(top, {
      position: Vector3.create(pos.x, pos.y + 0.52, pos.z),
      scale: Vector3.create(1.2, 0.05, 1.2)
    })
    MeshRenderer.setCylinder(top)
    MeshCollider.setBox(top)
    Material.setPbrMaterial(top, obsidianDeckMat)

    // Champagne Bucket on table
    const bucket = engine.addEntity()
    Transform.create(bucket, {
      position: Vector3.create(pos.x, pos.y + 0.68, pos.z),
      scale: Vector3.create(0.24, 0.28, 0.24)
    })
    MeshRenderer.setCylinder(bucket)
    Material.setPbrMaterial(bucket, polishedGoldMat)

    // Champagne Bottle
    const bottle = engine.addEntity()
    Transform.create(bottle, {
      position: Vector3.create(pos.x, pos.y + 0.88, pos.z),
      scale: Vector3.create(0.08, 0.35, 0.08)
    })
    MeshRenderer.setCylinder(bottle)
    Material.setPbrMaterial(bottle, neonAmberMat)
  }

  createCocktailTable(Vector3.create(VIP_CENTER_X - 1.2, VIP_FLOOR_Y, VIP_CENTER_Z - 1.2))
  createCocktailTable(Vector3.create(VIP_CENTER_X + 1.2, VIP_FLOOR_Y, VIP_CENTER_Z - 1.2))
  createCocktailTable(Vector3.create(VIP_CENTER_X - 1.2, VIP_FLOOR_Y, VIP_CENTER_Z + 1.2))
  createCocktailTable(Vector3.create(VIP_CENTER_X + 1.2, VIP_FLOOR_Y, VIP_CENTER_Z + 1.2))

  // VIP Stanchions & Velvet Rope
  const stanchionPositions = [
    Vector3.create(VIP_CENTER_X + 3.2, VIP_FLOOR_Y, VIP_CENTER_Z - 3.2),
    Vector3.create(VIP_CENTER_X + 3.2, VIP_FLOOR_Y, VIP_CENTER_Z),
    Vector3.create(VIP_CENTER_X + 3.2, VIP_FLOOR_Y, VIP_CENTER_Z + 3.2)
  ]
  stanchionPositions.forEach((pos) => {
    const post = engine.addEntity()
    Transform.create(post, {
      position: Vector3.create(pos.x, pos.y + 0.48, pos.z),
      scale: Vector3.create(0.08, 0.96, 0.08)
    })
    MeshRenderer.setCylinder(post)
    Material.setPbrMaterial(post, polishedGoldMat)

    const ball = engine.addEntity()
    Transform.create(ball, {
      position: Vector3.create(pos.x, pos.y + 0.98, pos.z),
      scale: Vector3.create(0.16, 0.16, 0.16)
    })
    MeshRenderer.setBox(ball)
    Material.setPbrMaterial(ball, polishedGoldMat)
  })

  // VIP Floating Sign
  const vipSign = engine.addEntity()
  Transform.create(vipSign, {
    position: Vector3.create(VIP_CENTER_X + 3.2, VIP_FLOOR_Y + 1.8, VIP_CENTER_Z)
  })
  TextShape.create(vipSign, {
    text: '✦ PRIVATE VIP LOUNGE ✦\n[ RESERVED FOR RESORT GUESTS ]',
    fontSize: 1.5,
    textColor: Color4.create(1.0, 0.82, 0.35, 1)
  })
  Billboard.create(vipSign, {
    billboardMode: BillboardMode.BM_Y
  })

  // ---------------------------------------------------------------------------
  // 6. Rooftop Club Cocktail Bar (East Terrace Deck: X = 37 to 42)
  // ---------------------------------------------------------------------------
  const BAR_CENTER_X = 39.5
  const BAR_CENTER_Z = 16.5
  const BAR_Y = ROOF_Y

  // Bar Counter (L-Shape / Linear 5.6m)
  const barCounter = engine.addEntity()
  Transform.create(barCounter, {
    position: Vector3.create(BAR_CENTER_X, BAR_Y + 0.60, BAR_CENTER_Z),
    scale: Vector3.create(1.2, 1.20, 6.2)
  })
  MeshRenderer.setBox(barCounter)
  MeshCollider.setBox(barCounter)
  Material.setPbrMaterial(barCounter, obsidianDeckMat)

  // Glowing Front LED Apron
  const barFrontLed = engine.addEntity()
  Transform.create(barFrontLed, {
    position: Vector3.create(BAR_CENTER_X - 0.62, BAR_Y + 0.60, BAR_CENTER_Z),
    scale: Vector3.create(0.04, 1.16, 6.1)
  })
  MeshRenderer.setBox(barFrontLed)
  Material.setPbrMaterial(barFrontLed, neonCyanMat)

  // Bar Top Marble Slab
  const barTop = engine.addEntity()
  Transform.create(barTop, {
    position: Vector3.create(BAR_CENTER_X, BAR_Y + 1.22, BAR_CENTER_Z),
    scale: Vector3.create(1.4, 0.08, 6.4)
  })
  MeshRenderer.setBox(barTop)
  MeshCollider.setBox(barTop)
  Material.setPbrMaterial(barTop, travertineMarbleMat)

  // Back-Bar Shelving Wall
  const backBarWall = engine.addEntity()
  Transform.create(backBarWall, {
    position: Vector3.create(BAR_CENTER_X + 1.8, BAR_Y + 1.6, BAR_CENTER_Z),
    scale: Vector3.create(0.35, 3.2, 6.2)
  })
  MeshRenderer.setBox(backBarWall)
  MeshCollider.setBox(backBarWall)
  Material.setPbrMaterial(backBarWall, obsidianDeckMat)

  // 3 Shelves with glowing bottles
  for (let s = 0; s < 3; s++) {
    const shelfY = BAR_Y + 0.9 + s * 0.85
    const shelf = engine.addEntity()
    Transform.create(shelf, {
      position: Vector3.create(BAR_CENTER_X + 1.6, shelfY, BAR_CENTER_Z),
      scale: Vector3.create(0.35, 0.05, 5.8)
    })
    MeshRenderer.setBox(shelf)
    Material.setPbrMaterial(shelf, polishedGoldMat)

    // Glowing bottles along each shelf
    for (let b = -4; b <= 4; b++) {
      const bottleEntity = engine.addEntity()
      Transform.create(bottleEntity, {
        position: Vector3.create(BAR_CENTER_X + 1.6, shelfY + 0.18, BAR_CENTER_Z + b * 0.58),
        scale: Vector3.create(0.10, 0.32, 0.10)
      })
      MeshRenderer.setCylinder(bottleEntity)
      const bMat = palette[(Math.abs(b) + s) % palette.length]
      Material.setPbrMaterial(bottleEntity, bMat)
    }
  }

  // 5 Modern Barstools
  for (let stool = -2; stool <= 2; stool++) {
    const stoolZ = BAR_CENTER_Z + stool * 1.25

    // Stool base
    const stoolPost = engine.addEntity()
    Transform.create(stoolPost, {
      position: Vector3.create(BAR_CENTER_X - 1.2, BAR_Y + 0.38, stoolZ),
      scale: Vector3.create(0.08, 0.75, 0.08)
    })
    MeshRenderer.setCylinder(stoolPost)
    Material.setPbrMaterial(stoolPost, polishedGoldMat)

    // Stool seat cushion
    const stoolSeat = engine.addEntity()
    Transform.create(stoolSeat, {
      position: Vector3.create(BAR_CENTER_X - 1.2, BAR_Y + 0.76, stoolZ),
      scale: Vector3.create(0.48, 0.12, 0.48)
    })
    MeshRenderer.setCylinder(stoolSeat)
    MeshCollider.setBox(stoolSeat)
    Material.setPbrMaterial(stoolSeat, crimsonVelvetMat)
  }

  // Bar Neon Sign
  const barSign = engine.addEntity()
  Transform.create(barSign, {
    position: Vector3.create(BAR_CENTER_X, BAR_Y + 3.4, BAR_CENTER_Z)
  })
  TextShape.create(barSign, {
    text: '✦ SKYLINE COCKTAIL BAR ✦\n[ CLICK SHAKER TO ORDER SIGNATURE DRINKS ]',
    fontSize: 1.6,
    textColor: Color4.create(0.1, 0.9, 1.0, 1)
  })
  Billboard.create(barSign, {
    billboardMode: BillboardMode.BM_Y
  })

  // Interactive Cocktail Shaker
  const cocktailShaker = engine.addEntity()
  Transform.create(cocktailShaker, {
    position: Vector3.create(BAR_CENTER_X - 0.4, BAR_Y + 1.35, BAR_CENTER_Z),
    scale: Vector3.create(0.18, 0.34, 0.18)
  })
  MeshRenderer.setCylinder(cocktailShaker)
  MeshCollider.setBox(cocktailShaker)
  Material.setPbrMaterial(cocktailShaker, polishedGoldMat)

  const drinkMenu = [
    '🍸 SERVED: "Neon Nitro Mojito" (Lime & Electric Mint)',
    '🍹 SERVED: "Skyline Sunset Daiquiri" (Blood Orange & Rum)',
    '🥂 SERVED: "Imperial Sapphire Champagne" (Blue Curacao & Gold Leaf)',
    '🥃 SERVED: "Smoked Obsidian Bourbon" (Vanilla & Toasted Wood)'
  ]
  let drinkIndex = 0

  pointerEventsSystem.onPointerDown(
    {
      entity: cocktailShaker,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Order Craft Cocktail' }
    },
    () => {
      const drink = drinkMenu[drinkIndex % drinkMenu.length]
      drinkIndex++
      AudioSource.playSound(cocktailShaker, 'assets/Audio/button-sound.mp3')
      const text = TextShape.getMutable(barSign)
      text.text = `${drink}\n✦ ENJOY AT THE SKYLINE BAR ✦`
      text.textColor = Color4.create(1.0, 0.85, 0.3, 1)
    }
  )

  // ---------------------------------------------------------------------------
  // 7. VIP Sky Lift (Direct Express Portal between Ground Lobby & Rooftop Club)
  // ---------------------------------------------------------------------------
  // Ground Atrium: X = 32.0, Z = 19.8, Y = 2.50
  // Rooftop Club:  X = 32.0, Z = 19.8, Y = 11.20
  const LIFT_X = 32.0
  const LIFT_Z = 19.8
  const GROUND_LOBBY_Y = 2.50
  const SKY_CLUB_Y = 11.20

  // Glass Lift Column Shaft
  const liftShaft = engine.addEntity()
  const liftShaftHeight = SKY_CLUB_Y - GROUND_LOBBY_Y + 3.2
  const liftShaftCenterY = (GROUND_LOBBY_Y + SKY_CLUB_Y + 3.0) * 0.5
  Transform.create(liftShaft, {
    position: Vector3.create(LIFT_X, liftShaftCenterY, LIFT_Z),
    scale: Vector3.create(2.2, liftShaftHeight, 2.2)
  })
  MeshRenderer.setCylinder(liftShaft)
  Material.setPbrMaterial(liftShaft, smokedGlassMat)

  // Three invisible collider panels make the glass shaft solid while keeping
  // its +Z lobby entrance open for the call station and player teleport.
  const addLiftWallCollider = (position: Vector3, scale: Vector3) => {
    const collider = engine.addEntity()
    Transform.create(collider, { position, scale })
    MeshCollider.setBox(collider)
  }
  const liftRadius = 1.1
  const liftWallThickness = 0.12
  const liftWallInset = liftRadius - liftWallThickness * 0.5
  addLiftWallCollider(
    Vector3.create(LIFT_X, liftShaftCenterY, LIFT_Z - liftWallInset),
    Vector3.create(2.2, liftShaftHeight, liftWallThickness)
  )
  addLiftWallCollider(
    Vector3.create(LIFT_X - liftWallInset, liftShaftCenterY, LIFT_Z),
    Vector3.create(liftWallThickness, liftShaftHeight, 2.2 - liftWallThickness)
  )
  addLiftWallCollider(
    Vector3.create(LIFT_X + liftWallInset, liftShaftCenterY, LIFT_Z),
    Vector3.create(liftWallThickness, liftShaftHeight, 2.2 - liftWallThickness)
  )

  // Ground Lobby Call Station
  const groundCallPedestal = engine.addEntity()
  Transform.create(groundCallPedestal, {
    position: Vector3.create(LIFT_X, GROUND_LOBBY_Y + 0.55, LIFT_Z + 1.35),
    scale: Vector3.create(0.40, 1.10, 0.25)
  })
  MeshRenderer.setBox(groundCallPedestal)
  Material.setPbrMaterial(groundCallPedestal, polishedGoldMat)

  const groundCallBtn = engine.addEntity()
  Transform.create(groundCallBtn, {
    position: Vector3.create(LIFT_X, GROUND_LOBBY_Y + 1.15, LIFT_Z + 1.22),
    scale: Vector3.create(0.24, 0.16, 0.08)
  })
  MeshRenderer.setBox(groundCallBtn)
  MeshCollider.setBox(groundCallBtn)
  Material.setPbrMaterial(groundCallBtn, neonCyanMat)

  const groundCallSign = engine.addEntity()
  Transform.create(groundCallSign, {
    position: Vector3.create(LIFT_X, GROUND_LOBBY_Y + 1.85, LIFT_Z + 1.55)
  })
  TextShape.create(groundCallSign, {
    text: '▲ EXPRESS SKY LIFT ▲\n[ CLICK TO ENTER ROOFTOP CLUB ]',
    fontSize: 1.05,
    textColor: Color4.create(0.1, 0.9, 1.0, 1)
  })
  Billboard.create(groundCallSign, { billboardMode: BillboardMode.BM_Y })

  pointerEventsSystem.onPointerDown(
    {
      entity: groundCallBtn,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Ride Sky Lift to Rooftop Club' }
    },
    () => {
      AudioSource.playSound(groundCallBtn, 'assets/Audio/button-sound.mp3')
      movePlayerTo({
        newRelativePosition: Vector3.create(LIFT_X, SKY_CLUB_Y + 0.15, LIFT_Z - 0.6),
        cameraTarget: Vector3.create(32.0, SKY_CLUB_Y + 1.6, 16.0)
      })
    }
  )

  // Rooftop Club Return Station
  const roofCallPedestal = engine.addEntity()
  Transform.create(roofCallPedestal, {
    position: Vector3.create(LIFT_X, SKY_CLUB_Y + 0.55, LIFT_Z + 1.35),
    scale: Vector3.create(0.40, 1.10, 0.25)
  })
  MeshRenderer.setBox(roofCallPedestal)
  Material.setPbrMaterial(roofCallPedestal, polishedGoldMat)

  const roofCallBtn = engine.addEntity()
  Transform.create(roofCallBtn, {
    position: Vector3.create(LIFT_X, SKY_CLUB_Y + 1.15, LIFT_Z + 1.22),
    scale: Vector3.create(0.24, 0.16, 0.08)
  })
  MeshRenderer.setBox(roofCallBtn)
  MeshCollider.setBox(roofCallBtn)
  Material.setPbrMaterial(roofCallBtn, neonMagentaMat)

  const roofCallSign = engine.addEntity()
  Transform.create(roofCallSign, {
    position: Vector3.create(LIFT_X, SKY_CLUB_Y + 1.85, LIFT_Z + 1.55)
  })
  TextShape.create(roofCallSign, {
    text: '▼ EXPRESS SKY LIFT ▼\n[ CLICK TO RETURN TO VILLA RECEPTION ]',
    fontSize: 1.05,
    textColor: Color4.create(1.0, 0.85, 0.35, 1)
  })
  Billboard.create(roofCallSign, { billboardMode: BillboardMode.BM_Y })

  pointerEventsSystem.onPointerDown(
    {
      entity: roofCallBtn,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Ride Sky Lift down to Villa Lobby' }
    },
    () => {
      AudioSource.playSound(roofCallBtn, 'assets/Audio/button-sound.mp3')
      movePlayerTo({
        newRelativePosition: Vector3.create(LIFT_X, GROUND_LOBBY_Y + 0.15, LIFT_Z + 2.5),
        cameraTarget: Vector3.create(32.0, GROUND_LOBBY_Y + 1.6, 23.8)
      })
    }
  )

  // ---------------------------------------------------------------------------
  // 8. Walkable Grand Skyline Staircase (Suite 3 SkyBridge to Rooftop Terrace)
  // ---------------------------------------------------------------------------
  // Suite 3 Floor at Y = 7.15, ascending to Rooftop Deck at Y = 11.20 (4.05m rise)
  // Steps run from X = 23.5 up eastward to X = 20.0, or along Z = 13.0
  for (let s = 0; s <= STAIR_STEPS; s++) {
    const frac = s / STAIR_STEPS
    const stepX = STAIR_START_X + (STAIR_END_X - STAIR_START_X) * frac
    const stepY = STAIR_START_Y + (STAIR_END_Y - STAIR_START_Y) * frac
    const stepZ = STAIR_START_Z

    const tread = engine.addEntity()
    Transform.create(tread, {
      position: Vector3.create(stepX, stepY + 0.08, stepZ),
      scale: Vector3.create(0.32, 0.16, 1.8)
    })
    MeshRenderer.setBox(tread)
    MeshCollider.setBox(tread)
    Material.setPbrMaterial(tread, travertineMarbleMat)

    // LED tread underglow
    const treadGlow = engine.addEntity()
    Transform.create(treadGlow, {
      position: Vector3.create(stepX, stepY + 0.02, stepZ),
      scale: Vector3.create(0.34, 0.04, 1.82)
    })
    MeshRenderer.setBox(treadGlow)
    Material.setPbrMaterial(treadGlow, neonCyanMat)
  }

  // ---------------------------------------------------------------------------
  // 9. Dynamic System: Moving Spotlights & Pulsating Dance Floor Waves
  // ---------------------------------------------------------------------------
  let animTime = 0

  engine.addSystem((dt: number) => {
    animTime += dt

    // Moving intelligent spotlight sweep
    const pitchLeft = 40 + Math.sin(animTime * 2.2) * 22
    const yawLeft = Math.cos(animTime * 1.6) * 35
    const leftTrans = Transform.getMutable(spotLeft)
    leftTrans.rotation = Quaternion.fromEulerDegrees(pitchLeft, yawLeft, 0)

    const pitchRight = 40 + Math.cos(animTime * 2.4) * 22
    const yawRight = Math.sin(animTime * 1.8) * -35
    const rightTrans = Transform.getMutable(spotRight)
    rightTrans.rotation = Quaternion.fromEulerDegrees(pitchRight, yawRight, 0)

    // Dynamic Dance Floor Color Animation
    danceTiles.forEach((tile) => {
      if (tile.activePulse > 0) {
        tile.activePulse = Math.max(0, tile.activePulse - dt * 1.5)
        Material.setPbrMaterial(tile.entity, neonAmberMat)
      } else {
        // Continuous wave pattern across grid
        const wave = Math.sin(animTime * 3.5 + tile.row * 1.2 + tile.col * 1.2)
        const matIdx = Math.floor(((wave + 1) * 0.5) * palette.length) % palette.length
        Material.setPbrMaterial(tile.entity, palette[matIdx])
      }
    })
  })
}
