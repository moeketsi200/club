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
  // Seamlessly integrated with Villa Suite 6 & the East Wing Grand Staircase
  // ---------------------------------------------------------------------------
  const ROOF_Y = 11.20
  const DECK_CENTER_X = 32.0
  const DECK_CENTER_Z = 16.0

  // 1) Main East Rooftop Dance & Club Deck (X: 24.5 to 44.5, Z: 8.6 to 23.4)
  const mainDeck = engine.addEntity()
  Transform.create(mainDeck, {
    position: Vector3.create(34.5, ROOF_Y, 16.0),
    scale: Vector3.create(20.0, 0.35, 14.8)
  })
  MeshRenderer.setBox(mainDeck)
  MeshCollider.setBox(mainDeck)
  Material.setPbrMaterial(mainDeck, obsidianDeckMat)

  // 2) West VIP Terrace Deck (X: 19.5 to 24.5, Z: 8.6 to 16.7 - South of Suite 6 Penthouse)
  const westVipDeck = engine.addEntity()
  Transform.create(westVipDeck, {
    position: Vector3.create(22.0, ROOF_Y, 12.65),
    scale: Vector3.create(5.0, 0.35, 8.1)
  })
  MeshRenderer.setBox(westVipDeck)
  MeshCollider.setBox(westVipDeck)
  Material.setPbrMaterial(westVipDeck, obsidianDeckMat)

  // 3) Seamless Stair Arrival Landing Connector (X: 20.0 to 24.5, Z: 20.6 to 22.2)
  // Perfectly flush with the villa's East Wing Grand Staircase exit (EastWing_F2_Step_17 at X = 20.0)
  const stairLandingConnector = engine.addEntity()
  Transform.create(stairLandingConnector, {
    position: Vector3.create(22.25, ROOF_Y, 21.40),
    scale: Vector3.create(4.5, 0.35, 1.60)
  })
  MeshRenderer.setBox(stairLandingConnector)
  MeshCollider.setBox(stairLandingConnector)
  Material.setPbrMaterial(stairLandingConnector, obsidianDeckMat)

  const createDeckTrim = (position: Vector3, scale: Vector3) => {
    const trim = engine.addEntity()
    Transform.create(trim, { position, scale })
    MeshRenderer.setBox(trim)
    Material.setPbrMaterial(trim, polishedGoldMat)
  }

  // Polished Gold Perimeter Trim (cleanly matches deck borders without obstructing walkways)
  createDeckTrim(Vector3.create(32.0, ROOF_Y, 8.6), Vector3.create(25.12, 0.36, 0.08)) // North edge
  createDeckTrim(Vector3.create(44.5, ROOF_Y, 16.0), Vector3.create(0.08, 0.36, 14.8)) // East edge
  createDeckTrim(Vector3.create(34.5, ROOF_Y, 23.4), Vector3.create(20.12, 0.36, 0.08)) // South edge (Main Deck)
  createDeckTrim(Vector3.create(19.5, ROOF_Y, 12.65), Vector3.create(0.08, 0.36, 8.1)) // West edge (VIP Terrace)

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

  // North railing (facing rear scenic hills - full width)
  createRailing(
    Vector3.create(32.0, ROOF_Y, 8.6),
    Vector3.create(25.0, 1.15, 0.06)
  )
  // East railing (facing east skyline - full depth)
  createRailing(
    Vector3.create(44.5, ROOF_Y, 16.0),
    Vector3.create(0.06, 1.15, 14.8)
  )
  // South railing (Main Deck - ends flush at Suite 6 Penthouse front wall, 100% open for stair arrival)
  createRailing(
    Vector3.create(34.5, ROOF_Y, 23.4),
    Vector3.create(20.0, 1.15, 0.06)
  )
  // West railing (VIP Terrace - ends flush at Suite 6 Penthouse rear wall, leaves stair arrival 100% unobstructed)
  createRailing(
    Vector3.create(19.5, ROOF_Y, 12.65),
    Vector3.create(0.06, 1.15, 8.1)
  )

  // Floating Club Grand Billboard Sign above North Edge
  const clubSign = engine.addEntity()
  Transform.create(clubSign, {
    position: Vector3.create(DECK_CENTER_X, ROOF_Y + 7.6, 9.0)
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
  // Positioned with ample clearance from the Suite 6 Penthouse doorway (Z = 18.6 - 20.1)
  // ---------------------------------------------------------------------------
  const VIP_CENTER_X = 24.2
  const VIP_CENTER_Z = 14.2
  const VIP_FLOOR_Y = ROOF_Y + 0.15

  // Elevated VIP Marble Dais
  const vipDais = engine.addEntity()
  Transform.create(vipDais, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y, VIP_CENTER_Z),
    scale: Vector3.create(5.8, 0.22, 5.0)
  })
  MeshRenderer.setBox(vipDais)
  MeshCollider.setBox(vipDais)
  Material.setPbrMaterial(vipDais, travertineMarbleMat)

  // VIP Gold Border
  const vipDaisTrim = engine.addEntity()
  Transform.create(vipDaisTrim, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.05, VIP_CENTER_Z),
    scale: Vector3.create(5.9, 0.06, 5.1)
  })
  MeshRenderer.setBox(vipDaisTrim)
  Material.setPbrMaterial(vipDaisTrim, polishedGoldMat)

  // Semicircular VIP Velvet Booth (North Curve)
  const boothBackNorth = engine.addEntity()
  Transform.create(boothBackNorth, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.65, VIP_CENTER_Z - 1.9),
    scale: Vector3.create(4.2, 0.90, 0.55)
  })
  MeshRenderer.setBox(boothBackNorth)
  MeshCollider.setBox(boothBackNorth)
  Material.setPbrMaterial(boothBackNorth, royalVelvetMat)

  const boothSeatNorth = engine.addEntity()
  Transform.create(boothSeatNorth, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.25, VIP_CENTER_Z - 1.5),
    scale: Vector3.create(4.2, 0.45, 0.70)
  })
  MeshRenderer.setBox(boothSeatNorth)
  MeshCollider.setBox(boothSeatNorth)
  Material.setPbrMaterial(boothSeatNorth, crimsonVelvetMat)

  // Semicircular VIP Velvet Booth (South Curve - leaves 2.2m open walkway to Suite 6 Penthouse door)
  const boothBackSouth = engine.addEntity()
  Transform.create(boothBackSouth, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.65, VIP_CENTER_Z + 1.9),
    scale: Vector3.create(4.2, 0.90, 0.55)
  })
  MeshRenderer.setBox(boothBackSouth)
  MeshCollider.setBox(boothBackSouth)
  Material.setPbrMaterial(boothBackSouth, royalVelvetMat)

  const boothSeatSouth = engine.addEntity()
  Transform.create(boothSeatSouth, {
    position: Vector3.create(VIP_CENTER_X, VIP_FLOOR_Y + 0.25, VIP_CENTER_Z + 1.5),
    scale: Vector3.create(4.2, 0.45, 0.70)
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

  createCocktailTable(Vector3.create(VIP_CENTER_X - 1.0, VIP_FLOOR_Y, VIP_CENTER_Z - 0.75))
  createCocktailTable(Vector3.create(VIP_CENTER_X + 1.0, VIP_FLOOR_Y, VIP_CENTER_Z - 0.75))
  createCocktailTable(Vector3.create(VIP_CENTER_X - 1.0, VIP_FLOOR_Y, VIP_CENTER_Z + 0.75))
  createCocktailTable(Vector3.create(VIP_CENTER_X + 1.0, VIP_FLOOR_Y, VIP_CENTER_Z + 0.75))

  // VIP Stanchions & Velvet Rope
  const stanchionPositions = [
    Vector3.create(VIP_CENTER_X + 2.8, VIP_FLOOR_Y, VIP_CENTER_Z - 2.0),
    Vector3.create(VIP_CENTER_X + 2.8, VIP_FLOOR_Y, VIP_CENTER_Z),
    Vector3.create(VIP_CENTER_X + 2.8, VIP_FLOOR_Y, VIP_CENTER_Z + 2.0)
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
    position: Vector3.create(VIP_CENTER_X + 2.8, VIP_FLOOR_Y + 1.8, VIP_CENTER_Z)
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
  // 6. Rooftop Club Freestanding Island Cocktail Bar (360° Open - No Walls)
  // Centered with generous open clearances on all 4 sides (does not touch any wall or railing)
  // ---------------------------------------------------------------------------
  const BAR_CENTER_X = 36.2
  const BAR_CENTER_Z = 15.5
  const BAR_Y = ROOF_Y

  // Freestanding Island Bar Counter Base (Obsidian)
  const barCounter = engine.addEntity()
  Transform.create(barCounter, {
    position: Vector3.create(BAR_CENTER_X, BAR_Y + 0.58, BAR_CENTER_Z),
    scale: Vector3.create(1.2, 1.15, 3.4)
  })
  MeshRenderer.setBox(barCounter)
  MeshCollider.setBox(barCounter)
  Material.setPbrMaterial(barCounter, obsidianDeckMat)

  // Bar Counter Gold Accent Trim
  const barCounterTrim = engine.addEntity()
  Transform.create(barCounterTrim, {
    position: Vector3.create(BAR_CENTER_X, BAR_Y + 1.15, BAR_CENTER_Z),
    scale: Vector3.create(1.26, 0.05, 3.46)
  })
  MeshRenderer.setBox(barCounterTrim)
  Material.setPbrMaterial(barCounterTrim, polishedGoldMat)

  // Bar Top Travertine Marble Slab
  const barTop = engine.addEntity()
  Transform.create(barTop, {
    position: Vector3.create(BAR_CENTER_X, BAR_Y + 1.20, BAR_CENTER_Z),
    scale: Vector3.create(1.40, 0.08, 3.6)
  })
  MeshRenderer.setBox(barTop)
  MeshCollider.setBox(barTop)
  Material.setPbrMaterial(barTop, travertineMarbleMat)

  // 360° Glowing LED Aprons (All 4 Sides of the Island Counter)
  const createBarApron = (pos: Vector3, scale: Vector3, mat: any) => {
    const apron = engine.addEntity()
    Transform.create(apron, { position: pos, scale })
    MeshRenderer.setBox(apron)
    Material.setPbrMaterial(apron, mat)
  }
  // West apron (facing dancefloor)
  createBarApron(Vector3.create(BAR_CENTER_X - 0.62, BAR_Y + 0.58, BAR_CENTER_Z), Vector3.create(0.04, 1.10, 3.3), neonCyanMat)
  // East apron (facing terrace)
  createBarApron(Vector3.create(BAR_CENTER_X + 0.62, BAR_Y + 0.58, BAR_CENTER_Z), Vector3.create(0.04, 1.10, 3.3), neonMagentaMat)
  // North apron
  createBarApron(Vector3.create(BAR_CENTER_X, BAR_Y + 0.58, BAR_CENTER_Z - 1.72), Vector3.create(1.2, 1.10, 0.04), neonCyanMat)
  // South apron
  createBarApron(Vector3.create(BAR_CENTER_X, BAR_Y + 0.58, BAR_CENTER_Z + 1.72), Vector3.create(1.2, 1.10, 0.04), neonMagentaMat)

  // Central Tiered Island Bottle Display (Freestanding on the marble counter top, 0 walls)
  // Lower Display Riser
  const tierLower = engine.addEntity()
  Transform.create(tierLower, {
    position: Vector3.create(BAR_CENTER_X, BAR_Y + 1.32, BAR_CENTER_Z),
    scale: Vector3.create(0.40, 0.16, 2.4)
  })
  MeshRenderer.setBox(tierLower)
  Material.setPbrMaterial(tierLower, polishedGoldMat)

  // Upper Display Riser
  const tierUpper = engine.addEntity()
  Transform.create(tierUpper, {
    position: Vector3.create(BAR_CENTER_X, BAR_Y + 1.48, BAR_CENTER_Z),
    scale: Vector3.create(0.22, 0.16, 1.8)
  })
  MeshRenderer.setBox(tierUpper)
  Material.setPbrMaterial(tierUpper, smokedGlassMat)

  // Illuminated Luxury Liquor Bottles on Display Risers
  for (let b = -3; b <= 3; b++) {
    // Lower tier bottles
    const bLower = engine.addEntity()
    Transform.create(bLower, {
      position: Vector3.create(BAR_CENTER_X + (b % 2 === 0 ? 0.10 : -0.10), BAR_Y + 1.48, BAR_CENTER_Z + b * 0.35),
      scale: Vector3.create(0.10, 0.30, 0.10)
    })
    MeshRenderer.setCylinder(bLower)
    Material.setPbrMaterial(bLower, palette[(Math.abs(b) + 1) % palette.length])

    // Upper tier bottles (inner 4)
    if (Math.abs(b) <= 2) {
      const bUpper = engine.addEntity()
      Transform.create(bUpper, {
        position: Vector3.create(BAR_CENTER_X, BAR_Y + 1.64, BAR_CENTER_Z + b * 0.35),
        scale: Vector3.create(0.09, 0.28, 0.09)
      })
      MeshRenderer.setCylinder(bUpper)
      Material.setPbrMaterial(bUpper, palette[(Math.abs(b) + 3) % palette.length])
    }
  }

  // Modern Barstools (West and East sides, leaving open walkways around the island)
  for (let sIdx = -1; sIdx <= 1; sIdx++) {
    const stoolZ = BAR_CENTER_Z + sIdx * 1.10

    for (const [stoolX, rotDeg] of [[BAR_CENTER_X - 1.05, 90], [BAR_CENTER_X + 1.05, -90]]) {
      // Stool post
      const stoolPost = engine.addEntity()
      Transform.create(stoolPost, {
        position: Vector3.create(stoolX, BAR_Y + 0.38, stoolZ),
        scale: Vector3.create(0.08, 0.75, 0.08)
      })
      MeshRenderer.setCylinder(stoolPost)
      Material.setPbrMaterial(stoolPost, polishedGoldMat)

      // Stool seat cushion
      const stoolSeat = engine.addEntity()
      Transform.create(stoolSeat, {
        position: Vector3.create(stoolX, BAR_Y + 0.76, stoolZ),
        scale: Vector3.create(0.48, 0.12, 0.48)
      })
      MeshRenderer.setCylinder(stoolSeat)
      MeshCollider.setBox(stoolSeat)
      Material.setPbrMaterial(stoolSeat, crimsonVelvetMat)
    }
  }

  // Bar Neon Sign
  const barSign = engine.addEntity()
  Transform.create(barSign, {
    position: Vector3.create(BAR_CENTER_X, BAR_Y + 3.2, BAR_CENTER_Z)
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
    position: Vector3.create(BAR_CENTER_X - 0.35, BAR_Y + 1.35, BAR_CENTER_Z),
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
  // 8. Dynamic System: Moving Spotlights & Pulsating Dance Floor Waves
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
