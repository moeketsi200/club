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
  LightSource
} from '@dcl/sdk/ecs'
import { Vector3, Color4, Color3, Quaternion } from '@dcl/sdk/math'

export function setupEstateGrounds() {
  // ---------------------------------------------------------------------------
  // 1. Estate Architectural Materials
  // ---------------------------------------------------------------------------
  const travertineStoneMat = {
    albedoColor: Color4.create(0.90, 0.88, 0.84, 1),
    metallic: 0.05,
    roughness: 0.35
  }

  const darkSlateMat = {
    albedoColor: Color4.create(0.14, 0.16, 0.18, 1),
    metallic: 0.30,
    roughness: 0.40
  }

  const polishedGoldMat = {
    albedoColor: Color4.create(0.90, 0.72, 0.28, 1),
    metallic: 0.95,
    roughness: 0.18
  }

  const reflectingPoolWaterMat = {
    albedoColor: Color4.create(0.04, 0.65, 0.82, 0.65),
    metallic: 0.15,
    roughness: 0.02,
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    emissiveColor: Color3.create(0.02, 0.25, 0.35),
    emissiveIntensity: 0.8
  }

  const manicuredLawnMat = {
    albedoColor: Color4.create(0.18, 0.44, 0.16, 1),
    metallic: 0.0,
    roughness: 0.75
  }

  const palmTrunkMat = {
    albedoColor: Color4.create(0.35, 0.24, 0.16, 1),
    metallic: 0.0,
    roughness: 0.65
  }

  const palmFoliageMat = {
    albedoColor: Color4.create(0.12, 0.52, 0.18, 1),
    metallic: 0.0,
    roughness: 0.55
  }

  const warmEmbersMat = {
    albedoColor: Color4.create(1.0, 0.42, 0.08, 1),
    emissiveColor: Color3.create(1.0, 0.38, 0.05),
    emissiveIntensity: 6.0
  }

  const bollardGlowMat = {
    albedoColor: Color4.create(1.0, 0.88, 0.60, 1),
    emissiveColor: Color3.create(1.0, 0.86, 0.55),
    emissiveIntensity: 4.0
  }

  // ---------------------------------------------------------------------------
  // 1. Scene Boundaries & Base Terrain (64m x 64m estate, 16 parcels)
  // Continuous elevated estate foundation that completely covers Genesis Plaza red terrain
  // ---------------------------------------------------------------------------
  const estateBase = engine.addEntity()
  Transform.create(estateBase, {
    position: Vector3.create(32.0, 0.10, 32.0),
    scale: Vector3.create(64.0, 0.25, 64.0)
  })
  MeshRenderer.setBox(estateBase)
  MeshCollider.setBox(estateBase)
  Material.setPbrMaterial(estateBase, darkSlateMat)

  // ---------------------------------------------------------------------------
  // 2. Grand Travertine Resort Plaza Floor (Surrounding Villa)
  // Replaces raw grass outside and beneath the villa with a seamless luxury stone terrace
  // ---------------------------------------------------------------------------
  const PLAZA_CENTER_X = 32.0
  const PLAZA_CENTER_Z = 14.5
  const PLAZA_WIDTH_X = 58.0
  const PLAZA_DEPTH_Z = 28.0
  const PLAZA_FLOOR_Y = 0.22

  // Dark Slate Accent Perimeter Rim
  const plazaRim = engine.addEntity()
  Transform.create(plazaRim, {
    position: Vector3.create(PLAZA_CENTER_X, PLAZA_FLOOR_Y - 0.01, PLAZA_CENTER_Z),
    scale: Vector3.create(PLAZA_WIDTH_X + 0.8, 0.26, PLAZA_DEPTH_Z + 0.8)
  })
  MeshRenderer.setBox(plazaRim)
  MeshCollider.setBox(plazaRim)
  Material.setPbrMaterial(plazaRim, darkSlateMat)

  // Polished Travertine Stone Plaza Floor (Flush with Arrival Boulevard at Z = 24 - 27)
  const villaPlazaFloor = engine.addEntity()
  Transform.create(villaPlazaFloor, {
    position: Vector3.create(PLAZA_CENTER_X, PLAZA_FLOOR_Y, PLAZA_CENTER_Z),
    scale: Vector3.create(PLAZA_WIDTH_X, 0.26, PLAZA_DEPTH_Z)
  })
  MeshRenderer.setBox(villaPlazaFloor)
  MeshCollider.setBox(villaPlazaFloor)
  Material.setPbrMaterial(villaPlazaFloor, travertineStoneMat)

  // Gold Architectural Inset Border along Plaza Perimeter
  const plazaTrimSegments = [
    { pos: Vector3.create(PLAZA_CENTER_X, PLAZA_FLOOR_Y + 0.135, PLAZA_CENTER_Z - PLAZA_DEPTH_Z * 0.5 + 0.25), scale: Vector3.create(PLAZA_WIDTH_X - 0.5, 0.015, 0.10) },
    { pos: Vector3.create(PLAZA_CENTER_X, PLAZA_FLOOR_Y + 0.135, PLAZA_CENTER_Z + PLAZA_DEPTH_Z * 0.5 - 0.25), scale: Vector3.create(PLAZA_WIDTH_X - 0.5, 0.015, 0.10) },
    { pos: Vector3.create(PLAZA_CENTER_X - PLAZA_WIDTH_X * 0.5 + 0.25, PLAZA_FLOOR_Y + 0.135, PLAZA_CENTER_Z), scale: Vector3.create(0.10, 0.015, PLAZA_DEPTH_Z - 0.5) },
    { pos: Vector3.create(PLAZA_CENTER_X + PLAZA_WIDTH_X * 0.5 - 0.25, PLAZA_FLOOR_Y + 0.135, PLAZA_CENTER_Z), scale: Vector3.create(0.10, 0.015, PLAZA_DEPTH_Z - 0.5) }
  ]
  plazaTrimSegments.forEach((seg) => {
    const goldTrim = engine.addEntity()
    Transform.create(goldTrim, { position: seg.pos, scale: seg.scale })
    MeshRenderer.setBox(goldTrim)
    Material.setPbrMaterial(goldTrim, polishedGoldMat)
  })

  // ---------------------------------------------------------------------------
  // 2B. Landscaped Garden Lawn Areas (Front Park & Estate Borders)
  // Clean green manicured turf elevated safely above Genesis Plaza terrain
  // ---------------------------------------------------------------------------
  const createLawnSection = (pos: Vector3, scale: Vector3) => {
    const lawn = engine.addEntity()
    Transform.create(lawn, { position: pos, scale })
    MeshRenderer.setBox(lawn)
    MeshCollider.setBox(lawn)
    Material.setPbrMaterial(lawn, manicuredLawnMat)
  }

  // Front Estate Park Lawn (Z: 26.8 to 63.8, hosting cabanas, pools, avenue, fire pit)
  createLawnSection(Vector3.create(32.0, 0.16, 45.3), Vector3.create(63.8, 0.16, 37.0))
  // West Side Garden Strip
  createLawnSection(Vector3.create(2.5, 0.16, 14.5), Vector3.create(5.0, 0.16, 25.0))
  // East Side Garden Strip
  createLawnSection(Vector3.create(61.5, 0.16, 14.5), Vector3.create(5.0, 0.16, 25.0))
  // North / Rear Garden Strip
  createLawnSection(Vector3.create(32.0, 0.16, 1.0), Vector3.create(63.8, 0.16, 2.0))

  // ---------------------------------------------------------------------------
  // 3. Grand Arrival Boulevard & VIP Avenue (Z = 24 to 58)
  // ---------------------------------------------------------------------------
  // Main Paved Travertine Boulevard (10m wide)
  const avenueLength = 34.0
  const avenueCenterZ = 24.0 + avenueLength * 0.5 // 41.0m
  const avenue = engine.addEntity()
  Transform.create(avenue, {
    position: Vector3.create(32.0, 0.24, avenueCenterZ),
    scale: Vector3.create(10.2, 0.22, avenueLength)
  })
  MeshRenderer.setBox(avenue)
  MeshCollider.setBox(avenue)
  Material.setPbrMaterial(avenue, travertineStoneMat)

  // VIP Bronze & Slate Central Runner
  const runner = engine.addEntity()
  Transform.create(runner, {
    position: Vector3.create(32.0, 0.36, avenueCenterZ),
    scale: Vector3.create(3.6, 0.04, avenueLength)
  })
  MeshRenderer.setBox(runner)
  MeshCollider.setBox(runner)
  Material.setPbrMaterial(runner, darkSlateMat)

  // Gold Edging Strips along Runner
  for (const offX of [-1.82, 1.82]) {
    const goldStrip = engine.addEntity()
    Transform.create(goldStrip, {
      position: Vector3.create(32.0 + offX, 0.37, avenueCenterZ),
      scale: Vector3.create(0.08, 0.04, avenueLength)
    })
    MeshRenderer.setBox(goldStrip)
    Material.setPbrMaterial(goldStrip, polishedGoldMat)
  }

  // ---------------------------------------------------------------------------
  // 4. Symmetrical Reflecting Water Pools & Underwater Lighting
  // ---------------------------------------------------------------------------
  const createReflectingPool = (centerX: number) => {
    const poolZ = 39.0
    const poolLength = 18.0
    const poolWidth = 5.6

    // Stone Coping Basin Rim
    const poolRim = engine.addEntity()
    Transform.create(poolRim, {
      position: Vector3.create(centerX, 0.36, poolZ),
      scale: Vector3.create(poolWidth + 0.6, 0.36, poolLength + 0.6)
    })
    MeshRenderer.setBox(poolRim)
    MeshCollider.setBox(poolRim)
    Material.setPbrMaterial(poolRim, travertineStoneMat)

    // Inner Pool Basin Floor
    const poolFloor = engine.addEntity()
    Transform.create(poolFloor, {
      position: Vector3.create(centerX, 0.20, poolZ),
      scale: Vector3.create(poolWidth, 0.04, poolLength)
    })
    MeshRenderer.setBox(poolFloor)
    Material.setPbrMaterial(poolFloor, darkSlateMat)

    // Pool Water Surface
    const poolWater = engine.addEntity()
    Transform.create(poolWater, {
      position: Vector3.create(centerX, 0.40, poolZ),
      scale: Vector3.create(poolWidth, 0.02, poolLength)
    })
    MeshRenderer.setBox(poolWater)
    Material.setPbrMaterial(poolWater, reflectingPoolWaterMat)

    // 3 Fountain Water Jets per pool
    for (const zOff of [-5.5, 0, 5.5]) {
      const fountainSpout = engine.addEntity()
      Transform.create(fountainSpout, {
        position: Vector3.create(centerX, 0.85, poolZ + zOff),
        scale: Vector3.create(0.35, 0.85, 0.35)
      })
      MeshRenderer.setCylinder(fountainSpout)
      Material.setPbrMaterial(fountainSpout, reflectingPoolWaterMat)

      // Submerged LED Glow
      const poolLed = engine.addEntity()
      Transform.create(poolLed, {
        position: Vector3.create(centerX, 0.50, poolZ + zOff)
      })
      LightSource.create(poolLed, {
        type: LightSource.Type.Point({}),
        color: Color3.create(0.1, 0.8, 1.0),
        intensity: 5000,
        range: 6
      })
    }
  }

  // West Reflecting Pool
  createReflectingPool(23.2)
  // East Reflecting Pool
  createReflectingPool(40.8)

  // ---------------------------------------------------------------------------
  // 5. Modern Palm Trees & Illuminated Pathway Bollards
  // ---------------------------------------------------------------------------
  const createPalmTree = (pos: Vector3) => {
    // Planter Box
    const planter = engine.addEntity()
    Transform.create(planter, {
      position: Vector3.create(pos.x, 0.40, pos.z),
      scale: Vector3.create(1.6, 0.50, 1.6)
    })
    MeshRenderer.setBox(planter)
    MeshCollider.setBox(planter)
    Material.setPbrMaterial(planter, travertineStoneMat)

    // Trunk
    const trunk = engine.addEntity()
    Transform.create(trunk, {
      position: Vector3.create(pos.x, 3.35, pos.z),
      scale: Vector3.create(0.38, 5.5, 0.38)
    })
    MeshRenderer.setCylinder(trunk)
    Material.setPbrMaterial(trunk, palmTrunkMat)

    // Palm Crown Fronds
    const angles = [0, 45, 90, 135, 180, 225, 270, 315]
    angles.forEach((deg) => {
      const frond = engine.addEntity()
      Transform.create(frond, {
        position: Vector3.create(pos.x, 5.95, pos.z),
        scale: Vector3.create(0.65, 0.08, 3.2),
        rotation: Quaternion.fromEulerDegrees(25, deg, 0)
      })
      MeshRenderer.setBox(frond)
      Material.setPbrMaterial(frond, palmFoliageMat)
    })

    // Uplight at base of trunk
    const uplight = engine.addEntity()
    Transform.create(uplight, {
      position: Vector3.create(pos.x, 0.70, pos.z)
    })
    LightSource.create(uplight, {
      type: LightSource.Type.Point({}),
      color: Color3.create(1.0, 0.85, 0.5),
      intensity: 3000,
      range: 5
    })
  }

  // Avenue Palm Trees
  const palmZPositions = [28.0, 35.0, 43.0, 51.0]
  palmZPositions.forEach((z) => {
    createPalmTree(Vector3.create(25.8, 0, z))
    createPalmTree(Vector3.create(38.2, 0, z))
  })

  // Illuminated Modern Pathway Bollards
  const bollardZPositions = [26.0, 31.0, 36.0, 41.0, 46.0, 51.0, 56.0]
  bollardZPositions.forEach((z) => {
    for (const x of [26.6, 37.4]) {
      // Bollard Post
      const post = engine.addEntity()
      Transform.create(post, {
        position: Vector3.create(x, 0.60, z),
        scale: Vector3.create(0.14, 0.90, 0.14)
      })
      MeshRenderer.setBox(post)
      Material.setPbrMaterial(post, darkSlateMat)

      // Glowing Lantern Top
      const lamp = engine.addEntity()
      Transform.create(lamp, {
        position: Vector3.create(x, 1.07, z),
        scale: Vector3.create(0.16, 0.12, 0.16)
      })
      MeshRenderer.setBox(lamp)
      Material.setPbrMaterial(lamp, bollardGlowMat)
    }
  })

  // ---------------------------------------------------------------------------
  // 6. Grand Arrival Monument & Entrance Sign (Z = 55)
  // ---------------------------------------------------------------------------
  const MONUMENT_X = 32.0
  const MONUMENT_Z = 55.5

  // Stone Monument Pylons
  const leftPylon = engine.addEntity()
  Transform.create(leftPylon, {
    position: Vector3.create(MONUMENT_X - 4.6, 2.65, MONUMENT_Z),
    scale: Vector3.create(1.2, 5.0, 1.2)
  })
  MeshRenderer.setBox(leftPylon)
  MeshCollider.setBox(leftPylon)
  Material.setPbrMaterial(leftPylon, travertineStoneMat)

  const rightPylon = engine.addEntity()
  Transform.create(rightPylon, {
    position: Vector3.create(MONUMENT_X + 4.6, 2.65, MONUMENT_Z),
    scale: Vector3.create(1.2, 5.0, 1.2)
  })
  MeshRenderer.setBox(rightPylon)
  MeshCollider.setBox(rightPylon)
  Material.setPbrMaterial(rightPylon, travertineStoneMat)

  // Floating Crossbeam
  const crossbeam = engine.addEntity()
  Transform.create(crossbeam, {
    position: Vector3.create(MONUMENT_X, 4.95, MONUMENT_Z),
    scale: Vector3.create(10.4, 0.45, 0.8)
  })
  MeshRenderer.setBox(crossbeam)
  Material.setPbrMaterial(crossbeam, polishedGoldMat)

  // Grand Entrance Title Sign
  const monumentSign = engine.addEntity()
  Transform.create(monumentSign, {
    position: Vector3.create(MONUMENT_X, 4.15, MONUMENT_Z + 0.65)
  })
  TextShape.create(monumentSign, {
    text: '✦ THE RESORT & SKYLINE CLUB ✦\n[ WELCOME TO THE 16-PARCEL PRIVATE ESTATE ]',
    fontSize: 1.35,
    textColor: Color4.create(1.0, 0.90, 0.50, 1)
  })
  Billboard.create(monumentSign, {
    billboardMode: BillboardMode.BM_Y
  })

  // ---------------------------------------------------------------------------
  // 7. Outdoor Sunken Fire Pit Lounge (East Lawn: X = 50, Z = 45)
  // ---------------------------------------------------------------------------
  const FIRE_X = 50.0
  const FIRE_Z = 45.0

  // Circular Seating Bench (North and South halves)
  const benchNorth = engine.addEntity()
  Transform.create(benchNorth, {
    position: Vector3.create(FIRE_X, 0.50, FIRE_Z - 2.8),
    scale: Vector3.create(5.6, 0.45, 0.8)
  })
  MeshRenderer.setBox(benchNorth)
  MeshCollider.setBox(benchNorth)
  Material.setPbrMaterial(benchNorth, travertineStoneMat)

  const benchSouth = engine.addEntity()
  Transform.create(benchSouth, {
    position: Vector3.create(FIRE_X, 0.50, FIRE_Z + 2.8),
    scale: Vector3.create(5.6, 0.45, 0.8)
  })
  MeshRenderer.setBox(benchSouth)
  MeshCollider.setBox(benchSouth)
  Material.setPbrMaterial(benchSouth, travertineStoneMat)

  // Fire Pit Stone Bowl
  const firePitBowl = engine.addEntity()
  Transform.create(firePitBowl, {
    position: Vector3.create(FIRE_X, 0.45, FIRE_Z),
    scale: Vector3.create(1.8, 0.50, 1.8)
  })
  MeshRenderer.setCylinder(firePitBowl)
  MeshCollider.setBox(firePitBowl)
  Material.setPbrMaterial(firePitBowl, darkSlateMat)

  // Glowing Fire Embers
  const fireEmbers = engine.addEntity()
  Transform.create(fireEmbers, {
    position: Vector3.create(FIRE_X, 0.70, FIRE_Z),
    scale: Vector3.create(1.3, 0.15, 1.3)
  })
  MeshRenderer.setCylinder(fireEmbers)
  Material.setPbrMaterial(fireEmbers, warmEmbersMat)

  // Warm Fireplace Point Light
  const fireLight = engine.addEntity()
  Transform.create(fireLight, {
    position: Vector3.create(FIRE_X, 1.05, FIRE_Z)
  })
  LightSource.create(fireLight, {
    type: LightSource.Type.Point({}),
    color: Color3.create(1.0, 0.55, 0.15),
    intensity: 12000,
    range: 10
  })

  // Fire Pit Floating Label
  const fireLabel = engine.addEntity()
  Transform.create(fireLabel, {
    position: Vector3.create(FIRE_X, 2.35, FIRE_Z)
  })
  TextShape.create(fireLabel, {
    text: '✦ SUNSET FIRE PIT LOUNGE ✦',
    fontSize: 1.6,
    textColor: Color4.create(1.0, 0.75, 0.3, 1)
  })
  Billboard.create(fireLabel, { billboardMode: BillboardMode.BM_Y })

  // ---------------------------------------------------------------------------
  // 8. Outdoor Luxury Resort Cabanas (West Lawn: X = 14, Z = 45)
  // ---------------------------------------------------------------------------
  const CABANA_X = 14.0
  const CABANA_Z = 45.0

  // Teak Wood Cabana Platform
  const cabanaPlatform = engine.addEntity()
  Transform.create(cabanaPlatform, {
    position: Vector3.create(CABANA_X, 0.30, CABANA_Z),
    scale: Vector3.create(6.2, 0.25, 4.8)
  })
  MeshRenderer.setBox(cabanaPlatform)
  MeshCollider.setBox(cabanaPlatform)
  Material.setPbrMaterial(cabanaPlatform, travertineStoneMat)

  // 4 Corner Posts
  const postOffsets = [
    [-2.8, -2.1],
    [2.8, -2.1],
    [-2.8, 2.1],
    [2.8, 2.1]
  ]
  postOffsets.forEach(([ox, oz]) => {
    const post = engine.addEntity()
    Transform.create(post, {
      position: Vector3.create(CABANA_X + ox, 1.80, CABANA_Z + oz),
      scale: Vector3.create(0.18, 2.8, 0.18)
    })
    MeshRenderer.setBox(post)
    Material.setPbrMaterial(post, polishedGoldMat)
  })

  // Cabana Roof Canopy
  const cabanaRoof = engine.addEntity()
  Transform.create(cabanaRoof, {
    position: Vector3.create(CABANA_X, 3.25, CABANA_Z),
    scale: Vector3.create(6.4, 0.12, 5.0)
  })
  MeshRenderer.setBox(cabanaRoof)
  Material.setPbrMaterial(cabanaRoof, travertineStoneMat)

  // Daybed Loungers
  const daybedLeft = engine.addEntity()
  Transform.create(daybedLeft, {
    position: Vector3.create(CABANA_X - 1.6, 0.55, CABANA_Z),
    scale: Vector3.create(1.5, 0.35, 3.2)
  })
  MeshRenderer.setBox(daybedLeft)
  MeshCollider.setBox(daybedLeft)
  Material.setPbrMaterial(daybedLeft, darkSlateMat)

  const daybedRight = engine.addEntity()
  Transform.create(daybedRight, {
    position: Vector3.create(CABANA_X + 1.6, 0.55, CABANA_Z),
    scale: Vector3.create(1.5, 0.35, 3.2)
  })
  MeshRenderer.setBox(daybedRight)
  MeshCollider.setBox(daybedRight)
  Material.setPbrMaterial(daybedRight, darkSlateMat)

  // Cabana Sign
  const cabanaSign = engine.addEntity()
  Transform.create(cabanaSign, {
    position: Vector3.create(CABANA_X, 3.8, CABANA_Z)
  })
  TextShape.create(cabanaSign, {
    text: '✦ PRIVATE RESORT CABANAS ✦',
    fontSize: 1.6,
    textColor: Color4.create(1.0, 0.90, 0.55, 1)
  })
  Billboard.create(cabanaSign, { billboardMode: BillboardMode.BM_Y })
}
